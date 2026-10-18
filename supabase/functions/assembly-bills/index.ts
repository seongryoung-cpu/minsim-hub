// 공론 의제의 '관련 법안' — 열린국회정보 Open API
//
// 동작 (body.action)
//   search    (관리자)  { q }                      국회 의안 이름 검색 (22대)
//   link      (관리자)  { agenda_id, bill_id }      의제에 연결 + 국회 자료 가져오기
//   refresh   (관리자)  { bill_id }                 한 법안 다시 가져오기
//   summarize (관리자)  { agenda_bill_id }          제안이유를 읽고 '시민의 말' 요약 초안 → plain_draft
//   sync      (누구나)  {}                          연결된 법안 전부 + 국회의원 명단 다시 확인. 20시간 안에 이미 돌았으면 건너뜀 (매일 예약 실행용)
//   members   (누구나)  {}                          국회의원 명단만 다시 받기. 6시간 안에 이미 받았으면 건너뜀
//   photos    (누구나)  {}                          사진이 새로 생기거나 바뀐 의원 몇 명씩 사진 줄여 저장 (할 일이 없으면 바로 끝남)
//
// 비밀값: ASSEMBLY_API_KEY(국회), FIRECRAWL_API_KEY(제안이유 읽기), LOVABLE_API_KEY(AI)
// 국회 자료는 바꾸지 않고 저장한다. 출처: 열린국회정보 (이용약관 제7조)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const BASE = 'https://open.assembly.go.kr/portal/openapi';
const AGE = '22';

type Row = Record<string, string | number | null>;

async function assembly(code: string, params: Record<string, string>, pSize = 100): Promise<Row[]> {
  const key = Deno.env.get('ASSEMBLY_API_KEY');
  if (!key) throw new Error('ASSEMBLY_API_KEY missing');
  const qs = new URLSearchParams({ KEY: key, Type: 'json', pIndex: '1', pSize: String(pSize), ...params });
  const res = await fetch(`${BASE}/${code}?${qs}`);
  if (!res.ok) throw new Error(`assembly ${code} http ${res.status}`);
  const body = await res.json();
  const block = body?.[code];
  if (!Array.isArray(block)) {
    const c = body?.RESULT?.CODE;
    if (c === 'INFO-200') return []; // 해당 자료 없음
    throw new Error(`assembly ${code} ${c ?? 'unknown'}: ${body?.RESULT?.MESSAGE ?? ''}`);
  }
  return (block[1]?.row ?? []) as Row[];
}

