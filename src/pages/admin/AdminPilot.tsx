import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Download, Plus, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import {
  PILOT_STATUS_LABELS,
  formatPhone,
  pilotCsv,
  useAdminPilotApplications,
  useAdminPilotEvents,
  usePurgePilotPersonal,
  useSavePilotEvent,
  useSetPilotStatus,
  type AdminPilotApplication,
  type PilotEvent,
  type PilotEventDraft,
  type PilotStatus,
} from '@/hooks/usePilot';

const DEFAULT_SCHOOLS = [
  '성균관대학교 (자연과학캠퍼스)',
  '아주대학교',
  '경기대학교',
  '경희대학교 (국제캠퍼스)',
  '동남보건대학교',
  '수원여자대학교',
  '수원대학교',
  '장안대학교',
  '수원과학대학교',
];

const NEW_EVENT: PilotEventDraft = {
  slug: 'student-gonglon-1205',
  title: '민심잇다 대학생 공론장',
  summary:
    '청년 정책 의제 하나를 두고, 생각이 다른 대학생들이 하루 동안 배우고 이야기해요. 마지막에는 양쪽이 함께 동의한 것과 크게 갈린 것을 그 자리에서 정리해 국회의원·경기도의회·수원시에 전달해요.',
  event_at: new Date('2026-12-05T13:00:00+09:00').toISOString(),
  venue: '경기도의회 (장소 확정 후 안내)',
  apply_closes_at: new Date('2026-11-20T23:59:00+09:00').toISOString(),
  announce_at: new Date('2026-11-21T12:00:00+09:00').toISOString(),
  capacity: 100,
  agenda_id: null,
  schools: DEFAULT_SCHOOLS,
  allow_public: true,
  is_published: false,
};

const PRE_LABEL: Record<string, string> = { agree: '찬성', disagree: '반대', hold: '모름' };
const STATUS_ORDER: PilotStatus[] = ['applied', 'selected', 'waitlist', 'declined', 'cancelled'];

/** ISO → datetime-local 입력값 (이 기기 시간대) */
function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

/** 운영진: 행사 만들기·신청자 보기·선발 */
export function AdminPilot() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: events, isLoading } = useAdminPilotEvents();
  const [eventId, setEventId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PilotEventDraft | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/');
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!eventId && events && events.length > 0) setEventId(events[0].id);
  }, [events, eventId]);

  if (adminLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const ev = events?.find((e) => e.id === eventId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <button onClick={() => navigate('/admin')} className="rounded-lg p-1 hover:bg-muted" aria-label="뒤로">
            <ArrowLeft size={20} />
          </button>
          <Ticket size={22} className="text-primary" />
          <h1 className="text-lg font-semibold">행사 신청 관리</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4 pb-20">
        <div className="flex flex-wrap items-center gap-2">
          {(events ?? []).map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setEventId(e.id);
                setEditing(null);
              }}
              className={cn(
                'h-9 rounded-full border px-3 text-sm',
                e.id === eventId ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border',
              )}
            >
              {e.title}
              {!e.is_published && <span className="ml-1 text-xs text-muted-foreground">(비공개)</span>}
            </button>
          ))}
          <button
            onClick={() => setEditing({ ...NEW_EVENT })}
            className="flex h-9 items-center gap-1 rounded-full border border-dashed border-border px-3 text-sm text-muted-foreground"
          >
            <Plus size={14} /> 새 행사
          </button>
        </div>

        {editing ? (
          <EventEditor
            draft={editing}
            onClose={() => setEditing(null)}
            onSaved={(id) => {
              setEventId(id);
              setEditing(null);
            }}
          />
        ) : ev ? (
          <>
            <EventSummary ev={ev} onEdit={() => setEditing({ ...ev })} />
            <Applicants ev={ev} />
          </>
        ) : (
          <p className="rounded-xl bg-secondary/60 p-6 text-center text-sm text-muted-foreground">
            아직 행사가 없어요. &lsquo;새 행사&rsquo;로 12월 5일 공론장부터 만들어 주세요.
          </p>
        )}
      </main>
    </div>
  );
}

