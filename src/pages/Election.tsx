import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, Calendar, Users, TrendingUp, MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { ElectionTimeline } from '@/components/dashboard/ElectionTimeline';
import { CandidateCard, CandidateCardSkeleton } from '@/components/dashboard/CandidateCard';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { useRegion } from '@/hooks/useRegion';
import { useCandidates } from '@/hooks/useCandidates';
import { 
  calculateDDay, 
  PRELIMINARY_PHASE_MILESTONES,
  getMetropolitanTitle 
} from '@/types/election';

export function Election() {
  const navigate = useNavigate();
  const { region } = useRegion();
  
  // Fetch candidates from DB
  const { data: candidates, isLoading: isCandidatesLoading } = useCandidates(region?.sido);

  const electionStatus = useMemo(() => {
    if (!region) return null;
    
    const dDay = calculateDDay();
    const regionName = region.sido;
    
    return {
      regionId: `${regionName}-metro`,
      regionName,
      electionType: '지방선거' as const,
      electionLevel: 'metropolitan' as const,
      currentPhase: 'preliminary' as const,
      electionDate: '2026-06-03',
      dDay,
      milestones: PRELIMINARY_PHASE_MILESTONES,
      candidates: candidates || [],
      title: getMetropolitanTitle(regionName),
    };
  }, [region, candidates]);

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  if (!electionStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">지역을 선택해주세요</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Vote size={22} className="text-primary" />
            <h1 className="font-semibold text-lg text-foreground">선거</h1>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>{region?.sigungu}</span>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* Election Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-[var(--shadow-md)] text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            2026 {electionStatus.electionType}
          </h2>
          <p className="text-2xl font-bold text-primary mb-4">
            D-{electionStatus.dDay}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-secondary rounded-xl p-3 cursor-pointer active:bg-secondary/70 transition-colors"
            >
              <Users size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">등록 후보</p>
              <p className="font-semibold text-foreground">
                {isCandidatesLoading ? '-' : `${electionStatus.candidates.length}명`}
              </p>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-secondary rounded-xl p-3 cursor-pointer active:bg-secondary/70 transition-colors"
            >
              <TrendingUp size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">여론조사</p>
              <p className="font-semibold text-foreground">준비중</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Election Timeline */}
        <DashboardSection title="선거 진행 단계" icon="📊" delay={0.1}>
          <ElectionTimeline
            milestones={electionStatus.milestones}
            currentPhase={electionStatus.currentPhase}
          />
        </DashboardSection>

        {/* Candidates */}
        <DashboardSection
          title="후보자 현황"
          icon="👥"
          action={{
            label: '비교하기',
            onPress: () => navigate('/compare'),
          }}
          delay={0.2}
        >
          <div className="space-y-3">
            {isCandidatesLoading ? (
              <>
                <CandidateCardSkeleton />
                <CandidateCardSkeleton />
              </>
            ) : electionStatus.candidates.length > 0 ? (
              electionStatus.candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={index}
                  onPress={() => navigate(`/candidate/${candidate.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">등록된 후보자가 없습니다</p>
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Polling Station Finder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-5 shadow-[var(--shadow-md)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Navigation size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">🗳️ 투표소 찾기</h3>
              <p className="text-xs text-muted-foreground">내 투표소 위치를 확인하세요</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <motion.a
              href="https://www.nec.go.kr/site/nec/ex/bbs/View.do?cbIdx=1090&bcIdx=188037"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/70 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">사전투표소 찾기</p>
                  <p className="text-xs text-muted-foreground">2026.05.29 ~ 05.30</p>
                </div>
              </div>
              <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.a>

            <motion.a
              href="https://www.nec.go.kr/site/nec/ex/bbs/View.do?cbIdx=1090&bcIdx=188037"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/70 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Vote size={16} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">선거일 투표소 찾기</p>
                  <p className="text-xs text-muted-foreground">2026.06.03</p>
                </div>
              </div>
              <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.a>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            중앙선거관리위원회 공식 사이트로 연결됩니다
          </p>
        </motion.div>

        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 shadow-[var(--shadow-md)]"
        >
          <h3 className="font-semibold text-foreground mb-3">📋 선거 준비 체크리스트</h3>
          <ul className="space-y-3">
            {['선거인명부 확인', '투표소 위치 확인', '후보자 정책 비교'].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </div>
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </main>
    </motion.div>
  );
}
