-- 정치 MBTI 질문 테이블
CREATE TABLE public.political_mbti_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  axis TEXT NOT NULL, -- 'EI' (경제), 'SN' (사회), 'TF' (외교), 'JP' (정치참여)
  statement TEXT NOT NULL,
  left_label TEXT NOT NULL,
  right_label TEXT NOT NULL,
  left_axis_value TEXT NOT NULL, -- E, S, T, J 등 왼쪽 선택시 해당 축 값
  right_axis_value TEXT NOT NULL, -- I, N, F, P 등 오른쪽 선택시 해당 축 값
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 정치 MBTI 유형 정의 테이블
CREATE TABLE public.political_mbti_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_code TEXT NOT NULL UNIQUE, -- 예: 'ESTP', 'INFJ' 등 16가지
  name TEXT NOT NULL, -- 유형 이름 (예: '열정적 개혁가')
  description TEXT NOT NULL, -- 유형 상세 설명
  keywords TEXT[] NOT NULL DEFAULT '{}', -- 키워드 태그
  famous_figures TEXT[] DEFAULT '{}', -- 유사 정치인/인물
  strengths TEXT[] DEFAULT '{}', -- 강점
  weaknesses TEXT[] DEFAULT '{}', -- 약점
  compatible_types TEXT[] DEFAULT '{}', -- 잘 맞는 유형
  incompatible_types TEXT[] DEFAULT '{}', -- 안 맞는 유형
  color TEXT NOT NULL DEFAULT '#6366F1', -- 유형 대표 색상
  icon TEXT DEFAULT 'user', -- 아이콘 이름
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 정치 MBTI 결과 저장 테이블
CREATE TABLE public.political_mbti_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type_code TEXT NOT NULL, -- 결과 유형 코드
  axis_scores JSONB NOT NULL DEFAULT '{}', -- 각 축별 점수 { "EI": { "E": 3, "I": 5 }, ... }
  answers_json JSONB NOT NULL DEFAULT '[]', -- 답변 기록
  from_policy_match BOOLEAN NOT NULL DEFAULT false, -- 정책매칭에서 연계된 결과인지
  policy_match_result_id UUID REFERENCES public.policy_match_results(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_mbti_questions_axis ON public.political_mbti_questions(axis);
CREATE INDEX idx_mbti_questions_active ON public.political_mbti_questions(is_active);
CREATE INDEX idx_mbti_results_user ON public.political_mbti_results(user_id);
CREATE INDEX idx_mbti_results_type ON public.political_mbti_results(type_code);

-- RLS 활성화
ALTER TABLE public.political_mbti_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_mbti_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_mbti_results ENABLE ROW LEVEL SECURITY;

-- 정책: 질문 읽기 (누구나)
CREATE POLICY "Anyone can read active mbti questions"
ON public.political_mbti_questions FOR SELECT
USING (is_active = true);

-- 정책: 질문 관리 (관리자)
CREATE POLICY "Admins can manage mbti questions"
ON public.political_mbti_questions FOR ALL
USING (is_admin(auth.uid()));

-- 정책: 유형 읽기 (누구나)
CREATE POLICY "Anyone can read mbti types"
ON public.political_mbti_types FOR SELECT
USING (true);

-- 정책: 유형 관리 (관리자)
CREATE POLICY "Admins can manage mbti types"
ON public.political_mbti_types FOR ALL
USING (is_admin(auth.uid()));

-- 정책: 결과 조회 (본인)
CREATE POLICY "Users can view own mbti results"
ON public.political_mbti_results FOR SELECT
USING (auth.uid() = user_id);

-- 정책: 결과 저장 (본인)
CREATE POLICY "Users can insert own mbti results"
ON public.political_mbti_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 정책: 결과 삭제 (본인)
CREATE POLICY "Users can delete own mbti results"
ON public.political_mbti_results FOR DELETE
USING (auth.uid() = user_id);

-- 정책: 관리자 전체 조회
CREATE POLICY "Admins can view all mbti results"
ON public.political_mbti_results FOR SELECT
USING (is_admin(auth.uid()));

-- 샘플 데이터: 4축 정의
-- E/I: 경제 성향 (시장/국가)
-- S/N: 사회 가치 (전통/진보)
-- T/F: 외교 노선 (실용/이념)
-- J/P: 정치 참여 (질서/변화)

-- 샘플 질문 삽입 (축당 3개씩 = 12개)
INSERT INTO public.political_mbti_questions (axis, statement, left_label, right_label, left_axis_value, right_axis_value, sort_order) VALUES
-- E/I 축: 경제 (E=시장, I=국가)
('EI', '기업 규제를 완화하면 경제가 성장한다', '국가개입', '시장자율', 'I', 'E', 1),
('EI', '복지 확대보다 감세가 경제에 도움이 된다', '복지확대', '감세', 'I', 'E', 2),
('EI', '최저임금은 시장에 맡겨야 한다', '정부결정', '시장결정', 'I', 'E', 3),

-- S/N 축: 사회 (S=전통, N=진보)
('SN', '전통적 가족 가치를 보존해야 한다', '진보', '전통', 'N', 'S', 4),
('SN', '사회 변화는 점진적으로 이루어져야 한다', '급진변화', '점진변화', 'N', 'S', 5),
('SN', '다양성보다 사회 통합이 더 중요하다', '다양성', '통합', 'N', 'S', 6),

-- T/F 축: 외교 (T=실용, F=이념)
('TF', '외교는 국익 중심으로 실용적이어야 한다', '이념중심', '실용중심', 'F', 'T', 7),
('TF', '동맹 관계는 가치보다 이익으로 판단해야 한다', '가치동맹', '이익동맹', 'F', 'T', 8),
('TF', '북한과의 관계는 원칙보다 유연성이 필요하다', '원칙', '유연', 'F', 'T', 9),

-- J/P 축: 정치 참여 (J=질서, P=변화)
('JP', '정치 안정을 위해 기존 시스템을 유지해야 한다', '변화', '질서', 'P', 'J', 10),
('JP', '시민 불복종도 정당한 정치 표현이다', '법질서', '불복종', 'J', 'P', 11),
('JP', '급진적 정치 변화보다 제도 내 개혁이 바람직하다', '급진', '제도', 'P', 'J', 12);

-- 16가지 유형 삽입
INSERT INTO public.political_mbti_types (type_code, name, description, keywords, color) VALUES
('ESTJ', '원칙주의 관리자', '시장경제와 전통가치를 중시하며, 실용적 외교와 제도적 질서를 선호합니다.', ARRAY['보수', '질서', '실용', '시장'], '#3B82F6'),
('ESTP', '현실주의 실행가', '시장경제와 전통가치를 중시하지만, 변화에 유연하고 실용적입니다.', ARRAY['실용', '변화', '시장', '전통'], '#10B981'),
('ESFJ', '가치수호 조화자', '시장경제를 선호하면서도 전통적 가치와 이념적 외교를 중시합니다.', ARRAY['전통', '이념', '시장', '조화'], '#F59E0B'),
('ESFP', '열정적 변화자', '시장경제와 전통을 중시하지만 이념적이고 변화 지향적입니다.', ARRAY['변화', '이념', '시장', '전통'], '#EF4444'),
('ENTJ', '진보적 전략가', '시장경제를 선호하면서 진보적 사회가치와 실용외교, 질서를 추구합니다.', ARRAY['진보', '실용', '시장', '질서'], '#8B5CF6'),
('ENTP', '혁신적 개혁가', '시장경제와 진보가치, 실용외교를 기반으로 변화를 추구합니다.', ARRAY['혁신', '진보', '시장', '변화'], '#06B6D4'),
('ENFJ', '이상주의 리더', '시장경제, 진보가치, 이념외교, 질서를 조화롭게 추구합니다.', ARRAY['이상', '진보', '시장', '이념'], '#EC4899'),
('ENFP', '열정적 이상가', '시장경제와 진보가치를 기반으로 이념적이고 변화 지향적입니다.', ARRAY['열정', '진보', '변화', '이념'], '#F97316'),
('ISTJ', '신중한 보수자', '국가개입과 전통가치, 실용외교, 질서를 중시하는 안정 지향형입니다.', ARRAY['보수', '국가', '질서', '전통'], '#6B7280'),
('ISTP', '독립적 실용가', '국가개입과 전통가치를 기반으로 실용적이면서 변화에 열린 성향입니다.', ARRAY['실용', '국가', '전통', '독립'], '#14B8A6'),
('ISFJ', '온건한 수호자', '국가개입, 전통가치, 이념외교, 질서를 중시하는 온건 보수형입니다.', ARRAY['온건', '국가', '전통', '이념'], '#A855F7'),
('ISFP', '감성적 전통가', '국가개입과 전통가치, 이념외교를 중시하면서 변화에 유연합니다.', ARRAY['감성', '전통', '이념', '국가'], '#F472B6'),
('INTJ', '전략적 진보가', '국가개입과 진보가치, 실용외교, 질서를 추구하는 전략가형입니다.', ARRAY['전략', '진보', '국가', '실용'], '#1D4ED8'),
('INTP', '분석적 진보가', '국가개입과 진보가치, 실용외교를 기반으로 변화를 추구합니다.', ARRAY['분석', '진보', '국가', '변화'], '#7C3AED'),
('INFJ', '이념적 진보가', '국가개입, 진보가치, 이념외교, 질서를 추구하는 이상주의자입니다.', ARRAY['이념', '진보', '국가', '질서'], '#059669'),
('INFP', '이상적 변화자', '국가개입과 진보가치, 이념외교를 기반으로 변화를 추구합니다.', ARRAY['이상', '진보', '변화', '이념'], '#DC2626');