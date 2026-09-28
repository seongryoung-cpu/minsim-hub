-- 선거가 끝난 뒤 후보의 결과를 기록한다 (평상시 모드에서 당선인을 앞에 보여 주기 위함).
--   election_result  NULL = 아직 입력 안 함
--                    'elected'        당선
--                    'defeated'       본선 낙선
--                    'not_nominated'  본선 미진출 (경선 탈락·불출마 포함)
--   vote_share       본선 최종 득표율(%). 확정 수치를 확인한 경우에만 입력
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS election_result text
    CHECK (election_result IS NULL OR election_result IN ('elected', 'defeated', 'not_nominated')),
  ADD COLUMN IF NOT EXISTS vote_share numeric(5, 2)
    CHECK (vote_share IS NULL OR vote_share BETWEEN 0 AND 100);
