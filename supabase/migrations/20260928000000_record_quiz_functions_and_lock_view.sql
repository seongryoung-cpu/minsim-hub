-- 퀴즈 서버 채점 (2026-09-28)
-- 1) 라이브 DB에만 있던 quiz_questions_public 뷰와 submit_quiz_answer / submit_daily_quiz 함수를
--    저장소에 기록한다 (라이브 정의 그대로 — 저장소와 DB를 맞추는 목적).
-- 2) 보안: quiz_questions_public 은 단순 뷰라 자동으로 수정 가능한 뷰이고, 뷰 소유자(postgres) 권한으로
--    실행되어 quiz_questions 의 RLS를 우회한다. 기본 GRANT 때문에 anon/authenticated 가
--    이 뷰를 통해 문제를 UPDATE/DELETE/INSERT 할 수 있었다 → 읽기 외 권한 회수.

CREATE OR REPLACE VIEW public.quiz_questions_public AS
  SELECT id, category, question, options, difficulty, points, is_active, created_at
  FROM public.quiz_questions
  WHERE is_active = true;

REVOKE ALL ON public.quiz_questions_public FROM anon, authenticated;
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_quiz_answer(p_question_id uuid, p_selected_index integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_question quiz_questions;
  v_is_correct boolean;
BEGIN
  SELECT * INTO v_question
  FROM quiz_questions
  WHERE id = p_question_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;

  v_is_correct := (p_selected_index = v_question.correct_answer);

  RETURN jsonb_build_object(
    'is_correct',   v_is_correct,
    'explanation',  v_question.explanation,
    'points',       CASE WHEN v_is_correct THEN v_question.points ELSE 0 END,
    'correct_index', v_question.correct_answer
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_daily_quiz(p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_answer jsonb;
  v_question quiz_questions;
  v_is_correct boolean;
  v_total_points integer := 0;
  v_correct_count integer := 0;
  v_total_count integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_today_kst date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_existing_stats quiz_stats;
  v_has_stats boolean;
  v_new_streak integer;
  v_yesterday_kst date := v_today_kst - 1;
BEGIN
  -- 비인증 사용자: 채점만 하고 저장 안 함
  IF v_user_id IS NULL THEN
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
      SELECT * INTO v_question
      FROM quiz_questions
      WHERE id = (v_answer->>'question_id')::uuid AND is_active = true;

      IF FOUND THEN
        v_is_correct := ((v_answer->>'selected_index')::integer = v_question.correct_answer);
        v_results := v_results || jsonb_build_object(
          'question_id',  v_question.id,
          'is_correct',   v_is_correct,
          'explanation',  v_question.explanation,
          'correct_index', v_question.correct_answer,
          'points',       CASE WHEN v_is_correct THEN v_question.points ELSE 0 END
        );
      END IF;
    END LOOP;
    RETURN jsonb_build_object('saved', false, 'results', v_results);
  END IF;

  -- 오늘 이미 제출했는지 확인
  SELECT * INTO v_existing_stats
  FROM quiz_stats
  WHERE user_id = v_user_id;
  v_has_stats := FOUND;

  IF v_has_stats AND v_existing_stats.updated_at IS NOT NULL
     AND (v_existing_stats.updated_at AT TIME ZONE 'Asia/Seoul')::date >= v_today_kst
     AND v_existing_stats.total_quizzes > 0 THEN
    RETURN jsonb_build_object('error', 'already_submitted', 'message', '오늘은 이미 퀴즈를 완료했습니다');
  END IF;

  -- 채점
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    SELECT * INTO v_question
    FROM quiz_questions
    WHERE id = (v_answer->>'question_id')::uuid AND is_active = true;

    IF FOUND THEN
      v_is_correct := ((v_answer->>'selected_index')::integer = v_question.correct_answer);
      v_total_count := v_total_count + 1;
      IF v_is_correct THEN
        v_correct_count := v_correct_count + 1;
        v_total_points  := v_total_points + v_question.points;
      END IF;

      v_results := v_results || jsonb_build_object(
        'question_id',   v_question.id,
        'is_correct',    v_is_correct,
        'explanation',   v_question.explanation,
        'correct_index', v_question.correct_answer,
        'points',        CASE WHEN v_is_correct THEN v_question.points ELSE 0 END
      );
    END IF;
  END LOOP;

  -- 스트릭 계산
  -- (수정) 예전 정의는 여기서 NOT FOUND 를 봤는데, 그 값은 바로 위 채점 루프의 마지막 SELECT 결과라
  --        기존 통계 유무와 무관했다. 통계 조회 직후 저장한 v_has_stats 로 판단한다.
  IF NOT v_has_stats THEN
    v_new_streak := 1;
  ELSIF (v_existing_stats.updated_at AT TIME ZONE 'Asia/Seoul')::date = v_yesterday_kst THEN
    v_new_streak := v_existing_stats.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- quiz_stats upsert (DB 트리거가 상한 적용)
  INSERT INTO quiz_stats (
    user_id, total_points, correct_answers, total_quizzes,
    current_streak, longest_streak, last_played_date, updated_at
  ) VALUES (
    v_user_id,
    COALESCE(v_existing_stats.total_points, 0) + v_total_points,
    COALESCE(v_existing_stats.correct_answers, 0) + v_correct_count,
    COALESCE(v_existing_stats.total_quizzes, 0) + 1,
    v_new_streak,
    GREATEST(COALESCE(v_existing_stats.longest_streak, 0), v_new_streak),
    v_today_kst::text,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points    = COALESCE(v_existing_stats.total_points, 0) + v_total_points,
    correct_answers = COALESCE(v_existing_stats.correct_answers, 0) + v_correct_count,
    total_quizzes   = COALESCE(v_existing_stats.total_quizzes, 0) + 1,
    current_streak  = v_new_streak,
    longest_streak  = GREATEST(COALESCE(v_existing_stats.longest_streak, 0), v_new_streak),
    last_played_date = v_today_kst::text,
    updated_at      = now();

  RETURN jsonb_build_object(
    'saved',          true,
    'correct_count',  v_correct_count,
    'total_count',    v_total_count,
    'total_points',   v_total_points,
    'results',        v_results
  );
END;
$function$;
