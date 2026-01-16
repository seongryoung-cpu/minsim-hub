import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppContainer } from '@/components/layout/AppContainer';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { RegionSheet } from '@/components/region/RegionSheet';
import { Home } from '@/pages/Home';
import { Election } from '@/pages/Election';
import { Discussion } from '@/pages/Discussion';
import { MyPage } from '@/pages/MyPage';
import { AppInfoPage } from '@/pages/AppInfoPage';
import { CandidateDetail } from '@/pages/CandidateDetail';
import { PolicyMatchGame } from '@/pages/PolicyMatchGame';
import { NewsFeed } from '@/pages/NewsFeed';
import { CandidateCompare } from '@/pages/CandidateCompare';
import { QuizPage } from '@/pages/QuizPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminContent } from '@/pages/admin/AdminContent';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminPolicyCards } from '@/pages/admin/AdminPolicyCards';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { useRegion } from '@/hooks/useRegion';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Region } from '@/types/region';

type AppPhase = 'splash' | 'onboarding' | 'main';

function Index() {
  const { region, setRegion, isLoaded, hasRegion } = useRegion();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const location = useLocation();

  // Check if current route is admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Desktop: Skip splash and go directly to main (with region sheet if needed)
  useEffect(() => {
    if (isLoaded && !isMobile) {
      setPhase('main');
      if (!hasRegion) {
        setIsRegionSheetOpen(true);
      }
    }
  }, [isLoaded, isMobile, hasRegion]);

  const handleSplashComplete = useCallback(() => {
    if (hasRegion) {
      setPhase('main');
    } else {
      setPhase('onboarding');
    }
  }, [hasRegion]);

  const handleOnboardingComplete = useCallback((selectedRegion: Region) => {
    setRegion(selectedRegion);
    setPhase('main');
  }, [setRegion]);

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    setIsRegionSheetOpen(false);
  }, [setRegion]);

  // Mobile: Show splash
  if (phase === 'splash' && isMobile) {
    return (
      <AppContainer>
        <SplashScreen onComplete={handleSplashComplete} />
      </AppContainer>
    );
  }

  // Mobile: Show onboarding (desktop uses RegionSheet instead)
  if (phase === 'onboarding' && isMobile && !region) {
    return (
      <AppContainer>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </AppContainer>
    );
  }

  // Default region for desktop if not set yet
  const currentRegion: Region = region || { sido: '서울특별시', sigungu: '전체' };

  // Main app
  return (
    <AppContainer 
      region={currentRegion} 
      onRegionClick={() => setIsRegionSheetOpen(true)}
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Home region={currentRegion} onRegionChange={handleRegionChange} />
            }
          />
          <Route path="/election" element={<Election />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route
            path="/my"
            element={
              <MyPage region={currentRegion} onRegionChange={() => setIsRegionSheetOpen(true)} />
            }
          />
          <Route path="/app-info" element={<AppInfoPage />} />
          <Route path="/candidate/:id" element={<CandidateDetail />} />
          <Route path="/policy-match" element={<PolicyMatchGame />} />
          <Route path="/news" element={<NewsFeed />} />
          <Route path="/compare" element={<CandidateCompare />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/policy-cards" element={<AdminPolicyCards />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Routes>
      </AnimatePresence>
      {!isAdminRoute && <BottomTabBar />}

      <RegionSheet
        isOpen={isRegionSheetOpen}
        onClose={() => setIsRegionSheetOpen(false)}
        onSelect={handleRegionChange}
        currentRegion={region}
      />
    </AppContainer>
  );
}

export default Index;
