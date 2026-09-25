-- 보안 보강 (2026-09-26)
-- 1) 사용자가 자기 프로필의 인증 관련 칸(인증 레벨, 연계정보, 전화번호 등)을 직접 바꾸지 못하게 함
-- 2) 사용자가 퀴즈 점수(quiz_stats)를 임의 값으로 올리지 못하게 하루 1회, 1회 최대치 이내로 제한
-- 서버 함수(service_role)와 관리자는 제한 없이 변경 가능

-- 일반 API 사용자(anon/authenticated) 중 관리자가 아닌 경우인지 판별
CREATE OR REPLACE FUNCTION public.is_restricted_api_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') IN ('anon', 'authenticated')
     AND NOT coalesce(public.is_admin(auth.uid()), false);
$$;

-- 1) 프로필 인증 칸 보호
CREATE OR REPLACE FUNCTION public.protect_profile_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_restricted_api_user() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verification_level := 'social';
    NEW.identity_ci := NULL;
    NEW.identity_provider := NULL;
    NEW.identity_verified_at := NULL;
    NEW.phone_number := NULL;
    NEW.phone_verified_at := NULL;
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.verification_level := OLD.verification_level;
    NEW.identity_ci := OLD.identity_ci;
    NEW.identity_provider := OLD.identity_provider;
    NEW.identity_verified_at := OLD.identity_verified_at;
    NEW.phone_number := OLD.phone_number;
    NEW.phone_verified_at := OLD.phone_verified_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_verification_fields ON public.profiles;
CREATE TRIGGER protect_profile_verification_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification_fields();

-- 2) 퀴즈 점수 보호
-- 하루 퀴즈 5문제 x 문제당 최대 15점 = 1회 최대 75점
CREATE OR REPLACE FUNCTION public.protect_quiz_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_points_per_day constant int := 75;
  max_correct_per_day constant int := 5;
  today_kst date := (now() AT TIME ZONE 'Asia/Seoul')::date;
BEGIN
  IF NOT public.is_restricted_api_user() THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.total_points := least(greatest(NEW.total_points, 0), max_points_per_day);
    NEW.correct_answers := least(greatest(NEW.correct_answers, 0), max_correct_per_day);
    NEW.total_quizzes := least(greatest(NEW.total_quizzes, 0), 1);
    NEW.current_streak := least(greatest(NEW.current_streak, 0), 1);
    NEW.longest_streak := least(greatest(NEW.longest_streak, 0), 1);
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  NEW.user_id := OLD.user_id;

  -- 오늘(한국 시간) 이미 점수가 반영됐다면 점수 관련 값은 그대로 유지
  IF (OLD.updated_at AT TIME ZONE 'Asia/Seoul')::date >= today_kst
     AND OLD.total_quizzes > 0 THEN
    NEW.total_points := OLD.total_points;
    NEW.correct_answers := OLD.correct_answers;
    NEW.total_quizzes := OLD.total_quizzes;
    NEW.current_streak := OLD.current_streak;
    NEW.longest_streak := OLD.longest_streak;
    NEW.updated_at := OLD.updated_at;
    RETURN NEW;
  END IF;

  NEW.total_points := OLD.total_points
    + least(greatest(NEW.total_points - OLD.total_points, 0), max_points_per_day);
  NEW.correct_answers := OLD.correct_answers
    + least(greatest(NEW.correct_answers - OLD.correct_answers, 0), max_correct_per_day);
  NEW.total_quizzes := OLD.total_quizzes
    + least(greatest(NEW.total_quizzes - OLD.total_quizzes, 0), 1);
  NEW.current_streak := least(greatest(NEW.current_streak, 0), OLD.current_streak + 1);
  NEW.longest_streak := greatest(OLD.longest_streak, least(NEW.longest_streak, NEW.current_streak));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_quiz_stats ON public.quiz_stats;
CREATE TRIGGER protect_quiz_stats
  BEFORE INSERT OR UPDATE ON public.quiz_stats
  FOR EACH ROW EXECUTE FUNCTION public.protect_quiz_stats();
