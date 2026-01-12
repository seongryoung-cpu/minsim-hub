import { motion } from 'framer-motion';
import { Brain, Flame, Trophy, Target, ChevronRight, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuizStats } from '@/hooks/useQuizStats';
import { CATEGORY_ICONS, QUIZ_CATEGORIES, type QuizCategory } from '@/types/quiz';

export function PQStatsCard() {
  const navigate = useNavigate();
  const { stats, isLoaded } = useQuizStats();

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-app-md animate-pulse">
        <div className="h-24 bg-secondary rounded-xl" />
      </div>
    );
  }

  const accuracy = stats.totalQuizzes > 0 
    ? Math.round((stats.correctAnswers / (stats.totalQuizzes * 5)) * 100) 
    : 0;

  // 카테고리별 성적 계산
  const categoryStats = QUIZ_CATEGORIES
    .map(category => ({
      category,
      correct: stats.categoryScores[category]?.correct || 0,
      total: stats.categoryScores[category]?.total || 0,
      accuracy: stats.categoryScores[category]?.total > 0
        ? Math.round((stats.categoryScores[category].correct / stats.categoryScores[category].total) * 100)
        : 0,
    }))
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  const hasPlayed = stats.totalQuizzes > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-app-md overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={20} />
            <span className="font-semibold">정치 문해력 (PQ)</span>
          </div>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            <Crown size={14} />
            랭킹
          </button>
        </div>

        {hasPlayed ? (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalPoints}</div>
              <div className="text-xs text-white/70">총 점수</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold">{100 - stats.percentile}%</div>
              <div className="text-xs text-white/70">상위</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center flex items-center gap-1">
              <Flame size={20} className="text-orange-300" />
              <div>
                <div className="text-2xl font-bold">{stats.currentStreak}</div>
                <div className="text-xs text-white/70">일 연속</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-white/80 text-sm">아직 퀴즈를 풀지 않았어요</p>
            <button
              onClick={() => navigate('/quiz')}
              className="mt-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
            >
              첫 퀴즈 시작하기 →
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {hasPlayed && (
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Trophy size={14} />
              </div>
              <div className="text-lg font-bold text-foreground">{stats.totalQuizzes}</div>
              <div className="text-xs text-muted-foreground">퀴즈 횟수</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-accent mb-1">
                <Target size={14} />
              </div>
              <div className="text-lg font-bold text-foreground">{stats.correctAnswers}</div>
              <div className="text-xs text-muted-foreground">정답 수</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">정답률</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Performance */}
      {categoryStats.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">카테고리별 성적</h4>
          <div className="space-y-2">
            {categoryStats.slice(0, 4).map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-base">{CATEGORY_ICONS[cat.category as QuizCategory]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{cat.category}</span>
                    <span className="text-muted-foreground">
                      {cat.correct}/{cat.total} ({cat.accuracy}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.accuracy}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {categoryStats.length > 4 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{categoryStats.length - 4}개 카테고리 더 보기
            </p>
          )}
        </div>
      )}

      {/* Quiz CTA */}
      <button
        onClick={() => navigate('/quiz')}
        className="w-full p-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors border-t border-border"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="font-medium text-foreground">오늘의 퀴즈 풀러가기</span>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>
    </motion.div>
  );
}
