-- 정책 카드 테이블
CREATE TABLE public.policy_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  statement text NOT NULL,
  left_label text NOT NULL,
  right_label text NOT NULL,
  region_name text NOT NULL DEFAULT '전국',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 후보자별 정책 입장 테이블
CREATE TABLE public.policy_candidate_alignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_card_id uuid NOT NULL REFERENCES public.policy_cards(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  stance text NOT NULL CHECK (stance IN ('agree', 'disagree', 'neutral')),
  intensity integer NOT NULL DEFAULT 3 CHECK (intensity >= 1 AND intensity <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(policy_card_id, candidate_id)
);

-- 인덱스 생성
CREATE INDEX idx_policy_cards_region ON public.policy_cards(region_name);
CREATE INDEX idx_policy_cards_category ON public.policy_cards(category);
CREATE INDEX idx_policy_cards_active ON public.policy_cards(is_active);
CREATE INDEX idx_policy_alignments_policy ON public.policy_candidate_alignments(policy_card_id);
CREATE INDEX idx_policy_alignments_candidate ON public.policy_candidate_alignments(candidate_id);

-- RLS 활성화
ALTER TABLE public.policy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_candidate_alignments ENABLE ROW LEVEL SECURITY;

-- 정책 카드 RLS 정책
CREATE POLICY "Anyone can read active policy cards"
ON public.policy_cards
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage policy cards"
ON public.policy_cards
FOR ALL
USING (is_admin(auth.uid()));

-- 후보자 정책 입장 RLS 정책
CREATE POLICY "Anyone can read policy alignments"
ON public.policy_candidate_alignments
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage policy alignments"
ON public.policy_candidate_alignments
FOR ALL
USING (is_admin(auth.uid()));

-- 업데이트 트리거
CREATE TRIGGER update_policy_cards_updated_at
BEFORE UPDATE ON public.policy_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policy_alignments_updated_at
BEFORE UPDATE ON public.policy_candidate_alignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();