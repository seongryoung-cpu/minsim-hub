import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Users, Vote, MessageCircle } from 'lucide-react';
import { RegionSheet } from '@/components/region/RegionSheet';
import type { Region } from '@/types/region';

interface OnboardingScreenProps {
  onComplete: (region: Region) => void;
}

const features = [
  {
    icon: Vote,
    title: '투표 정보',
    description: '내 지역 선거 일정과 후보자 정보',
  },
  {
    icon: MessageCircle,
    title: '지역 토론',
    description: '이웃과 함께 지역 이슈 토론',
  },
  {
    icon: Users,
    title: '주민 참여',
    description: '조례 제정 및 예산 참여 기회',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(220 70% 50%), hsl(230 70% 55%))' }}
          >
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <path
                d="M16 20h16M16 24h12M16 28h8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="36" cy="32" r="6" fill="white" />
              <path
                d="M34 32l2 2 3-3"
                stroke="hsl(220 70% 50%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            민심잇다
          </h1>
          <p className="text-muted-foreground text-lg">
            나의 목소리가 정치가 되는 곳
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl shadow-app-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="p-6 pb-safe"
      >
        <motion.button
          onClick={() => setIsRegionSheetOpen(true)}
          className="w-full h-14 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 text-primary-foreground"
          style={{ background: 'linear-gradient(135deg, hsl(220 70% 50%), hsl(230 70% 55%))' }}
          whileTap={{ scale: 0.98 }}
        >
          <MapPin size={20} />
          내 지역 선택하기
          <ArrowRight size={20} />
        </motion.button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          지역 정보는 언제든지 변경할 수 있습니다
        </p>
      </motion.div>

      {/* Region Sheet */}
      <RegionSheet
        isOpen={isRegionSheetOpen}
        onClose={() => setIsRegionSheetOpen(false)}
        onSelect={onComplete}
      />
    </div>
  );
}
