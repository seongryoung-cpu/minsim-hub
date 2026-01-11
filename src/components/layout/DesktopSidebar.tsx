import { Home, Vote, MessageSquare, User, FileText, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  description: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: '홈', icon: Home, path: '/', description: '대시보드 및 주요 정보' },
  { id: 'election', label: '선거', icon: Vote, path: '/election', description: '선거 일정 및 후보자' },
  { id: 'discussion', label: '토론', icon: MessageSquare, path: '/discussion', description: '지역 이슈 토론' },
  { id: 'my', label: '마이', icon: User, path: '/my', description: '계정 및 설정' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-xl">🗳️</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">민심잇다</h1>
            <p className="text-xs text-muted-foreground">지역 정치 참여 플랫폼</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground px-3 mb-3">메뉴</p>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors group ${
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-secondary text-foreground'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                active ? 'bg-primary-foreground/20' : 'bg-secondary group-hover:bg-muted'
              }`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className={`text-xs truncate ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {item.description}
                </p>
              </div>
              <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'opacity-100' : ''}`} />
            </motion.button>
          );
        })}
      </nav>

      {/* Quick Info */}
      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">앱 정보</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            민심잇다의 기획 의도와 기능을 확인하세요.
          </p>
          <button 
            onClick={() => navigate('/app-info')}
            className="text-xs font-medium text-primary hover:underline"
          >
            자세히 보기 →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © 2025 민심잇다. All rights reserved.
        </p>
      </div>
    </aside>
  );
}
