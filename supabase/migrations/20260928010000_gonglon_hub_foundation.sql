-- 공론 허브 기초 (2026-09-28)
-- 허브 앤 스포크: 의제(agendas) 하나에 후보 공약·정책카드가 연결표(agenda_links)로 붙는다.
-- 모든 연결은 UUID 기준 (후보 slug/uuid 혼용으로 정책 매칭이 전부 50%가 됐던 버그 재발 방지).
--
-- 테이블
--   agendas               의제 (배경 설명, 진행 상태)
--   agenda_issues         의제의 쟁점 카드
--   agenda_links          연결표: 의제 ↔ 후보 공약(candidate_pledges) 또는 정책카드(policy_cards)
--   agenda_votes          의제 투표. stage = first(카드에서 첫 반응) / final(쟁점 읽고 최종 의견)
--   agenda_statements     한 줄 의견 (답글 없음)
--   statement_reactions   한 줄 의견에 대한 동의·비동의·유보 (Pol.is 방식)
--
-- 공개 원칙
--   - 개별 투표·반응은 본인만 읽는다. 집계는 서버 함수로만 나간다.
--   - 의견 분포(%)는 그 의제에서 최종 의견을 낸 사람에게만, 참여자 5명 이상일 때만 준다.
--   - 후보 화면용 연결 카드 함수는 참여자 수만 준다 (분포 없음).
--   - app_settings: election_quiet_mode = 'true' 이면 연결 카드에서 첫 반응을 받지 않고,
--                   election_hide_link_cards = 'true' 이면 연결 카드를 아예 돌려주지 않는다.

-- ─────────────────────────────────────────────────────────────
-- 1. 테이블
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.agendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 80),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 200),
  background text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  region_sido text,                          -- NULL = 전국 의제
  is_featured boolean NOT NULL DEFAULT false, -- 홈 '이번 주 공론' 배너
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at > opens_at)
);
CREATE INDEX idx_agendas_status ON public.agendas(status);

CREATE TABLE public.agenda_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 80),
  body text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agenda_issues_agenda ON public.agenda_issues(agenda_id, sort_order);

CREATE TABLE public.agenda_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  pledge_id uuid REFERENCES public.candidate_pledges(id) ON DELETE CASCADE,
  policy_card_id uuid REFERENCES public.policy_cards(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- 공약 또는 정책카드 중 정확히 하나
  CHECK ((pledge_id IS NOT NULL)::int + (policy_card_id IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX uq_agenda_links_pledge ON public.agenda_links(agenda_id, pledge_id) WHERE pledge_id IS NOT NULL;
CREATE UNIQUE INDEX uq_agenda_links_card ON public.agenda_links(agenda_id, policy_card_id) WHERE policy_card_id IS NOT NULL;
CREATE INDEX idx_agenda_links_pledge ON public.agenda_links(pledge_id) WHERE pledge_id IS NOT NULL;
CREATE INDEX idx_agenda_links_card ON public.agenda_links(policy_card_id) WHERE policy_card_id IS NOT NULL;

CREATE TABLE public.agenda_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('first', 'final')),
  choice text NOT NULL CHECK (choice IN ('agree', 'disagree', 'hold')),
  source text NOT NULL DEFAULT 'agenda' CHECK (source IN ('pledge_card', 'compare', 'home', 'hub', 'agenda')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agenda_id, user_id, stage)
);
CREATE INDEX idx_agenda_votes_agenda ON public.agenda_votes(agenda_id, stage);

CREATE TABLE public.agenda_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 5 AND 140),
  is_hidden boolean NOT NULL DEFAULT false, -- 관리자 숨김 (신고 처리)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agenda_statements_agenda ON public.agenda_statements(agenda_id, created_at DESC);

CREATE TABLE public.statement_reactions (
  statement_id uuid NOT NULL REFERENCES public.agenda_statements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice text NOT NULL CHECK (choice IN ('agree', 'disagree', 'hold')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (statement_id, user_id)
);

CREATE TRIGGER trg_agendas_updated_at BEFORE UPDATE ON public.agendas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agenda_votes_updated_at BEFORE UPDATE ON public.agenda_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_statement_reactions_updated_at BEFORE UPDATE ON public.statement_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statement_reactions ENABLE ROW LEVEL SECURITY;

-- 의제·쟁점·연결표: 공개된 의제만 누구나 읽기, 관리자는 전부
CREATE POLICY "Public reads published agendas" ON public.agendas
  FOR SELECT USING (status <> 'draft' OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage agendas" ON public.agendas
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Public reads issues of published agendas" ON public.agenda_issues
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.agendas a
    WHERE a.id = agenda_id AND (a.status <> 'draft' OR public.is_admin(auth.uid()))
  ));
CREATE POLICY "Admins manage issues" ON public.agenda_issues
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Public reads links of published agendas" ON public.agenda_links
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.agendas a
    WHERE a.id = agenda_id AND (a.status <> 'draft' OR public.is_admin(auth.uid()))
  ));
CREATE POLICY "Admins manage links" ON public.agenda_links
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 투표: 본인 것만 읽기. 쓰기는 cast_agenda_vote 함수로만 (진행 중 확인·단계 검증을 서버에서)
CREATE POLICY "Users read own votes" ON public.agenda_votes
  FOR SELECT USING (auth.uid() = user_id);

-- 한 줄 의견: 숨김 아닌 것 누구나 읽기 (작성자 id는 읽기 함수에서 노출하지 않음)
-- 작성은 진행 중 의제에만, 본인 이름으로. 삭제는 본인. 숨김 처리는 관리자.
CREATE POLICY "Public reads visible statements" ON public.agenda_statements
  FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users write statements on open agendas" ON public.agenda_statements
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_hidden = false
    AND EXISTS (SELECT 1 FROM public.agendas a WHERE a.id = agenda_id AND a.status = 'open')
  );
