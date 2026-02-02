# Google Gemini API 직접 연결 - 완료 ✅

## 변경 내용

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| API | Lovable AI Gateway | Google Gemini API 직접 호출 |
| 모델 | `google/gemini-3-flash-preview` | `gemini-2.0-flash` |
| API 키 | `LOVABLE_API_KEY` | `GOOGLE_GEMINI_API_KEY` |
| 엔드포인트 | `ai.gateway.lovable.dev` | `generativelanguage.googleapis.com` |

## 수정된 파일

- `supabase/functions/extract-candidates/index.ts`
  - Google Gemini API 직접 호출로 변경
  - 응답 형식 파싱 로직 수정 (OpenAI 형식 → Gemini 형식)
  - 에러 핸들링 업데이트

## 시크릿 추가됨

- `GOOGLE_GEMINI_API_KEY` ✅
