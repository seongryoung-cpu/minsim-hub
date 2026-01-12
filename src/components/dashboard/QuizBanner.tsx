import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { useQuizStats } from '@/hooks/useQuizStats';

export function QuizBanner() {
  const navigate = useNavigate();
  const { stats, canPlayToday } = useQuizStats();
  const canPlay = canPlayToday();

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/quiz')}
      className="w-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-5 shadow-lg text-left relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"
        />
        <motion.div
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute bottom-2 left-4"
        >
          <Sparkles size={24} className="text-white/30" />
        </motion.div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                <Flame size={14} className="text-orange-300" />
                <span className="text-xs text-white font-medium">{stats.currentStreak}일</span>
              </div>
            )}
          </div>
          {canPlay ? (
            <span className="bg-white text-purple-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              NEW
            </span>
          ) : (
            <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
              완료
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          오늘의 정치 퀴즈
        </h3>
        <p className="text-sm text-white/80 mb-3">
          {canPlay 
            ? '5문제 풀고 PQ 점수를 올려보세요!'
            : '내일 새로운 퀴즈가 준비됩니다'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-white/70">내 PQ</div>
              <div className="text-lg font-bold text-white">{stats.totalPoints}점</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <div className="text-xs text-white/70">상위</div>
              <div className="text-lg font-bold text-white">{100 - stats.percentile}%</div>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ChevronRight size={20} className="text-white" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