const str = (v: unknown) => (v == null || v === '' || v === ' ' ? null : String(v).trim());
const day = (v: unknown) => {
  const s = str(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

/** 국회 날짜·결과로 지금 단계를 정한다 (판단 없이 기록 그대로) */
function computeStage(b: {
  proc_result: string | null; propose_dt: string | null; committee_dt: string | null; cmt_proc_dt: string | null;
  law_proc_dt: string | null; plenary_dt: string | null; gov_transfer_dt: string | null; promulgation_dt: string | null;
}) {
  const r = b.proc_result ?? '';
  const end = b.plenary_dt ?? b.cmt_proc_dt ?? b.law_proc_dt ?? null;
  if (r.includes('대안반영')) return { stage: 'merged', on: b.cmt_proc_dt ?? end };
  if (r.includes('철회')) return { stage: 'withdrawn', on: end };
  if (r.includes('임기만료')) return { stage: 'expired', on: end };
  if (r.includes('부결')) return { stage: 'rejected', on: end };
  if (r.includes('폐기')) return { stage: 'discarded', on: end };
  if (b.promulgation_dt) return { stage: 'promulgated', on: b.promulgation_dt };
  if (b.gov_transfer_dt) return { stage: 'transferred', on: b.gov_transfer_dt };
  if (b.plenary_dt || r.includes('가결')) return { stage: 'plenary_passed', on: b.plenary_dt };
  if (b.law_proc_dt) return { stage: 'judiciary', on: b.law_proc_dt };
  if (b.cmt_proc_dt) return { stage: 'committee_done', on: b.cmt_proc_dt };
  if (b.committee_dt) return { stage: 'committee', on: b.committee_dt };
  return { stage: 'proposed', on: b.propose_dt };
}

async function refreshBill(db: SupabaseClient, billId: string) {
  // 의안검색(전체 의안: 의원·정부·위원장 대안) → 기본. 의원 발의안이면 공동발의자 목록을 더한다.
  const [base] = await assembly('TVBPMBILL11', { AGE, BILL_ID: billId }, 5);
  const [detail] = await assembly('BILLINFODETAIL', { BILL_ID: billId }, 5).catch(() => [] as Row[]);
  if (!base && !detail) throw new Error('bill_not_found');
  const [member] = await assembly('nzmimeepazxkubdpn', { AGE, BILL_ID: billId }, 5).catch(() => [] as Row[]);
  const [voteSum] = await assembly('ncocpgfiaoituanbr', { AGE, BILL_ID: billId }, 5).catch(() => [] as Row[]);

  const b0 = base ?? {};
  const d = detail ?? {};
  const m = member ?? {};
  const bill = {
    bill_id: billId,
    bill_no: str(b0.BILL_NO) ?? str(d.BILL_NO),
    bill_name: str(b0.BILL_NAME) ?? str(d.BILL_NM) ?? billId,
    age: Number(b0.AGE ?? AGE),
    proposer: str(b0.PROPOSER) ?? str(d.PPSR),
    rst_proposer: str(b0.RST_PROPOSER) ?? str(m.RST_PROPOSER),
    rst_mona_cd: str(b0.RST_MONA_CD) ?? str(m.RST_MONA_CD),
    publ_proposer: str(m.PUBL_PROPOSER),
    committee: str(b0.CURR_COMMITTEE) ?? str(d.JRCMIT_NM) ?? str(voteSum?.CURR_COMMITTEE),
    committee_id: str(b0.CURR_COMMITTEE_ID) ?? str(voteSum?.CURR_COMMITTEE_ID),
    propose_dt: day(b0.PROPOSE_DT) ?? day(d.PPSL_DT),
    committee_dt: day(b0.COMMITTEE_DT) ?? day(d.JRCMIT_CMMT_DT),
    cmt_proc_dt: day(b0.CMT_PROC_DT) ?? day(b0.COMMITTEE_PROC_DT) ?? day(d.JRCMIT_PROC_DT),
    cmt_proc_result: str(b0.CMT_PROC_RESULT_CD) ?? str(d.JRCMIT_PROC_RSLT),
    law_proc_dt: day(b0.LAW_PROC_DT) ?? day(d.LAW_PROC_DT),
    plenary_dt: day(d.RGS_RSLN_DT) ?? day(b0.PROC_DT),
    proc_result: str(b0.PROC_RESULT_CD) ?? str(d.RGS_CONF_RSLT) ?? str(voteSum?.PROC_RESULT_CD) ?? str(b0.CMT_PROC_RESULT_CD) ?? str(d.JRCMIT_PROC_RSLT),
    gov_transfer_dt: day(d.GVRN_TRSF_DT),
    promulgation_dt: day(d.PROM_DT),
    detail_link: (str(b0.LINK_URL) ?? str(m.DETAIL_LINK))?.replace(/^http:/, 'https:') ?? null,
    vote_member_total: voteSum ? Number(voteSum.MEMBER_TCNT) : null,
    vote_total: voteSum ? Number(voteSum.VOTE_TCNT) : null,
    vote_yes: voteSum ? Number(voteSum.YES_TCNT) : null,
    vote_no: voteSum ? Number(voteSum.NO_TCNT) : null,
    vote_blank: voteSum ? Number(voteSum.BLANK_TCNT) : null,
    vote_date: voteSum ? day(voteSum.PROC_DT) : null,
    synced_at: new Date().toISOString(),
  };
  const { stage, on } = computeStage(bill);
  const { error } = await db.from('assembly_bills').upsert({ ...bill, stage, stage_changed_on: on });
  if (error) throw error;

  // 지금까지 거친 단계를 기록 (처음 발견한 날이 detected_at으로 남는다)
  const reached: { stage: string; on: string | null }[] = [{ stage: 'proposed', on: bill.propose_dt }];
  if (bill.committee_dt) reached.push({ stage: 'committee', on: bill.committee_dt });
  if (bill.cmt_proc_dt) reached.push({ stage: 'committee_done', on: bill.cmt_proc_dt });
  if (bill.law_proc_dt) reached.push({ stage: 'judiciary', on: bill.law_proc_dt });
  if (bill.plenary_dt && stage !== 'merged') reached.push({ stage: 'plenary_passed', on: bill.plenary_dt });
  if (bill.gov_transfer_dt) reached.push({ stage: 'transferred', on: bill.gov_transfer_dt });
  if (bill.promulgation_dt) reached.push({ stage: 'promulgated', on: bill.promulgation_dt });
  if (!reached.some((r) => r.stage === stage)) reached.push({ stage, on });
  await db.from('assembly_bill_events').upsert(
    reached.map((r) => ({ bill_id: billId, stage: r.stage, event_on: r.on })),
    { onConflict: 'bill_id,stage', ignoreDuplicates: true },
  );

  // 본회의 표결이 있으면 의원별 표결
  if (voteSum) {
    const votes = await assembly('nojepdqqaweusdfbi', { AGE, BILL_ID: billId }, 320);
    if (votes.length > 0) {
      const rows = votes
        .filter((v) => str(v.MONA_CD) && str(v.HG_NM))
        .map((v) => ({
          bill_id: billId,
          mona_cd: str(v.MONA_CD)!,
          member_name: str(v.HG_NM)!,
          party: str(v.POLY_NM),
          district: str(v.ORIG_NM),
          vote: str(v.RESULT_VOTE_MOD) ?? '불참',
        }));
      const { error: vErr } = await db.from('assembly_bill_votes').upsert(rows, { onConflict: 'bill_id,mona_cd' });
      if (vErr) throw vErr;
    }
  }
  return { bill_id: billId, stage, votes: !!voteSum };
}

async function summarize(db: SupabaseClient, agendaBillId: string) {
  const { data: ab, error } = await db
    .from('agenda_bills')
    .select('id, bill_id, assembly_bills(bill_name, detail_link, proposer)')
    .eq('id', agendaBillId)
    .single();
  if (error || !ab) throw new Error('not_found');
  const bill = (ab as unknown as { assembly_bills: { bill_name: string; detail_link: string | null; proposer: string | null } }).assembly_bills;

  // 제안이유는 의안정보시스템 화면이 스크립트로 그려서 Firecrawl로 읽는다
  let reason = '';
  const fc = Deno.env.get('FIRECRAWL_API_KEY');
  if (fc && bill.detail_link) {
    const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${fc}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: bill.detail_link, formats: ['markdown'], waitFor: 2500, onlyMainContent: true }),
    });
    if (r.ok) {
      const md: string = (await r.json())?.data?.markdown ?? '';
      const i = md.indexOf('제안이유');
      reason = (i >= 0 ? md.slice(i) : md).slice(0, 7000);
    }
  }

  const ai = Deno.env.get('LOVABLE_API_KEY');
  if (!ai) throw new Error('LOVABLE_API_KEY missing');
  const system = `너는 법안을 시민이 이해하기 쉬운 말로 옮기는 편집자다.
규칙:
- 법안에 적힌 내용만 쓴다. 찬성·반대, 좋다·나쁘다 같은 평가는 쓰지 않는다.
- 어려운 법률 용어는 일상어로 바꾼다. 숫자·대상·시기는 법안에 있는 그대로.
- 법안에서 확인되지 않는 내용은 "확인 필요"라고 쓴다.
- what: 무엇이 바뀌나 (2문장 이내, 200자 이내)
- who: 누가 영향을 받나 (120자 이내)
- when: 언제부터 (80자 이내, 예: "공포 후 6개월부터")`;
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ai}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `법안: ${bill.bill_name} (${bill.proposer ?? ''})\n\n${reason || '(제안이유를 읽지 못했어요. 법안 이름만으로 쓰고, 모르는 부분은 "확인 필요")'}` },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'plain_summary',
          description: '시민의 말로 쓴 법안 요약',
          parameters: {
            type: 'object',
            properties: { what: { type: 'string' }, who: { type: 'string' }, when: { type: 'string' } },
            required: ['what', 'who', 'when'],
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'plain_summary' } },
    }),
  });
  if (!res.ok) throw new Error(`ai http ${res.status}`);
  const out = await res.json();
  const args = out?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const draft = typeof args === 'string' ? JSON.parse(args) : args;
  const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');
  const plain_draft = {
    what: clip(draft?.what, 200),
    who: clip(draft?.who, 120),
    when: clip(draft?.when, 80),
    read_reason: !!reason,
    at: new Date().toISOString(),
  };
  const { error: uErr } = await db.from('agenda_bills').update({ plain_draft }).eq('id', agendaBillId);
  if (uErr) throw uErr;
  return plain_draft;
}

