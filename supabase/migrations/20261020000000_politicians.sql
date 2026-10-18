-- 정치인 탭 '우리를 대표하는 사람들'
-- 국회의원: 열린국회정보 국회의원 인적사항(nwvrqwxyaytdsfvhu)을 매일 받아 저장 (Edge Function assembly-bills, action members)
-- 광역단체장: 기존 candidates 의 당선인(election_result = 'elected')을 그대로 쓴다
-- 공개 정보만 저장한다: 생년월일·보좌진 이름은 받지 않는다.

CREATE TABLE IF NOT EXISTS public.assembly_members (
  mona_cd text PRIMARY KEY,                       -- 국회 의원 코드
  name text NOT NULL,
  party text,
  district text,                                  -- 국회 선거구 이름 그대로 (예: 경기 수원시갑, 비례대표)
  elect_type text,                                -- 지역구 / 비례대표
  sido text,                                      -- 앱 시·도 이름 (비례대표는 null)
  sigungu_tokens text[] NOT NULL DEFAULT '{}',    -- 선거구에 들어 있는 시·군·구 (예: {동구,군위군})
  committees text[] NOT NULL DEFAULT '{}',
  committee_role text,                            -- 위원장·간사·위원
  reelection text,                                -- 초선·재선…
  units text,                                     -- 제21대, 제22대
  tel text,
  email text,
  homepage text,
  office text,                                    -- 의원회관 호실
  career text,                                    -- 국회 공개 약력 (의원실이 작성)
  is_current boolean NOT NULL DEFAULT true,       -- 마지막 동기화 명단에 없으면 false
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assembly_members_sido_idx ON public.assembly_members (sido) WHERE is_current;
CREATE INDEX IF NOT EXISTS assembly_members_name_idx ON public.assembly_members (name);

ALTER TABLE public.assembly_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads current members" ON public.assembly_members;
CREATE POLICY "Anyone reads current members" ON public.assembly_members
  FOR SELECT USING (is_current OR public.is_admin(auth.uid()));
-- 쓰기는 Edge Function(service role)만

-- 관련 인물 입장을 국회의원과 정확히 잇는다 (이름만으로는 동명이인이 생길 수 있어서 코드로)
ALTER TABLE public.agenda_positions ADD COLUMN IF NOT EXISTS mona_cd text;
CREATE INDEX IF NOT EXISTS agenda_positions_mona_idx ON public.agenda_positions (mona_cd);

-- 운영진이 이름만 넣어도, 현직 국회의원 중 같은 이름이 딱 한 명이면 코드를 채운다
CREATE OR REPLACE FUNCTION public.agenda_positions_fill_mona()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_codes text[];
BEGIN
  IF NEW.mona_cd IS NULL AND NEW.candidate_id IS NULL THEN
    SELECT array_agg(mona_cd) INTO v_codes FROM assembly_members WHERE is_current AND name = btrim(NEW.person_name);
    IF coalesce(array_length(v_codes, 1), 0) = 1 THEN NEW.mona_cd := v_codes[1]; END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS agenda_positions_fill_mona ON public.agenda_positions;
CREATE TRIGGER agenda_positions_fill_mona BEFORE INSERT OR UPDATE OF person_name, candidate_id, mona_cd
  ON public.agenda_positions FOR EACH ROW EXECUTE FUNCTION public.agenda_positions_fill_mona();

-- 동기화 뒤 기존 입장에도 코드를 채운다 (Edge Function이 members 동기화 끝에 부른다)
CREATE OR REPLACE FUNCTION public.backfill_position_mona()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH uniq AS (
    SELECT name, min(mona_cd) AS mona_cd FROM assembly_members WHERE is_current GROUP BY name HAVING count(*) = 1
  ), upd AS (
    UPDATE agenda_positions p SET mona_cd = u.mona_cd
    FROM uniq u WHERE p.mona_cd IS NULL AND p.candidate_id IS NULL AND btrim(p.person_name) = u.name
    RETURNING 1
  ) SELECT count(*)::int FROM upd $$;
REVOKE ALL ON FUNCTION public.backfill_position_mona() FROM PUBLIC, anon, authenticated;

-- 인물 페이지: 공론에서의 기록 (입장 · 연결된 법안 표결 · 대표발의)
-- 공론이 비공개면 비우고, 선거 조용 모드에서는 입장을 내린다 (agenda_positions RLS와 같은 기준)
CREATE OR REPLACE FUNCTION public.get_politician_activity(p_mona_cd text DEFAULT NULL, p_candidate_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH vis AS (
    SELECT a.id, a.title FROM agendas a
    WHERE (a.status <> 'draft' AND public.gonglon_visible()) OR public.is_admin(auth.uid())
  )
  SELECT jsonb_build_object(
    'positions', CASE WHEN public.app_setting_on('election_quiet_mode') AND NOT public.is_admin(auth.uid()) THEN '[]'::jsonb ELSE (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'agenda_id', v.id, 'agenda_title', v.title, 'role_label', p.role_label, 'summary', p.summary,
        'source_url', p.source_url, 'source_kind', p.source_kind, 'spoken_on', p.spoken_on) ORDER BY p.spoken_on DESC), '[]'::jsonb)
      FROM agenda_positions p JOIN vis v ON v.id = p.agenda_id
      WHERE NOT p.is_hidden
        AND ((p_mona_cd IS NOT NULL AND p.mona_cd = p_mona_cd) OR (p_candidate_id IS NOT NULL AND p.candidate_id = p_candidate_id))
    ) END,
    'votes', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'agenda_id', v.id, 'agenda_title', v.title, 'bill_id', b.bill_id, 'bill_name', b.bill_name,
        'vote', bv.vote, 'vote_date', b.vote_date) ORDER BY b.vote_date DESC NULLS LAST), '[]'::jsonb)
      FROM assembly_bill_votes bv
      JOIN assembly_bills b ON b.bill_id = bv.bill_id
      JOIN agenda_bills ab ON ab.bill_id = b.bill_id
      JOIN vis v ON v.id = ab.agenda_id
      WHERE p_mona_cd IS NOT NULL AND bv.mona_cd = p_mona_cd
    ),
    'sponsored', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'agenda_id', v.id, 'agenda_title', v.title, 'bill_id', b.bill_id, 'bill_name', b.bill_name,
        'stage', b.stage, 'propose_dt', b.propose_dt) ORDER BY b.propose_dt DESC NULLS LAST), '[]'::jsonb)
      FROM assembly_bills b
      JOIN agenda_bills ab ON ab.bill_id = b.bill_id
      JOIN vis v ON v.id = ab.agenda_id
      WHERE p_mona_cd IS NOT NULL AND b.rst_mona_cd = p_mona_cd
    )
  ) $$;
GRANT EXECUTE ON FUNCTION public.get_politician_activity(text, uuid) TO anon, authenticated;
