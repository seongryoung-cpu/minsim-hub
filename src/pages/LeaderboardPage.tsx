import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Medal, Award, Crown, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
import { useQuizStats } from '@/hooks/useQuizStats';
import { MOCK_LEADERBOARD, MOCK_WEEKLY_LEADERBOARD } from '@/data/mockLeaderboard';
import type { LeaderboardUser } from '@/data/mockLeaderboard';

type LeaderboardTab = 'all' | 'weekly';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { stats } = useQuizStats();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('all');

  // 현재 사용자 데이터 (데모용)
  const currentUser: LeaderboardUser = useMemo(() => ({
    id: 'me',
    nickname: '나',
    avatar: '😊',
    totalPoints: stats.totalPoints,
    currentStreak: stats.currentStreak,
    quizCount: stats.totalQuizzes,
    accuracy: stats.totalQuizzes > 0 
      ? Math.round((stats.correctAnswers / (stats.totalQuizzes * 5)) * 100) 
      : 0,
    region: '서울특별시',
    trend: 'up' as const,
    trendValue: 0,
  }), [stats]);

  // 리더보드 데이터 + 현재 사용자 위치 계산
  const leaderboardData = useMemo(() => {
    const data = activeTab === 'all' ? MOCK_LEADERBOARD : MOCK_WEEKLY_LEADERBOARD;
    
    // 현재 사용자 순위 계산
    const myRank = data.filter(u => u.totalPoints > currentUser.totalPoints).length + 1;
    
    return {
      topUsers: data.slice(0, 10),
      myRank,
      totalUsers: data.length + 1, // +1 for current user
    };
  }, [activeTab, currentUser]);

  const top3 = leaderboardData.topUsers.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">PQ 랭킹</h1>
          <div className="w-10" />
        </div>

        {/* Top 3 Podium */}
        <div className="px-4 pb-6 pt-2">
          <div className="flex items-end justify-center gap-2">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">
                {top3[1]?.avatar}
              </div>
              <span className="text-sm font-medium truncate max-w-[80px]">{top3[1]?.nickname}</span>
              <span className="text-xs text-white/70">{top3[1]?.totalPoints.toLocaleString()}점</span>
              <div className="w-20 h-16 bg-slate-400/30 rounded-t-lg mt-2 flex items-center justify-center">
                <Medal size={24} className="text-slate-300" />
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center -mt-4"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown size={28} className="text-yellow-300 mb-1" />
              </motion.div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-4xl mb-2 shadow-lg">
                {top3[0]?.avatar}
              </div>
              <span className="text-base font-bold">{top3[0]?.nickname}</span>
              <span className="text-sm text-white/80">{top3[0]?.totalPoints.toLocaleString()}점</span>
              <div className="w-24 h-24 bg-yellow-500/30 rounded-t-lg mt-2 flex items-center justify-center">
                <Trophy size={32} className="text-yellow-300" />
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">
                {top3[2]?.avatar}
              </div>
              <span className="text-sm font-medium truncate max-w-[80px]">{top3[2]?.nickname}</span>
              <span className="text-xs text-white/70">{top3[2]?.totalPoints.toLocaleString()}점</span>
              <div className="w-20 h-12 bg-amber-700/30 rounded-t-lg mt-2 flex items-center justify-center">
                <Award size={20} className="text-amber-600" />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* My Rank Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-4 -mt-3 mb-4 bg-card rounded-2xl p-4 shadow-lg border border-primary/20"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">내 순위</span>
          <span className="text-xs text-muted-foreground">
            전체 {leaderboardData.totalUsers.toLocaleString()}명 중
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            {currentUser.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                #{leaderboardData.myRank}
              </span>
              <span className="text-sm text-muted-foreground">/ {leaderboardData.totalUsers}</span>
            </div>
            <div className="text-sm text-primary font-medium">
              {currentUser.totalPoints.toLocaleString()}점
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">상위</div>
            <div className="text-lg font-bold text-accent">
              {Math.round((leaderboardData.myRank / leaderboardData.totalUsers) * 100)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 gap-1">
              <Users size={14} />
              전체
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 gap-1">
              <Calendar size={14} />
              이번 주
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 pb-32 space-y-2">
        {leaderboardData.topUsers.map((user, index) => (
          <LeaderboardCard
            key={user.id}
            user={user}
            rank={index + 1}
          />
        ))}

        {/* Demo notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 bg-secondary/50 rounded-xl text-center"
        >
          <p className="text-sm text-muted-foreground">
            🔒 실제 랭킹 참여는 로그인 후 이용 가능합니다
          </p>
          <button className="mt-2 text-sm text-primary font-medium hover:underline">
            로그인하고 랭킹 도전하기 →
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
