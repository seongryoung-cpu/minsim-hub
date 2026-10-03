-- 공론 2단계: 주장 카드 · 가까운 주장 고르기 · 시민 평가 · 관심 의제 · 읽은 사람 (2026-10-04)
--
-- 스위치: app_settings.gonglon_claims = 'true' 일 때만 시민이 주장을 보고 고르고 쓸 수 있다.
--         꺼져 있어도 관리자는 모든 기능을 쓸 수 있다 (미리 만들어 두고 관문 A 이후 공개).
-- 원칙:  주장 목록은 좋아요 수 대신 '고른 사람 수'와 검증 상태를 보여 준다.
--        작성자 user_id 는 직접 읽기를 막고(본인·관리자만), 공개 목록은 함수로 닉네임만 준다.
--        모든 사용자 칸은 auth.users ON DELETE CASCADE (탈퇴 시 함께 삭제).

-- ─────────────────────────────────────────────────────────────
-- 1. 테이블
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agenda_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  issue_id uuid REFERENCES public.agenda_issues(id) ON DELETE SET NULL,      -- 쟁점(kind='point') 연결, 없으면 의제 전체
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,                  -- NULL = 운영진이 정리한 주장
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 5 AND 80),     -- 주장 한 문장
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 500),        -- 근거
  counter text NOT NULL DEFAULT '' CHECK (char_length(counter) <= 300),      -- 예상되는 반론
  sources text[] NOT NULL DEFAULT '{}' CHECK (cardinality(sources) <= 5),    -- 출처 링크
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'review', 'verified', 'hidden')),
  source_issue_id uuid UNIQUE REFERENCES public.agenda_issues(id) ON DELETE SET NULL, -- 찬반 카드에서 옮긴 주장
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agenda_claims_agenda ON public.agenda_claims(agenda_id, issue_id);
CREATE INDEX IF NOT EXISTS idx_agenda_claims_user ON public.agenda_claims(user_id) WHERE user_id IS NOT NULL;

