-- 1. 먼저 제약조건 삭제
ALTER TABLE public.spectrum_questions 
DROP CONSTRAINT IF EXISTS spectrum_questions_target_dimension_check;

-- 2. 데이터 업데이트
UPDATE public.spectrum_questions SET target_dimension = 'economy' WHERE target_dimension = 'ECO';
UPDATE public.spectrum_questions SET target_dimension = 'security' WHERE target_dimension = 'SEC';
UPDATE public.spectrum_questions SET target_dimension = 'gender' WHERE target_dimension = 'GEN';
UPDATE public.spectrum_questions SET target_dimension = 'fairness' WHERE target_dimension = 'FAI';
UPDATE public.spectrum_questions SET target_dimension = 'future' WHERE target_dimension = 'FUT';

-- 3. 새 제약조건 추가
ALTER TABLE public.spectrum_questions 
ADD CONSTRAINT spectrum_questions_target_dimension_check 
CHECK (target_dimension IN ('economy', 'security', 'gender', 'fairness', 'future'));