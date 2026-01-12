import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Smartphone, MapPin, Vote, MessageSquare, User, Sparkles, ChevronRight, Brain, Heart, BarChart3, Users, Bell, Share2, Newspaper, GitCompare, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    category: '온보딩 및 지역 설정',
    icon: MapPin,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    items: [
      '스플래시 화면: 앱 실행 시 로고 애니메이션 후 온보딩 진입',
      '온보딩 스크린: 앱 소개 및 주요 기능 안내 (3단계)',
      '지역 선택 UI: 시/도 → 시/군/구 순차 선택 (Bottom Sheet)',
      '지역 정보 저장: localStorage를 통한 지역 설정 유지',
      '인천 신설 구역 지원: 제물포구, 영종구, 검단구',
      '광역단체장 매핑: 세부 지역구 선택 시 서울시장/경기도지사 데이터 표시',
    ],
  },
  {
    category: '메인 대시보드 (홈)',
    icon: Smartphone,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    items: [
      '지역 헤더: 선택된 지역 표시 및 변경 기능 + D-Day 배지',
      '선거 타임라인: 4단계 진행 상태 시각화 (예비후보→당내경선→본선대결→당선확정)',
      '현재 단계 강조: 펄스 애니메이션, 미래 단계 자물쇠 잠금 표시',
      '후보자 카드: 지역구별 후보자 정보 (사진, 이름, 정당, 요약) → 클릭 시 상세 페이지',
      '정책 매칭 배너: "머리 vs 가슴" 게임 진입 배너',
      '이벤트 타임라인: 정치 이슈 카드 (준비/진행/완료 상태)',
      '퀵 액션: 주요 기능 바로가기',
      '후보자 비교 바로가기: 후보자 현황에서 비교 페이지 진입',
    ],
  },
  {
    category: '정책 매칭 게임 (4단계 플로우)',
    icon: Brain,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    items: [
      '[Step 1] 블라인드 정책 밸런스 게임: 틴더 스타일 스와이프 UI (15개 질문)',
      '↳ 정책 카테고리: 주거, 교통, 경제, 복지, 환경, 안전, 도시, 행정',
      '↳ 후보별 성향 점수 (1-5점) 기반 매칭 로직',
      '[Step 2] Pre-reveal 화면: 결과 공개 전 "내 원픽 후보" 선택',
      '↳ 후보자 그리드 + "아직 없음(미결정)" 옵션',
      '[Step 3] AI 매칭 결과 및 비교 리포트',
      '↳ 레이더 차트: 카테고리별 나의 성향 vs 후보 성향 비교',
      '↳ 원픽 vs AI 추천 대조 (Heart vs Brain 시각화)',
      '↳ AI 인사이트: 불일치 지점 텍스트 코멘트',
      '[Step 4] 표심 변화 확인: "정책이 더 중요해요" vs "인물과 정당을 믿어요"',
      '↳ 관심 후보 저장 + 알림 받기 유도',
    ],
  },
  {
    category: '후보자 비교',
    icon: GitCompare,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    items: [
      '후보자 선택: 2~3명의 후보자를 선택하여 비교',
      '서울/경기 후보자 통합 목록: 시장/도지사 후보자 선택 UI',
      '기본 정보 비교: 이름, 정당, 나이, 학력 나란히 표시',
      '공약 비교: 카테고리별 공약 접기/펼치기 (Accordion)',
      '경력 비교: 주요 경력 타임라인 나란히 표시',
      '정당 색상 시각화: 후보별 정당 컬러로 구분',
    ],
  },
  {
    category: '후보자 상세 페이지',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    items: [
      '프로필 히어로: 후보 사진, 이름, 정당, 슬로건, 나이, 학력',
      '탭 네비게이션: 프로필 / 공약 / 경력',
      '프로필 탭: 기본 정보 및 소개',
      '공약 탭: 카테고리별 공약 리스트 (제목, 설명)',
      '경력 탭: 타임라인 형식 이력 (기간, 직함, 기관)',
      '공유 버튼: 정당 색상 스타일링',
      '팔로우 버튼: 관심 후보자 등록/해제',
    ],
  },
  {
    category: '뉴스피드',
    icon: Newspaper,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    items: [
      '뉴스 카드: 후보자별 관련 뉴스 표시 (이미지, 제목, 요약)',
      '팔로우 기반 개인화: 팔로우한 후보자 뉴스 우선 표시',
      '후보자별 필터링: 특정 후보자 뉴스만 선택적으로 보기',
      '↳ 다중 필터 지원: 여러 후보자 동시 필터링',
      '↳ 필터 초기화: 한 번에 모든 필터 해제',
      '필터 상태 표시: 현재 적용된 필터 개수 표시',
      '일반 뉴스: 팔로우 안 한 후보자 뉴스도 별도 섹션으로 표시',
    ],
  },
  {
    category: '선거 탭',
    icon: Vote,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    items: [
      '선거 일정 타임라인: 단계별 선거 진행 현황',
      '후보자 목록: 지역구 후보자 상세 정보',
      '정책 매칭 게임 배너: 성향 분석 게임 진입점',
      '후보자 비교 바로가기: 비교 페이지 진입 버튼',
    ],
  },
  {
    category: '토론 탭',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    items: [
      '토론 주제 목록: 현재 진행 중인 토론 표시',
      '의견 투표: 찬/반 투표 기능 (예정)',
      '댓글 시스템: 익명/닉네임 참여 (예정)',
    ],
  },
  {
    category: '마이 탭',
    icon: User,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    items: [
      '프로필 카드: 사용자 정보 및 로그인 유도',
      '지역 설정: 현재 지역 확인 및 변경',
      '알림 설정: 푸시 알림 관리',
      '도움말: 자주 묻는 질문',
      '앱 설정: 테마, 언어 설정',
      '기획서: 앱 기능 명세 확인 (현재 페이지)',
    ],
  },
];

