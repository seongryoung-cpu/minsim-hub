import { motion } from 'framer-motion';
import { Trophy, Flame, Target, TrendingUp, RotateCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { UserQuizStats, QuizCategory } from '@/types/quiz';
import { CATEGORY_ICONS } from '@/types/quiz';

interface QuizResultScreenProps {
  correctAnswers: number;
  totalQuestions: number;
  earnedPoints: number;
  stats: UserQuizStats;
  onPlayAgain?: () => void;
}

export function QuizResultScreen({
  correctAnswers,
  totalQuestions,
  earnedPoints,
  stats,
  onPlayAgain,
}: QuizResultScreenProps) {
  const navigate = useNavigate();
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  // 카테고리별 정답률 계산
  const categoryStats = Object.entries(stats.categoryScores)
    .filter(([_, score]) => score.total > 0)
    .map(([category, score]) => ({
      category: category as QuizCategory,
      accuracy: Math.round((score.correct / score.total) * 100),
      total: score.total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const getMessage = () => {
    if (accuracy === 100) return { emoji: '🏆', text: '완벽해요! 정치 천재!' };
    if (accuracy >= 80) return { emoji: '🎉', text: '훌륭합니다! 정치 고수!' };
    if (accuracy >= 60) return { emoji: '👍', text: '좋아요! 계속 성장 중!' };
    if (accuracy >= 40) return { emoji: '💪', text: '괜찮아요! 다음엔 더 잘할 거예요!' };
    return { emoji: '📚', text: '조금 더 공부해볼까요?' };
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-5 pb-32"
    >
      {/* Result Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-center mb-8"
      >
        <span className="text-6xl mb-4 block">{message.emoji}</span>
        <h2 className="text-2xl font-bold text-foreground mb-2">{message.text}</h2>
        <p className="text-muted-foreground">
          {totalQuestions}문제 중 {correctAnswers}문제 정답
        </p>
      </motion.div>

      {/* Score Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="flex justify-center mb-8"
      >
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="12"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: accuracy / 100 }}
              transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
              style={{
                strokeDasharray: '351.86',
                strokeDashoffset: '0',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{accuracy}%</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="bg-card rounded-2xl p-4 shadow-app-sm">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Trophy size={18} />
            <span className="text-sm font-medium">획득 점수</span>
          </div>
          <span className="text-2xl font-bold text-foreground">+{earnedPoints}</span>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-app-sm">
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Flame size={18} />
            <span className="text-sm font-medium">연속 학습</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{stats.currentStreak}일</span>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-app-sm">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Target size={18} />
            <span className="text-sm font-medium">총 PQ 점수</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{stats.totalPoints}</span>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-app-sm">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">상위</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{100 - stats.percentile}%</span>
        </div>
      </motion.div>

      {/* Category Performance */}
      {categoryStats.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-2xl p-5 shadow-app-sm mb-6"
        >
          <h3 className="font-semibold text-foreground mb-4">카테고리별 성적</h3>
          <div className="space-y-3">
            {categoryStats.slice(0, 4).map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-lg">{CATEGORY_ICONS[cat.category]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{cat.category}</span>
                    <span className="text-muted-foreground">{cat.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.accuracy}%` }}
                      transition={{ delay: 1, duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-3"
      >
        {onPlayAgain && (
          <Button
            onClick={onPlayAgain}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            <RotateCcw size={18} className="mr-2" />
            다시 도전하기
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="w-full h-12 rounded-xl text-base font-semibold"
        >
          <Home size={18} className="mr-2" />
          홈으로 돌아가기
        </Button>
      </motion.div>
    </motion.div>
  );
}
