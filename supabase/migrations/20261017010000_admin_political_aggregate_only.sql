-- 관리자도 개인별 정치 성향 결과는 볼 수 없게 한다 (민감정보 접근 최소화 — 개인정보보호법 제23·29조 취지, 추정·법률 검토 필요).
-- 관리자 화면은 아래 집계 함수만 쓴다. 5명 미만인 칸은 숫자를 감춘다 (몇 명 안 되면 누군지 짐작할 수 있으므로).

DROP POLICY IF EXISTS "Admins can view all mbti results"  ON public.political_mbti_results;
DROP POLICY IF EXISTS "Admins can view all match results" ON public.policy_match_results;
DROP POLICY IF EXISTS "Admins can view all spectrums"     ON public.user_spectrums;
DROP POLICY IF EXISTS "Admins can view all answers"       ON public.spectrum_answers;

CREATE OR REPLACE FUNCTION public.admin_political_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  k constant int := 5;
  v_spec_n int;
BEGIN
  IF NOT coalesce(public.is_admin(auth.uid()), false) THEN RAISE EXCEPTION 'admin_only'; END IF;

  SELECT count(*) INTO v_spec_n FROM user_spectrums;

  RETURN jsonb_build_object(
    'k', k,
    'consented_users', (SELECT count(*) FROM profiles WHERE political_consent_at IS NOT NULL),
    'mbti', jsonb_build_object(
      'results', (SELECT count(*) FROM political_mbti_results),
      'people',  (SELECT count(DISTINCT user_id) FROM political_mbti_results),
      -- 사람 기준(각자 가장 최근 결과)으로 센다. 5명 미만 유형은 '기타'로 묶는다.
      'types', coalesce((
        SELECT jsonb_agg(jsonb_build_object('type', t, 'count', n) ORDER BY n DESC, t)
        FROM (
          SELECT CASE WHEN count(*) >= k THEN type_code ELSE NULL END AS t, count(*)::int AS n
          FROM (SELECT DISTINCT ON (user_id) user_id, type_code FROM political_mbti_results
                ORDER BY user_id, created_at DESC) latest
          GROUP BY type_code
        ) g WHERE t IS NOT NULL), '[]'::jsonb),
      'hidden_people', coalesce((
        SELECT sum(n)::int FROM (
          SELECT count(*) AS n FROM (SELECT DISTINCT ON (user_id) user_id, type_code FROM political_mbti_results
                                     ORDER BY user_id, created_at DESC) latest
          GROUP BY type_code HAVING count(*) < k) h), 0)
    ),
    'spectrum', jsonb_build_object(
      'people', v_spec_n,
      'averages', CASE WHEN v_spec_n >= k THEN (
        SELECT jsonb_build_object(
          'economy',  round(avg(economy_score)::numeric, 1),
          'security', round(avg(security_score)::numeric, 1),
          'gender',   round(avg(gender_score)::numeric, 1),
          'fairness', round(avg(fairness_score)::numeric, 1),
          'future',   round(avg(future_score)::numeric, 1))
        FROM user_spectrums) END
    ),
    'policy_match', jsonb_build_object(
      'results', (SELECT count(*) FROM policy_match_results),
      'people',  (SELECT count(DISTINCT user_id) FROM policy_match_results)
    )
  );
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_political_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_political_stats() TO authenticated, service_role;
