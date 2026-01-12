import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizIntroScreen } from '@/components/quiz/QuizIntroScreen';
import { QuizResultScreen } from '@/components/quiz/QuizResultScreen';
import { useQuizStats } from '@/hooks/useQuizStats';
import { DAILY_QUIZ_QUESTIONS } from '@/types/quiz';
import type { QuizResult, QuizCategory } from '@/types/quiz';

type QuizPhase = 'intro' | 'playing' | 'result';

export function QuizPage() {
  const navigate = useNavigate();
  const { stats, isLoaded, updateStats, canPlayToday } = useQuizStats();
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // 오늘의 퀴즈 5문제 선택 (랜덤 또는 날짜 기반)
  const todayQuestions = useMemo(() => {
    const shuffled = [...DAILY_QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);

  const currentQuestion = todayQuestions[currentQuestionIndex];
  const categories = useMemo(() => todayQuestions.map(q => q.category), [todayQuestions]);

  const handleStart = useCallback(() => {
    const canPlay = canPlayToday();
    setIsPracticeMode(!canPlay);
    setPhase('playing');
    setCurrentQuestionIndex(0);
    setResults([]);
  }, [canPlayToday]);

  const handleAnswer = useCallback((selectedIndex: number, isCorrect: boolean) => {
    const newResult: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedIndex,
      isCorrect,
      timeSpent: 0,
    };

    setResults(prev => [...prev, newResult]);

    if (currentQuestionIndex < todayQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 퀴즈 완료
      const allResults = [...results, newResult];
      if (!isPracticeMode) {
        updateStats(allResults, categories);
      }
      setPhase('result');
    }
  }, [currentQuestion, currentQuestionIndex, todayQuestions.length, results, isPracticeMode, updateStats, categories]);

  const handlePlayAgain = useCallback(() => {
    setPhase('intro');
  }, []);

  const earnedPoints = useMemo(() => {
    return results.reduce((sum, r, i) => {
      return sum + (r.isCorrect ? todayQuestions[i]?.points || 0 : 0);
    }, 0);
  }, [results, todayQuestions]);

  const correctCount = results.filter(r => r.isCorrect).length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header - only show during intro and playing */}
      {phase !== 'result' && (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              {phase === 'playing' ? '오늘의 퀴즈' : '정치 퀴즈'}
            </h1>
            <div className="w-10" />
          </div>
        </header>
      )}

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <QuizIntroScreen
            key="intro"
            stats={stats}
            canPlay={canPlayToday()}
            onStart={handleStart}
          />
        )}

        {phase === 'playing' && currentQuestion && (
          <motion.div
            key={`question-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="p-5 pb-32"
          >
            {isPracticeMode && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl text-center">
                <span className="text-sm text-amber-700">🔄 연습 모드 (점수 미반영)</span>
              </div>
            )}
            <QuizCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={todayQuestions.length}
              onAnswer={handleAnswer}
            />
          </motion.div>
        )}

        {phase === 'result' && (
          <QuizResultScreen
            key="result"
            correctAnswers={correctCount}
            totalQuestions={todayQuestions.length}
            earnedPoints={isPracticeMode ? 0 : earnedPoints}
            stats={stats}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
