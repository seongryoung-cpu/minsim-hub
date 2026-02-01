import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Scale, Newspaper, Heart } from 'lucide-react';
import { RegionSheet } from '@/components/region/RegionSheet';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ElectionTimeline } from '@/components/dashboard/ElectionTimeline';
import { DashboardSection, ExpandableSlot } from '@/components/dashboard/DashboardSection';
import { CandidateCard, CandidateCardSkeleton } from '@/components/dashboard/CandidateCard';
import { PolicyMatchBanner } from '@/components/dashboard/PolicyMatchBanner';
import { MbtiBanner } from '@/components/dashboard/MbtiBanner';
import { QuizBanner } from '@/components/dashboard/QuizBanner';
import { NotificationSheet } from '@/components/notification/NotificationSheet';
import { getElectionStatus, getMetropolitanTitle } from '@/types/election';
import { useCandidates } from '@/hooks/useCandidates';
import type { Region } from '@/types/region';

interface HomeProps {
  region: Region;
  onRegionChange: (region: Region) => void;
}

export function Home({ region, onRegionChange }: HomeProps) {
  const navigate = useNavigate();
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  // DB에서 후보자 데이터 로드
  const { data: dbCandidates, isLoading: candidatesLoading } = useCandidates(region.sido);

  // 광역단체 선거 상태 데이터 로드 (타임라인용)
  const electionStatus = useMemo(() => {
    return getElectionStatus(region.sido, region.sigungu);
  }, [region.sido, region.sigungu]);

  // 광역단체장 타이틀
  const metropolitanTitle = useMemo(() => {
    return getMetropolitanTitle(region.sido);
  }, [region.sido]);

  // DB 후보자를 셔플 (매 세션마다 랜덤)
  const shuffledCandidates = useMemo(() => {
    const candidates = dbCandidates ? [...dbCandidates] : [];
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates;
  }, [dbCandidates]);

  // 표시할 후보자 수
  const displayedCandidates = showAllCandidates 
    ? shuffledCandidates 
    : shuffledCandidates.slice(0, 4);
  
  const remainingCount = shuffledCandidates.length - 4;

  const handleViewAllCandidates = useCallback(() => {
    setShowAllCandidates(true);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // Quick action cards for desktop
  const quickActions = [
    {
      id: 'compare',
      icon: Scale,
      title: '후보자 비교',
      description: '공약과 정책을 나란히 비교해보세요',
      color: 'from-primary to-primary/70',
      path: '/compare',
    },
    {
      id: 'news',
      icon: Newspaper,
      title: '뉴스 피드',
      description: '후보자 관련 최신 소식',
      color: 'from-accent to-accent/70',
      path: '/news',
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="min-h-screen bg-background pb-20 lg:pb-8"
    >
      {/* Mobile Header - Hidden on Desktop */}
      <div className="lg:hidden">
        <DashboardHeader
          region={region}
          onRegionClick={() => setIsRegionSheetOpen(true)}
          onNotificationClick={() => setIsNotificationOpen(true)}
        />
      </div>

      <main className="p-4 sm:p-5 lg:px-8 lg:py-6">
        {/* Desktop Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {region.sigungu} 선거 정보
              </h1>
              <p className="text-muted-foreground mt-1">
                {metropolitanTitle} 예비후보 현황과 정책을 확인하세요
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsRegionSheetOpen(true)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-medium transition-colors"
            >
              지역 변경
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-5">
          {/* Election Timeline */}
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

          {/* Policy Match Banner */}
          <PolicyMatchBanner onPress={() => navigate('/policy-match')} />

          {/* MBTI Banner */}
          <MbtiBanner onPress={() => navigate('/political-mbti')} />

          {/* Mobile Candidates Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {metropolitanTitle} 예비후보
              </h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {shuffledCandidates.length}명
              </span>
            </div>

            <div className="space-y-3">
              {candidatesLoading ? (
                <>
                  <CandidateCardSkeleton />
                  <CandidateCardSkeleton />
                  <CandidateCardSkeleton />
                </>
              ) : (
                displayedCandidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    onPress={() => navigate(`/candidate/${candidate.id}`)}
                  />
                ))
              )}

              {!showAllCandidates && remainingCount > 0 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleViewAllCandidates}
                  className="w-full py-2.5 text-sm text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors border border-dashed border-primary/30"
                >
                  +{remainingCount}명 더 보기
                </motion.button>
              )}

              {showAllCandidates && (
                <p className="text-center text-xs text-muted-foreground py-1">
                  ※ 후보자 순서는 공정성을 위해 무작위로 표시됩니다
                </p>
              )}

              {/* Compare Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/compare')}
                className="w-full py-3.5 mt-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <Scale size={18} />
                <span>후보자 공약 비교하기</span>
              </motion.button>
            </div>
          </motion.div>

          {/* More Info Section */}
          <DashboardSection
            title="더 알아보기"
            icon="✨"
            delay={0.3}
          >
            <div className="space-y-3">
              <ExpandableSlot
                title="뉴스 피드"
                description="관심 후보자의 최신 뉴스를 확인하세요"
                icon="📰"
                onPress={() => navigate('/news')}
              />
            </div>
          </DashboardSection>
        </div>

        {/* Desktop Three Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Election Timeline */}
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

            {/* Policy Match & MBTI Banners - Desktop Grid */}
            <div className="grid grid-cols-2 gap-5">
              <PolicyMatchBanner onPress={() => navigate('/policy-match')} />
              <MbtiBanner onPress={() => navigate('/political-mbti')} />
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-5 shadow-sm border border-border/50"
            >
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>⚡</span>
                빠른 메뉴
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary/50 transition-colors text-center group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
                      <action.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Desktop Candidates - Horizontal Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/50"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  {metropolitanTitle} 예비후보
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    총 {shuffledCandidates.length}명
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/compare')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <Scale size={16} />
                    비교하기
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {candidatesLoading ? (
                  <>
                    <CandidateCardSkeleton variant="horizontal" />
                    <CandidateCardSkeleton variant="horizontal" />
                    <CandidateCardSkeleton variant="horizontal" />
                    <CandidateCardSkeleton variant="horizontal" />
                  </>
                ) : (
                  shuffledCandidates.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      index={index}
                      variant="horizontal"
                      onPress={() => navigate(`/candidate/${candidate.id}`)}
                    />
                  ))
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                ※ 후보자 순서는 공정성을 위해 무작위로 표시됩니다
              </p>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Compact Candidate List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-5 shadow-sm border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Heart size={16} className="text-rose-500" />
                  빠른 후보 탐색
                </h3>
              </div>

              <div className="space-y-2">
                {candidatesLoading ? (
                  <>
                    <CandidateCardSkeleton variant="compact" />
                    <CandidateCardSkeleton variant="compact" />
                    <CandidateCardSkeleton variant="compact" />
                  </>
                ) : (
                  shuffledCandidates.slice(0, 5).map((candidate, index) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      index={index}
                      variant="compact"
                      onPress={() => navigate(`/candidate/${candidate.id}`)}
                    />
                  ))
                )}
              </div>

              {shuffledCandidates.length > 5 && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/election')}
                  className="w-full mt-3 py-2 text-sm text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  전체 후보 보기
                  <ArrowRight size={14} />
                </motion.button>
              )}
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-5 border border-border/50"
            >
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <span>💡</span>
                선거 참여 팁
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  후보자의 공약을 꼼꼼히 비교해보세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  정책 매칭으로 나와 맞는 후보를 찾아보세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  퀴즈로 선거 지식을 쌓아보세요
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>

      <RegionSheet
        isOpen={isRegionSheetOpen}
        onClose={() => setIsRegionSheetOpen(false)}
        onSelect={onRegionChange}
        currentRegion={region}
      />

      <NotificationSheet
        open={isNotificationOpen}
        onOpenChange={setIsNotificationOpen}
      />
    </motion.div>
  );
}
