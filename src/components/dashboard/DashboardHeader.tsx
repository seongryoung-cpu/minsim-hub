import { motion } from 'framer-motion';
import { MapPin, Bell, ChevronDown } from 'lucide-react';
import type { Region } from '@/types/region';

interface DashboardHeaderProps {
  region: Region;
  onRegionClick: () => void;
  onNotificationClick?: () => void;
}

export function DashboardHeader({
  region,
  onRegionClick,
  onNotificationClick,
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50"
    >
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Region selector */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRegionClick}
          className="flex items-center gap-2 touch-target"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin size={16} className="text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground text-sm">
                {region.sigungu}
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {region.sido}
            </span>
          </div>
        </motion.button>

        {/* Notification */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onNotificationClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center touch-target hover:bg-secondary transition-colors"
          >
            <Bell size={20} className="text-foreground" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
