-- B 묶음: 계정과 개인정보
--  1) 사용자 데이터 테이블 10개에 auth.users CASCADE FK (탈퇴하면 같이 지워짐)
--  2) 공개 닉네임 (실명 노출 방지) + 필수 동의 기록 (약관·개인정보·만 14세)
--  3) 정치 성향 결과는 '계정 저장 동의'가 있을 때만 서버에 저장 (민감정보 별도 동의, 개인정보보호법 제23조)
--     동의를 거두면 저장된 성향 결과만 지운다. 계정과 서비스 이용은 그대로.
--  4) 본인 탈퇴 / 관리자 삭제를 auth.users 삭제로 일원화 (가짜 성공 제거)
--  5) 인증 등급·본인인증 필드는 관리자만 바꿀 수 있게 (사용자가 스스로 '본인인증'으로 올리던 구멍)
--  6) 활동 로그에서 이메일과 후보 선호(정치 성향) 제거

-- ───────────────────────── 1) CASCADE FK ─────────────────────────
-- 2026-10-17 기준 고아 행 0개 확인 후 바로 검증된 FK로 건다.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['activity_logs','notification_preferences','notifications','policy_match_results',
                           'political_mbti_results','push_subscriptions','quiz_stats','spectrum_answers',
                           'user_followed_candidates','user_spectrums']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = t || '_user_id_fkey' AND conrelid = ('public.' || t)::regclass) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
                     t, t || '_user_id_fkey');
    END IF;
  END LOOP;
END $$;

-- 신고에 답한 관리자가 삭제돼도 신고 기록은 남긴다 (기존 NO ACTION이라 관리자 삭제가 막혔음)
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_responded_by_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_responded_by_fkey
  FOREIGN KEY (responded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ───────────────────────── 2) 닉네임 · 동의 ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS age14_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS political_consent_at timestamptz;

