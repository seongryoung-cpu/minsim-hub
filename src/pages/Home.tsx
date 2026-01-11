import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/layout/AppHeader';
import { RegionSheet } from '@/components/region/RegionSheet';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EventTimeline } from '@/components/dashboard/EventTimeline';
import { MOCK_EVENTS } from '@/types/event';
import type { Region } from '@/types/region';

interface HomeProps {
  region: Region;
  onRegionChange: (region: Region) => void;
}

export function Home({ region, onRegionChange }: HomeProps) {
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-20"
    >
      <AppHeader region={region} onRegionClick={() => setIsRegionSheetOpen(true)} />

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
              우리 지역의 정치 소식을 확인하세요
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 top-16 w-20 h-20 bg-white/10 rounded-full" />
        </motion.div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Events Timeline */}
        <EventTimeline events={MOCK_EVENTS} />
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
