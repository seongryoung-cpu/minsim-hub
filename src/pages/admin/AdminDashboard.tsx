import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, FileText, BarChart3, MessageSquare, 
  ChevronRight, Settings, LogOut, ArrowLeft, Activity,
  LogIn, Trophy, Target, UserPlus, UserCheck, Bell, Send, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingReports: number;
  todaySignups: number;
}

interface SignupTrend {
  date: string;
  count: number;
}

interface VerificationDistribution {
  name: string;
  value: number;
  color: string;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  activity_type: string;
  description: string;
  created_at: string;
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
  const [signupTrends, setSignupTrends] = useState<SignupTrend[]>([]);
  const [verificationDist, setVerificationDist] = useState<VerificationDistribution[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingPush, setIsSendingPush] = useState(false);

  const handleSendTestPush = async () => {
    setIsSendingPush(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '테스트 알림 🔔',
          body: '관리자가 보낸 테스트 푸시 알림입니다.',
          data: { type: 'test', url: '/my' }
        }
      });

      if (error) throw error;

      toast.success(`푸시 알림 전송 완료: ${data.sent}건 성공, ${data.failed}건 실패`);
    } catch (error) {
      console.error('Failed to send test push:', error);
      toast.error('푸시 알림 전송에 실패했습니다');
    } finally {
      setIsSendingPush(false);
    }
  };

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

        // Fetch signup trends (last 7 days)
        const last7Days: SignupTrend[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          const nextDateStr = nextDate.toISOString().split('T')[0];

          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dateStr)
            .lt('created_at', nextDateStr);

          last7Days.push({
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            count: count || 0,
          });
        }
        setSignupTrends(last7Days);

        // Fetch verification level distribution
        const { count: socialCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_level', 'social');

        const { count: phoneCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_level', 'phone');

        const { count: identityCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_level', 'identity');

        setVerificationDist([
          { name: '소셜 로그인', value: socialCount || 0, color: 'hsl(var(--chart-1))' },
          { name: '휴대폰 인증', value: phoneCount || 0, color: 'hsl(var(--chart-2))' },
          { name: '본인 인증', value: identityCount || 0, color: 'hsl(var(--chart-3))' },
        ]);

        // Fetch recent activity logs
        const { data: logsData } = await supabase
          .from('activity_logs')
          .select('id, user_id, activity_type, description, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        setActivityLogs(logsData || []);

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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Signup Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-4 shadow-app-md"
          >
            <h3 className="font-semibold mb-4">최근 7일 가입 추이</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupTrends}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorSignups)"
                    name="가입자 수"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Verification Level Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl p-4 shadow-app-md"
          >
            <h3 className="font-semibold mb-4">인증 레벨 분포</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {verificationDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}명`, '']}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl p-4 shadow-app-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-primary" />
            <h3 className="font-semibold">최근 활동</h3>
          </div>
          
          {activityLogs.length > 0 ? (
            <div className="space-y-3">
              {activityLogs.map((log) => {
                const getIcon = () => {
                  switch (log.activity_type) {
                    case 'login': return <LogIn size={16} className="text-green-500" />;
                    case 'logout': return <LogOut size={16} className="text-gray-500" />;
                    case 'signup': return <UserPlus size={16} className="text-blue-500" />;
                    case 'quiz_complete': return <Trophy size={16} className="text-amber-500" />;
                    case 'policy_match_complete': return <Target size={16} className="text-purple-500" />;
                    case 'identity_verify': return <UserCheck size={16} className="text-emerald-500" />;
                    default: return <Activity size={16} className="text-muted-foreground" />;
                  }
                };

                const getActivityLabel = () => {
                  switch (log.activity_type) {
                    case 'login': return '로그인';
                    case 'logout': return '로그아웃';
                    case 'signup': return '회원가입';
                    case 'quiz_complete': return '퀴즈 완료';
                    case 'policy_match_complete': return '정책 매칭';
                    case 'candidate_follow': return '후보 팔로우';
                    case 'candidate_unfollow': return '팔로우 취소';
                    case 'identity_verify': return '본인 인증';
                    case 'profile_update': return '프로필 수정';
                    default: return log.activity_type;
                  }
                };

                const timeAgo = (dateStr: string) => {
                  const now = new Date();
                  const date = new Date(dateStr);
                  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
                  
                  if (diff < 60) return '방금 전';
                  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
                  return `${Math.floor(diff / 86400)}일 전`;
                };

                return (
                  <div 
                    key={log.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {getActivityLabel()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {log.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">아직 활동 로그가 없습니다</p>
            </div>
          )}
        </motion.div>

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

        {/* Push Notification Test */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-xl p-4 shadow-app-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell size={20} className="text-primary" />
            <h3 className="font-semibold">푸시 알림 테스트</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            등록된 모든 푸시 구독자에게 테스트 알림을 전송합니다.
          </p>
          <button
            onClick={handleSendTestPush}
            disabled={isSendingPush}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSendingPush ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                전송 중...
              </>
            ) : (
              <>
                <Send size={18} />
                테스트 알림 전송
              </>
            )}
          </button>
        </motion.div>

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
