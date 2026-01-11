import { Home, Vote, MessageSquare, User, FileText, Bell, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: '홈', icon: Home, path: '/' },
  { id: 'election', label: '선거', icon: Vote, path: '/election' },
  { id: 'discussion', label: '토론', icon: MessageSquare, path: '/discussion' },
  { id: 'my', label: '마이페이지', icon: User, path: '/my' },
];

export function DesktopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-lg">🗳️</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">민심잇다</h1>
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
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Search size={18} className="text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
              <Bell size={18} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <button 
              onClick={() => navigate('/app-info')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground"
            >
              <FileText size={16} />
              <span>기획서</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