// ─────────────────────────────────────────────────────────────
// 국회의원 명단 (정치인 탭)
// ─────────────────────────────────────────────────────────────
// 선거구 → 앱 지역(시·도, 시·군·구) 계산은 화면에서 한다: src/lib/districts.ts (앱의 시·군·구 목록이 필요해서)
const splitList = (v: unknown) => (str(v) ?? '').split(',').map((x) => x.trim()).filter(Boolean);

/** 국회의원 정보 통합(ALLNAMEMBER)에서 의원 코드 → 사진 주소. 역대 의원 전체라 1000명씩 나눠 받는다 */
async function photoSources(): Promise<Map<string, string>> {
  const key = Deno.env.get('ASSEMBLY_API_KEY');
  if (!key) throw new Error('ASSEMBLY_API_KEY missing');
  const map = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const qs = new URLSearchParams({ KEY: key, Type: 'json', pIndex: String(page), pSize: '1000' });
    const res = await fetch(`${BASE}/ALLNAMEMBER?${qs}`);
    if (!res.ok) throw new Error(`assembly ALLNAMEMBER http ${res.status}`);
    const body = await res.json();
    const block = body?.ALLNAMEMBER;
    if (!Array.isArray(block)) break;
    const total = Number(block[0]?.head?.[0]?.list_total_count ?? 0);
    const rows = (block[1]?.row ?? []) as Row[];
    for (const r of rows) {
      const code = str(r.NAAS_CD);
      const pic = str(r.NAAS_PIC);
      if (code && pic && /^https?:\/\//.test(pic)) map.set(code, pic.replace(/^http:/, 'https:'));
    }
    if (rows.length === 0 || page * 1000 >= total) break;
  }
  return map;
}

