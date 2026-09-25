import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppContainer } from '@/components/layout/AppContainer';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { RegionSheet } from '@/components/region/RegionSheet';
import { Home } from '@/pages/Home';
import { useRegion } from '@/hooks/useRegion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdmin } from '@/hooks/useAdmin';
import type { Region } from '@/types/region';

// 페이지별 코드 분할: 첫 화면(Home) 외에는 해당 페이지에 들어갈 때 불러옴
const Election = lazy(() => import('@/pages/Election').then((m) => ({ default: m.Election })));
const Discussion = lazy(() => import('@/pages/Discussion').then((m) => ({ default: m.Discussion })));
const MyPage = lazy(() => import('@/pages/MyPage').then((m) => ({ default: m.MyPage })));
const AppInfoPage = lazy(() => import('@/pages/AppInfoPage').then((m) => ({ default: m.AppInfoPage })));
const CandidateDetail = lazy(() => import('@/pages/CandidateDetail').then((m) => ({ default: m.CandidateDetail })));
const PolicyMatchGame = lazy(() => import('@/pages/PolicyMatchGame').then((m) => ({ default: m.PolicyMatchGame })));
const NewsFeed = lazy(() => import('@/pages/NewsFeed').then((m) => ({ default: m.NewsFeed })));
const CandidateCompare = lazy(() => import('@/pages/CandidateCompare').then((m) => ({ default: m.CandidateCompare })));
const QuizPage = lazy(() => import('@/pages/QuizPage').then((m) => ({ default: m.QuizPage })));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const NotificationSettingsPage = lazy(() => import('@/pages/NotificationSettingsPage').then((m) => ({ default: m.NotificationSettingsPage })));
const FAQPage = lazy(() => import('@/pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminContent = lazy(() => import('@/pages/admin/AdminContent').then((m) => ({ default: m.AdminContent })));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports').then((m) => ({ default: m.AdminReports })));
const AdminPolicyCards = lazy(() => import('@/pages/admin/AdminPolicyCards').then((m) => ({ default: m.AdminPolicyCards })));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminMbti = lazy(() => import('@/pages/admin/AdminMbti').then((m) => ({ default: m.AdminMbti })));
const PoliticalMbtiPage = lazy(() => import('@/pages/PoliticalMbtiPage').then((m) => ({ default: m.PoliticalMbtiPage })));
const AdminCandidateImport = lazy(() => import('@/pages/admin/AdminCandidateImport'));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

type AppPhase = 'splash' | 'onboarding' | 'main';

function Index() {
  const { region, setRegion, isLoaded, hasRegion } = useRegion();
  const isMobile = useIsMobile();
  const { isAdmin } = useAdmin();
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
      <Suspense fallback={<PageFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Home region={currentRegion} onRegionChange={handleRegionChange} />
            }
          />
          <Route path="/election" element={<Election />} />
          {isAdmin && <Route path="/discussion" element={<Discussion />} />}
          <Route
            path="/my"
            element={
              <MyPage region={currentRegion} onRegionChange={() => setIsRegionSheetOpen(true)} />
            }
          />
          <Route path="/app-info" element={<AppInfoPage />} />
          <Route path="/candidate/:id" element={<CandidateDetail />} />
          <Route path="/policy-match" element={<PolicyMatchGame />} />
          <Route path="/political-mbti" element={<PoliticalMbtiPage />} />
          <Route path="/news" element={<NewsFeed />} />
          <Route path="/compare" element={<CandidateCompare region={currentRegion} />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/notification-settings" element={<NotificationSettingsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/policy-cards" element={<AdminPolicyCards />} />
          <Route path="/admin/mbti" element={<AdminMbti />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/candidate-import" element={<AdminCandidateImport />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
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