CREATE POLICY "Users delete own statements" ON public.agenda_statements
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins moderate statements" ON public.agenda_statements
  FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 반응: 본인 것만 읽기·쓰기 (집계는 함수로)
CREATE POLICY "Users read own reactions" ON public.statement_reactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users react" ON public.statement_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users change own reaction" ON public.statement_reactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reaction" ON public.statement_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- 한 사람이 한 의제에 남길 수 있는 한 줄 의견은 3개까지 (도배 방지)
CREATE OR REPLACE FUNCTION public.limit_agenda_statements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM agenda_statements
      WHERE agenda_id = NEW.agenda_id AND user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'statement_limit' USING HINT = '한 의제에 한 줄 의견은 3개까지 남길 수 있어요';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_limit_agenda_statements BEFORE INSERT ON public.agenda_statements
  FOR EACH ROW EXECUTE FUNCTION public.limit_agenda_statements();

-- ─────────────────────────────────────────────────────────────
-- 3. 서버 함수
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.app_setting_on(p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((SELECT value FROM app_settings WHERE key = p_key) = 'true', false);
$$;

-- 투표 (첫 반응 / 최종 의견). 같은 단계는 다시 고르면 덮어쓴다.
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
  IF NOT EXISTS (SELECT 1 FROM agendas WHERE id = p_agenda_id AND status = 'open') THEN
    RETURN jsonb_build_object('error', 'agenda_not_open');
  END IF;
  -- 선거 기간 조용한 모드: 후보·비교 화면 카드에서의 첫 반응은 받지 않는다
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

-- 의제 요약: 참여자 수는 항상. 분포는 최종 의견을 낸 본인에게만, 참여자 5명 이상일 때만.
-- shift = 첫 반응과 최종 의견을 모두 낸 사람들의 (처음 → 나중) 이동 집계 (숙의 전후 변화)
CREATE OR REPLACE FUNCTION public.get_agenda_summary(p_agenda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_participants int;
  v_my_first text;
  v_my_final text;
  v_reveal boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM agendas WHERE id = p_agenda_id AND (status <> 'draft' OR public.is_admin(v_user))
  ) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT count(DISTINCT user_id) INTO v_participants FROM agenda_votes WHERE agenda_id = p_agenda_id;

  IF v_user IS NOT NULL THEN
    SELECT choice INTO v_my_first FROM agenda_votes WHERE agenda_id = p_agenda_id AND user_id = v_user AND stage = 'first';
    SELECT choice INTO v_my_final FROM agenda_votes WHERE agenda_id = p_agenda_id AND user_id = v_user AND stage = 'final';
  END IF;

  v_reveal := (v_my_final IS NOT NULL OR public.is_admin(v_user)) AND v_participants >= 5;

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

-- 후보 공약·정책카드 화면용 연결 카드: 대상마다 의제 최대 2개, 참여자 수만 (분포 없음)
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
  IF public.app_setting_on('election_hide_link_cards') THEN
    RETURN; -- 선거 기간 연결 카드 숨김
  END IF;

  RETURN QUERY
  SELECT r.pledge_id, r.policy_card_id, r.agenda_id, r.title, r.status, r.closes_at,
         r.participants, r.my_first, r.my_final, v_quiet
  FROM (
    SELECT l.pledge_id, l.policy_card_id, a.id AS agenda_id, a.title, a.status, a.closes_at,
           (SELECT count(DISTINCT v.user_id)::int FROM agenda_votes v WHERE v.agenda_id = a.id) AS participants,
           (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = v_user AND v.stage = 'first') AS my_first,
           (SELECT v.choice FROM agenda_votes v WHERE v.agenda_id = a.id AND v.user_id = v_user AND v.stage = 'final') AS my_final,
           row_number() OVER (
             PARTITION BY coalesce(l.pledge_id, l.policy_card_id)
             ORDER BY (a.status = 'open') DESC, l.sort_order, a.created_at DESC
           ) AS rn
    FROM agenda_links l
    JOIN agendas a ON a.id = l.agenda_id AND a.status <> 'draft'
    WHERE l.pledge_id = ANY (p_pledge_ids) OR l.policy_card_id = ANY (p_policy_card_ids)
  ) r
  WHERE r.rn <= 2;
END;
$$;

-- 의제 상세의 '관련 공약': 연결된 공약을 가진 후보를 모두 같은 형식으로 (정렬은 가나다순 — 특정 후보 우대 방지)
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
  WHERE l.agenda_id = p_agenda_id
  ORDER BY c.name, p.sort_order;
$$;

-- 한 줄 의견 목록 + 반응 집계. 작성자 id는 내보내지 않는다 (본인 글 여부만).
-- p_sort: latest(최신순) | agreed(동의 많은 순) | divisive(논쟁적인 순: 동의≈비동의, 반응 많은 것 우선)
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
    WHERE st.agenda_id = p_agenda_id AND NOT st.is_hidden
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
    s.created_at DESC
  LIMIT least(greatest(p_limit, 1), 100) OFFSET greatest(p_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.cast_agenda_vote(uuid, text, text, text) FROM public;
-- anon도 호출은 가능하게 두어 'login_required'를 JSON으로 돌려받게 한다 (함수 안에서 막음)
GRANT EXECUTE ON FUNCTION public.cast_agenda_vote(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_agenda_summary(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_linked_agendas(uuid[], uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_agenda_related_pledges(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_agenda_statements(uuid, text, int, int) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. 선거 기간 설정 (기본값: 꺼짐)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (key, value)
VALUES ('election_quiet_mode', 'false'), ('election_hide_link_cards', 'false')
ON CONFLICT (key) DO NOTHING;
