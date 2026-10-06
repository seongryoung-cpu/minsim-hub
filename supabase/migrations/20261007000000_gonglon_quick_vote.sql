-- 공론 빠른 투표: 후보 의제를 카드로 빠르게 투표하고, 반응이 큰 의제만 공론으로 올린다 (2026-10-07)
--
-- 의제 상태:   draft(초안) → candidate(후보 · 빠른 투표) → open(공론 진행 중) → closed(마감)
-- 빠른 투표:   agenda_votes 의 stage='first', source='quick' 로 저장 → 공론으로 올라가면 그대로 '첫 반응'이 된다.
--              화면의 '모르겠어요'는 공론의 '유보'(hold)와 같은 값. '건너뛰기'는 저장하지 않는다.
-- 더 알고 싶어요: agenda_interests (관심 의제) 재사용. 후보가 공론으로 올라가면 앱 안 알림.
-- 승격:        관리자용 순위(참여 수 · 갈림 정도 · 더 알고 싶어요)만 계산하고, 올릴지는 운영자가 정한다.
-- 후보 의제는 허브 목록·공약 연결 카드에 나오지 않는다.

-- ─────────────────────────────────────────────────────────────
-- 1. 상태와 출처 값 추가
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_status_check;
ALTER TABLE public.agendas
  ADD CONSTRAINT agendas_status_check CHECK (status IN ('draft', 'candidate', 'open', 'closed'));

ALTER TABLE public.agenda_votes DROP CONSTRAINT IF EXISTS agenda_votes_source_check;
ALTER TABLE public.agenda_votes
  ADD CONSTRAINT agenda_votes_source_check
  CHECK (source IN ('pledge_card', 'compare', 'home', 'hub', 'agenda', 'quick'));

