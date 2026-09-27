-- 공론 서버 규칙 보강 (2026-09-28, 독립 검토 반영)
--
-- 1. 작성자 보호: agenda_statements 를 테이블에서 직접 읽으면 user_id 가 보였다.
--    → 본인 글과 관리자만 직접 읽기. 공개 목록은 get_agenda_statements(작성자 id 없음)로만.
-- 2. 분포 공개 기준: '참여자(첫 반응+최종) 5명'이 아니라 '최종 의견 5명 이상'.
--    (첫 반응 4명 + 최종 1명일 때 한 사람의 선택이 100%로 드러나던 문제)
-- 3. 선거 기간 조용한 모드에서는 마감된 의제도 '최종 의견을 낸 본인·관리자'에게만 분포 공개.
-- 4. 마감 일시(closes_at)가 지나면 status='open'이어도 마감으로 취급 (투표·의견 작성 차단, 목록 정렬).
-- 5. 공론 공개 전(app_settings.gonglon_public ≠ 'true')에는 서버에서도 관리자에게만 데이터를 준다.
-- 6. 한 줄 의견 3개 제한은 숨김 처리되지 않은 것만 센다.
-- 7. 허브 카드의 '관련 공약 N개'는 활성 후보의 공약만 센다 (의제 상세 목록과 일치).

-- ─────────────────────────────────────────────────────────────
-- 도우미
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gonglon_visible()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_setting_on('gonglon_public') OR coalesce(public.is_admin(auth.uid()), false);
$$;
GRANT EXECUTE ON FUNCTION public.gonglon_visible() TO anon, authenticated;

-- 마감 일시가 지난 진행 중 의제는 마감으로 본다
CREATE OR REPLACE FUNCTION public.agenda_effective_status(p_status text, p_closes_at timestamptz)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN p_status = 'open' AND p_closes_at IS NOT NULL AND p_closes_at <= now() THEN 'closed' ELSE p_status END;
$$;
GRANT EXECUTE ON FUNCTION public.agenda_effective_status(text, timestamptz) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public reads published agendas" ON public.agendas;
CREATE POLICY "Public reads published agendas" ON public.agendas
  FOR SELECT USING (public.is_admin(auth.uid()) OR (status <> 'draft' AND public.gonglon_visible()));

DROP POLICY IF EXISTS "Public reads issues of published agendas" ON public.agenda_issues;
CREATE POLICY "Public reads issues of published agendas" ON public.agenda_issues
  FOR SELECT USING (public.is_admin(auth.uid()) OR (public.gonglon_visible() AND EXISTS (
    SELECT 1 FROM public.agendas a WHERE a.id = agenda_id AND a.status <> 'draft'
  )));

DROP POLICY IF EXISTS "Public reads links of published agendas" ON public.agenda_links;
CREATE POLICY "Public reads links of published agendas" ON public.agenda_links
  FOR SELECT USING (public.is_admin(auth.uid()) OR (public.gonglon_visible() AND EXISTS (
    SELECT 1 FROM public.agendas a WHERE a.id = agenda_id AND a.status <> 'draft'
  )));

-- 한 줄 의견: 직접 읽기는 본인 글·관리자만 (작성자 id 노출 방지)
DROP POLICY IF EXISTS "Public reads visible statements" ON public.agenda_statements;
DROP POLICY IF EXISTS "Users read own statements" ON public.agenda_statements;
CREATE POLICY "Users read own statements" ON public.agenda_statements
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 작성: 진행 중이고 마감 일시 전인 의제에만
DROP POLICY IF EXISTS "Users write statements on open agendas" ON public.agenda_statements;
CREATE POLICY "Users write statements on open agendas" ON public.agenda_statements
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_hidden = false
    AND public.gonglon_visible()
    AND EXISTS (
      SELECT 1 FROM public.agendas a
      WHERE a.id = agenda_id AND public.agenda_effective_status(a.status, a.closes_at) = 'open'
    )
  );

