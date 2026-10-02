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
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // 오늘(KST) 이미 제출했는지 — 서버(get_daily_quiz_status)가 판정한다. 비로그인은 항상 false
  const [playedToday, setPlayedToday] = useState(false);
  const isLoaded = isLocalLoaded && isAuthChecked;

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
    setIsLocalLoaded(true);
  }, []);

  // Check for authenticated user and sync with DB
  useEffect(() => {
    const fetchPlayedToday = async () => {
      const { data, error } = await supabase.rpc('get_daily_quiz_status');
      // 조회에 실패하면 '가능'으로 둔다. 실제 중복 제출은 submit_daily_quiz가 already_submitted로 막는다
      setPlayedToday(!error && (data as { played_today?: boolean } | null)?.played_today === true);
    };

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlayedToday(false);
        setIsAuthChecked(true);
        return;
      }
      setUserId(user.id);
      await fetchPlayedToday();
      setIsAuthChecked(true);

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
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        // 새로 로그인했을 때만 다시 판정 (첫 세션은 checkUser가 처리, 리스너 안에서 바로 await하지 않음)
        if (event === 'SIGNED_IN') setTimeout(() => { void fetchPlayedToday(); }, 0);
      } else {
        setUserId(null);
        setPlayedToday(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage when stats change
  useEffect(() => {
    if (isLocalLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats, isLocalLoaded]);

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

  /** 오늘 점수가 반영되는 정식 도전이 가능한지. 판정은 서버 기준(KST, quiz_stats.updated_at) */
  const canPlayToday = useCallback(() => !playedToday, [playedToday]);

  /** 정식 제출이 끝났거나 서버가 already_submitted를 돌려줬을 때 호출 */
  const markPlayedToday = useCallback(() => setPlayedToday(true), []);

  const resetStats = useCallback(() => {
    setStats(getInitialStats());
  }, []);

  return {
    stats,
    isLoaded,
    isAuthenticated: !!userId,
    updateStats,
    canPlayToday,
    markPlayedToday,
    checkStreak,
    resetStats,
  };
}
