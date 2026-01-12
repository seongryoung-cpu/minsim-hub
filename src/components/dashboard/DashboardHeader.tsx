import { motion } from 'framer-motion';
import { MapPin, Bell, ChevronDown, Sparkles } from 'lucide-react';
import type { Region } from '@/types/region';

interface DashboardHeaderProps {
  region: Region;
  onRegionClick: () => void;
  onNotificationClick?: () => void;
}

// 시/도별 이모지 아이콘
const SIDO_EMOJI: Record<string, string> = {
  '서울특별시': '🏛️',
  '부산광역시': '🌊',
  '대구광역시': '🍎',
  '인천광역시': '✈️',
  '광주광역시': '💡',
  '대전광역시': '🔬',
  '울산광역시': '🏭',
  '세종특별자치시': '🏢',
  '경기도': '🏙️',
  '강원도': '🏔️',
  '충청북도': '🌾',
  '충청남도': '🌻',
  '전라북도': '🎋',
  '전라남도': '🌿',
  '경상북도': '🏯',
  '경상남도': '🌸',
  '제주특별자치도': '🍊',
};

export function DashboardHeader({
  region,
  onRegionClick,
  onNotificationClick,
}: DashboardHeaderProps) {
  const sidoEmoji = SIDO_EMOJI[region.sido] || '📍';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50"
    >
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Region selector - Enhanced Design */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={onRegionClick}
          className="group flex items-center gap-3 px-3 py-2 -ml-3 rounded-2xl hover:bg-primary/5 transition-all duration-300"
        >
          {/* Animated Icon Container */}
          <motion.div 
            className="relative"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10 group-hover:shadow-md group-hover:border-primary/20 transition-all">
              <span className="text-lg">{sidoEmoji}</span>
            </div>
            {/* Pulse indicator */}
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MapPin size={8} className="text-primary-foreground" />
            </motion.div>
          </motion.div>

          {/* Location Text */}
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base tracking-tight">
                {region.sigungu}
              </span>
              <motion.div
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown size={16} className="text-primary" />
              </motion.div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                {region.sido}
              </span>
              <span className="text-[10px] text-primary/60 font-medium">
                • 지역 변경
              </span>
            </div>
          </div>
        </motion.button>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onNotificationClick}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary transition-all"
          >
            <Bell size={20} className="text-foreground" />
            {/* Notification badge */}
            <motion.span 
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-accent to-accent/80 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
