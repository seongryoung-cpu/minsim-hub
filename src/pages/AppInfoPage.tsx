import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Smartphone, MapPin, Vote, MessageSquare, User, Sparkles, ChevronRight } from 'lucide-react';
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
    ],
  },
  {
    category: '메인 대시보드 (홈)',
    icon: Smartphone,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    items: [
      '지역 헤더: 선택된 지역 표시 및 변경 기능',
      '선거 타임라인: 4단계 진행 상태 시각화 (예비후보→당내경선→본선대결→당선확정)',
      '후보자 카드: 지역구별 후보자 정보 (사진, 이름, 정당, 요약)',
      '정책 매칭 배너: "머리 vs 가슴" 게임 진입 배너',
      '이벤트 타임라인: 정치 이슈 카드 (준비/진행/완료 상태)',
      '퀵 액션: 주요 기능 바로가기',
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
      '기획서: 앱 기능 명세 확인',
    ],
  },
];

const techStack = [
  { name: 'React 18', description: 'UI 라이브러리' },
  { name: 'TypeScript', description: '타입 안정성' },
  { name: 'Tailwind CSS', description: '스타일링' },
  { name: 'Framer Motion', description: '애니메이션' },
  { name: 'React Router', description: '라우팅' },
  { name: 'Vite', description: '빌드 도구' },
];

const designPrinciples = [
  '모바일 퍼스트: 448px 기준 앱 컨테이너',
  '반응형 디자인: 모바일/태블릿/데스크톱 대응',
  '터치 친화적: 최소 44px 터치 영역',
  'Safe Area 대응: 노치/홈바 고려',
  '앱 전환 효과: 슬라이드 애니메이션',
  'PWA Ready: 웹앱 설치 지원 준비',
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
            지역 기반 정치 참여 플랫폼으로, 시민들이 쉽고 재미있게 정치에 참여할 수 있도록 설계된 모바일 퍼스트 웹 애플리케이션입니다.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-background/50 rounded-full">v1.0.0</span>
            <span className="px-2 py-1 bg-background/50 rounded-full">MVP Phase 2</span>
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
                  transition={{ delay: index * 0.1 }}
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
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight size={14} className="mt-1 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
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
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl">
              <span className="text-xs font-medium text-orange-500 px-2 py-0.5 bg-orange-500/20 rounded-full">Phase 3</span>
              <span className="text-sm text-foreground">정책 매칭 게임 (틴더 스타일)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Phase 4</span>
              <span className="text-sm text-muted-foreground">사용자 인증 및 프로필</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Phase 5</span>
              <span className="text-sm text-muted-foreground">실시간 토론 및 투표</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Phase 6</span>
              <span className="text-sm text-muted-foreground">PWA 및 네이티브 앱 전환</span>
            </div>
          </motion.div>
        </section>
      </main>
    </motion.div>
  );
}
