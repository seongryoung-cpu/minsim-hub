import { motion } from 'framer-motion';
import { User, Settings, Bell, HelpCircle, ChevronRight, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PQStatsCard } from '@/components/quiz/PQStatsCard';
import type { Region } from '@/types/region';

interface MyPageProps {
  region: Region;
  onRegionChange: () => void;
}

const menuItems = [
  { icon: Bell, label: '알림 설정', description: '푸시 알림 관리', path: null },
  { icon: HelpCircle, label: '도움말', description: '자주 묻는 질문', path: null },
  { icon: Settings, label: '앱 설정', description: '테마, 언어 설정', path: null },
  { icon: FileText, label: '기획서', description: '앱 기능 명세 확인', path: '/app-info' },
];

export function MyPage({ region, onRegionChange }: MyPageProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4">
          <User size={22} className="text-primary mr-2" />
          <h1 className="font-semibold text-lg text-foreground">마이</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-app-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-lg">시민 님</h2>
              <p className="text-sm text-muted-foreground">로그인하고 더 많은 기능을 이용하세요</p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
            로그인 / 회원가입
          </button>
        </motion.div>

        {/* PQ Stats Card */}
        <PQStatsCard />

        {/* Region Setting */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onRegionChange}
          className="w-full bg-card rounded-2xl p-4 shadow-app-md flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MapPin size={20} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">내 지역</p>
              <p className="text-sm text-muted-foreground">{region.sido} {region.sigungu}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.button>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-app-md overflow-hidden"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className={`w-full p-4 flex items-center justify-between active:bg-secondary/50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon size={20} className="text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </button>
            );
          })}
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">민심잇다 v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">나의 목소리가 정치가 되는 곳</p>
        </motion.div>
      </main>
    </motion.div>
  );
}