async function syncMembers(db: SupabaseClient) {
  const rows = await assembly('nwvrqwxyaytdsfvhu', {}, 320);
  const pics = await photoSources().catch((e) => { console.error('photo sources', e); return null; });
  if (rows.length < 250) throw new Error(`members_too_few ${rows.length}`); // 응답이 이상하면 기존 명단을 지우지 않는다
  const now = new Date().toISOString();
  const members = rows
    .filter((r) => str(r.MONA_CD) && str(r.HG_NM))
    .map((r) => {
      return {
        mona_cd: str(r.MONA_CD)!,
        name: str(r.HG_NM)!,
        party: str(r.POLY_NM),
        district: str(r.ORIG_NM),
        elect_type: str(r.ELECT_GBN_NM),
        committees: splitList(r.CMITS ?? r.CMIT_NM),
        committee_role: str(r.JOB_RES_NM),
        reelection: str(r.REELE_GBN_NM),
        units: str(r.UNITS),
        tel: str(r.TEL_NO),
        email: str(r.E_MAIL),
        homepage: str(r.HOMEPAGE)?.replace(/^http:/, 'https:') ?? null,
        office: str(r.ASSEM_ADDR),
        career: str(r.MEM_TITLE)?.replace(/&middot;/g, '·').replace(/\r\n/g, '\n').slice(0, 4000) ?? null,
        is_current: true,
        synced_at: now,
        ...(pics ? { photo_src: pics.get(str(r.MONA_CD)!) ?? null } : {}),
      };
    });
  const { error } = await db.from('assembly_members').upsert(members);
  if (error) throw error;
  // 이번 명단에 없는 사람은 현직이 아니다 (사퇴·당선무효 등)
  const codes = members.map((m) => m.mona_cd);
  const { error: offErr } = await db.from('assembly_members').update({ is_current: false })
    .eq('is_current', true).not('mona_cd', 'in', `(${codes.map((c) => `"${c}"`).join(',')})`);
  if (offErr) throw offErr;
  const { data: linked } = await db.rpc('backfill_position_mona');
  return { members: members.length, positions_linked: linked ?? 0, photo_sources: pics ? members.filter((m) => m.photo_src).length : null };
}

// ─────────────────────────────────────────────────────────────
// 의원 사진: 원본을 잠깐 올려 Supabase 이미지 변환으로 줄이고, 작은 파일만 남긴다
// ─────────────────────────────────────────────────────────────
const PHOTO_BUCKET = 'politician-photos';
const PHOTO_SET = 'v2'; // 저장한 크기 묶음 (화면이 어느 폴더를 볼지 정한다)
const PHOTO_SIZES = [160, 480]; // 가로 px, 세로는 3:4. 160: 목록(48×64), 480: 인물 페이지(120×160)·크게 보기. 원본보다 크게 늘리지는 않는다