-- ─────────────────────────────────────────────────────────────
-- 2. 투표: 후보 의제에는 첫 반응(빠른 투표)만 받는다
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cast_agenda_vote(
  p_agenda_id uuid,
  p_stage text,
  p_choice text,
  p_source text DEFAULT 'agenda'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_status text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('error', 'login_required');
  END IF;
  IF p_stage NOT IN ('first', 'final') OR p_choice NOT IN ('agree', 'disagree', 'hold')
     OR p_source NOT IN ('pledge_card', 'compare', 'home', 'hub', 'agenda', 'quick') THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;

  SELECT public.agenda_effective_status(status, closes_at) INTO v_status FROM agendas WHERE id = p_agenda_id;
  IF NOT public.gonglon_visible() OR v_status IS NULL
     OR NOT (v_status = 'open' OR (v_status = 'candidate' AND p_stage = 'first')) THEN
    RETURN jsonb_build_object('error', 'agenda_not_open');
  END IF;
  IF p_source IN ('pledge_card', 'compare') AND public.app_setting_on('election_quiet_mode') THEN
    RETURN jsonb_build_object('error', 'quiet_mode');
  END IF;

  INSERT INTO agenda_votes (agenda_id, user_id, stage, choice, source)
  VALUES (p_agenda_id, v_user, p_stage, p_choice, p_source)
  ON CONFLICT (agenda_id, user_id, stage)
  DO UPDATE SET choice = EXCLUDED.choice, source = EXCLUDED.source;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. 공약 연결 카드에서 후보 의제 제외
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_linked_agendas(p_pledge_ids uuid[] DEFAULT '{}'::uuid[], p_policy_card_ids uuid[] DEFAULT '{}'::uuid[])
 RETURNS TABLE(pledge_id uuid, policy_card_id uuid, agenda_id uuid, title text, status text, closes_at timestamp with time zone, participants integer, my_first text, my_final text, quiet_mode boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_quiet boolean := public.app_setting_on('election_quiet_mode');
BEGIN
  IF public.app_setting_on('election_hide_link_cards') OR NOT public.gonglon_visible() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.pledge_id, r.policy_card_id, r.agenda_id, r.title, r.eff, r.closes_at,
         r.participants, r.my_first, r.my_final, v_quiet
  FROM (
    SELECT l.pledge_id, l.policy_card_id, a.id AS agenda_id, a.title,
           public.agenda_effective_status(a.status, a.closes_at) AS eff, a.closes_at,
           (SELECT count(DISTINCT v.user_id)::int FROM agenda_votes v WHERE v.agenda_id = a.id) AS participants,
           (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = v_user AND v.stage = 'first') AS my_first,
           (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = v_user AND v.stage = 'final') AS my_final,
           row_number() OVER (
             PARTITION BY coalesce(l.pledge_id, l.policy_card_id)
             ORDER BY (public.agenda_effective_status(a.status, a.closes_at) = 'open') DESC, l.sort_order, a.created_at DESC
           ) AS rn
    FROM agenda_links l
    JOIN agendas a ON a.id = l.agenda_id AND a.status IN ('open', 'closed')
    WHERE l.pledge_id = ANY (p_pledge_ids) OR l.policy_card_id = ANY (p_policy_card_ids)
  ) r
  WHERE r.rn <= 2;
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- 4. 빠른 투표 카드 목록
-- ─────────────────────────────────────────────────────────────
-- 아직 투표하지 않은 카드가 먼저. 결과는 내가 투표했고 참여 5명 이상일 때만 (쏠림 방지, 한 사람 노출 방지).
CREATE OR REPLACE FUNCTION public.get_quick_agendas(p_sido text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF NOT public.gonglon_visible() THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN coalesce((
    SELECT jsonb_agg(row_to_json(x) ORDER BY (x.my_vote IS NOT NULL), x.created_at DESC)
    FROM (
      SELECT a.id, a.title, a.summary, a.question, a.category, a.region_sido, a.created_at,
             mv.choice AS my_vote,
             (v_user IS NOT NULL AND EXISTS (
               SELECT 1 FROM agenda_interests i WHERE i.agenda_id = a.id AND i.user_id = v_user
             )) AS my_interest,
             CASE WHEN mv.choice IS NOT NULL AND t.total >= 5 THEN
               jsonb_build_object('total', t.total, 'agree', t.agree, 'disagree', t.disagree, 'hold', t.hold)
             END AS results
      FROM agendas a
      LEFT JOIN agenda_votes mv ON mv.agenda_id = a.id AND mv.user_id = v_user AND mv.stage = 'first'
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE choice = 'agree')::int AS agree,
               count(*) FILTER (WHERE choice = 'disagree')::int AS disagree,
               count(*) FILTER (WHERE choice = 'hold')::int AS hold
        FROM agenda_votes v WHERE v.agenda_id = a.id AND v.stage = 'first'
      ) t ON true
      WHERE a.status = 'candidate'
        AND (p_sido IS NULL OR a.region_sido IS NULL OR a.region_sido = p_sido)
    ) x
  ), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.get_quick_agendas(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quick_agendas(text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. 관리자: 승격 순위
-- ─────────────────────────────────────────────────────────────
-- 갈림 정도 = 1 - |찬성 - 반대| / (찬성 + 반대)  (50:50이면 1, 한쪽으로 쏠리면 0)
-- 점수     = (참여 수 + 더 알고 싶어요 × 3) × (0.4 + 0.6 × 갈림 정도)
--            가중치는 초안이다. 숫자는 판단 보조이고, 올릴지는 운영자가 정한다.
CREATE OR REPLACE FUNCTION public.get_candidate_ranking()
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  region_sido text,
  created_at timestamptz,
  votes int,
  agree int,
  disagree int,
  hold int,
  interested int,
  divisiveness numeric,
  score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT coalesce(public.is_admin(auth.uid()), false) THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT s.id, s.title, s.category, s.region_sido, s.created_at,
         s.votes, s.agree, s.disagree, s.hold, s.interested,
         round(s.div, 2),
         round((s.votes + s.interested * 3) * (0.4 + 0.6 * s.div), 1)
  FROM (
    SELECT a.id, a.title, a.category, a.region_sido, a.created_at,
           count(v.*)::int AS votes,
           count(v.*) FILTER (WHERE v.choice = 'agree')::int AS agree,
           count(v.*) FILTER (WHERE v.choice = 'disagree')::int AS disagree,
           count(v.*) FILTER (WHERE v.choice = 'hold')::int AS hold,
           (SELECT count(*)::int FROM agenda_interests i WHERE i.agenda_id = a.id) AS interested,
           CASE WHEN count(v.*) FILTER (WHERE v.choice IN ('agree', 'disagree')) = 0 THEN 0
                ELSE 1 - abs(count(v.*) FILTER (WHERE v.choice = 'agree') - count(v.*) FILTER (WHERE v.choice = 'disagree'))::numeric
                         / count(v.*) FILTER (WHERE v.choice IN ('agree', 'disagree'))
           END AS div
    FROM agendas a
    LEFT JOIN agenda_votes v ON v.agenda_id = a.id AND v.stage = 'first'
    WHERE a.status = 'candidate'
    GROUP BY a.id
  ) s
  ORDER BY 12 DESC, s.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_candidate_ranking() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_candidate_ranking() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. 알림: 후보가 공론으로 올라가면 '더 알고 싶어요'를 누른 사람에게
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_agenda_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_closed boolean := NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed';
  v_promoted boolean := NEW.status = 'open' AND OLD.status = 'candidate';
BEGIN
  IF NEW.status IN ('draft', 'candidate') THEN RETURN NEW; END IF;
  IF v_promoted OR v_closed OR NEW.summary IS DISTINCT FROM OLD.summary THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT i.user_id, 'agenda',
           CASE WHEN v_promoted THEN '더 알고 싶다던 의제가 공론으로 올라왔어요'
                WHEN v_closed THEN '관심 의제가 마감됐어요'
                ELSE '관심 의제의 요약이 바뀌었어요' END,
           NEW.title,
           jsonb_build_object('path', '/gonglon/' || NEW.id::text, 'agenda_id', NEW.id)
    FROM agenda_interests i WHERE i.agenda_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_agenda_interest() FROM PUBLIC, anon, authenticated;
