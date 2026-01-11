import { Home, Vote, MessageSquare, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
}

const tabs: TabItem[] = [
  { id: 'home', label: '홈', icon: Home, path: '/' },
  { id: 'election', label: '선거', icon: Vote, path: '/election' },
  { id: 'discussion', label: '토론', icon: MessageSquare, path: '/discussion' },
  { id: 'my', label: '마이', icon: User, path: '/my' },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 bg-card/95 backdrop-blur-xl border-t border-border pb-safe w-full max-w-full sm:max-w-[540px] lg:hidden sm:rounded-t-2xl sm:border-x">
      <div className="flex items-center justify-around h-16 sm:h-[72px]">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="touch-target flex-1 flex flex-col items-center justify-center gap-1 relative group"
            >
              <motion.div
                className="relative"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <Icon
                  size={24}
                  className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
              <span
                className={`text-[10px] sm:text-xs font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
