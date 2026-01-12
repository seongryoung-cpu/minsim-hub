import { useState, useEffect, useCallback } from 'react';
import type { UserQuizStats, QuizCategory, QuizResult } from '@/types/quiz';
import { QUIZ_CATEGORIES } from '@/types/quiz';

const STORAGE_KEY = 'minsim-quiz-stats';

const getInitialStats = (): UserQuizStats => {
  const initialCategoryScores = QUIZ_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = { correct: 0, total: 0 };
    return acc;
  }, {} as Record<QuizCategory, { correct: number; total: number }>);

  return {
    totalPoints: 0,
    totalQuizzes: 0,
    correctAnswers: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    categoryScores: initialCategoryScores,
    percentile: 50,
  };
};

export function useQuizStats() {
  const [stats, setStats] = useState<UserQuizStats>(getInitialStats);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStats({ ...getInitialStats(), ...parsed });
      } catch {
        setStats(getInitialStats());
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  const checkStreak = useCallback(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (stats.lastPlayedDate === today) {
      return 'already_played';
    }

    if (stats.lastPlayedDate === yesterday) {
      return 'continue_streak';
    }

    if (stats.lastPlayedDate && stats.lastPlayedDate !== yesterday) {
      return 'streak_broken';
    }

    return 'new_streak';
  }, [stats.lastPlayedDate]);

  const updateStats = useCallback((results: QuizResult[], categories: QuizCategory[]) => {
    const today = new Date().toDateString();
    const streakStatus = checkStreak();

    const correctCount = results.filter(r => r.isCorrect).length;
    const earnedPoints = results.reduce((sum, r, i) => {
      return sum + (r.isCorrect ? (categories[i] ? 15 : 10) : 0);
    }, 0);

    setStats(prev => {
      const newCategoryScores = { ...prev.categoryScores };
      results.forEach((result, index) => {
        const category = categories[index];
        if (category && newCategoryScores[category]) {
          newCategoryScores[category] = {
            correct: newCategoryScores[category].correct + (result.isCorrect ? 1 : 0),
            total: newCategoryScores[category].total + 1,
          };
        }
      });

      let newStreak = prev.currentStreak;
      if (streakStatus === 'continue_streak' || streakStatus === 'new_streak') {
        newStreak = prev.currentStreak + 1;
      } else if (streakStatus === 'streak_broken') {
        newStreak = 1;
      }

      const newTotalPoints = prev.totalPoints + earnedPoints;
      // 간단한 백분위 계산 (실제로는 서버에서 계산해야 함)
      const estimatedPercentile = Math.min(99, Math.floor(50 + (newTotalPoints / 100)));

      return {
        ...prev,
        totalPoints: newTotalPoints,
        totalQuizzes: prev.totalQuizzes + 1,
        correctAnswers: prev.correctAnswers + correctCount,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastPlayedDate: today,
        categoryScores: newCategoryScores,
        percentile: estimatedPercentile,
      };
    });
  }, [checkStreak]);

  const canPlayToday = useCallback(() => {
    const today = new Date().toDateString();
    return stats.lastPlayedDate !== today;
  }, [stats.lastPlayedDate]);

  const resetStats = useCallback(() => {
    setStats(getInitialStats());
  }, []);

  return {
    stats,
    isLoaded,
    updateStats,
    canPlayToday,
    checkStreak,
    resetStats,
  };
}
