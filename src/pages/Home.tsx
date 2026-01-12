import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RegionSheet } from '@/components/region/RegionSheet';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ElectionTimeline } from '@/components/dashboard/ElectionTimeline';
import { DashboardSection, ExpandableSlot } from '@/components/dashboard/DashboardSection';
import { CandidateCard } from '@/components/dashboard/CandidateCard';
import { PolicyMatchBanner } from '@/components/dashboard/PolicyMatchBanner';
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
        dDay={electionStatus.dDay}
        onRegionClick={() => setIsRegionSheetOpen(true)}
      />

      <main className="p-4 sm:p-5 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(220 70% 50%), hsl(230 70% 55%))' }}
        >
          <div className="relative z-10 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">환영합니다</p>
              <h1 className="text-xl lg:text-2xl font-bold mb-2">
                {region.sigungu} 주민 여러분
              </h1>
              <p className="text-sm lg:text-base text-white/90">
                2026 {metropolitanTitle} 선거 정보를 확인하세요
              </p>
            </div>
            <div className="hidden lg:block">
              <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors">
                자세히 알아보기 →
              </button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 lg:w-48 lg:h-48 bg-white/10 rounded-full" />
          <div className="absolute -right-4 top-16 w-20 h-20 lg:w-32 lg:h-32 bg-white/10 rounded-full" />
        </motion.div>

        {/* Election Timeline */}
        <DashboardSection
          title={`${metropolitanTitle} 선거 진행 현황`}
          icon="🗳️"
          delay={0.1}
        >
          <ElectionTimeline
            milestones={electionStatus.milestones}
            currentPhase={electionStatus.currentPhase}
          />
        </DashboardSection>

        {/* Desktop: Two column layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-5 lg:space-y-0">
          {/* Policy Match Banner */}
          <PolicyMatchBanner onPress={() => navigate('/policy-match')} />

          {/* Candidates Section */}
          <DashboardSection
            title={`${metropolitanTitle} 예비후보`}
            icon="👥"
            action={{
              label: '비교하기',
              onPress: () => navigate('/compare'),
            }}
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
