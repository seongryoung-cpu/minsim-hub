
# 관리자 페이지 뉴스 관리 기능 구현 계획

## 목표
관리자 페이지에서 뉴스 기사를 **추가/수정/삭제**할 수 있는 완전한 CRUD 기능을 구현합니다.

---

## 1. 현재 상태

| 항목 | 상태 |
|------|------|
| 뉴스 목록 조회 | 구현됨 |
| 뉴스 삭제 | 구현됨 |
| 뉴스 추가 | 미구현 |
| 뉴스 수정 | 미구현 |

---

## 2. 구현할 기능

### 2.1 뉴스 추가/수정 다이얼로그 (`NewsArticleDialog`)
- **필드 구성:**
  - 제목 (title) - 필수
  - 요약 (summary) - 필수
  - 출처 (source) - 필수
  - 카테고리 (category) - 선택: policy, campaign, interview, general
  - 후보자 연결 (candidate_id) - 선택 (드롭다운)
  - 발행일 (published_at) - 날짜 선택
  - 기사 URL (article_url) - 선택
  - 이미지 URL (image_url) - 선택

### 2.2 NewsManager 컴포넌트 확장
- "뉴스 추가" 버튼 추가
- 각 뉴스 항목에 "수정" 버튼 추가
- 후보자 이름 표시 개선

---

## 3. 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/admin/AdminContent.tsx` | NewsManager 컴포넌트에 추가/수정 기능 구현 |

---

## 4. 기술적 세부 사항

### 4.1 뉴스 추가/수정 Mutation
```text
- useMutation으로 INSERT/UPDATE 구현
- queryClient.invalidateQueries로 캐시 갱신
- toast로 성공/실패 알림
```

### 4.2 후보자 선택 드롭다운
```text
- useAllCandidatesAdmin 훅 재사용
- slug 대신 실제 candidate_id (UUID) 사용
- 후보자 없음 옵션 제공
```

### 4.3 카테고리 선택
```text
- 4가지 카테고리: 정책(policy), 캠페인(campaign), 인터뷰(interview), 일반(general)
- Select 컴포넌트 사용
```

### 4.4 날짜 선택
```text
- Shadcn Calendar/Popover 컴포넌트 사용
- ISO 형식으로 저장
```

---

## 5. UI/UX 고려사항

- 기존 후보자 관리 UI 패턴 유지
- 모바일 친화적 다이얼로그 레이아웃
- 입력값 유효성 검사 (제목, 요약, 출처 필수)
- 저장 중 로딩 상태 표시
