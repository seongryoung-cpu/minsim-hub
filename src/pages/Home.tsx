import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RegionSheet } from '@/components/region/RegionSheet';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ElectionTimeline } from '@/components/dashboard/ElectionTimeline';
import { DashboardSection, ExpandableSlot } from '@/components/dashboard/DashboardSection';
import { CandidateCard } from '@/components/dashboard/CandidateCard';
import { PolicyMatchBanner } from '@/components/dashboard/PolicyMatchBanner';
import { getElectionStatus } from '@/types/election';
import type { Region } from '@/types/region';

interface HomeProps {
  region: Region;
  onRegionChange: (region: Region) => void;
}

export function Home({ region, onRegionChange }: HomeProps) {
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  // 지역별 선거 상태 데이터 로드
  const electionStatus = useMemo(() => {
    return getElectionStatus(region.sido, region.sigungu);
  }, [region.sido, region.sigungu]);

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
      className="min-h-screen bg-background pb-20"
    >
      <DashboardHeader
        region={region}
        dDay={electionStatus.dDay}
        onRegionClick={() => setIsRegionSheetOpen(true)}
      />

      <main className="p-4 space-y-5">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(220 70% 50%), hsl(230 70% 55%))' }}
        >
          <div className="relative z-10">
            <p className="text-white/80 text-sm mb-1">환영합니다</p>
            <h1 className="text-xl font-bold mb-2">
              {region.sigungu} 주민 여러분
            </h1>
            <p className="text-sm text-white/90">
              {electionStatus.electionType} 정보를 확인하세요
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 top-16 w-20 h-20 bg-white/10 rounded-full" />
        </motion.div>

        {/* Election Timeline */}
        <DashboardSection
          title="선거 진행 현황"
          icon="🗳️"
          delay={0.1}
        >
          <ElectionTimeline
            milestones={electionStatus.milestones}
            currentPhase={electionStatus.currentPhase}
          />
        </DashboardSection>

        {/* Policy Match Banner */}
        <PolicyMatchBanner onPress={() => console.log('Policy match game')} />

        {/* Candidates Section */}
        <DashboardSection
          title="후보자 정보"
          icon="👥"
          action={{
            label: '전체 보기',
            onPress: () => console.log('View all candidates'),
          }}
          delay={0.2}
        >
          <div className="space-y-3">
            {electionStatus.candidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                index={index}
                onPress={() => console.log('Candidate:', candidate.id)}
              />
            ))}
          </div>
        </DashboardSection>

        {/* Expandable Future Slots */}
        <DashboardSection
          title="더 알아보기"
          icon="✨"
          delay={0.3}
        >
          <div className="space-y-3">
            <ExpandableSlot
              title="오늘의 담론"
              description="지역 주민들과 함께 토론해보세요"
              icon="💬"
              comingSoon
            />
            <ExpandableSlot
              title="지역 핫 이슈"
              description="우리 동네 실시간 이슈를 확인하세요"
              icon="🔥"
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
