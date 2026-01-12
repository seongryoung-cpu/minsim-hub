import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Check, X, Scale, FileText, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { SEOUL_MAYOR_CANDIDATES, GYEONGGI_GOVERNOR_CANDIDATES, PARTY_COLORS } from '@/types/election';
import type { Candidate, CandidatePledge, CandidateCareer } from '@/types/election';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Extended candidate data
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
    ],
  },
};

const ALL_CANDIDATES = [...SEOUL_MAYOR_CANDIDATES, ...GYEONGGI_GOVERNOR_CANDIDATES].map(c => ({
  ...c,
  ...CANDIDATE_DETAILS[c.id],
}));

// Group candidates by region
const SEOUL_CANDIDATES = ALL_CANDIDATES.filter(c => c.id.startsWith('seoul'));
const GYEONGGI_CANDIDATES = ALL_CANDIDATES.filter(c => c.id.startsWith('gyeonggi'));

export function CandidateCompare() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pledges' | 'careers'>('pledges');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const selectedCandidates = useMemo(() => {
    return selectedIds.map(id => ALL_CANDIDATES.find(c => c.id === id)).filter(Boolean) as (typeof ALL_CANDIDATES[0])[];
  }, [selectedIds]);

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Get all unique pledge categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    selectedCandidates.forEach(c => {
      c.pledges?.forEach(p => categories.add(p.category));
    });
    return Array.from(categories);
  }, [selectedCandidates]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24 lg:pb-8"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              <h1 className="font-semibold text-lg">후보자 비교</h1>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              선택 초기화
            </button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Selection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">비교할 후보자 선택</h2>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length}/3명 선택됨
            </span>
          </div>

          {/* Seoul Candidates */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">서울시장 예비후보</p>
            <div className="flex flex-wrap gap-2">
              {SEOUL_CANDIDATES.map(candidate => {
                const isSelected = selectedIds.includes(candidate.id);
                const isDisabled = !isSelected && selectedIds.length >= 3;
                return (
                  <motion.button
                    key={candidate.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !isDisabled && toggleCandidate(candidate.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-offset-background'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-secondary'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${candidate.partyColor}15` : undefined,
                      borderColor: isSelected ? candidate.partyColor : undefined,
                      ['--tw-ring-color' as string]: candidate.partyColor,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: `${candidate.partyColor}20`,
                        color: candidate.partyColor,
                      }}
                    >
                      {candidate.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{candidate.name}</p>
                      <p className="text-[10px] text-muted-foreground">{candidate.party}</p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-primary ml-1" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Gyeonggi Candidates */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">경기도지사 예비후보</p>
            <div className="flex flex-wrap gap-2">
              {GYEONGGI_CANDIDATES.map(candidate => {
                const isSelected = selectedIds.includes(candidate.id);
                const isDisabled = !isSelected && selectedIds.length >= 3;
                return (
                  <motion.button
                    key={candidate.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !isDisabled && toggleCandidate(candidate.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-offset-background'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-secondary'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${candidate.partyColor}15` : undefined,
                      borderColor: isSelected ? candidate.partyColor : undefined,
                      ['--tw-ring-color' as string]: candidate.partyColor,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: `${candidate.partyColor}20`,
                        color: candidate.partyColor,
                      }}
                    >
                      {candidate.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{candidate.name}</p>
                      <p className="text-[10px] text-muted-foreground">{candidate.party}</p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-primary ml-1" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Comparison Section */}
        <AnimatePresence mode="wait">
          {selectedCandidates.length >= 2 ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Candidate Headers - Sticky */}
              <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-md)] sticky top-16 z-10">
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                  {selectedCandidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div
                        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${candidate.partyColor}40, ${candidate.partyColor}20)`,
                          border: `2px solid ${candidate.partyColor}`,
                        }}
                      >
                        <User size={24} style={{ color: candidate.partyColor }} />
                      </div>
                      <p className="font-semibold text-sm">{candidate.name}</p>
                      <p
                        className="text-[10px] px-2 py-0.5 rounded-full inline-block mt-1"
                        style={{
                          backgroundColor: `${candidate.partyColor}15`,
                          color: candidate.partyColor,
                        }}
                      >
                        {candidate.party}
                      </p>
                      <button
                        onClick={() => toggleCandidate(candidate.id)}
                        className="block mx-auto mt-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <X size={14} className="inline" /> 제외
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Basic Info Comparison */}
              <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  기본 정보
                </h3>
                <div className="space-y-3">
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                    {selectedCandidates.map(c => (
                      <div key={c.id} className="text-center p-2 bg-secondary/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground mb-1">나이</p>
                        <p className="font-semibold">{c.age}세</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                    {selectedCandidates.map(c => (
                      <div key={c.id} className="text-center p-2 bg-secondary/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground mb-1">학력</p>
                        <p className="text-xs font-medium line-clamp-2">{c.education?.split(',')[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs for Pledges/Careers */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pledges' | 'careers')}>
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="pledges" className="flex items-center gap-2">
                    <FileText size={16} />
                    공약 비교
                  </TabsTrigger>
                  <TabsTrigger value="careers" className="flex items-center gap-2">
                    <Briefcase size={16} />
                    경력 비교
                  </TabsTrigger>
                </TabsList>

                {/* Pledges Comparison */}
                <TabsContent value="pledges" className="space-y-3">
                  {allCategories.map(category => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-card rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden"
                    >
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                      >
                        <span className="font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {category}
                        </span>
                        {expandedCategories.includes(category) ? (
                          <ChevronUp size={18} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={18} className="text-muted-foreground" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedCategories.includes(category) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border"
                          >
                            <div 
                              className="grid gap-3 p-4"
                              style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}
                            >
                              {selectedCandidates.map(candidate => {
                                const pledge = candidate.pledges?.find(p => p.category === category);
                                return (
                                  <div 
                                    key={candidate.id}
                                    className="p-3 rounded-xl"
                                    style={{ backgroundColor: `${candidate.partyColor}08` }}
                                  >
                                    {pledge ? (
                                      <>
                                        <p className="font-medium text-sm mb-1">{pledge.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-3">
                                          {pledge.description}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center py-4">
                                        관련 공약 없음
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}

                  {allCategories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>공약 정보가 없습니다</p>
                    </div>
                  )}
                </TabsContent>

                {/* Careers Comparison */}
                <TabsContent value="careers" className="space-y-3">
                  <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]">
                    <div 
                      className="grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}
                    >
                      {selectedCandidates.map(candidate => (
                        <div key={candidate.id}>
                          <div 
                            className="text-center py-2 rounded-xl mb-3"
                            style={{ backgroundColor: `${candidate.partyColor}15` }}
                          >
                            <p className="text-sm font-semibold" style={{ color: candidate.partyColor }}>
                              {candidate.name}
                            </p>
                          </div>
                          <div className="space-y-3">
                            {candidate.careers?.map((career, idx) => (
                              <motion.div
                                key={career.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative pl-4 border-l-2"
                                style={{ borderColor: candidate.partyColor }}
                              >
                                <p className="text-[10px] text-muted-foreground">{career.period}</p>
                                <p className="text-sm font-medium">{career.title}</p>
                                <p className="text-xs text-muted-foreground">{career.organization}</p>
                              </motion.div>
                            ))}
                            {(!candidate.careers || candidate.careers.length === 0) && (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                경력 정보 없음
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-md)]"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale size={32} className="text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">후보자를 선택하세요</h3>
              <p className="text-muted-foreground text-sm">
                비교하고 싶은 후보자를<br />
                2~3명 선택해주세요
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