CREATE OR REPLACE FUNCTION public.nickname_problem(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p IS NULL OR p !~ '^[가-힣a-zA-Z0-9_]{2,12}$' THEN 'invalid'
    WHEN lower(p) ~ '(운영진|운영자|관리자|민심잇다|admin|staff)' OR p IN ('시민', '익명') THEN 'reserved'
    ELSE NULL
  END
$$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_nickname_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nickname_check
  CHECK (nickname IS NULL OR public.nickname_problem(nickname) IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_lower_key ON public.profiles (lower(nickname));

-- 사용자는 자기 프로필을 직접 UPDATE할 수 있으므로, 민감 필드는 트리거로 지킨다.
--  · 인증 등급·본인인증 필드: 관리자만
--  · 정치 성향 저장 동의: set_political_consent()로만 (철회 시 데이터 삭제를 보장하려고)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  v_client boolean := v_role IN ('authenticated', 'anon');
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 앱이 직접 프로필을 만드는 경우(트리거 누락 대비)에도 등급·동의를 스스로 정하지 못하게
    IF v_client THEN
      NEW.verification_level := 'social';
      NEW.identity_verified_at := NULL; NEW.identity_provider := NULL; NEW.identity_ci := NULL;
      NEW.phone_verified_at := NULL; NEW.political_consent_at := NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF v_client AND NOT coalesce(public.is_admin(auth.uid()), false) THEN
    NEW.verification_level   := OLD.verification_level;
    NEW.identity_verified_at := OLD.identity_verified_at;
    NEW.identity_provider    := OLD.identity_provider;
    NEW.identity_ci          := OLD.identity_ci;
    NEW.phone_verified_at    := OLD.phone_verified_at;
  END IF;
  IF v_client AND coalesce(current_setting('minsim.consent_rpc', true), '') <> '1' THEN
    NEW.political_consent_at := OLD.political_consent_at;
  END IF;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 가입 시 메타데이터(동의·닉네임)를 프로필로 옮긴다. 닉네임이 쓸 수 없거나 이미 있으면 비워 두고 나중에 정한다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  v_nick text := nullif(btrim(m ->> 'nickname'), '');
  v_agreed boolean := coalesce((m ->> 'agree_terms')::boolean, false)
                  AND coalesce((m ->> 'agree_privacy')::boolean, false)
                  AND coalesce((m ->> 'agree_age14')::boolean, false);
BEGIN
  IF v_nick IS NOT NULL AND (public.nickname_problem(v_nick) IS NOT NULL
      OR EXISTS (SELECT 1 FROM profiles WHERE lower(nickname) = lower(v_nick))) THEN
    v_nick := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, avatar_url, verification_level, nickname,
                               terms_agreed_at, privacy_agreed_at, age14_confirmed_at)
  VALUES (
    NEW.id,
    COALESCE(m ->> 'full_name', m ->> 'name'),
    m ->> 'avatar_url',
    'social',
    v_nick,
    CASE WHEN v_agreed THEN now() END,
    CASE WHEN v_agreed THEN now() END,
    CASE WHEN v_agreed THEN now() END
  );
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 닉네임 확인 (가입 전에도 쓰므로 anon 허용. 닉네임은 공개 정보라 존재 여부 노출은 괜찮다)
CREATE OR REPLACE FUNCTION public.check_nickname(p_nickname text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    public.nickname_problem(btrim(p_nickname)),
    CASE WHEN EXISTS (SELECT 1 FROM profiles
                      WHERE lower(nickname) = lower(btrim(p_nickname))
                        AND user_id IS DISTINCT FROM auth.uid()) THEN 'taken' END,
    'ok')
$$;

CREATE OR REPLACE FUNCTION public.set_my_nickname(p_nickname text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_code text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
  v_code := public.check_nickname(p_nickname);
  IF v_code <> 'ok' THEN RETURN v_code; END IF;
  BEGIN
    UPDATE profiles SET nickname = btrim(p_nickname), updated_at = now() WHERE user_id = v_uid;
  EXCEPTION WHEN unique_violation THEN RETURN 'taken';
  END;
  RETURN 'ok';
END $$;
REVOKE EXECUTE ON FUNCTION public.set_my_nickname(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_nickname(text) TO authenticated, service_role;

-- 기존 가입자·소셜 가입자가 필수 동의를 나중에 하는 경로
CREATE OR REPLACE FUNCTION public.accept_required_terms(p_age14 boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
  IF NOT coalesce(p_age14, false) THEN RAISE EXCEPTION 'age14_required'; END IF;
  UPDATE profiles SET
    terms_agreed_at    = coalesce(terms_agreed_at, now()),
    privacy_agreed_at  = coalesce(privacy_agreed_at, now()),
    age14_confirmed_at = coalesce(age14_confirmed_at, now()),
    updated_at = now()
  WHERE user_id = auth.uid();
END $$;
REVOKE EXECUTE ON FUNCTION public.accept_required_terms(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_required_terms(boolean) TO authenticated, service_role;

-- ───────────────────────── 3) 정치 성향 저장 동의 ─────────────────────────
CREATE OR REPLACE FUNCTION public.has_political_consent(p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_user AND political_consent_at IS NOT NULL)
$$;
REVOKE EXECUTE ON FUNCTION public.has_political_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_political_consent(uuid) TO authenticated, service_role;

-- 저장은 동의한 본인만
DROP POLICY IF EXISTS "Users can insert own match results" ON public.policy_match_results;
CREATE POLICY "Users can insert own match results" ON public.policy_match_results
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_political_consent(auth.uid()));
DROP POLICY IF EXISTS "Users can insert own mbti results" ON public.political_mbti_results;
CREATE POLICY "Users can insert own mbti results" ON public.political_mbti_results
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_political_consent(auth.uid()));
DROP POLICY IF EXISTS "Users can insert own answers" ON public.spectrum_answers;
CREATE POLICY "Users can insert own answers" ON public.spectrum_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_political_consent(auth.uid()));
DROP POLICY IF EXISTS "Users can insert own spectrum" ON public.user_spectrums;
CREATE POLICY "Users can insert own spectrum" ON public.user_spectrums
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_political_consent(auth.uid()));
DROP POLICY IF EXISTS "Users can update own spectrum" ON public.user_spectrums;
CREATE POLICY "Users can update own spectrum" ON public.user_spectrums
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_political_consent(auth.uid()));
-- 본인 삭제 (기존엔 스펙트럼·답변 삭제 정책이 없었음)
DROP POLICY IF EXISTS "Users can delete own spectrum" ON public.user_spectrums;
CREATE POLICY "Users can delete own spectrum" ON public.user_spectrums FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own answers" ON public.spectrum_answers;
CREATE POLICY "Users can delete own answers" ON public.spectrum_answers FOR DELETE USING (auth.uid() = user_id);

