import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Share2, Heart, Briefcase, FileText, GraduationCap, Calendar, Building2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOUL_MAYOR_CANDIDATES, GYEONGGI_GOVERNOR_CANDIDATES, PARTY_COLORS } from '@/types/election';
import type { Candidate } from '@/types/election';

// 확장된 후보자 데이터 (MVP용 상세 정보 포함)
const CANDIDATE_DETAILS: Record<string, Partial<Candidate>> = {
  'seoul-1': {
    age: 64,
    education: '서울대학교 법학과 졸업',
    slogan: '시민과 함께 만드는 새로운 서울',
    pledges: [
      { id: 'p1', title: '청년 주거 안정화', description: '청년 전용 공공임대 10만 호 공급 및 전세사기 근절 대책 강화', category: '주거' },
      { id: 'p2', title: '디지털 경제 허브', description: 'AI·블록체인 특구 조성 및 글로벌 스타트업 육성', category: '경제' },
      { id: 'p3', title: '탄소중립 도시', description: '2030년까지 탄소배출 50% 감축, 친환경 교통체계 구축', category: '환경' },
      { id: 'p4', title: '돌봄 공공성 강화', description: '국공립 어린이집 확대 및 아이돌봄 서비스 24시간 운영', category: '복지' },
    ],
    careers: [
      { id: 'c1', period: '2021-2022', title: '중소벤처기업부 장관', organization: '대한민국 정부' },
      { id: 'c2', period: '2004-2020', title: '국회의원 (4선)', organization: '더불어민주당' },
      { id: 'c3', period: '1998-2004', title: '변호사', organization: '법무법인 광장' },
      { id: 'c4', period: '1995-1998', title: 'MBC 기자', organization: 'MBC' },
    ],
  },
  'seoul-2': {
    age: 62,
    education: '서울대학교 법학과 졸업, 미국 조지워싱턴대 법학석사',
    slogan: '실력으로 증명하는 서울',
    pledges: [
      { id: 'p1', title: '지하철 노후시설 현대화', description: '1-4호선 전동차 전면 교체 및 냉난방 시스템 개선', category: '교통' },
      { id: 'p2', title: '재개발·재건축 규제 완화', description: '안전진단 간소화 및 인허가 기간 단축으로 주거환경 개선', category: '주거' },
      { id: 'p3', title: '소상공인 지원 강화', description: '전통시장 현대화 및 온라인 판로 지원', category: '경제' },
      { id: 'p4', title: '치안 강화', description: 'AI CCTV 확대 및 심야 안전귀가 서비스 전 지역 확대', category: '안전' },
    ],
    careers: [
      { id: 'c1', period: '2023-2024', title: '국민의힘 당대표', organization: '국민의힘' },
      { id: 'c2', period: '2004-2024', title: '국회의원 (5선)', organization: '국민의힘' },
      { id: 'c3', period: '2000-2004', title: '울산광역시 부시장', organization: '울산광역시' },
      { id: 'c4', period: '1990-2000', title: '검사', organization: '대검찰청' },
    ],
  },
  'seoul-3': {
    age: 52,
    education: '연세대학교 정치외교학과 졸업, 미국 하버드대 행정학석사',
    slogan: '혁신의 바람, 서울을 바꾸다',
    pledges: [
      { id: 'p1', title: '기본소득 시범사업', description: '청년·시니어 대상 기본소득 월 30만원 시범 지급', category: '복지' },
      { id: 'p2', title: '디지털 민주주의', description: '시민참여 플랫폼 구축 및 온라인 주민투표 활성화', category: '행정' },
      { id: 'p3', title: '공유경제 활성화', description: '공유 오피스·주차장 확대 및 모빌리티 혁신', category: '경제' },
    ],
    careers: [
      { id: 'c1', period: '2020-2024', title: '시대전환 대표', organization: '시대전환' },
      { id: 'c2', period: '2020-2024', title: '국회의원', organization: '시대전환' },
      { id: 'c3', period: '2015-2020', title: '시민단체 대표', organization: '정치개혁시민연대' },
    ],
  },
  'seoul-4': {
    age: 61,
    education: 'MIT 건축학 석사, 서울대학교 건축학과 졸업',
    slogan: '사람을 위한 도시, 서울',
    pledges: [
      { id: 'p1', title: '보행친화 도시', description: '차 없는 거리 확대 및 녹지공간 30% 증가', category: '도시' },
      { id: 'p2', title: '공공건축 혁신', description: '시민 참여형 공공건축 설계 및 커뮤니티 공간 확대', category: '건축' },
      { id: 'p3', title: '젠트리피케이션 방지', description: '상가 임대료 상한제 및 지역상권 보호 정책', category: '경제' },
    ],
    careers: [
      { id: 'c1', period: '2010-현재', title: '도시건축 전문가', organization: '프리랜서' },
      { id: 'c2', period: '2004-2008', title: '국회의원', organization: '열린우리당' },
      { id: 'c3', period: '1998-2004', title: '건축사', organization: '김진애 건축사무소' },
    ],
  },
  'gyeonggi-1': {
    age: 62,
    education: '서울대학교 경제학과 졸업, 미국 펜실베니아대 경제학 박사',
    slogan: '경기도민과 함께 성장하는 경기도',
    pledges: [
      { id: 'p1', title: 'GTX 조기 완공', description: 'GTX-A/B/C 노선 조기 개통 및 광역교통망 확충', category: '교통' },
      { id: 'p2', title: '반도체 클러스터 확대', description: '용인·평택 반도체 벨트 조성 및 일자리 50만 개 창출', category: '경제' },
      { id: 'p3', title: '경기북부 균형발전', description: '경기북부특별자치도 추진 및 북부 인프라 투자 확대', category: '균형발전' },
    ],
    careers: [
      { id: 'c1', period: '2022-현재', title: '경기도지사', organization: '경기도' },
      { id: 'c2', period: '2017-2018', title: '경제부총리 겸 기획재정부 장관', organization: '대한민국 정부' },
      { id: 'c3', period: '2015-2017', title: '차관', organization: '기획재정부' },
    ],
  },
  'gyeonggi-2': {
    age: 52,
    education: '이화여자대학교 정치외교학과 졸업',
    slogan: '변화의 시작, 새로운 경기도',
    pledges: [
      { id: 'p1', title: '경기도 교통혁명', description: '광역버스 노선 확충 및 환승할인 확대', category: '교통' },
      { id: 'p2', title: '청년 일자리 10만', description: '도내 기업 채용지원금 및 청년창업 지원 확대', category: '경제' },
      { id: 'p3', title: '안심 돌봄 체계', description: '아이돌봄 시간 연장 및 어르신 돌봄 로봇 보급', category: '복지' },
    ],
    careers: [
      { id: 'c1', period: '2024-현재', title: '국회의원', organization: '국민의힘' },
      { id: 'c2', period: '2022-2024', title: '대통령실 홍보수석', organization: '대통령실' },
      { id: 'c3', period: '2020-2022', title: '국회의원', organization: '국민의힘' },
    ],
  },
  'gyeonggi-3': {
    age: 56,
    education: '고려대학교 법학과 졸업',
    slogan: '상식이 통하는 경기도',
    pledges: [
      { id: 'p1', title: '행정 효율화', description: '불필요한 규제 철폐 및 인허가 절차 간소화', category: '행정' },
      { id: 'p2', title: '주민 직접 참여', description: '주요 정책 주민투표 의무화', category: '민주주의' },
      { id: 'p3', title: '범죄와의 전쟁', description: '조폭 척결 및 불법 도박 근절', category: '안전' },
    ],
    careers: [
      { id: 'c1', period: '2024-현재', title: '개혁신당 공동대표', organization: '개혁신당' },
      { id: 'c2', period: '2008-2012', title: '국회의원', organization: '한나라당' },
      { id: 'c3', period: '1995-현재', title: '변호사', organization: '법무법인' },
    ],
  },
};

