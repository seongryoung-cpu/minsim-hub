import { ChevronDown, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Region } from '@/types/region';

interface AppHeaderProps {
  region: Region | null;
  onRegionClick: () => void;
}

export function AppHeader({ region, onRegionClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="h-14 flex items-center justify-between px-4">
        <motion.button
          onClick={onRegionClick}
          className="flex items-center gap-1 touch-target -ml-2 px-2 rounded-lg active:bg-secondary/50"
          whileTap={{ scale: 0.98 }}
        >
          <span className="font-semibold text-foreground">
            {region ? `${region.sido} ${region.sigungu}` : '지역 선택'}
          </span>
          <ChevronDown size={18} className="text-muted-foreground" />
        </motion.button>

        <div className="flex items-center gap-2">
          <motion.button
            className="touch-target rounded-full hover:bg-secondary/50 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={22} className="text-foreground" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
