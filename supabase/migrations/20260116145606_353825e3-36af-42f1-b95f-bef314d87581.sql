-- 정책 매칭 결과 저장 테이블
CREATE TABLE public.policy_match_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  region_name text NOT NULL,
  top_match_candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,
  top_match_candidate_name text NOT NULL,
  top_match_score integer NOT NULL,
  preferred_candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,
  preferred_candidate_name text,
  results_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  choices_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_questions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_policy_match_user ON public.policy_match_results(user_id);
CREATE INDEX idx_policy_match_created ON public.policy_match_results(created_at DESC);

-- RLS 활성화
ALTER TABLE public.policy_match_results ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own match results"
ON public.policy_match_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own match results"
ON public.policy_match_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own match results"
ON public.policy_match_results
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all match results"
ON public.policy_match_results
FOR SELECT
USING (is_admin(auth.uid()));