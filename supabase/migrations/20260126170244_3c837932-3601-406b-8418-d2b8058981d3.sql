-- 1. 사용자 스펙트럼 테이블 (5D 좌표 + 불확실성)
CREATE TABLE public.user_spectrums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- 5차원 스코어 (-1.0 ~ 1.0)
  economy_score FLOAT NOT NULL DEFAULT 0.0,
  security_score FLOAT NOT NULL DEFAULT 0.0,
  gender_score FLOAT NOT NULL DEFAULT 0.0,
  fairness_score FLOAT NOT NULL DEFAULT 0.0,
  future_score FLOAT NOT NULL DEFAULT 0.0,
  
  -- 불확실성 지수 (각 차원별 표준편차)
  economy_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  security_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  gender_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  fairness_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  future_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  
  -- 메타데이터
  total_answers INTEGER NOT NULL DEFAULT 0,
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 2. 스펙트럼 질문 테이블 (변별력 지수 포함)
CREATE TABLE public.spectrum_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 질문 내용
  statement TEXT NOT NULL,
  left_label TEXT NOT NULL,
  right_label TEXT NOT NULL,
  
  -- 타겟 차원 (ECO, SEC, GEN, FAI, FUT)
  target_dimension TEXT NOT NULL CHECK (target_dimension IN ('ECO', 'SEC', 'GEN', 'FAI', 'FUT')),
  
  -- 가중치 벡터 (각 차원에 미치는 영향도)
  weight_economy FLOAT NOT NULL DEFAULT 0.0,
  weight_security FLOAT NOT NULL DEFAULT 0.0,
  weight_gender FLOAT NOT NULL DEFAULT 0.0,
  weight_fairness FLOAT NOT NULL DEFAULT 0.0,
  weight_future FLOAT NOT NULL DEFAULT 0.0,
  
  -- 변별력 지수 (IRT의 discrimination parameter)
  discrimination FLOAT NOT NULL DEFAULT 1.0,
  
  -- 난이도 (IRT의 difficulty parameter)
  difficulty FLOAT NOT NULL DEFAULT 0.0,
  
  -- 질문 메타
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 사용자 답변 히스토리
CREATE TABLE public.spectrum_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.spectrum_questions(id) ON DELETE CASCADE,
  
  -- 답변 값 (-1.0 ~ 1.0)
  answer_value FLOAT NOT NULL,
  
  -- 이 답변이 선택된 이유 (능동 학습 로그)
  information_gain FLOAT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 인덱스 생성
CREATE INDEX idx_user_spectrums_user_id ON public.user_spectrums(user_id);
CREATE INDEX idx_spectrum_questions_dimension ON public.spectrum_questions(target_dimension);
CREATE INDEX idx_spectrum_questions_active ON public.spectrum_questions(is_active);
CREATE INDEX idx_spectrum_answers_user ON public.spectrum_answers(user_id, session_id);
CREATE INDEX idx_spectrum_answers_question ON public.spectrum_answers(question_id);

-- 5. RLS 활성화
ALTER TABLE public.user_spectrums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectrum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectrum_answers ENABLE ROW LEVEL SECURITY;

-- 6. user_spectrums RLS 정책
CREATE POLICY "Users can view own spectrum" ON public.user_spectrums
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spectrum" ON public.user_spectrums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spectrum" ON public.user_spectrums
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all spectrums" ON public.user_spectrums
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 7. spectrum_questions RLS 정책
CREATE POLICY "Anyone can read active questions" ON public.spectrum_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON public.spectrum_questions
  FOR ALL USING (public.is_admin(auth.uid()));

-- 8. spectrum_answers RLS 정책
CREATE POLICY "Users can view own answers" ON public.spectrum_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON public.spectrum_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all answers" ON public.spectrum_answers
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 9. updated_at 트리거
CREATE TRIGGER update_user_spectrums_updated_at
  BEFORE UPDATE ON public.user_spectrums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spectrum_questions_updated_at
  BEFORE UPDATE ON public.spectrum_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();