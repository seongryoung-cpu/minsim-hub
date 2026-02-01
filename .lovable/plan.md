
# 앱 완성도 향상 종합 계획

## 1. 미완성 기능 정리 ✅ 완료

### 1.1 토론장(Discussion) 메뉴 숨김 ✅
- BottomTabBar에서 토론 탭 제거
- DesktopNavbar에서 토론 메뉴 제거
- 홈화면 quickActions에서 토론장 항목 제거
- Index.tsx 라우터에서 /discussion 경로 제거

### 1.2 "Coming Soon" 표시 제거 ✅
- "더 알아보기" 섹션에서 comingSoon 표시된 항목 제거

---

## 2. UI/UX 일관성 개선 ✅ 완료

### 2.1 빈 상태(Empty State) UI 통일 ✅
- `EmptyState` 공통 컴포넌트 생성 (`src/components/ui/empty-state.tsx`)
- 뉴스 피드, 후보자 상세 페이지에 적용

### 2.2 로딩/에러 상태 통일 ✅
- `LoadingSpinner`, `PageLoading`, `CardSkeleton` 공통 컴포넌트 생성
- `ErrorState` 공통 컴포넌트 생성 (재시도 버튼 포함)

---

## 3. 기능 완성도 향상 ✅ 완료

### 3.1 공유 기능 강화 ✅
- Web Share API 연동 구현
- 클립보드 복사 폴백 구현
- 공유 성공/실패 토스트 메시지 추가

### 3.2 뉴스 피드 필터 개선 ✅
- 하드코딩된 후보자 목록 → DB에서 가져온 후보자 목록으로 변경
- 에러 상태 처리 및 재시도 버튼 추가
- 빈 상태 UI 통일

---

## 생성된 공통 컴포넌트

| 파일 | 설명 |
|------|------|
| `src/components/ui/empty-state.tsx` | 빈 상태 UI 컴포넌트 |
| `src/components/ui/error-state.tsx` | 에러 상태 UI 컴포넌트 (재시도 버튼 포함) |
| `src/components/ui/loading-state.tsx` | 로딩 관련 컴포넌트들 |

---

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `BottomTabBar.tsx` | 토론 탭 제거 |
| `DesktopNavbar.tsx` | 토론 메뉴 제거 |
| `Home.tsx` | 토론장 퀵액션 제거, Coming Soon 항목 제거 |
| `Index.tsx` | /discussion 라우트 제거 |
| `CandidateDetail.tsx` | 공유 기능 구현, 공통 컴포넌트 적용 |
| `NewsFeed.tsx` | DB 기반 필터, 공통 컴포넌트 적용 |

---

## 향후 추가 개선 가능 항목

- PWA 오프라인 경험 개선
- 이미지 최적화 (lazy loading)
- 선거일 DB 관리 중앙화
- React Query staleTime/cacheTime 최적화
