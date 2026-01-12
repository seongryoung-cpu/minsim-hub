import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RegionSheet } from '@/components/region/RegionSheet';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ElectionTimeline } from '@/components/dashboard/ElectionTimeline';
import { DashboardSection, ExpandableSlot } from '@/components/dashboard/DashboardSection';
import { CandidateCard } from '@/components/dashboard/CandidateCard';
import { PolicyMatchBanner } from '@/components/dashboard/PolicyMatchBanner';
import { QuizBanner } from '@/components/dashboard/QuizBanner';
import { getElectionStatus, getMetropolitanTitle } from '@/types/election';
import type { Region } from '@/types/region';

interface HomeProps {
  region: Region;
  onRegionChange: (region: Region) => void;
}

export function Home({ region, onRegionChange }: HomeProps) {
  const navigate = useNavigate();
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  // 광역단체 선거 상태 데이터 로드 (sido 기준)
  const electionStatus = useMemo(() => {
    return getElectionStatus(region.sido, region.sigungu);
  }, [region.sido, region.sigungu]);

  // 광역단체장 타이틀
  const metropolitanTitle = useMemo(() => {
    return getMetropolitanTitle(region.sido);
  }, [region.sido]);

  // 후보자 공정 표시를 위해 셔플 (매 세션마다 랜덤)
  const shuffledCandidates = useMemo(() => {
    const candidates = [...electionStatus.candidates];
    // Fisher-Yates 셔플 알고리즘
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates;
  }, [electionStatus.candidates]);

  // 표시할 후보자 수
  const displayedCandidates = showAllCandidates 
    ? shuffledCandidates 
    : shuffledCandidates.slice(0, 3);
  
  const remainingCount = shuffledCandidates.length - 3;

  const handleViewAllCandidates = useCallback(() => {
    setShowAllCandidates(true);
  }, []);

  const handleNavigateToElection = useCallback(() => {
    navigate('/election');
  }, [navigate]);

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
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="min-h-screen bg-background pb-20 lg:pb-0"
    >
      <DashboardHeader
        region={region}
        onRegionClick={() => setIsRegionSheetOpen(true)}
      />

      <main className="p-4 sm:p-5 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
        {/* Election Status with D-Day + Timeline */}
        <DashboardSection
          title={`${metropolitanTitle} 선거 진행 현황`}
          icon="🗳️"
          badge={`D-${electionStatus.dDay}`}
          delay={0.1}
        >
          <ElectionTimeline
            milestones={electionStatus.milestones}
            currentPhase={electionStatus.currentPhase}
          />
        </DashboardSection>

        {/* Quiz Banner */}
        <QuizBanner />

        {/* Desktop: Two column layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-5 lg:space-y-0">
          {/* Policy Match Banner */}
          <PolicyMatchBanner onPress={() => navigate('/policy-match')} />

          {/* Candidates Section */}
          <DashboardSection
            title={`${metropolitanTitle} 예비후보`}
            icon="👥"
            delay={0.2}
          >
            <div className="space-y-3">
              {displayedCandidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={index}
                  onPress={() => navigate(`/candidate/${candidate.id}`)}
                />
              ))}
              {!showAllCandidates && remainingCount > 0 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleViewAllCandidates}
                  className="w-full py-3 text-sm text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors border border-dashed border-primary/30"
                >
                  +{remainingCount}명 더 보기
                </motion.button>
              )}
              {showAllCandidates && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-muted-foreground py-2"
                >
                  ※ 후보자 순서는 공정성을 위해 무작위로 표시됩니다
                </motion.p>
              )}
              
              {/* Compare Button - More Prominent */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/compare')}
                className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <span className="text-lg">⚖️</span>
                <span>후보자 공약 비교하기</span>
              </motion.button>
            </div>
          </DashboardSection>
        </div>

        {/* Expandable Future Slots */}
        <DashboardSection
          title="더 알아보기"
          icon="✨"
          delay={0.3}
        >
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-3 lg:space-y-0">
            <ExpandableSlot
              title="뉴스 피드"
              description="관심 후보자의 최신 뉴스를 확인하세요"
              icon="📰"
              onPress={() => navigate('/news')}
            />
            <ExpandableSlot
              title="오늘의 담론"
              description="지역 주민들과 함께 토론해보세요"
              icon="💬"
              comingSoon
            />
          </div>
        </DashboardSection>
      </main>

      <RegionSheet
        isOpen={isRegionSheetOpen}
        onClose={() => setIsRegionSheetOpen(false)}
        onSelect={onRegionChange}
        currentRegion={region}
      />
    </motion.div>
  );
}
