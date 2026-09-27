-- 공론 화면 보강 (2026-09-28)
-- 와이어프레임(공론 허브 · 의제 상세 · 연결 카드)에 맞춰 부족한 칸과 함수를 채운다.
--
--   agendas.category       카테고리 칩 (주거·교통·교육 …). NULL 허용
--   agendas.split_reason   배경의 '쟁점' 줄: 의견이 갈리는 이유 한두 줄
--   agendas.question       배경의 '결정' 줄: 이번 공론에서 정할 것 (투표 문장)
--   agenda_issues.kind     쟁점 카드 종류: pro(찬성 쪽 논거) / con(반대 쪽 논거) / fact(확인된 사실) / point(일반)
--   agenda_issues.sources  쟁점 카드의 출처 목록 (URL 또는 인용 문구)
--   한 줄 의견 길이        5~140자 → 5~80자 (한 줄 느낌 유지)
--   get_agenda_list        허브 목록: 참여자·한 줄 의견·관련 공약 수, 내 참여 여부를 한 번에
--   get_agenda_summary     마감된 의제는 투표하지 않은 사람에게도 결과 공개 (참여 5명 이상일 때)

-- ─────────────────────────────────────────────────────────────
-- 1. 칸 추가
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.agendas
  ADD COLUMN IF NOT EXISTS category text CHECK (category IS NULL OR char_length(category) BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS split_reason text NOT NULL DEFAULT '' CHECK (char_length(split_reason) <= 300),
  ADD COLUMN IF NOT EXISTS question text NOT NULL DEFAULT '' CHECK (char_length(question) <= 200);

ALTER TABLE public.agenda_issues
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'point' CHECK (kind IN ('pro', 'con', 'fact', 'point')),
  ADD COLUMN IF NOT EXISTS sources text[] NOT NULL DEFAULT '{}';

-- 한 줄 의견 80자
ALTER TABLE public.agenda_statements DROP CONSTRAINT IF EXISTS agenda_statements_body_check;
ALTER TABLE public.agenda_statements
  ADD CONSTRAINT agenda_statements_body_check CHECK (char_length(btrim(body)) BETWEEN 5 AND 80);

CREATE INDEX IF NOT EXISTS idx_agendas_status_closes ON public.agendas (status, closes_at);

-- ─────────────────────────────────────────────────────────────
-- 2. 허브 목록
-- ─────────────────────────────────────────────────────────────
-- 진행 중 먼저(마감 임박 순), 그다음 마감(최근 마감 순). p_sido 지정 시 그 지역 + 전국 의제.
-- 분포는 주지 않는다 (목록에서 다수 쪽으로 쏠리지 않게).
CREATE OR REPLACE FUNCTION public.get_agenda_list(p_sido text DEFAULT NULL)
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
  my_final text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.title, a.summary, a.category, a.region_sido, a.status, a.is_featured,
         a.opens_at, a.closes_at, a.created_at,
         (SELECT count(DISTINCT v.user_id)::int FROM agenda_votes v WHERE v.agenda_id = a.id),
         (SELECT count(*)::int FROM agenda_statements s WHERE s.agenda_id = a.id AND NOT s.is_hidden),
         (SELECT count(*)::int FROM agenda_links l WHERE l.agenda_id = a.id AND l.pledge_id IS NOT NULL),
         (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = auth.uid() AND v.stage = 'first'),
         (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = auth.uid() AND v.stage = 'final')
  FROM agendas a
  WHERE a.status IN ('open', 'closed')
    AND (p_sido IS NULL OR a.region_sido IS NULL OR a.region_sido = p_sido)
  ORDER BY (a.status = 'open') DESC,
           CASE WHEN a.status = 'open' THEN a.closes_at END ASC NULLS LAST,
           CASE WHEN a.status = 'closed' THEN a.closes_at END DESC NULLS LAST,
           a.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_agenda_list(text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. 의제 요약: 마감된 의제는 결과 공개
-- ─────────────────────────────────────────────────────────────
-- 진행 중: 최종 의견을 낸 본인(또는 관리자)에게만, 참여 5명 이상일 때 분포 공개 (기존과 같음)
-- 마감:    누구에게나, 참여 5명 이상일 때 분포 공개
CREATE OR REPLACE FUNCTION public.get_agenda_summary(p_agenda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_status text;
  v_participants int;
  v_my_first text;
  v_my_final text;
  v_reveal boolean;
BEGIN
  SELECT status INTO v_status FROM agendas WHERE id = p_agenda_id;
  IF v_status IS NULL OR (v_status = 'draft' AND NOT public.is_admin(v_user)) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT count(DISTINCT user_id) INTO v_participants FROM agenda_votes WHERE agenda_id = p_agenda_id;

  IF v_user IS NOT NULL THEN
    SELECT choice INTO v_my_first FROM agenda_votes WHERE agenda_id = p_agenda_id AND user_id = v_user AND stage = 'first';
    SELECT choice INTO v_my_final FROM agenda_votes WHERE agenda_id = p_agenda_id AND user_id = v_user AND stage = 'final';
  END IF;

  v_reveal := (v_status = 'closed' OR v_my_final IS NOT NULL OR public.is_admin(v_user)) AND v_participants >= 5;

  RETURN jsonb_build_object(
    'participants', v_participants,
    'my_first', v_my_first,
    'my_final', v_my_final,
    'revealed', v_reveal,
    'distribution', CASE WHEN v_reveal THEN (
      SELECT jsonb_build_object(
        'first', jsonb_build_object(
          'agree',    count(*) FILTER (WHERE stage = 'first' AND choice = 'agree'),
          'disagree', count(*) FILTER (WHERE stage = 'first' AND choice = 'disagree'),
          'hold',     count(*) FILTER (WHERE stage = 'first' AND choice = 'hold')),
        'final', jsonb_build_object(
          'agree',    count(*) FILTER (WHERE stage = 'final' AND choice = 'agree'),
          'disagree', count(*) FILTER (WHERE stage = 'final' AND choice = 'disagree'),
          'hold',     count(*) FILTER (WHERE stage = 'final' AND choice = 'hold')))
      FROM agenda_votes WHERE agenda_id = p_agenda_id
    ) END,
    'shift', CASE WHEN v_reveal THEN (
      SELECT coalesce(jsonb_object_agg(s.first_choice || '>' || s.final_choice, s.cnt), '{}'::jsonb)
      FROM (
        SELECT f.choice AS first_choice, l.choice AS final_choice, count(*) AS cnt
        FROM agenda_votes f
        JOIN agenda_votes l ON l.agenda_id = f.agenda_id AND l.user_id = f.user_id AND l.stage = 'final'
        WHERE f.agenda_id = p_agenda_id AND f.stage = 'first'
        GROUP BY f.choice, l.choice
      ) s
    ) END
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. 공론 공개 스위치 (기본 꺼짐: 관리자에게만 보임)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (key, value)
VALUES ('gonglon_public', 'false')
ON CONFLICT (key) DO NOTHING;
