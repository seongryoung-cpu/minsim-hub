import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import type { LeaderboardUser } from '@/data/mockLeaderboard';

interface LeaderboardCardProps {
  user: LeaderboardUser;
  rank: number;
  isCurrentUser?: boolean;
}

export function LeaderboardCard({ user, rank, isCurrentUser = false }: LeaderboardCardProps) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (user.trend) {
      case 'up':
        return <TrendingUp size={14} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={14} className="text-red-500" />;
      default:
        return <Minus size={14} className="text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isCurrentUser 
          ? 'bg-primary/10 border-2 border-primary' 
          : 'bg-card hover:bg-secondary/50'
      }`}
    >
      {/* Rank */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getRankStyle()}`}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
        {user.avatar}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
            {user.nickname}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full">
              나
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{user.region}</span>
          {user.currentStreak > 0 && (
            <span className="flex items-center gap-0.5 text-orange-500">
              <Flame size={10} />
              {user.currentStreak}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="font-bold text-foreground">{user.totalPoints.toLocaleString()}</div>
        <div className="flex items-center justify-end gap-1 text-xs">
          {getTrendIcon()}
          {user.trendValue > 0 && (
            <span className={user.trend === 'up' ? 'text-green-500' : user.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
              {user.trendValue}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
