import { Home, Vote, User, FileText, Bell, ChevronDown, MessageSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { useAdmin } from '@/hooks/useAdmin';
import { getSidoEmoji, type Region } from '@/types/region';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { id: 'home', label: '홈', icon: Home, path: '/' },
  { id: 'election', label: '선거', icon: Vote, path: '/election' },
  { id: 'discussion', label: '토론', icon: MessageSquare, path: '/discussion', adminOnly: true },
  { id: 'my', label: '마이페이지', icon: User, path: '/my' },
];

interface DesktopNavbarProps {
  region?: Region;
  onRegionClick?: () => void;
}

export function DesktopNavbar({ region, onRegionClick }: DesktopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useAdmin();

  // Filter nav items based on admin status
  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  const sidoEmoji = region ? getSidoEmoji(region.sido) : '📍';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="hidden lg:block sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
              <img 
                src={settings?.logo_url || 'https://zdgpxmtapbviwrpcleqi.supabase.co/storage/v1/object/public/app-assets/logos/logo-1768900705056.jpg'} 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">
                {settings?.app_name || '민심잇다'}
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Region Selector */}
            {region && onRegionClick && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRegionClick}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors"
              >
                <span className="text-sm">{sidoEmoji}</span>
                <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                  {region.sigungu}
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </motion.button>
            )}

            {/* Notification Button */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-secondary transition-colors relative"
            >
              <Bell size={18} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </span>
              )}
            </motion.button>

            {/* App Info — 관리자 전용 */}
            {isAdmin && (
              <button
                onClick={() => navigate('/app-info')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground"
              >
                <FileText size={16} />
                <span>기획서</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
