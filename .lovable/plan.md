
# 이미지 로딩 문제 해결 ✅ 완료
## 핫링킹 차단 및 토큰 만료 문제 해결

**상태: 구현 완료**

---

## 구현 완료 내역

### 원인 2: User-Agent 차단
- 일부 서버는 브라우저가 아닌 요청(빈 User-Agent)을 차단

### 원인 3: 이미지 URL 토큰 만료
- 나무위키 이미지 URL에 포함된 인증 토큰이 시간이 지나면 만료
- 현재 저장된 URL 예시:
```
https://i.namu.wiki/i/X0key-E48asX9ijJr-5WFMiEyCz29RlvgA-8eFYslhBTNRkg0_T3eOKhoOinhghBNE3NGe57phKOW63v38v5MUJTDcl5HNBrEZVml-SIloc2BRVeTR7jqe48n-lwAOvmHedOvWITzbRvZcnJkNYZmg.webp
```

---

## 해결 방안: 이미지 프록시 및 자체 저장

외부 이미지를 직접 참조하는 대신, **Edge Function에서 이미지를 다운로드하여 Supabase Storage에 저장**합니다.

### 구현 흐름

```text
+-----------------+     +------------------+     +------------------+
| 1. 이미지 URL   | --> | 2. Edge Function | --> | 3. Supabase      |
|    발견         |     |    다운로드      |     |    Storage 저장  |
+-----------------+     +------------------+     +------------------+
                                                         |
                                                         v
                                                 +------------------+
                                                 | 4. 영구 URL로    |
                                                 |    DB 업데이트   |
                                                 +------------------+
```

---

## 수정할 파일

| 파일 | 변경 내용 |
|------|---------|
| `supabase/functions/fetch-candidate-info/index.ts` | 이미지 다운로드 및 Storage 업로드 로직 추가 |
| `supabase/functions/proxy-image/index.ts` (신규) | 기존 외부 이미지를 Storage로 마이그레이션하는 함수 |
| `src/pages/admin/AdminCandidateImport.tsx` | 이미지 선택 시 자동 업로드 로직 추가 |

---

## 상세 구현

### 1단계: 이미지 프록시/업로드 Edge Function 생성

**`supabase/functions/proxy-image/index.ts`**

```typescript
// 주요 기능:
// 1. 외부 이미지 URL을 받아서 다운로드
// 2. User-Agent를 브라우저처럼 설정하여 차단 우회
// 3. Supabase Storage에 업로드
// 4. 영구적인 public URL 반환

const response = await fetch(externalImageUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...',
    'Referer': sourceUrl, // 원본 사이트 Referer 설정
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  }
});

// Storage에 업로드
const { data, error } = await supabaseAdmin.storage
  .from('candidate-images')
  .upload(`candidates/${candidateId}-${timestamp}.webp`, imageBuffer, {
    contentType: 'image/webp',
    upsert: true
  });
```

### 2단계: fetch-candidate-info 수정

이미지 검색 후 자동으로 Storage에 저장:

```typescript
// 이미지 발견 시 바로 프록시하여 저장
if (imageOptions.length > 0) {
  const proxyResult = await proxyAndSaveImage(
    imageOptions[0].url,
    imageOptions[0].source_url,
    candidateName
  );
  
  if (proxyResult.success) {
    extractedInfo.image_url = proxyResult.storageUrl; // Storage URL 반환
  }
}
```

### 3단계: 기존 이미지 마이그레이션 도구

관리자가 기존 외부 URL 이미지를 일괄 Storage로 마이그레이션할 수 있는 기능:

```typescript
// 외부 URL인 경우에만 마이그레이션
if (candidate.image_url && !candidate.image_url.includes('supabase.co')) {
  // 이미지 다운로드 및 업로드
  const newUrl = await migrateImageToStorage(candidate.id, candidate.image_url);
  // DB 업데이트
  await updateCandidateImageUrl(candidate.id, newUrl);
}
```

---

## 기술적 세부사항

### 핫링킹 우회 방법

```typescript
const fetchHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://namu.wiki/', // 나무위키 Referer로 설정
  'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};
```

### 이미지 형식 처리

```typescript
// WebP, PNG, JPEG 등 다양한 형식 처리
const contentType = response.headers.get('content-type') || 'image/webp';
const extension = contentType.includes('png') ? 'png' 
  : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' 
  : 'webp';
```

### Storage 경로 구조

```text
candidate-images/
  └── candidates/
      ├── {candidateId}-{timestamp}.webp
      ├── {candidateId}-{timestamp}.png
      └── ...
```

---

## 구현 순서

| 순서 | 작업 | 설명 |
|------|------|------|
| 1 | `proxy-image` Edge Function 생성 | 이미지 다운로드 및 Storage 업로드 기능 |
| 2 | `fetch-candidate-info` 수정 | 검색된 이미지를 바로 Storage에 저장하도록 변경 |
| 3 | 관리자 UI에 마이그레이션 버튼 추가 | 기존 외부 URL 이미지를 일괄 마이그레이션 |
| 4 | Edge Function 배포 | 함수 배포 및 테스트 |

---

## 기대 효과

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| 이미지 로딩 | 핫링킹 차단으로 실패 | 항상 성공 (자체 Storage) |
| 토큰 만료 | 시간이 지나면 깨짐 | 영구적 URL |
| 로딩 속도 | 외부 서버 의존 | Supabase CDN 활용 (빠름) |
| 안정성 | 외부 서버 상태 의존 | 자체 인프라로 안정적 |

---

## 마이그레이션 관리자 UI

기존 후보자들의 이미지를 일괄 마이그레이션하는 버튼 추가:

```text
┌─────────────────────────────────────────────┐
│ 후보자 관리                                  │
├─────────────────────────────────────────────┤
│ [외부 이미지 마이그레이션] 버튼              │
│                                             │
│ 상태: 17명 중 15명 외부 URL 사용 중          │
│ 진행: ████████░░ 80% (12/15 완료)           │
└─────────────────────────────────────────────┘
```
