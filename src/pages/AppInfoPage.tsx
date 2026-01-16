import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Smartphone, MapPin, Vote, MessageSquare, User, Sparkles, ChevronRight, Brain, Heart, BarChart3, Users, Bell, Share2, Newspaper, GitCompare, Filter, Trophy, Shield, Settings, Database } from 'lucide-react';
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
    category: '사용자 인증 및 프로필',
    icon: Shield,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    items: [
      '다중 로그인 방식: 이메일/비밀번호, 소셜 로그인 (카카오, 구글, 애플)',
      '3단계 인증 레벨: social → phone → identity',
      '↳ 소셜 인증: 기본 계정 생성',
      '↳ 휴대폰 인증: 전화번호 확인 (예정)',
      '↳ 본인 인증: 실명 확인 완료 (투표 참여 가능)',
      '프로필 관리: 닉네임, 프로필 사진, 지역 정보',
      '인증 배지: 인증 레벨별 시각적 구분 (아이콘, 색상)',
      '회원 탈퇴: Edge Function을 통한 안전한 계정 삭제',
    ],
  },
  {
    category: '메인 대시보드 (홈)',
    icon: Smartphone,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    items: [
      '지역 헤더: 선택된 지역 표시 및 변경 기능 + 알림 배지',
      '선거 타임라인: 4단계 진행 상태 시각화 (예비후보→당내경선→본선대결→당선확정)',
      '현재 단계 강조: 펄스 애니메이션, 미래 단계 자물쇠 잠금 표시',
      '후보자 카드: 지역구별 후보자 정보 (사진, 이름, 정당, 요약)',
      '↳ 호버 애니메이션: 관리자 설정으로 온/오프 가능',
      '↳ 팔로우 버튼: 관심 후보자 등록',
      '정책 매칭 배너: "머리 vs 가슴" 게임 진입 배너',
      '퀴즈 배너: PQ 테스트 진입 배너',
      '이벤트 타임라인: 정치 이슈 카드 (준비/진행/완료 상태)',
      '퀵 액션: 주요 기능 바로가기',
    ],
  },
  {
    category: '정책 매칭 게임 (4단계 플로우)',
    icon: Brain,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    items: [
      '[Step 1] 블라인드 정책 밸런스 게임: 틴더 스타일 스와이프 UI',
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
      '결과 저장: Supabase에 매칭 결과 영구 저장',
      '히스토리: 마이탭에서 이전 매칭 결과 확인',
    ],
  },
  {
    category: '퀴즈 및 리더보드',
    icon: Trophy,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    items: [
      'PQ (Political Quotient) 테스트: 정치 상식 퀴즈',
      '난이도 시스템: 쉬움/보통/어려움 문제별 차등 점수',
      '스트릭 시스템: 연속 정답 시 보너스 점수',
      '실시간 리더보드: 전체/지역별 순위',
      '↳ 상위 3명 하이라이트 (금/은/동 메달)',
      '↳ 내 순위 표시',
      '퀴즈 통계: 총 퀴즈 수, 정답률, 최장 스트릭',
      '결과 공유: 점수 및 순위 SNS 공유',
    ],
  },
  {
    category: '후보자 비교',
    icon: GitCompare,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    items: [
      '후보자 선택: 최대 4명의 후보자를 선택하여 비교',
      '서울/경기 후보자 통합 목록: 시장/도지사 후보자 선택 UI',
      '기본 정보 비교: 이름, 정당, 나이, 학력 나란히 표시',
      '공약 비교: 카테고리별 테이블 UI로 나란히 비교',
      '↳ 카테고리 바로가기: 카테고리 버튼으로 빠른 이동',
      '↳ 공약 없음 표시: 해당 카테고리에 공약이 없는 경우 표시',
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
      '팔로우 버튼: 관심 후보자 등록/해제 (DB 저장)',
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
      '자동 알림: 팔로우한 후보자 뉴스 등록 시 인앱 알림',
    ],
  },
  {
    category: '알림 시스템',
    icon: Bell,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    items: [
      '인앱 알림: 앱 내 알림 센터 (헤더 벨 아이콘)',
      '↳ 읽음/안읽음 상태 관리',
      '↳ 전체 읽음 처리, 개별/전체 삭제',
      '푸시 알림: 브라우저 Web Push API 연동',
      '↳ Service Worker 기반 백그라운드 알림',
      '↳ VAPID 키 기반 보안 인증',
      '알림 유형별 설정: 뉴스, 후보자 업데이트, 퀴즈, 정책 매치, 시스템',
      '↳ 각 유형별 개별 온/오프 설정',
      '↳ 사용자 설정에 따른 알림 필터링',
      '알림 통계: 유형별 받은 알림 개수 표시',
    ],
  },
  {
    category: '마이 탭',
    icon: User,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    items: [
      '프로필 카드: 사용자 정보, 인증 배지, 로그인/로그아웃',
      '팔로우한 후보자 목록: 관심 후보자 바로가기',
      '정책 매치 히스토리: 이전 매칭 결과 목록',
      'PQ 통계: 퀴즈 점수, 정답률, 스트릭',
      '지역 설정: 현재 지역 확인 및 변경',
      '알림 설정: 푸시 알림 및 유형별 설정 페이지',
      '다크 모드: 테마 전환',
      '도움말(FAQ): 자주 묻는 질문',
      '앱 공유: 카카오톡, 링크 복사 등',
      '회원 탈퇴: 계정 삭제 기능',
    ],
  },
  {
    category: '관리자 시스템',
    icon: Settings,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    items: [
      '관리자 대시보드: 통계 개요 (사용자 수, 인증 현황, 가입 추이)',
      '↳ 가입자 추이 차트: 7일간 일별 가입자 수',
      '↳ 인증 레벨 분포: 파이 차트로 시각화',
      '↳ 최근 활동 로그: 로그인, 퀴즈, 정책 매칭 등',
      '사용자 관리: 회원 목록, 권한 관리, 인증 레벨 변경',
      '콘텐츠 관리: 후보자, 뉴스, 퀴즈, 정책 카드 CRUD',
      '↳ 후보자: 프로필, 공약, 경력 관리',
      '↳ 후보자 이미지 업로드: Supabase Storage 연동',
      '↳ 정책 카드: 질문, 좌/우 라벨, 후보 성향 점수',
      '신고/문의 관리: 사용자 문의 및 신고 처리',
      '시스템 설정: 앱 이름, 로고, 연락처, 소셜 링크, 호버 애니메이션',
      '푸시 알림 발송: 전체/특정 사용자 대상 알림 전송',
      '↳ 알림 유형 선택: 유형에 따른 필터링 적용',
      '↳ 발송 기록: 제목, 내용, 성공/실패 수',
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
];

const techStack = [
  { name: 'React 18', description: 'UI 라이브러리' },
  { name: 'TypeScript', description: '타입 안정성' },
  { name: 'Tailwind CSS', description: '스타일링' },
  { name: 'Framer Motion', description: '애니메이션' },
  { name: 'React Router', description: '라우팅' },
  { name: 'Recharts', description: '차트 시각화' },
  { name: 'Vite', description: '빌드 도구' },
  { name: 'shadcn/ui', description: 'UI 컴포넌트' },
  { name: 'Supabase', description: '백엔드 (DB, Auth, Storage)' },
  { name: 'TanStack Query', description: '서버 상태 관리' },
];

const designPrinciples = [
  '모바일 퍼스트: 448px 기준 앱 컨테이너',
  '반응형 디자인: 모바일/태블릿/데스크톱 대응',
  '터치 친화적: 최소 44px 터치 영역',
  'Safe Area 대응: 노치/홈바 고려',
  '앱 전환 효과: 슬라이드 애니메이션',
  'PWA Ready: Service Worker 기반 푸시 알림',
  '정당 색상 시스템: 후보별 시각적 구분',
  '다크 모드: 시스템 설정 및 수동 전환',
];

const dataModels = [
  { name: 'profiles', description: '사용자 프로필 (인증 레벨, 지역 정보)' },
  { name: 'candidates', description: '후보자 정보 (프로필, 공약, 경력)' },
  { name: 'policy_cards', description: '정책 질문 및 좌/우 라벨' },
  { name: 'policy_candidate_alignments', description: '정책별 후보자 성향 점수' },
  { name: 'policy_match_results', description: '사용자별 정책 매칭 결과' },
  { name: 'user_followed_candidates', description: '팔로우한 후보자 목록' },
  { name: 'news_articles', description: '뉴스 기사 (후보자 연동)' },
  { name: 'quiz_questions', description: '퀴즈 문제 (난이도, 점수)' },
  { name: 'quiz_stats', description: '퀴즈 통계 (점수, 스트릭)' },
  { name: 'notifications', description: '인앱 알림' },
  { name: 'notification_preferences', description: '알림 유형별 설정' },
  { name: 'push_subscriptions', description: '푸시 알림 구독 정보' },
  { name: 'notification_logs', description: '푸시 알림 발송 기록' },
  { name: 'user_roles', description: '사용자 역할 (admin/user)' },
  { name: 'activity_logs', description: '활동 로그' },
  { name: 'app_settings', description: '앱 설정 (이름, 로고 등)' },
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
            onClick={() => navigate(-1)}
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
            정책 매칭 게임을 통해 자신의 성향과 맞는 후보를 찾고, 퀴즈로 정치 상식을 테스트하며, 후보자 정보를 한눈에 비교할 수 있습니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-background/50 rounded-full">v2.0.0</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">Phase 10 완료</span>
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">Full-Stack</span>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-primary">13</p>
            <p className="text-xs text-muted-foreground">주요 기능</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-accent">16</p>
            <p className="text-xs text-muted-foreground">데이터 모델</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-app-sm">
            <p className="text-2xl font-bold text-green-500">10</p>
            <p className="text-xs text-muted-foreground">기술 스택</p>
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
            데이터베이스 테이블
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-app-sm"
          >
            <div className="space-y-3">
              {dataModels.map((model) => (
                <div key={model.name} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{model.name}</code>
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
            개발 히스토리
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-app-sm space-y-3"
          >
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 1-3: 온보딩, 대시보드, 정책 매칭</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 4-5: 후보자 비교, 뉴스피드</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 6: SNS 공유, 다크모드</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 7: 사용자 인증 및 프로필</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 8: 퀴즈 및 리더보드</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 9: 관리자 시스템</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">완료</span>
              <span className="text-sm text-foreground">Phase 10: 알림 시스템 (인앱 + 푸시)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">예정</span>
              <span className="text-sm text-muted-foreground">Phase 11: 실시간 토론 및 투표</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">예정</span>
              <span className="text-sm text-muted-foreground">Phase 12: 네이티브 앱 전환 (PWA)</span>
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
            마지막 업데이트: 2026년 1월 16일
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
