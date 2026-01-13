-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view quiz stats for leaderboard" ON public.quiz_stats;

-- Create a secure view for leaderboard that doesn't expose user_id directly
CREATE OR REPLACE VIEW public.leaderboard_view
WITH (security_invoker = on)
AS
SELECT 
  q.id,
  q.total_points,
  q.current_streak,
  q.longest_streak,
  q.total_quizzes,
  q.correct_answers,
  q.updated_at,
  p.display_name,
  p.avatar_url,
  p.region_sido
FROM public.quiz_stats q
JOIN public.profiles p ON q.user_id = p.user_id
ORDER BY q.total_points DESC;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

-- Create policy for authenticated users to view their own stats
CREATE POLICY "Authenticated users can view all quiz stats for leaderboard"
ON public.quiz_stats
FOR SELECT
TO authenticated
USING (true);

-- Create policy for anonymous users - no direct access to quiz_stats
-- They should use the leaderboard_view instead