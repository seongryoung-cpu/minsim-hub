-- 오늘(KST) 퀴즈를 이미 제출했는지 서버가 알려준다.
-- 예전에는 클라이언트가 localStorage와 quiz_stats.last_played_date를 섞어 비교해서,
-- 같은 기기의 다른 계정 기록이 남거나 날짜 형식이 달라 판정이 틀릴 수 있었다.
-- 판정 기준은 submit_daily_quiz의 already_submitted 조건과 똑같이 맞춘다.
CREATE OR REPLACE FUNCTION public.get_daily_quiz_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_today_kst date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_stats quiz_stats;
BEGIN
  IF v_user_id IS NULL THEN
    -- 비로그인은 저장하지 않으므로 언제든 풀 수 있다 (점수 미반영)
    RETURN jsonb_build_object('today', v_today_kst, 'played_today', false, 'saved', false);
  END IF;

  SELECT * INTO v_stats FROM quiz_stats WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'today', v_today_kst,
    'saved', true,
    'played_today', FOUND
      AND v_stats.updated_at IS NOT NULL
      AND (v_stats.updated_at AT TIME ZONE 'Asia/Seoul')::date >= v_today_kst
      AND v_stats.total_quizzes > 0
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_daily_quiz_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_quiz_status() TO anon, authenticated;
