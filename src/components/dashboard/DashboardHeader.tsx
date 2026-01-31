import { motion } from 'framer-motion';
import { MapPin, Bell, ChevronDown } from 'lucide-react';
import type { Region } from '@/types/region';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

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
  const { settings } = useAppSettings();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50"
    >
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Left: App Logo & Name */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-sm">
            <img 
              src={settings?.logo_url || 'https://zdgpxmtapbviwrpcleqi.supabase.co/storage/v1/object/public/app-assets/logos/logo-1768900705056.jpg'} 
              alt="Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="font-bold text-base text-foreground hidden sm:block">
            {settings?.app_name || '민심잇다'}
          </h1>
        </motion.div>

        {/* Center: Region selector */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={onRegionClick}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-all duration-300"
        >
          <span className="text-sm">{sidoEmoji}</span>
          <span className="font-medium text-foreground text-sm">
            {region.sigungu}
          </span>
          <motion.div
            animate={{ y: [0, 2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={14} className="text-muted-foreground" />
          </motion.div>
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
            {/* Notification badge - only show if there are unread notifications */}
            {unreadCount > 0 && (
              <motion.span 
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-background flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <span className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
