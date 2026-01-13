import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [userId, setUserId] = useState<string | null>(null);

  // Load stats from localStorage initially
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

  // Check for authenticated user and sync with DB
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch user's stats from DB
        const { data: dbStats } = await supabase
          .from('quiz_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dbStats) {
          // Merge with local stats, preferring higher values
          setStats(prev => ({
            ...prev,
            totalPoints: Math.max(prev.totalPoints, dbStats.total_points),
            totalQuizzes: Math.max(prev.totalQuizzes, dbStats.total_quizzes),
            correctAnswers: Math.max(prev.correctAnswers, dbStats.correct_answers),
            currentStreak: Math.max(prev.currentStreak, dbStats.current_streak),
            longestStreak: Math.max(prev.longestStreak, dbStats.longest_streak),
            lastPlayedDate: dbStats.last_played_date || prev.lastPlayedDate,
          }));
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage when stats change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  // Sync to DB when stats change and user is authenticated
  const syncToDatabase = useCallback(async (newStats: UserQuizStats) => {
    if (!userId) return;

    const { data: existing } = await supabase
      .from('quiz_stats')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('quiz_stats')
        .update({
          total_points: newStats.totalPoints,
          total_quizzes: newStats.totalQuizzes,
          correct_answers: newStats.correctAnswers,
          current_streak: newStats.currentStreak,
          longest_streak: newStats.longestStreak,
          last_played_date: newStats.lastPlayedDate,
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('quiz_stats')
        .insert({
          user_id: userId,
          total_points: newStats.totalPoints,
          total_quizzes: newStats.totalQuizzes,
          correct_answers: newStats.correctAnswers,
          current_streak: newStats.currentStreak,
          longest_streak: newStats.longestStreak,
          last_played_date: newStats.lastPlayedDate,
        });
    }
  }, [userId]);

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
      const estimatedPercentile = Math.min(99, Math.floor(50 + (newTotalPoints / 100)));

      const newStats: UserQuizStats = {
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

      // Sync to database
      syncToDatabase(newStats);

      return newStats;
    });
  }, [checkStreak, syncToDatabase]);

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
    isAuthenticated: !!userId,
    updateStats,
    canPlayToday,
    checkStreak,
    resetStats,
  };
}