function EventSummary({ ev, onEdit }: { ev: PilotEvent; onEdit: () => void }) {
  const link = `${window.location.origin}/pilot/${ev.slug}`;
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{ev.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            행사 {new Date(ev.event_at).toLocaleString('ko-KR')} · 마감 {new Date(ev.apply_closes_at).toLocaleString('ko-KR')} · 정원 {ev.capacity}명
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            사전 의견 의제: {ev.agenda_id ? '연결됨' : '아직 없음 (의제 확정 후 연결)'} · {ev.is_published ? '신청 화면 공개 중' : '비공개'}
          </p>
        </div>
        <button onClick={onEdit} className="h-9 shrink-0 rounded-lg border border-border px-3 text-sm font-semibold">
          고치기
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
        <span className="min-w-0 flex-1 truncate">{link}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(link).then(
              () => toast.success('신청 링크를 복사했어요'),
              () => toast.error('복사하지 못했어요'),
            );
          }}
          className="flex items-center gap-1 text-xs font-semibold text-primary"
        >
          <Copy size={14} /> 복사
        </button>
      </div>
    </section>
  );
}

function EventEditor({ draft, onClose, onSaved }: { draft: PilotEventDraft; onClose: () => void; onSaved: (id: string) => void }) {
  const [d, setD] = useState<PilotEventDraft>(draft);
  const [schoolsText, setSchoolsText] = useState(draft.schools.join('\n'));
  const save = useSavePilotEvent();
  const agendas = useQuery({
    queryKey: ['admin-agenda-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agendas').select('id, title, status').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const set = <K extends keyof PilotEventDraft>(k: K, v: PilotEventDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const input = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm';

  return (
    <section className="space-y-3 rounded-xl border border-border p-4">
      <p className="font-bold">{d.id ? '행사 고치기' : '새 행사'}</p>
      <L label="제목">
        <input className={input} value={d.title} onChange={(e) => set('title', e.target.value)} />
      </L>
      <L label="주소 (영문 소문자·숫자·-)" hint={`/pilot/${d.slug}`}>
        <input className={input} value={d.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
      </L>
      <L label="소개 (600자)">
        <textarea className="min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm" value={d.summary} maxLength={600} onChange={(e) => set('summary', e.target.value)} />
      </L>
      <div className="grid gap-3 sm:grid-cols-3">
        <L label="행사 일시">
          <input type="datetime-local" className={input} value={toLocalInput(d.event_at)} onChange={(e) => set('event_at', fromLocalInput(e.target.value) ?? d.event_at)} />
        </L>
        <L label="신청 마감">
          <input type="datetime-local" className={input} value={toLocalInput(d.apply_closes_at)} onChange={(e) => set('apply_closes_at', fromLocalInput(e.target.value) ?? d.apply_closes_at)} />
        </L>
        <L label="결과 안내일">
          <input type="datetime-local" className={input} value={toLocalInput(d.announce_at)} onChange={(e) => set('announce_at', fromLocalInput(e.target.value))} />
        </L>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <L label="장소">
          <input className={input} value={d.venue} onChange={(e) => set('venue', e.target.value)} />
        </L>
        <L label="선발 인원">
          <input type="number" min={1} className={input} value={d.capacity} onChange={(e) => set('capacity', Math.max(1, Number(e.target.value) || 1))} />
        </L>
      </div>
      <L label="사전 의견 의제" hint="선택하면 신청한 사람에게 1분 참여가 보여요">
        <select className={input} value={d.agenda_id ?? ''} onChange={(e) => set('agenda_id', e.target.value || null)}>
          <option value="">아직 없음</option>
          {(agendas.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.title} {a.status === 'draft' ? '(초안)' : ''}
            </option>
          ))}
        </select>
      </L>
      <L label="학교 선택지 (한 줄에 하나)">
        <textarea className="min-h-32 w-full rounded-lg border border-input bg-background p-3 text-sm" value={schoolsText} onChange={(e) => setSchoolsText(e.target.value)} />
      </L>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.allow_public} onChange={(e) => set('allow_public', e.target.checked)} /> 일반 시민 신청도 받기
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.is_published} onChange={(e) => set('is_published', e.target.checked)} /> 신청 화면 공개 (끄면 운영진만 봄)
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="h-10 rounded-lg px-4 text-sm text-muted-foreground">
          그만두기
        </button>
        <button
          disabled={save.isPending}
          onClick={() =>
            save.mutate(
              { ...d, schools: schoolsText.split('\n') },
              {
                onSuccess: (id) => {
                  toast.success('저장했어요');
                  onSaved(id);
                },
                onError: (e) => toast.error(e instanceof Error && /slug|duplicate|unique/i.test(e.message) ? '이미 쓰는 주소예요' : '저장하지 못했어요. 칸을 확인해 주세요'),
              },
            )
          }
          className="h-10 flex-1 rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          저장
        </button>
      </div>
    </section>
  );
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        {label}
        {hint && <span className="ml-2 font-normal">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

function Applicants({ ev }: { ev: PilotEvent }) {
  const { data: rows = [], isLoading } = useAdminPilotApplications(ev.id);
  const setStatus = useSetPilotStatus(ev.id);
  const purge = usePurgePilotPersonal(ev.id);
  const [status, setStatusFilter] = useState<PilotStatus | 'all' | 'active'>('active');
  const [school, setSchool] = useState('all');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const active = rows.filter((r) => r.status !== 'cancelled');
  const schoolKey = (r: AdminPilotApplication) => (r.is_student ? r.school || '(학교 없음)' : '일반 시민');

  const bySchool = useMemo(() => {
    const m = new Map<string, { n: number; selected: number; agree: number; disagree: number; hold: number; none: number }>();
    for (const r of active) {
      const k = schoolKey(r);
      const s = m.get(k) ?? { n: 0, selected: 0, agree: 0, disagree: 0, hold: 0, none: 0 };
      s.n++;
      if (r.status === 'selected') s.selected++;
      s[r.pre_choice ?? 'none']++;
      m.set(k, s);
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [active]);

  const totals = useMemo(() => {
    const t = { selected: 0, agree: 0, disagree: 0, hold: 0, none: 0, selAgree: 0, selDisagree: 0 };
    for (const r of active) {
      t[r.pre_choice ?? 'none']++;
      if (r.status === 'selected') {
        t.selected++;
        if (r.pre_choice === 'agree') t.selAgree++;
        if (r.pre_choice === 'disagree') t.selDisagree++;
      }
    }
    return t;
  }, [active]);

  const shown = rows.filter((r) => {
    if (status === 'active' ? r.status === 'cancelled' : status !== 'all' && r.status !== status) return false;
    if (school !== 'all' && schoolKey(r) !== school) return false;
    if (q && !`${r.name} ${r.phone} ${r.major}`.includes(q.trim())) return false;
    return true;
  });

  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const bulk = (s: Exclude<PilotStatus, 'cancelled'>) => {
    const ids = [...picked];
    if (ids.length === 0) return;
    setStatus.mutate(
      { ids, status: s },
      {
        onSuccess: (n) => {
          toast.success(`${n}명을 '${PILOT_STATUS_LABELS[s]}'(으)로 바꿨어요`);
          setPicked(new Set());
        },
        onError: () => toast.error('바꾸지 못했어요'),
      },
    );
  };

  const download = (kind: 'contact' | 'all') => {
    const list = kind === 'contact' ? rows.filter((r) => r.status === 'selected') : rows;
    const cols =
      kind === 'contact'
        ? ([
            { key: 'name', label: '이름' },
            { key: 'phone', label: '휴대전화' },
            { key: 'school', label: '학교' },
            { key: 'consent_photo', label: '촬영 동의' },
          ] as const)
        : ([
            { key: 'name', label: '이름' },
            { key: 'phone', label: '휴대전화' },
            { key: 'is_student', label: '구분' },
            { key: 'school', label: '학교' },
            { key: 'major', label: '학과' },
            { key: 'grade', label: '학년' },
            { key: 'pre', label: '사전 의견' },
            { key: 'status', label: '상태' },
            { key: 'heard_from', label: '알게 된 경로' },
            { key: 'consent_photo', label: '촬영 동의' },
            { key: 'created_at', label: '신청 시각' },
          ] as const);
    const blob = new Blob([pilotCsv(list, [...cols])], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ev.slug}-${kind === 'contact' ? '선발자-연락' : '신청자-전체'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">신청자를 불러오는 중…</p>;

  const finished = new Date(ev.event_at).getTime() < Date.now();

  return (
    <>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="신청" value={`${active.length}명`} sub={`정원 ${ev.capacity}명`} />
        <Stat label="선발" value={`${totals.selected}명`} sub={`찬성 ${totals.selAgree} · 반대 ${totals.selDisagree}`} />
        <Stat label="사전 의견 (신청자)" value={`찬 ${totals.agree} · 반 ${totals.disagree}`} sub={`모름 ${totals.hold} · 미응답 ${totals.none}`} />
        <Stat label="취소" value={`${rows.length - active.length}명`} />
      </section>

      <section className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">학교</th>
              <th className="px-3 py-2 text-right">신청</th>
              <th className="px-3 py-2 text-right">선발</th>
              <th className="px-3 py-2 text-right">찬성</th>
              <th className="px-3 py-2 text-right">반대</th>
              <th className="px-3 py-2 text-right">모름</th>
              <th className="px-3 py-2 text-right">미응답</th>
            </tr>
          </thead>
          <tbody>
            {bySchool.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  아직 신청자가 없어요
                </td>
              </tr>
            )}
            {bySchool.map(([k, s]) => (
              <tr key={k} className="border-t border-border">
                <td className="px-3 py-2">
                  <button onClick={() => setSchool(school === k ? 'all' : k)} className={cn('text-left', school === k && 'font-bold text-primary')}>
                    {k}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">{s.n}</td>
                <td className="px-3 py-2 text-right font-semibold">{s.selected}</td>
                <td className="px-3 py-2 text-right">{s.agree}</td>
                <td className="px-3 py-2 text-right">{s.disagree}</td>
                <td className="px-3 py-2 text-right">{s.hold}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{s.none}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => setStatusFilter(e.target.value as typeof status)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="active">취소 빼고 전체</option>
            <option value="all">전체</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {PILOT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select value={school} onChange={(e) => setSchool(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="all">모든 학교</option>
            {bySchool.map(([k]) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·번호·학과 찾기" className="h-9 min-w-40 flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
          <button onClick={() => download('contact')} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm">
            <Download size={14} /> 선발자 연락 명단
          </button>
          <button onClick={() => download('all')} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm">
            <Download size={14} /> 전체 CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
          <span className="font-semibold">{picked.size}명 고름</span>
          <button onClick={() => setPicked(new Set(shown.filter((r) => r.status !== 'cancelled').map((r) => r.id)))} className="text-xs text-primary">
            보이는 사람 모두
          </button>
          <button onClick={() => setPicked(new Set())} className="text-xs text-muted-foreground">
            고르기 풀기
          </button>
          <span className="flex-1" />
          {(['selected', 'waitlist', 'declined', 'applied'] as const).map((s) => (
            <button
              key={s}
              disabled={picked.size === 0 || setStatus.isPending}
              onClick={() => bulk(s)}
              className={cn('h-8 rounded-lg px-3 text-xs font-semibold disabled:opacity-40', s === 'selected' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background')}
            >
              {s === 'applied' ? '되돌리기' : PILOT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2" />
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">휴대전화</th>
                <th className="px-3 py-2 text-left">학교 · 학과 · 학년</th>
                <th className="px-3 py-2 text-left">사전 의견</th>
                <th className="px-3 py-2 text-left">상태</th>
                <th className="px-3 py-2 text-left">신청</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={cn('border-t border-border', r.status === 'cancelled' && 'text-muted-foreground line-through')}>
                  <td className="px-3 py-2">
                    <input type="checkbox" disabled={r.status === 'cancelled'} checked={picked.has(r.id)} onChange={() => togglePick(r.id)} aria-label={`${r.name} 고르기`} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium">
                    {r.name || '(지움)'}
                    {r.consent_photo ? '' : <span className="ml-1 text-xs text-muted-foreground">촬영✕</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatPhone(r.phone)}</td>
                  <td className="px-3 py-2">{r.is_student ? [r.school, r.major, r.grade].filter(Boolean).join(' · ') : '일반 시민'}</td>
                  <td className="px-3 py-2">{r.pre_choice ? PRE_LABEL[r.pre_choice] : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs', r.status === 'selected' ? 'bg-primary/15 font-semibold text-primary' : 'bg-secondary')}>
                      {PILOT_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4 text-sm">
        <p className="font-semibold">행사 후 개인정보 지우기</p>
        <p className="mt-1 text-muted-foreground">
          행사가 끝나고 3개월 안에 지워야 해요. 이름·연락처·학과·알게 된 경로가 지워지고 학교·학년·상태만 남아요. 되돌릴 수 없어요.
          {ev.personal_purged_at && ` (지운 날: ${new Date(ev.personal_purged_at).toLocaleDateString('ko-KR')})`}
        </p>
        <button
          disabled={!finished || purge.isPending}
          onClick={() => {
            if (!window.confirm('이 행사 신청자의 개인정보를 지울까요? 되돌릴 수 없어요.')) return;
            purge.mutate(undefined, {
              onSuccess: (n) => toast.success(`${n}명의 개인정보를 지웠어요`),
              onError: () => toast.error('지우지 못했어요'),
            });
          }}
          className="mt-2 h-9 rounded-lg border border-destructive/40 px-3 text-sm font-semibold text-destructive disabled:opacity-40"
        >
          {finished ? '개인정보 지우기' : '행사가 끝난 뒤에 쓸 수 있어요'}
        </button>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
