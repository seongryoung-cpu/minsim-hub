-- 평상시(선거 후) 공론 화면 정리
--  1) 관련 인물 입장 (운영진 입력): 출처 필수, 권한 순서로 정렬, 찬반 분류 없음
--  2) 관련 공약에 당선 여부를 같이 내려 준다 → 평상시엔 당선인 공약만 '이행 추적'으로, 나머지는 선거 탭 링크로
--  3) 의제 목록의 공약 수에 당선인 공약 수를 따로 둔다

-- ─────────────────────────────────────────────────────────────
-- 1) 관련 인물 입장
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agenda_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  person_name text NOT NULL CHECK (char_length(btrim(person_name)) BETWEEN 2 AND 30),
  -- 이 의제에 대한 권한 순서 (화면 정렬 기준, 순서를 ? 설명에 공개)
  role_kind text NOT NULL CHECK (role_kind IN ('bill_sponsor', 'committee', 'local_head', 'party_leader', 'other')),
  role_label text NOT NULL CHECK (char_length(btrim(role_label)) BETWEEN 2 AND 40),   -- 예: 국회 국토교통위원장
  party text CHECK (party IS NULL OR char_length(party) <= 30),
  summary text NOT NULL CHECK (char_length(btrim(summary)) BETWEEN 10 AND 300),          -- 발언 요지 (민심잇다가 찬반으로 분류하지 않음)
  source_url text NOT NULL CHECK (source_url ~ '^https?://[^\s]+$' AND char_length(source_url) <= 500),
  source_kind text NOT NULL CHECK (source_kind IN ('minutes', 'press', 'sns', 'news')),
  spoken_on date NOT NULL CHECK (spoken_on <= (now() AT TIME ZONE 'Asia/Seoul')::date),
  candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,                 -- 나중에 정치인(인물) 테이블과 연결할 자리
  is_hidden boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agenda_positions_agenda_idx ON public.agenda_positions (agenda_id);

ALTER TABLE public.agenda_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Positions are visible with the agenda" ON public.agenda_positions;
CREATE POLICY "Positions are visible with the agenda" ON public.agenda_positions
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR (
      NOT is_hidden
      AND public.gonglon_visible()
      AND NOT public.app_setting_on('election_quiet_mode')   -- 선거 기간엔 인물 발언을 내린다
      AND EXISTS (SELECT 1 FROM public.agendas a WHERE a.id = agenda_id AND a.status <> 'draft')
    )
  );

DROP POLICY IF EXISTS "Admins manage positions" ON public.agenda_positions;
CREATE POLICY "Admins manage positions" ON public.agenda_positions
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.agenda_positions_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN NEW.created_by := auth.uid(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS agenda_positions_touch ON public.agenda_positions;
CREATE TRIGGER agenda_positions_touch BEFORE INSERT OR UPDATE ON public.agenda_positions
  FOR EACH ROW EXECUTE FUNCTION public.agenda_positions_touch();

REVOKE ALL ON public.agenda_positions FROM anon;
GRANT SELECT ON public.agenda_positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_positions TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2) 관련 공약 + 당선 여부 (반환 형식이 바뀌므로 다시 만든다)
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_agenda_related_pledges(uuid);
CREATE FUNCTION public.get_agenda_related_pledges(p_agenda_id uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_slug text,
  candidate_name text,
  party text,
  pledge_id uuid,
  pledge_title text,
  pledge_description text,
  election_result text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.slug, c.name, c.party, p.id, p.title, p.description, c.election_result
  FROM agenda_links l
  JOIN agendas a ON a.id = l.agenda_id AND (a.status <> 'draft' OR public.is_admin(auth.uid()))
  JOIN candidate_pledges p ON p.id = l.pledge_id
  JOIN candidates c ON c.id = p.candidate_id AND c.is_active
  WHERE l.agenda_id = p_agenda_id AND public.gonglon_visible()
  ORDER BY c.name, p.sort_order;
$$;
GRANT EXECUTE ON FUNCTION public.get_agenda_related_pledges(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3) 의제 목록: 당선인 공약 수 추가 (기존 열은 그대로, 맨 끝에 추가)
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_agenda_list(text);
CREATE FUNCTION public.get_agenda_list(p_sido text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  category text,
  region_sido text,
  status text,
  is_featured boolean,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz,
  participants int,
  statement_count int,
  pledge_count int,
  my_first text,
  my_final text,
  elected_pledge_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.title, a.summary, a.category, a.region_sido, a.eff, a.is_featured,
         a.opens_at, a.closes_at, a.created_at,
         (SELECT count(DISTINCT v.user_id)::int FROM agenda_votes v WHERE v.agenda_id = a.id),
         (SELECT count(*)::int FROM agenda_statements s WHERE s.agenda_id = a.id AND NOT s.is_hidden),
         (SELECT count(*)::int FROM agenda_links l
            JOIN candidate_pledges p ON p.id = l.pledge_id
            JOIN candidates c ON c.id = p.candidate_id AND c.is_active
          WHERE l.agenda_id = a.id),
         (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = auth.uid() AND v.stage = 'first'),
         (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = auth.uid() AND v.stage = 'final'),
         (SELECT count(*)::int FROM agenda_links l
            JOIN candidate_pledges p ON p.id = l.pledge_id
            JOIN candidates c ON c.id = p.candidate_id AND c.is_active AND c.election_result = 'elected'
          WHERE l.agenda_id = a.id)
  FROM (
    SELECT ag.*, public.agenda_effective_status(ag.status, ag.closes_at) AS eff FROM agendas ag
  ) a
  WHERE public.gonglon_visible()
    AND a.eff IN ('open', 'closed')
    AND (p_sido IS NULL OR a.region_sido IS NULL OR a.region_sido = p_sido)
  ORDER BY (a.eff = 'open') DESC,
           CASE WHEN a.eff = 'open' THEN a.closes_at END ASC NULLS LAST,
           CASE WHEN a.eff = 'closed' THEN a.closes_at END DESC NULLS LAST,
           a.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_agenda_list(text) TO anon, authenticated;
