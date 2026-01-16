-- Create table for user followed candidates
CREATE TABLE public.user_followed_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, candidate_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_followed_candidates ENABLE ROW LEVEL SECURITY;

-- Users can view their own followed candidates
CREATE POLICY "Users can view own followed candidates"
ON public.user_followed_candidates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own followed candidates
CREATE POLICY "Users can insert own followed candidates"
ON public.user_followed_candidates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own followed candidates
CREATE POLICY "Users can delete own followed candidates"
ON public.user_followed_candidates
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_user_followed_candidates_user_id ON public.user_followed_candidates(user_id);
CREATE INDEX idx_user_followed_candidates_candidate_id ON public.user_followed_candidates(candidate_id);