async function savePhoto(db: SupabaseClient, code: string, src: string) {
  const res = await fetch(src, { signal: AbortSignal.timeout(30_000) });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.startsWith('image/')) throw new Error(`photo http ${res.status} ${type}`);
  const original = new Uint8Array(await res.arrayBuffer());
  // 경로에 시각을 넣어 이미지 변환 캐시가 예전 사진을 돌려주지 않게 한다
  const tmp = `tmp/${code}-${Date.now()}.jpg`;
  const up = await db.storage.from(PHOTO_BUCKET).upload(tmp, original, { contentType: type.split(';')[0], upsert: true });
  if (up.error) throw up.error;
  try {
    const base = Deno.env.get('SUPABASE_URL')!;
    for (const w of PHOTO_SIZES) {
      const h = Math.round((w * 4) / 3);
      const r = await fetch(`${base}/storage/v1/render/image/public/${PHOTO_BUCKET}/${tmp}?width=${w}&height=${h}&resize=cover&quality=82`, {
        headers: { Accept: 'image/webp' },
        signal: AbortSignal.timeout(30_000),
      });
      const t = r.headers.get('content-type') ?? '';
      if (!r.ok || !t.startsWith('image/')) throw new Error(`resize ${w} http ${r.status} ${(await r.text().catch(() => '')).slice(0, 160)}`);
      const small = new Uint8Array(await r.arrayBuffer());
      const put = await db.storage.from(PHOTO_BUCKET).upload(`${w}/${code}.webp`, small, {
        contentType: 'image/webp', upsert: true, cacheControl: '604800',
      });
      if (put.error) throw put.error;
    }
  } finally {
    // 예전 크기(96·240) 파일도 함께 지운다
    await db.storage.from(PHOTO_BUCKET).remove([tmp, `96/${code}.webp`, `240/${code}.webp`]);
  }
  return original.length;
}

async function syncPhotos(db: SupabaseClient, limit: number) {
  const retryAfter = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data, error } = await db
    .from('assembly_members')
    .select('mona_cd, photo_src, photo_saved_src')
    .eq('is_current', true)
    .not('photo_src', 'is', null)
    .or(`photo_failed_at.is.null,photo_failed_at.lt.${retryAfter}`)
    .limit(400);
  if (error) throw error;
  const todo = (data ?? []).filter((m) => m.photo_src !== m.photo_saved_src).slice(0, limit);
  let saved = 0;
  const failed: { code: string; error: string }[] = [];
  // 국회 서버가 느려서 3명씩 동시에
  for (let i = 0; i < todo.length; i += 3) {
    await Promise.all(todo.slice(i, i + 3).map(async (m) => {
      try {
        try {
          await savePhoto(db, m.mona_cd, m.photo_src!);
        } catch (e) {
          // 원본 해상도가 너무 크면 이미지 변환이 거절한다 → 국회의 예전 형식 작은 사진(의원 코드.jpg)으로 대신
          if (!String(e).includes('resolution')) throw e;
          await savePhoto(db, m.mona_cd, `https://www.assembly.go.kr/static/portal/img/openassm/${encodeURIComponent(m.mona_cd)}.jpg`);
        }
        await db.from('assembly_members').update({
          photo_saved_src: m.photo_src, photo_version: Math.floor(Date.now() / 1000), photo_failed_at: null, photo_set: PHOTO_SET,
        }).eq('mona_cd', m.mona_cd);
        saved++;
      } catch (e) {
        failed.push({ code: m.mona_cd, error: String(e instanceof Error ? e.message : e).slice(0, 200) });
        await db.from('assembly_members').update({ photo_failed_at: new Date().toISOString() }).eq('mona_cd', m.mona_cd);
      }
    }));
  }
  const left = (data ?? []).filter((m) => m.photo_src !== m.photo_saved_src).length - saved - failed.length;
  return { saved, failed, left };
}

