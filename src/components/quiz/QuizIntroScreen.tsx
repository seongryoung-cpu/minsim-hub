import { motion } from 'framer-motion';
import { Brain, Flame, Trophy, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserQuizStats } from '@/types/quiz';

interface QuizIntroScreenProps {
  stats: UserQuizStats;
  canPlay: boolean;
  onStart: () => void;
}

export function QuizIntroScreen({ stats, canPlay, onStart }: QuizIntroScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-5 pb-32"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8 pt-8"
      >
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-7xl mb-4"
        >
          🧠
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          오늘의 정치 퀴즈
        </h1>
        <p className="text-muted-foreground">
          매일 퀴즈를 풀고 정치 문해력(PQ)을 높여보세요!
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} />
            <span className="text-sm font-medium opacity-90">연속 학습</span>
          </div>
          <div className="text-3xl font-bold">{stats.currentStreak}일</div>
          <div className="text-xs opacity-75 mt-1">
            최고 기록: {stats.longestStreak}일
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} />
            <span className="text-sm font-medium opacity-90">PQ 점수</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalPoints}</div>
          <div className="text-xs opacity-75 mt-1">
            상위 {100 - stats.percentile}%
          </div>
        </div>
      </motion.div>

      {/* Achievement Summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-5 shadow-app-sm mb-6"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          나의 학습 현황
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
            <div className="text-xs text-muted-foreground">총 퀴즈</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{stats.correctAnswers}</div>
            <div className="text-xs text-muted-foreground">정답 수</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalQuizzes > 0 
                ? Math.round((stats.correctAnswers / (stats.totalQuizzes * 5)) * 100) 
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground">정답률</div>
          </div>
        </div>
      </motion.div>

      {/* Quiz Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-secondary/50 rounded-2xl p-5 mb-8"
      >
        <div className="flex items-start gap-3 mb-3">
          <Zap size={20} className="text-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">5문제 도전</h4>
            <p className="text-sm text-muted-foreground">
              다양한 정치 분야에서 출제됩니다
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock size={20} className="text-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">하루 1회</h4>
            <p className="text-sm text-muted-foreground">
              매일 새로운 퀴즈가 준비됩니다
            </p>
          </div>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {canPlay ? (
          <Button
            onClick={onStart}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
          >
            <Zap size={22} className="mr-2" />
            퀴즈 시작하기
          </Button>
        ) : (
          <div className="text-center">
            <div className="bg-muted rounded-2xl p-4 mb-3">
              <p className="text-muted-foreground">
                오늘의 퀴즈를 이미 완료했어요! 🎉
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                내일 다시 도전해주세요
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onStart}
              className="w-full h-12 rounded-xl"
            >
              다시 연습하기 (점수 미반영)
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
