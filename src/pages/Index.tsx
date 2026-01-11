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
import { useRegion } from '@/hooks/useRegion';
import type { Region } from '@/types/region';

type AppPhase = 'splash' | 'onboarding' | 'main';

function Index() {
  const { region, setRegion, isLoaded, hasRegion } = useRegion();
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isLoaded) {
      if (phase === 'splash') {
        // Splash will handle its own timing
      }
    }
  }, [isLoaded, phase]);

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

  // Show splash
  if (phase === 'splash') {
    return (
      <AppContainer>
        <SplashScreen onComplete={handleSplashComplete} />
      </AppContainer>
    );
  }

  // Show onboarding
  if (phase === 'onboarding' || !region) {
    return (
      <AppContainer>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </AppContainer>
    );
  }

  // Main app
  return (
    <AppContainer>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Home region={region} onRegionChange={handleRegionChange} />
            }
          />
          <Route path="/election" element={<Election />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route
            path="/my"
            element={
              <MyPage region={region} onRegionChange={() => setIsRegionSheetOpen(true)} />
            }
          />
          <Route path="/app-info" element={<AppInfoPage />} />
        </Routes>
      </AnimatePresence>
      <BottomTabBar />

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