async function isAdmin(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;
  const { data } = await userClient.rpc('is_admin', { _user_id: user.id });
  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* sync 예약 호출은 본문이 비어 있을 수 있다 */ }
  const action = String(body.action ?? 'sync');

  try {
    if (action === 'sync') {
      const since = new Date(Date.now() - 20 * 3600_000).toISOString();
      const { data: recent } = await db.from('assembly_sync_runs').select('id').eq('kind', 'sync').eq('ok', true).gte('started_at', since).limit(1);
      if (recent && recent.length > 0) return json({ skipped: true });
      const { data: run } = await db.from('assembly_sync_runs').insert({ kind: 'sync' }).select('id').single();
      const { data: links } = await db.from('agenda_bills').select('bill_id');
      const ids = [...new Set((links ?? []).map((l) => l.bill_id as string))];
      const results: unknown[] = [];
      let ok = true;
      for (const id of ids) {
        try { results.push(await refreshBill(db, id)); } catch (e) { ok = false; results.push({ bill_id: id, error: String(e) }); }
      }
      let members: unknown = null;
      try { members = await syncMembers(db); } catch (e) { ok = false; members = { error: String(e) }; }
      let photos: unknown = null;
      try { photos = await syncPhotos(db, 12); } catch (e) { photos = { error: String(e) }; } // 사진 실패는 동기화 실패로 치지 않는다
      await db.from('assembly_sync_runs').update({ finished_at: new Date().toISOString(), ok, detail: { count: ids.length, results, members, photos } }).eq('id', run?.id);
      return json({ ok, count: ids.length, members, photos });
    }

    if (action === 'members') {
      const since = new Date(Date.now() - 6 * 3600_000).toISOString();
      const { data: recent } = await db.from('assembly_sync_runs').select('id').eq('kind', 'members').eq('ok', true).gte('started_at', since).limit(1);
      if (recent && recent.length > 0) return json({ skipped: true });
      const result = await syncMembers(db);
      await db.from('assembly_sync_runs').insert({ kind: 'members', ok: true, finished_at: new Date().toISOString(), detail: result });
      return json({ ok: true, ...result });
    }

    if (action === 'photos') {
      return json({ ok: true, ...(await syncPhotos(db, 9)) });
    }

    if (!(await isAdmin(req))) return json({ error: 'forbidden' }, 403);

    if (action === 'search') {
      const q = String(body.q ?? '').trim();
      if (q.length < 2 || q.length > 40) return json({ error: 'invalid_query' }, 400);
      const rows = await assembly('TVBPMBILL11', { AGE, BILL_NAME: q }, 30);
      return json({
        bills: rows.map((r) => ({
          bill_id: str(r.BILL_ID), bill_no: str(r.BILL_NO), bill_name: str(r.BILL_NAME), proposer: str(r.PROPOSER),
          proposer_kind: str(r.PROPOSER_KIND), committee: str(r.CURR_COMMITTEE), propose_dt: day(r.PROPOSE_DT),
          proc_result: str(r.PROC_RESULT_CD), pass_gubun: str(r.PASS_GUBUN),
        })),
      });
    }

    if (action === 'link') {
      const agendaId = String(body.agenda_id ?? '');
      const billId = String(body.bill_id ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(agendaId) || !/^PRC_[A-Z0-9]+$/i.test(billId)) return json({ error: 'invalid_input' }, 400);
      const result = await refreshBill(db, billId);
      const { count } = await db.from('agenda_bills').select('id', { count: 'exact', head: true }).eq('agenda_id', agendaId);
      const { data, error } = await db
        .from('agenda_bills')
        .upsert({ agenda_id: agendaId, bill_id: billId, sort_order: count ?? 0 }, { onConflict: 'agenda_id,bill_id', ignoreDuplicates: true })
        .select('id')
        .maybeSingle();
      if (error) throw error;
      await db.from('assembly_sync_runs').insert({ kind: 'link', ok: true, finished_at: new Date().toISOString(), detail: result });
      return json({ ok: true, id: data?.id ?? null, ...result });
    }

    if (action === 'refresh') {
      const billId = String(body.bill_id ?? '');
      if (!/^PRC_[A-Z0-9]+$/i.test(billId)) return json({ error: 'invalid_input' }, 400);
      return json({ ok: true, ...(await refreshBill(db, billId)) });
    }

    if (action === 'summarize') {
      const id = String(body.agenda_bill_id ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'invalid_input' }, 400);
      return json({ ok: true, draft: await summarize(db, id) });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('assembly-bills', action, e);
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