-- 가까운 주장 고르기: 의제(또는 쟁점)마다 한 사람 한 개, 다시 고르면 바뀐다
CREATE TABLE IF NOT EXISTS public.claim_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  issue_id uuid REFERENCES public.agenda_issues(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES public.agenda_claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_claim_picks_scope
  ON public.claim_picks(user_id, agenda_id, coalesce(issue_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_claim_picks_claim ON public.claim_picks(claim_id);

-- 시민 평가: 근거가 명확한가 · 다른 관점을 정확히 설명했는가
CREATE TABLE IF NOT EXISTS public.claim_evaluations (
  claim_id uuid NOT NULL REFERENCES public.agenda_claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence text NOT NULL CHECK (evidence IN ('clear', 'partly', 'unclear')),
  perspective text NOT NULL CHECK (perspective IN ('good', 'partly', 'poor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (claim_id, user_id)
);

-- 관심 의제 (요약이 바뀌거나 마감되면 앱 안 알림)
CREATE TABLE IF NOT EXISTS public.agenda_interests (
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agenda_id, user_id)
);

-- 읽은 사람: 로그인은 user_id, 비로그인은 기기별 임의 id (개인정보 아님)
CREATE TABLE IF NOT EXISTS public.agenda_views (
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  viewer_key text NOT NULL CHECK (char_length(viewer_key) BETWEEN 8 AND 64),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agenda_id, viewer_key)
);

DROP TRIGGER IF EXISTS trg_agenda_claims_updated_at ON public.agenda_claims;
CREATE TRIGGER trg_agenda_claims_updated_at BEFORE UPDATE ON public.agenda_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_claim_picks_updated_at ON public.claim_picks;
CREATE TRIGGER trg_claim_picks_updated_at BEFORE UPDATE ON public.claim_picks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_claim_evaluations_updated_at ON public.claim_evaluations;
CREATE TRIGGER trg_claim_evaluations_updated_at BEFORE UPDATE ON public.claim_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 2. RLS: 직접 읽기는 본인·관리자만, 쓰기는 함수로만 (관리자는 주장 테이블 직접 관리)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.agenda_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own or admin reads claims" ON public.agenda_claims;
CREATE POLICY "Own or admin reads claims" ON public.agenda_claims
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admin manages claims" ON public.agenda_claims;
CREATE POLICY "Admin manages claims" ON public.agenda_claims
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Own or admin reads picks" ON public.claim_picks;
CREATE POLICY "Own or admin reads picks" ON public.claim_picks
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Own or admin reads evaluations" ON public.claim_evaluations;
CREATE POLICY "Own or admin reads evaluations" ON public.claim_evaluations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Own or admin reads interests" ON public.agenda_interests;
CREATE POLICY "Own or admin reads interests" ON public.agenda_interests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin reads views" ON public.agenda_views;
CREATE POLICY "Admin reads views" ON public.agenda_views
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 3. 도우미
-- ─────────────────────────────────────────────────────────────
-- 주장 기능이 켜졌는지 (관리자는 꺼져 있어도 사용)
CREATE OR REPLACE FUNCTION public.gonglon_claims_on()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.gonglon_visible()
     AND (public.app_setting_on('gonglon_claims') OR coalesce(public.is_admin(auth.uid()), false));
$$;
REVOKE ALL ON FUNCTION public.gonglon_claims_on() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gonglon_claims_on() TO anon, authenticated;

-- 두 글자 묶음(바이그램) 다이스 유사도 0~1. 한글에도 동작하도록 직접 계산한다.
CREATE OR REPLACE FUNCTION public.text_bigram_similarity(a text, b text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH na AS (SELECT regexp_replace(lower(coalesce(a, '')), '[^0-9a-z가-힣]', '', 'g') AS s),
       nb AS (SELECT regexp_replace(lower(coalesce(b, '')), '[^0-9a-z가-힣]', '', 'g') AS s),
       ga AS (SELECT DISTINCT substr(na.s, i, 2) AS g FROM na, generate_series(1, greatest(char_length(na.s) - 1, 0)) AS i),
       gb AS (SELECT DISTINCT substr(nb.s, i, 2) AS g FROM nb, generate_series(1, greatest(char_length(nb.s) - 1, 0)) AS i),
       c AS (SELECT (SELECT count(*) FROM ga) AS ca, (SELECT count(*) FROM gb) AS cb,
                    (SELECT count(*) FROM ga JOIN gb USING (g)) AS shared)
  SELECT CASE WHEN ca + cb = 0 THEN 0 ELSE round(2.0 * shared / (ca + cb), 3) END FROM c;
$$;
GRANT EXECUTE ON FUNCTION public.text_bigram_similarity(text, text) TO anon, authenticated;

-- 의제가 진행 중인지 (마감 일시 반영)
CREATE OR REPLACE FUNCTION public.agenda_is_open(p_agenda_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM agendas WHERE id = p_agenda_id AND public.agenda_effective_status(status, closes_at) = 'open'
  );
$$;
GRANT EXECUTE ON FUNCTION public.agenda_is_open(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. 주장 목록
-- ─────────────────────────────────────────────────────────────
-- p_issue_id 가 NULL 이면 쟁점에 묶이지 않은 주장(의제 전체)만.
CREATE OR REPLACE FUNCTION public.get_agenda_claims(p_agenda_id uuid, p_issue_id uuid DEFAULT NULL)
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
BEGIN
  SELECT public.agenda_effective_status(status, closes_at) INTO v_status FROM agendas WHERE id = p_agenda_id;
  IF v_status IS NULL OR (v_status = 'draft' AND NOT v_admin) OR NOT public.gonglon_claims_on() THEN
    RETURN jsonb_build_object('enabled', false);
  END IF;

  RETURN jsonb_build_object(
    'enabled', true,
    'agenda_status', v_status,
    'total_picks', (SELECT count(*) FROM claim_picks p
                    WHERE p.agenda_id = p_agenda_id AND p.issue_id IS NOT DISTINCT FROM p_issue_id),
    'my_pick', (SELECT jsonb_build_object('claim_id', p.claim_id, 'reason', p.reason) FROM claim_picks p
                WHERE v_user IS NOT NULL AND p.user_id = v_user AND p.agenda_id = p_agenda_id
                  AND p.issue_id IS NOT DISTINCT FROM p_issue_id),
    'claims', coalesce((
      SELECT jsonb_agg(row_to_json(x) ORDER BY x.status_rank, x.pick_count DESC, x.created_at)
      FROM (
        SELECT c.id, c.issue_id, c.body, c.reason, c.counter, c.sources, c.status, c.created_at,
               CASE c.status WHEN 'verified' THEN 0 WHEN 'review' THEN 1 ELSE 2 END AS status_rank,
               CASE WHEN c.user_id IS NULL THEN '운영진 정리'
                    ELSE coalesce(nullif(btrim(pr.display_name), ''), '시민') END AS author,
               (c.user_id IS NULL) AS by_staff,
               coalesce(v_user IS NOT NULL AND c.user_id = v_user, false) AS is_mine,
               (SELECT count(*) FROM claim_picks p WHERE p.claim_id = c.id)::int AS pick_count,
               (SELECT count(*) FROM claim_evaluations e WHERE e.claim_id = c.id)::int AS eval_count,
               (SELECT count(*) FROM claim_evaluations e WHERE e.claim_id = c.id AND e.evidence = 'clear')::int AS evidence_clear,
               (SELECT count(*) FROM claim_evaluations e WHERE e.claim_id = c.id AND e.perspective = 'good')::int AS perspective_good,
               (SELECT count(*) FROM claim_evaluations e WHERE e.claim_id = c.id AND e.perspective = 'partly')::int AS perspective_partly,
               (SELECT jsonb_build_object('evidence', e.evidence, 'perspective', e.perspective)
                  FROM claim_evaluations e WHERE e.claim_id = c.id AND e.user_id = v_user) AS my_evaluation
        FROM agenda_claims c
        LEFT JOIN profiles pr ON pr.user_id = c.user_id
        WHERE c.agenda_id = p_agenda_id
          AND c.issue_id IS NOT DISTINCT FROM p_issue_id
          AND (c.status <> 'hidden' OR v_admin)
      ) x
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_agenda_claims(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agenda_claims(uuid, uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. 비슷한 주장 찾기 (쓰기 전에 보여 줌)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_similar_claims(p_agenda_id uuid, p_issue_id uuid, p_text text)
RETURNS TABLE (id uuid, body text, status text, similarity numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.body, c.status, public.text_bigram_similarity(c.body, p_text) AS similarity
  FROM agenda_claims c
  WHERE public.gonglon_claims_on()
    AND char_length(btrim(coalesce(p_text, ''))) >= 5
    AND c.agenda_id = p_agenda_id
    AND c.issue_id IS NOT DISTINCT FROM p_issue_id
    AND c.status <> 'hidden'
    AND public.text_bigram_similarity(c.body, p_text) >= 0.35
  ORDER BY 4 DESC
  LIMIT 3;
$$;
REVOKE ALL ON FUNCTION public.find_similar_claims(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_similar_claims(uuid, uuid, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. 고르기 · 쓰기 · 평가
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pick_claim(p_claim_id uuid, p_reason text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_claim agenda_claims;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  SELECT * INTO v_claim FROM agenda_claims WHERE id = p_claim_id AND status <> 'hidden';
  IF NOT FOUND OR NOT public.gonglon_claims_on() THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF NOT public.agenda_is_open(v_claim.agenda_id) THEN RETURN jsonb_build_object('error', 'agenda_not_open'); END IF;
  IF char_length(coalesce(p_reason, '')) > 80 THEN RETURN jsonb_build_object('error', 'reason_too_long'); END IF;

  INSERT INTO claim_picks (agenda_id, issue_id, claim_id, user_id, reason)
  VALUES (v_claim.agenda_id, v_claim.issue_id, v_claim.id, v_user, btrim(coalesce(p_reason, '')))
  ON CONFLICT (user_id, agenda_id, coalesce(issue_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET claim_id = EXCLUDED.claim_id, reason = EXCLUDED.reason;

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.pick_claim(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pick_claim(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.post_claim(
  p_agenda_id uuid,
  p_issue_id uuid,
  p_body text,
  p_reason text DEFAULT '',
  p_counter text DEFAULT '',
  p_sources text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_sources text[];
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  IF NOT public.gonglon_claims_on() THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF NOT public.agenda_is_open(p_agenda_id) THEN RETURN jsonb_build_object('error', 'agenda_not_open'); END IF;
  IF p_issue_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM agenda_issues WHERE id = p_issue_id AND agenda_id = p_agenda_id
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;
  IF char_length(v_body) NOT BETWEEN 5 AND 80
     OR char_length(coalesce(p_reason, '')) > 500
     OR char_length(coalesce(p_counter, '')) > 300 THEN
    RETURN jsonb_build_object('error', 'invalid_length');
  END IF;

  -- 출처는 http(s) 링크만, 500자 이하, 최대 5개 (Postgres 정규식 반복 횟수 상한 255라 길이는 따로 검사)
  SELECT coalesce(array_agg(s), '{}') INTO v_sources
  FROM (SELECT btrim(s) AS s FROM unnest(coalesce(p_sources, '{}')) s
        WHERE btrim(s) ~* '^https?://\S{3,}$' AND char_length(btrim(s)) <= 500 LIMIT 5) t;

  -- 한 의제에 숨김 안 된 주장 3개까지
  IF (SELECT count(*) FROM agenda_claims
      WHERE agenda_id = p_agenda_id AND user_id = v_user AND status <> 'hidden') >= 3 THEN
    RETURN jsonb_build_object('error', 'claim_limit');
  END IF;

  INSERT INTO agenda_claims (agenda_id, issue_id, user_id, body, reason, counter, sources, status)
  VALUES (p_agenda_id, p_issue_id, v_user, v_body, btrim(coalesce(p_reason, '')), btrim(coalesce(p_counter, '')), v_sources, 'new')
  RETURNING id INTO v_id;

  -- 내가 쓴 주장을 내 선택으로
  INSERT INTO claim_picks (agenda_id, issue_id, claim_id, user_id)
  VALUES (p_agenda_id, p_issue_id, v_id, v_user)
  ON CONFLICT (user_id, agenda_id, coalesce(issue_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET claim_id = EXCLUDED.claim_id, reason = '';

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE ALL ON FUNCTION public.post_claim(uuid, uuid, text, text, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_claim(uuid, uuid, text, text, text, text[]) TO authenticated;

-- 본인이 쓴 주장은 지울 수 있다 (고른 사람이 있으면 숨김 처리로 기록 유지)
CREATE OR REPLACE FUNCTION public.delete_my_claim(p_claim_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  IF NOT EXISTS (SELECT 1 FROM agenda_claims WHERE id = p_claim_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF EXISTS (SELECT 1 FROM claim_picks WHERE claim_id = p_claim_id AND user_id <> v_user) THEN
    UPDATE agenda_claims SET status = 'hidden' WHERE id = p_claim_id;
  ELSE
    DELETE FROM agenda_claims WHERE id = p_claim_id;
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.delete_my_claim(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_claim(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.evaluate_claim(p_claim_id uuid, p_evidence text, p_perspective text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_claim agenda_claims;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  IF p_evidence NOT IN ('clear', 'partly', 'unclear') OR p_perspective NOT IN ('good', 'partly', 'poor') THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;
  SELECT * INTO v_claim FROM agenda_claims WHERE id = p_claim_id AND status <> 'hidden';
  IF NOT FOUND OR NOT public.gonglon_claims_on() THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_claim.user_id = v_user THEN RETURN jsonb_build_object('error', 'own_claim'); END IF;
  IF NOT public.agenda_is_open(v_claim.agenda_id) THEN RETURN jsonb_build_object('error', 'agenda_not_open'); END IF;

  INSERT INTO claim_evaluations (claim_id, user_id, evidence, perspective)
  VALUES (p_claim_id, v_user, p_evidence, p_perspective)
  ON CONFLICT (claim_id, user_id) DO UPDATE SET evidence = EXCLUDED.evidence, perspective = EXCLUDED.perspective;

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.evaluate_claim(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_claim(uuid, text, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. 관리자: 찬성·반대 카드를 주장으로 옮기기 (이미 옮긴 카드는 건너뜀)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.import_issue_cards_as_claims(p_agenda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT coalesce(public.is_admin(auth.uid()), false) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  INSERT INTO agenda_claims (agenda_id, issue_id, user_id, body, reason, sources, status, source_issue_id)
  SELECT i.agenda_id, NULL, NULL,
         left(btrim(i.title), 80), left(i.body, 500),
         (SELECT coalesce(array_agg(s), '{}') FROM (SELECT s FROM unnest(i.sources) s WHERE s ~* '^https?://' LIMIT 5) t),
         'verified', i.id
  FROM agenda_issues i
  WHERE i.agenda_id = p_agenda_id AND i.kind IN ('pro', 'con')
    AND char_length(btrim(i.title)) >= 5
    AND NOT EXISTS (SELECT 1 FROM agenda_claims c WHERE c.source_issue_id = i.id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'imported', v_count);
END;
$$;
REVOKE ALL ON FUNCTION public.import_issue_cards_as_claims(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_issue_cards_as_claims(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. 관심 의제 · 읽은 사람
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_agenda_interest(p_agenda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  IF NOT public.gonglon_visible() OR NOT EXISTS (
    SELECT 1 FROM agendas WHERE id = p_agenda_id AND status <> 'draft'
  ) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF EXISTS (SELECT 1 FROM agenda_interests WHERE agenda_id = p_agenda_id AND user_id = v_user) THEN
    DELETE FROM agenda_interests WHERE agenda_id = p_agenda_id AND user_id = v_user;
    RETURN jsonb_build_object('ok', true, 'interested', false);
  END IF;
  INSERT INTO agenda_interests (agenda_id, user_id) VALUES (p_agenda_id, v_user);
  RETURN jsonb_build_object('ok', true, 'interested', true);
END;
$$;
REVOKE ALL ON FUNCTION public.toggle_agenda_interest(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_agenda_interest(uuid) TO authenticated;

-- 로그인 사용자는 user_id 로, 비로그인은 기기 id 로 한 번만 센다
CREATE OR REPLACE FUNCTION public.record_agenda_view(p_agenda_id uuid, p_client_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_key text;
BEGIN
  IF NOT public.gonglon_visible() OR NOT EXISTS (
    SELECT 1 FROM agendas WHERE id = p_agenda_id AND status <> 'draft'
  ) THEN
    RETURN;
  END IF;
  v_key := CASE WHEN v_user IS NOT NULL THEN 'u:' || v_user::text
                WHEN p_client_id ~ '^[0-9a-zA-Z-]{8,60}$' THEN 'c:' || p_client_id
                ELSE NULL END;
  IF v_key IS NULL THEN RETURN; END IF;
  INSERT INTO agenda_views (agenda_id, viewer_key, user_id) VALUES (p_agenda_id, v_key, v_user)
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.record_agenda_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_agenda_view(uuid, text) TO anon, authenticated;

-- 읽은 사람은 50명 이상일 때만 숫자를 준다 (초기의 작은 숫자가 오히려 썰렁해 보이지 않게)
CREATE OR REPLACE FUNCTION public.get_agenda_engagement(p_agenda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_viewers int;
BEGIN
  IF NOT public.gonglon_visible() OR NOT EXISTS (
    SELECT 1 FROM agendas WHERE id = p_agenda_id AND (status <> 'draft' OR coalesce(public.is_admin(auth.uid()), false))
  ) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  SELECT count(*) INTO v_viewers FROM agenda_views WHERE agenda_id = p_agenda_id;
  RETURN jsonb_build_object(
    'viewers', CASE WHEN v_viewers >= 50 THEN v_viewers END,
    'interested', (SELECT count(*) FROM agenda_interests WHERE agenda_id = p_agenda_id),
    'my_interest', v_user IS NOT NULL AND EXISTS (
      SELECT 1 FROM agenda_interests WHERE agenda_id = p_agenda_id AND user_id = v_user
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_agenda_engagement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agenda_engagement(uuid) TO anon, authenticated;

-- 관심 의제 알림: 요약이 바뀌거나 마감 처리되면 앱 안 알림 (푸시는 고친 뒤 연결)
CREATE OR REPLACE FUNCTION public.notify_agenda_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_closed boolean := NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed';
BEGIN
  IF NEW.status = 'draft' THEN RETURN NEW; END IF;
  IF v_closed OR NEW.summary IS DISTINCT FROM OLD.summary THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT i.user_id, 'agenda',
           CASE WHEN v_closed THEN '관심 의제가 마감됐어요' ELSE '관심 의제의 요약이 바뀌었어요' END,
           NEW.title,
           jsonb_build_object('path', '/gonglon/' || NEW.id::text, 'agenda_id', NEW.id)
    FROM agenda_interests i WHERE i.agenda_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_agenda_interest() FROM PUBLIC;
DROP TRIGGER IF EXISTS trg_notify_agenda_interest ON public.agendas;
CREATE TRIGGER trg_notify_agenda_interest AFTER UPDATE ON public.agendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_agenda_interest();

-- ─────────────────────────────────────────────────────────────
-- 9. 권한: Supabase는 새 함수에 anon 실행 권한을 기본으로 주므로 로그인 전용 함수는 명시적으로 회수
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.pick_claim(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.post_claim(uuid, uuid, text, text, text, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_my_claim(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_claim(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.import_issue_cards_as_claims(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_agenda_interest(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_agenda_interest() FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 10. 스위치 (기본 꺼짐)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (key, value)
VALUES ('gonglon_claims', 'false')
ON CONFLICT (key) DO NOTHING;