// 모든 후보자 데이터 병합
const ALL_CANDIDATES = [...SEOUL_MAYOR_CANDIDATES, ...GYEONGGI_GOVERNOR_CANDIDATES].map(c => ({
  ...c,
  ...CANDIDATE_DETAILS[c.id],
}));

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLiked, setIsLiked] = useState(false);

  const candidate = useMemo(() => {
    return ALL_CANDIDATES.find(c => c.id === id);
  }, [id]);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">후보자를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary font-medium"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-24 lg:pb-8"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold">후보자 정보</h1>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <Heart
              size={20}
              className={isLiked ? 'fill-red-500 text-red-500' : ''}
            />
          </button>
        </div>
      </header>

      {/* Profile Hero */}
      <section className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-6 shadow-[var(--shadow-md)]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${candidate.partyColor}40, ${candidate.partyColor}20)`,
                border: `3px solid ${candidate.partyColor}`,
              }}
            >
              {candidate.image ? (
                <img
                  src={candidate.image}
                  alt={candidate.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={48} style={{ color: candidate.partyColor }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${candidate.partyColor}20`,
                    color: candidate.partyColor,
                  }}
                >
                  {candidate.party}
                </span>
              </div>
              <p className="text-muted-foreground mb-2">{candidate.position}</p>
              {candidate.slogan && (
                <p className="text-primary font-medium italic">"{candidate.slogan}"</p>
              )}

              {/* Quick Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                {candidate.age && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {candidate.age}세
                  </span>
                )}
                {candidate.education && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} />
                    {candidate.education.split(',')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Tabs Section */}
      <section className="px-4 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              <span className="hidden sm:inline">프로필</span>
            </TabsTrigger>
            <TabsTrigger value="pledges" className="flex items-center gap-2">
              <FileText size={16} />
              <span className="hidden sm:inline">공약</span>
            </TabsTrigger>
            <TabsTrigger value="career" className="flex items-center gap-2">
              <Briefcase size={16} />
              <span className="hidden sm:inline">경력</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    기본 정보
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">이름</span>
                      <span className="font-medium">{candidate.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">나이</span>
                      <span className="font-medium">{candidate.age}세</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">소속</span>
                      <span className="font-medium" style={{ color: candidate.partyColor }}>{candidate.party}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">학력</span>
                      <span className="font-medium text-right max-w-[60%]">{candidate.education}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]">
                  <h3 className="font-semibold mb-3">한 줄 소개</h3>
                  <p className="text-secondary-foreground">{candidate.summary}</p>
                </div>
              </motion.div>
            </TabsContent>

            {/* Pledges Tab */}
            <TabsContent value="pledges" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {candidate.pledges && candidate.pledges.length > 0 ? (
                  candidate.pledges.map((pledge, index) => (
                    <motion.div
                      key={pledge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{
                            backgroundColor: `${candidate.partyColor}20`,
                            color: candidate.partyColor,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{pledge.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {pledge.category}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-foreground">
                            {pledge.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>등록된 공약이 없습니다</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Career Tab */}
            <TabsContent value="career" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]"
              >
                {candidate.careers && candidate.careers.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                    <div className="space-y-6">
                      {candidate.careers.map((career, index) => (
                        <motion.div
                          key={career.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-10"
                        >
                          {/* Timeline dot */}
                          <div
                            className="absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: index === 0 ? candidate.partyColor : 'hsl(var(--secondary))',
                            }}
                          >
                            <Building2 size={12} className={index === 0 ? 'text-white' : 'text-muted-foreground'} />
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{career.period}</p>
                            <h4 className="font-semibold text-sm">{career.title}</h4>
                            <p className="text-sm text-secondary-foreground">{career.organization}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                    <p>등록된 경력이 없습니다</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </section>

      {/* Share Button */}
      <section className="fixed bottom-20 lg:bottom-8 left-0 right-0 px-4 lg:px-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white shadow-lg"
          style={{ backgroundColor: candidate.partyColor }}
        >
          <Share2 size={18} />
          후보자 정보 공유하기
        </motion.button>
      </section>
    </motion.div>
  );
}
