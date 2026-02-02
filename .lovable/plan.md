
# Google Gemini API 직접 연결 계획

## 현재 상황 vs 변경 후

| 항목 | 현재 (Lovable AI Gateway) | 변경 후 (직접 Gemini API) |
|------|-------------------------|------------------------|
| 비용 | Lovable 크레딧 소모 | 구글 구독에 포함 (추가 비용 없음) |
| Rate Limit | Lovable 제한 적용 | 구글 구독 플랜 제한 (일반적으로 더 높음) |
| 모델 | `google/gemini-3-flash-preview` | `gemini-2.0-flash` 또는 원하는 모델 |
| API 키 | `LOVABLE_API_KEY` (자동 제공) | `GOOGLE_GEMINI_API_KEY` (사용자 제공 필요) |

---

## 구현 계획

### 1단계: API 키 시크릿 추가

- 시크릿 이름: `GOOGLE_GEMINI_API_KEY`
- Google AI Studio (https://aistudio.google.com)에서 API 키 복사

### 2단계: 엣지 함수 수정

**파일**: `supabase/functions/extract-candidates/index.ts`

**주요 변경사항**:

```typescript
// 변경 전: Lovable AI Gateway
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({ model: 'google/gemini-3-flash-preview', ... })
});

// 변경 후: Google Gemini API 직접 호출
const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
const aiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  }
);
```

### 3단계: 응답 파싱 로직 수정

Google Gemini API는 OpenAI와 다른 응답 형식을 사용합니다:

```typescript
// Lovable AI Gateway (OpenAI 형식)
const content = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

// Google Gemini API (Gemini 형식)
const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
```

---

## 수정할 파일

| 파일 | 변경 내용 |
|------|---------|
| `supabase/functions/extract-candidates/index.ts` | API 엔드포인트 변경, 요청/응답 형식 수정 |

---

## 기술적 세부사항

### Google Gemini API 요청 형식

```typescript
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "후보자 정보를 추출해주세요..." }]
    }
  ],
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": {
      "type": "object",
      "properties": {
        "candidates": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "party": { "type": "string" },
              // ... 기타 필드
            }
          }
        }
      }
    }
  }
}
```

### Google Gemini API 응답 형식

```typescript
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "{\"candidates\": [...]}" }
        ],
        "role": "model"
      }
    }
  ]
}
```

---

## 사용 가능한 모델

| 모델 | 특징 | 추천 용도 |
|------|------|---------|
| `gemini-2.0-flash` | 빠름, 저비용 | 일반 추출 (기본 추천) |
| `gemini-2.0-flash-lite` | 가장 빠름, 최저 비용 | 간단한 추출 |
| `gemini-2.5-pro-preview-06-05` | 최고 성능 | 복잡한 분석 필요 시 |

---

## 필요한 작업 순서

1. **API 키 준비**: Google AI Studio에서 API 키 복사
2. **시크릿 추가**: `GOOGLE_GEMINI_API_KEY` 시크릿 등록
3. **엣지 함수 수정**: API 엔드포인트 및 요청/응답 형식 변경
4. **테스트**: 후보자 추출 기능 동작 확인

---

## 예상 결과

- Lovable 크레딧 소모 없이 AI 추출 기능 사용 가능
- 구글 구독 플랜의 높은 rate limit 활용
- 동일한 Gemini 모델 성능 유지
