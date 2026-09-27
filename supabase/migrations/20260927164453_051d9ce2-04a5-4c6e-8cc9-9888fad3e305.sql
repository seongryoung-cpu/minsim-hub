CREATE OR REPLACE FUNCTION public.leaderboard_rows()
RETURNS TABLE(id uuid, total_points integer, current_streak integer, longest_streak integer, total_quizzes integer, correct_answers integer, updated_at timestamptz, display_name text, avatar_url text, region_sido text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT q.id, q.total_points, q.current_streak, q.longest_streak, q.total_quizzes, q.correct_answers, q.updated_at,
         p.display_name, p.avatar_url, p.region_sido
  FROM public.quiz_stats q JOIN public.profiles p ON q.user_id = p.user_id
$$;
GRANT EXECUTE ON FUNCTION public.leaderboard_rows() TO anon, authenticated;

CREATE OR REPLACE VIEW public.leaderboard_view WITH (security_invoker = on) AS
  SELECT * FROM public.leaderboard_rows() ORDER BY total_points DESC;
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;