const techStack = [
  { name: 'React 18', description: 'UI 라이브러리' },
  { name: 'TypeScript', description: '타입 안정성' },
  { name: 'Tailwind CSS', description: '스타일링' },
  { name: 'Framer Motion', description: '애니메이션' },
  { name: 'React Router', description: '라우팅' },
  { name: 'Recharts', description: '레이더 차트' },
  { name: 'Vite', description: '빌드 도구' },
  { name: 'shadcn/ui', description: 'UI 컴포넌트' },
];

const designPrinciples = [
  '모바일 퍼스트: 448px 기준 앱 컨테이너',
  '반응형 디자인: 모바일/태블릿/데스크톱 대응',
  '터치 친화적: 최소 44px 터치 영역',
  'Safe Area 대응: 노치/홈바 고려',
  '앱 전환 효과: 슬라이드 애니메이션',
  'PWA Ready: 웹앱 설치 지원 준비',
  '정당 색상 시스템: 후보별 시각적 구분',
];

const dataModels = [
  { name: 'Region', description: '시/도, 시/군/구 지역 정보' },
  { name: 'Candidate', description: '후보자 정보 (프로필, 공약, 경력)' },
  { name: 'PolicyCard', description: '정책 질문 및 후보 성향 매핑' },
  { name: 'MatchResult', description: '정책 매칭 결과 및 카테고리별 점수' },
  { name: 'ElectionStatus', description: '선거 진행 상태 및 마일스톤' },
  { name: 'NewsItem', description: '뉴스 기사 정보 (제목, 요약, 후보자)' },
  { name: 'FollowedCandidate', description: '팔로우한 후보자 목록 (localStorage)' },
];

export function AppInfoPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => navigate('/my')}
            className="touch-target p-2 -ml-2 rounded-xl hover:bg-secondary/50 active:scale-95 transition-all"
          >
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <FileText size={22} className="text-primary" />
          <h1 className="font-semibold text-lg text-foreground">앱 기획서</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 rounded-2xl p-5 border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-foreground">민심잇다</h2>
              <p className="text-sm text-muted-foreground">나의 목소리가 정치가 되는 곳</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            2026년 6월 3일 지방선거를 앞두고, 시민들이 쉽고 재미있게 정치에 참여할 수 있도록 설계된 지역 기반 정치 참여 플랫폼입니다. 
            정책 매칭 게임을 통해 자신의 성향과 맞는 후보를 찾고, 후보자 정보를 한눈에 비교할 수 있습니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-background/50 rounded-full">v1.0.0</span>
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">MVP Phase 3</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">정책 매칭 완료</span>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-primary">15</p>
            <p className="text-xs text-muted-foreground">정책 질문</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-accent">7</p>
            <p className="text-xs text-muted-foreground">예비후보</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-green-500">8</p>
            <p className="text-xs text-muted-foreground">정책 카테고리</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-cyan-500">10</p>
            <p className="text-xs text-muted-foreground">주요 기능</p>
          </div>
        </motion.div>

        {/* Features */}
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            주요 기능
          </h3>
          <div className="space-y-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl shadow-app-sm overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-3 border-b border-border/50">
                    <div className={`w-10 h-10 rounded-xl ${feature.bgColor} flex items-center justify-center`}>
                      <Icon size={20} className={feature.color} />
                    </div>
                    <h4 className="font-medium text-foreground">{feature.category}</h4>
                  </div>
                  <ul className="p-4 space-y-2">
                    {feature.items.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${item.startsWith('↳') ? 'text-muted-foreground pl-4' : 'text-foreground'}`}>
                        {!item.startsWith('↳') && <ChevronRight size={14} className="mt-1 text-primary flex-shrink-0" />}
                        {item.startsWith('↳') && <span className="text-muted-foreground">•</span>}
                        <span>{item.replace('↳ ', '')}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Data Models */}
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-purple-500 rounded-full" />
            데이터 모델
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-app-sm"
          >
            <div className="space-y-3">
              {dataModels.map((model) => (
                <div key={model.name} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                  <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{model.name}</code>
                  <span className="text-sm text-muted-foreground">{model.description}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Tech Stack */}
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-accent rounded-full" />
            기술 스택
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-app-sm"
          >
            <div className="grid grid-cols-2 gap-3">
              {techStack.map((tech) => (
                <div key={tech.name} className="p-3 bg-secondary/50 rounded-xl">
                  <p className="font-medium text-sm text-foreground">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Design Principles */}
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full" />
            디자인 원칙
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-app-sm"
          >
            <ul className="space-y-2">
              {designPrinciples.map((principle, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {principle}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* Roadmap */}
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            향후 계획
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-app-sm space-y-3"
          >
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 3: 정책 매칭 게임 (4단계 플로우)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 4: 후보자 비교 기능</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 5: 뉴스피드 후보자별 필터링</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl">
              <span className="text-xs font-medium text-orange-500 px-2 py-0.5 bg-orange-500/20 rounded-full">Phase 6</span>
              <span className="text-sm text-foreground">SNS 공유 기능 + 다크모드</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Phase 7</span>
              <span className="text-sm text-muted-foreground">사용자 인증 및 프로필</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Phase 8</span>
              <span className="text-sm text-muted-foreground">실시간 토론 및 투표</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Phase 9</span>
              <span className="text-sm text-muted-foreground">PWA 및 네이티브 앱 전환</span>
            </div>
          </motion.div>
        </section>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-muted-foreground">
            마지막 업데이트: 2026년 1월 12일
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
