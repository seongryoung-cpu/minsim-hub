-- 국회의원 사진: 국회 원본(약 1MB)을 한 번 받아 작은 크기로 줄여 우리 저장소에 둔다
--   politician-photos/160/{mona_cd}.webp  목록용 (48×64, 선명한 화면 대응) — 처음엔 96, 2026-10-19에 키움
--   politician-photos/480/{mona_cd}.webp  인물 페이지(120×160)·크게 보기용 — 처음엔 240
-- 원본(큰 것은 16MB까지 확인됨)은 줄인 뒤 지운다. 사진 주소(photo_src)가 바뀐 사람만 다시 받는다.
-- 출처: 열린국회정보 국회의원 정보(ALLNAMEMBER, NAAS_PIC)

ALTER TABLE public.assembly_members
  ADD COLUMN IF NOT EXISTS photo_src text,          -- 국회가 준 사진 주소
  ADD COLUMN IF NOT EXISTS photo_saved_src text,    -- 우리 저장소에 줄여 둔 사진의 원래 주소 (photo_src와 다르면 다시 받는다)
  ADD COLUMN IF NOT EXISTS photo_version integer,   -- 화면 캐시 갱신용 (저장할 때마다 바뀜)
  ADD COLUMN IF NOT EXISTS photo_failed_at timestamptz;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('politician-photos', 'politician-photos', true, 26214400, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
-- 공개 버킷이라 읽기 정책은 필요 없고, 쓰기는 Edge Function(service role)만 한다

-- 크기 묶음: null = 96·240 (처음), 'v2' = 160·480. 화면은 이 값으로 폴더를 고른다
ALTER TABLE public.assembly_members ADD COLUMN IF NOT EXISTS photo_set text;
