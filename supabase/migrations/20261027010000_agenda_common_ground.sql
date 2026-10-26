-- 진행 중 의제 맨 위 '한눈에' 칸: 운영진이 적는 '대부분 동의하는 것' (갈리는 지점은 split_reason)
-- 마감 뒤에는 결과 카드의 실제 공통분모가 대신한다
ALTER TABLE public.agendas
  ADD COLUMN IF NOT EXISTS common_ground text NOT NULL DEFAULT ''
  CHECK (char_length(common_ground) <= 200);
