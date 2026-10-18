-- 의제별 '지금 상황' 한 줄 (운영진 작성, 출처 필수)
-- 법안이 아닌 수단(예산·조례·정부 방침)도 이 한 줄로 알린다. 예: "2027년 예산안에 소득 기준 확대가 들어가 국회 심사 중"
ALTER TABLE public.agendas
  ADD COLUMN IF NOT EXISTS status_note text CHECK (status_note IS NULL OR char_length(btrim(status_note)) BETWEEN 5 AND 140),
  ADD COLUMN IF NOT EXISTS status_source_url text CHECK (status_source_url IS NULL OR (status_source_url ~ '^https?://[^\s]+$' AND char_length(status_source_url) <= 500)),
  ADD COLUMN IF NOT EXISTS status_next text CHECK (status_next IS NULL OR char_length(btrim(status_next)) BETWEEN 3 AND 80),   -- 다음 결정 시점 (예: "12월 2일까지 국회 예산 의결")
  ADD COLUMN IF NOT EXISTS status_updated_on date;

ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_status_note_needs_source;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_status_note_needs_source
  CHECK (status_note IS NULL OR status_source_url IS NOT NULL);
