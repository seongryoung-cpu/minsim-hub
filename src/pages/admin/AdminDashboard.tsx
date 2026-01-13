import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, FileText, BarChart3, MessageSquare, 
  ChevronRight, Settings, LogOut, ArrowLeft 
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingReports: number;
  todaySignups: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingReports: 0,
    todaySignups: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin) return;

      try {
        // Fetch user stats
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: verifiedUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_level', 'identity');

        const { count: pendingReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const today = new Date().toISOString().split('T')[0];
        const { count: todaySignups } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        setStats({
          totalUsers: totalUsers || 0,
          verifiedUsers: verifiedUsers || 0,
          pendingReports: pendingReports || 0,
          todaySignups: todaySignups || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      
      setIsLoading(false);
    };

    fetchStats();
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { icon: Users, label: '사용자 관리', description: '회원 목록 및 권한 관리', path: '/admin/users' },
    { icon: FileText, label: '콘텐츠 관리', description: '후보자, 뉴스, 퀴즈 관리', path: '/admin/content' },
    { icon: MessageSquare, label: '신고/문의 관리', description: '사용자 신고 및 문의 처리', path: '/admin/reports' },
    { icon: Settings, label: '시스템 설정', description: '앱 설정 및 환경 구성', path: '/admin/settings' },
  ];

  const statCards = [
    { label: '전체 사용자', value: stats.totalUsers, color: 'bg-blue-500' },
    { label: '본인인증 완료', value: stats.verifiedUsers, color: 'bg-green-500' },
    { label: '대기 중 문의', value: stats.pendingReports, color: 'bg-amber-500' },
    { label: '오늘 가입', value: stats.todaySignups, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="p-1 rounded-lg hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
            <Shield size={22} className="text-primary" />
            <h1 className="font-semibold text-lg">관리자</h1>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-4 shadow-app-md"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <BarChart3 size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">관리 메뉴</h2>
          <div className="bg-card rounded-xl shadow-app-md overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  onClick={() => navigate(item.path)}
                  className={`w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            로그인: {user?.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            관리자 권한으로 접속 중
          </p>
        </div>
      </main>
    </div>
  );
}