-- 3개 제한은 숨김 안 된 것만
CREATE OR REPLACE FUNCTION public.limit_agenda_statements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM agenda_statements
      WHERE agenda_id = NEW.agenda_id AND user_id = NEW.user_id AND NOT is_hidden) >= 3 THEN
    RAISE EXCEPTION 'statement_limit' USING HINT = '한 의제에 한 줄 의견은 3개까지 남길 수 있어요';
  END IF;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 투표
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
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('error', 'login_required');
  END IF;
  IF p_stage NOT IN ('first', 'final') OR p_choice NOT IN ('agree', 'disagree', 'hold')
     OR p_source NOT IN ('pledge_card', 'compare', 'home', 'hub', 'agenda') THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;
  IF NOT public.gonglon_visible() OR NOT EXISTS (
    SELECT 1 FROM agendas
    WHERE id = p_agenda_id AND public.agenda_effective_status(status, closes_at) = 'open'
  ) THEN
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
-- 의제 요약 (분포 공개 기준 강화)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_agenda_summary(p_agenda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_admin boolean := coalesce(public.is_admin(auth.uid()), false);
  v_status text;
  v_participants int;
  v_final_count int;
  v_my_first text;
  v_my_final text;
  v_reveal boolean;
BEGIN
  SELECT public.agenda_effective_status(status, closes_at) INTO v_status FROM agendas WHERE id = p_agenda_id;
  IF v_status IS NULL OR NOT public.gonglon_visible() OR (v_status = 'draft' AND NOT v_admin) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT count(DISTINCT user_id), count(*) FILTER (WHERE stage = 'final')
    INTO v_participants, v_final_count
    FROM agenda_votes WHERE agenda_id = p_agenda_id;

  IF v_user IS NOT NULL THEN
    SELECT choice INTO v_my_first FROM agenda_votes WHERE agenda_id = p_agenda_id AND user_id = v_user AND stage = 'first';
    SELECT choice INTO v_my_final FROM agenda_votes WHERE agenda_id = p_agenda_id AND user_id = v_user AND stage = 'final';
  END IF;

  -- 최종 의견 5명 이상일 때만. 진행 중에는 최종 의견을 낸 본인·관리자에게만,
  -- 마감 후에는 누구에게나 — 단 선거 기간 조용한 모드에서는 마감돼도 본인·관리자에게만.
  v_reveal := v_final_count >= 5 AND (
    v_my_final IS NOT NULL
    OR v_admin
    OR (v_status = 'closed' AND NOT public.app_setting_on('election_quiet_mode'))
  );

  RETURN jsonb_build_object(
    'status', v_status,
    'participants', v_participants,
    'final_participants', v_final_count,
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
-- 허브 목록
-- ─────────────────────────────────────────────────────────────
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
  SELECT a.id, a.title, a.summary, a.category, a.region_sido, a.eff, a.is_featured,
         a.opens_at, a.closes_at, a.created_at,
         (SELECT count(DISTINCT v.user_id)::int FROM agenda_votes v WHERE v.agenda_id = a.id),
         (SELECT count(*)::int FROM agenda_statements s WHERE s.agenda_id = a.id AND NOT s.is_hidden),
         (SELECT count(*)::int FROM agenda_links l
            JOIN candidate_pledges p ON p.id = l.pledge_id
            JOIN candidates c ON c.id = p.candidate_id AND c.is_active
          WHERE l.agenda_id = a.id),
         (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = auth.uid() AND v.stage = 'first'),
         (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = auth.uid() AND v.stage = 'final')
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

-- ─────────────────────────────────────────────────────────────
-- 연결 카드 · 관련 공약 · 한 줄 의견 목록
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_linked_agendas(
  p_pledge_ids uuid[] DEFAULT '{}',
  p_policy_card_ids uuid[] DEFAULT '{}'
)
RETURNS TABLE (
  pledge_id uuid,
  policy_card_id uuid,
  agenda_id uuid,
  title text,
  status text,
  closes_at timestamptz,
  participants int,
  my_first text,
  my_final text,
  quiet_mode boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    JOIN agendas a ON a.id = l.agenda_id AND a.status <> 'draft'
    WHERE l.pledge_id = ANY (p_pledge_ids) OR l.policy_card_id = ANY (p_policy_card_ids)
  ) r
  WHERE r.rn <= 2;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agenda_related_pledges(p_agenda_id uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_slug text,
  candidate_name text,
  party text,
  pledge_id uuid,
  pledge_title text,
  pledge_description text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.slug, c.name, c.party, p.id, p.title, p.description
  FROM agenda_links l
  JOIN agendas a ON a.id = l.agenda_id AND (a.status <> 'draft' OR public.is_admin(auth.uid()))
  JOIN candidate_pledges p ON p.id = l.pledge_id
  JOIN candidates c ON c.id = p.candidate_id AND c.is_active
  WHERE l.agenda_id = p_agenda_id AND public.gonglon_visible()
  ORDER BY c.name, p.sort_order;
$$;

CREATE OR REPLACE FUNCTION public.get_agenda_statements(
  p_agenda_id uuid,
  p_sort text DEFAULT 'latest',
  p_limit int DEFAULT 30,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  body text,
  created_at timestamptz,
  agree int,
  disagree int,
  hold int,
  my_reaction text,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH s AS (
    SELECT st.id, st.body, st.created_at, st.user_id,
           count(r.*) FILTER (WHERE r.choice = 'agree')::int    AS agree,
           count(r.*) FILTER (WHERE r.choice = 'disagree')::int AS disagree,
           count(r.*) FILTER (WHERE r.choice = 'hold')::int     AS hold
    FROM agenda_statements st
    JOIN agendas a ON a.id = st.agenda_id AND a.status <> 'draft'
    LEFT JOIN statement_reactions r ON r.statement_id = st.id
    WHERE st.agenda_id = p_agenda_id AND NOT st.is_hidden AND public.gonglon_visible()
    GROUP BY st.id
  )
  SELECT s.id, s.body, s.created_at, s.agree, s.disagree, s.hold,
         (SELECT r.choice FROM statement_reactions r WHERE r.statement_id = s.id AND r.user_id = auth.uid()),
         (s.user_id = auth.uid())
  FROM s
  ORDER BY
    CASE WHEN p_sort = 'agreed' THEN s.agree - s.disagree END DESC NULLS LAST,
    CASE WHEN p_sort = 'divisive' THEN
      least(s.agree, s.disagree)::numeric / greatest(greatest(s.agree, s.disagree), 1) * (s.agree + s.disagree)
    END DESC NULLS LAST,
    s.created_at DESC,
    s.id
  LIMIT least(greatest(p_limit, 1), 100) OFFSET greatest(p_offset, 0);
$$;
