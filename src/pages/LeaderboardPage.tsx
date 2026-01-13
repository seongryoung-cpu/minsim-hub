import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Medal, Award, Crown, Users, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
import { useQuizStats } from '@/hooks/useQuizStats';
import { useLeaderboard, useMyRank, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';

type LeaderboardTab = 'all' | 'weekly';

// Avatar emoji based on rank or random
const getAvatarEmoji = (index: number) => {
  const emojis = ['🦊', '🐻', '🐰', '🦁', '🐨', '🐼', '🐸', '🦄', '🐳', '🦋'];
  return emojis[index % emojis.length];
};

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { stats, isAuthenticated } = useQuizStats();
  const { isAuthenticated: isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useLeaderboard(activeTab);
  const { data: myRank, isLoading: isRankLoading } = useMyRank();

  // Transform leaderboard data for display
  const transformedLeaderboard = (leaderboard || []).map((entry, index) => ({
    id: entry.id,
    nickname: entry.display_name || `사용자${index + 1}`,
    avatar: getAvatarEmoji(index),
    totalPoints: entry.total_points,
    currentStreak: entry.current_streak,
    quizCount: entry.total_quizzes,
    accuracy: entry.total_quizzes > 0 
      ? Math.round((entry.correct_answers / (entry.total_quizzes * 5)) * 100) 
      : 0,
    region: entry.region_sido || '미설정',
    trend: 'same' as const,
    trendValue: 0,
  }));

  const top3 = transformedLeaderboard.slice(0, 3);
  const totalUsers = myRank?.totalUsers || leaderboard?.length || 0;
  const currentUserRank = myRank?.rank || transformedLeaderboard.length + 1;

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
          {isLeaderboardLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-white/70" size={32} />
            </div>
          ) : top3.length > 0 ? (
            <div className="flex items-end justify-center gap-2">
              {/* 2nd Place */}
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">
                    {top3[1].avatar}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[80px]">{top3[1].nickname}</span>
                  <span className="text-xs text-white/70">{top3[1].totalPoints.toLocaleString()}점</span>
                  <div className="w-20 h-16 bg-slate-400/30 rounded-t-lg mt-2 flex items-center justify-center">
                    <Medal size={24} className="text-slate-300" />
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {top3[0] && (
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
                    {top3[0].avatar}
                  </div>
                  <span className="text-base font-bold">{top3[0].nickname}</span>
                  <span className="text-sm text-white/80">{top3[0].totalPoints.toLocaleString()}점</span>
                  <div className="w-24 h-24 bg-yellow-500/30 rounded-t-lg mt-2 flex items-center justify-center">
                    <Trophy size={32} className="text-yellow-300" />
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">
                    {top3[2].avatar}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[80px]">{top3[2].nickname}</span>
                  <span className="text-xs text-white/70">{top3[2].totalPoints.toLocaleString()}점</span>
                  <div className="w-20 h-12 bg-amber-700/30 rounded-t-lg mt-2 flex items-center justify-center">
                    <Award size={20} className="text-amber-600" />
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-white/70">
              <Trophy size={40} className="mb-2 opacity-50" />
              <p className="text-sm">아직 참여자가 없습니다</p>
              <p className="text-xs">첫 번째 랭커가 되어보세요!</p>
            </div>
          )}
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
            전체 {totalUsers.toLocaleString()}명 중
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            😊
          </div>
          <div className="flex-1">
            {isLoggedIn ? (
              isRankLoading ? (
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
              ) : myRank ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      #{myRank.rank}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {myRank.totalUsers}</span>
                  </div>
                  <div className="text-sm text-primary font-medium">
                    {myRank.totalPoints.toLocaleString()}점
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  퀴즈를 풀어 순위에 등록하세요!
                </div>
              )
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    #{currentUserRank}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {totalUsers || 1}</span>
                </div>
                <div className="text-sm text-primary font-medium">
                  {stats.totalPoints.toLocaleString()}점 (로컬)
                </div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">상위</div>
            <div className="text-lg font-bold text-accent">
              {totalUsers > 0 ? Math.round((currentUserRank / totalUsers) * 100) : 100}%
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
        {isLeaderboardLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : transformedLeaderboard.length > 0 ? (
          transformedLeaderboard.map((user, index) => (
            <LeaderboardCard
              key={user.id}
              user={user}
              rank={index + 1}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">아직 랭킹 데이터가 없습니다</p>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-secondary/50 rounded-xl text-center"
          >
            <p className="text-sm text-muted-foreground">
              🔒 실제 랭킹 참여는 로그인 후 이용 가능합니다
            </p>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="mt-2 text-sm text-primary font-medium hover:underline"
            >
              로그인하고 랭킹 도전하기 →
            </button>
          </motion.div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </motion.div>
  );
}
