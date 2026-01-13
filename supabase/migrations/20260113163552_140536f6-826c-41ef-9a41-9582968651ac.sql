-- Create quiz_stats table for leaderboard
CREATE TABLE public.quiz_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_played_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view leaderboard (for ranking)
CREATE POLICY "Anyone can view quiz stats for leaderboard"
ON public.quiz_stats
FOR SELECT
USING (true);

-- Users can insert their own stats
CREATE POLICY "Users can insert own quiz stats"
ON public.quiz_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own quiz stats"
ON public.quiz_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_quiz_stats_updated_at
BEFORE UPDATE ON public.quiz_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();