-- 동의 켜기/끄기. 끄면 성향 결과 4종을 지우고 지운 개수를 돌려준다.
CREATE OR REPLACE FUNCTION public.set_political_consent(p_on boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  n1 int := 0; n2 int := 0; n3 int := 0; n4 int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
  PERFORM set_config('minsim.consent_rpc', '1', true);
  IF p_on THEN
    UPDATE profiles SET political_consent_at = coalesce(political_consent_at, now()), updated_at = now()
    WHERE user_id = v_uid;
  ELSE
    UPDATE profiles SET political_consent_at = NULL, updated_at = now() WHERE user_id = v_uid;
    -- mbti 결과가 정책 매칭 결과를 참조할 수 있으므로 mbti부터
    DELETE FROM political_mbti_results WHERE user_id = v_uid; GET DIAGNOSTICS n1 = ROW_COUNT;
    DELETE FROM policy_match_results   WHERE user_id = v_uid; GET DIAGNOSTICS n2 = ROW_COUNT;
    DELETE FROM user_spectrums         WHERE user_id = v_uid; GET DIAGNOSTICS n3 = ROW_COUNT;
    DELETE FROM spectrum_answers       WHERE user_id = v_uid; GET DIAGNOSTICS n4 = ROW_COUNT;
  END IF;
  PERFORM set_config('minsim.consent_rpc', '', true);
  RETURN jsonb_build_object('consent', p_on,
    'deleted', jsonb_build_object('mbti', n1, 'policy_match', n2, 'spectrum', n3, 'answers', n4));
END $$;
REVOKE EXECUTE ON FUNCTION public.set_political_consent(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_political_consent(boolean) TO authenticated, service_role;

-- 동의 없이 이미 저장된 결과 개수 (기존 가입자에게 '남길지/지울지' 물어볼 때)
CREATE OR REPLACE FUNCTION public.get_my_political_data_count()
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*) FROM political_mbti_results WHERE user_id = auth.uid())::int
       + (SELECT count(*) FROM policy_match_results   WHERE user_id = auth.uid())::int
       + (SELECT count(*) FROM user_spectrums         WHERE user_id = auth.uid())::int
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_political_data_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_political_data_count() TO authenticated, service_role;

-- ───────────────────────── 4) 탈퇴 · 관리자 삭제 ─────────────────────────
-- auth.users를 지우면 FK CASCADE로 사용자 데이터가 함께 지워진다.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
  IF public.is_admin(v_uid) AND (SELECT count(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'last_admin';
  END IF;
  DELETE FROM auth.users WHERE id = v_uid;
END $$;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT coalesce(public.is_admin(auth.uid()), false) THEN RAISE EXCEPTION 'admin_only'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'cannot_delete_self'; END IF;
  IF public.is_admin(p_user) AND (SELECT count(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'last_admin';
  END IF;
  DELETE FROM auth.users WHERE id = p_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'user_not_found'; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, service_role;

-- ───────────────────────── 공개 이름을 닉네임으로 ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_agenda_claims(p_agenda_id uuid, p_issue_id uuid DEFAULT NULL::uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
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
                    ELSE coalesce(nullif(btrim(pr.nickname), ''), '시민') END AS author,
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
$function$;

-- 퀴즈 랭킹도 실명 대신 닉네임 (컬럼 이름은 그대로 둬서 화면 코드 호환)
CREATE OR REPLACE FUNCTION public.leaderboard_rows()
RETURNS TABLE(id uuid, total_points integer, current_streak integer, longest_streak integer, total_quizzes integer,
              correct_answers integer, updated_at timestamptz, display_name text, avatar_url text, region_sido text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $function$
  SELECT q.id, q.total_points, q.current_streak, q.longest_streak, q.total_quizzes, q.correct_answers, q.updated_at,
         coalesce(nullif(btrim(p.nickname), ''), '시민') AS display_name, p.avatar_url, p.region_sido
  FROM public.quiz_stats q JOIN public.profiles p ON q.user_id = p.user_id
$function$;

-- ───────────────────────── 6) 활동 로그 정리 ─────────────────────────
UPDATE public.activity_logs
SET description = regexp_replace(description, '[^\s:]+@[^\s]+', '(이메일 삭제)', 'g')
WHERE description ~ '@';
UPDATE public.activity_logs
SET metadata = metadata - 'preference'
WHERE metadata ? 'preference';
