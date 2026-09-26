import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizIntroScreen } from '@/components/quiz/QuizIntroScreen';
import { QuizResultScreen } from '@/components/quiz/QuizResultScreen';
import { useQuizStats } from '@/hooks/useQuizStats';
import { useDailyQuiz, submitDailyQuiz } from '@/hooks/useQuizQuestions';
import type { QuizAnswerInput, QuizAnswerResult } from '@/hooks/useQuizQuestions';
import { logActivity } from '@/lib/activityLogger';

type QuizPhase = 'intro' | 'playing' | 'result';

export function QuizPage() {
  const navigate = useNavigate();
  const { stats, isLoaded, canPlayToday } = useQuizStats();
  const { data: todayQuestions, isLoading: isQuestionsLoading } = useDailyQuiz();
  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // 서버 채점 결과 (마지막 문제 완료 후 집계)
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // 누적 답안 목록 (마지막 문제에서 한꺼번에 제출)
  const accumulatedAnswers = useRef<QuizAnswerInput[]>([]);

  const currentQuestion = todayQuestions?.[currentQuestionIndex];

  const handleStart = useCallback(() => {
    const canPlay = canPlayToday();
    setIsPracticeMode(!canPlay);
    setPhase('playing');
    setCurrentQuestionIndex(0);
    setEarnedPoints(0);
    setCorrectCount(0);
    accumulatedAnswers.current = [];
  }, [canPlayToday]);

  /**
   * QuizCard의 onAnswer prop: (selectedIndex) => Promise<QuizAnswerResult>
   * - 문제별로 서버에 채점 요청
   * - 마지막 문제면 전체 제출(submit_daily_quiz)로 stats까지 저장
   */
  const handleAnswer = useCallback(async (selectedIndex: number): Promise<QuizAnswerResult> => {
    if (!currentQuestion || !todayQuestions) {
      throw new Error('No current question');
    }

    const answer: QuizAnswerInput = {
      question_id: currentQuestion.id,
      selected_index: selectedIndex,
    };

    const newAccumulated = [...accumulatedAnswers.current, answer];
    accumulatedAnswers.current = newAccumulated;

    const isLast = currentQuestionIndex === todayQuestions.length - 1;

    // 마지막 문제: 전체 제출 (채점 + stats 저장)
    if (isLast && !isPracticeMode) {
      const response = await submitDailyQuiz(newAccumulated);

      const thisResult = response.results.find(r => r.question_id === currentQuestion.id);
      if (!thisResult) throw new Error('Result not found');

      setEarnedPoints(response.total_points ?? 0);
      setCorrectCount(response.correct_count ?? 0);

      logActivity({
        activityType: 'quiz_complete',
        description: `퀴즈 완료: ${response.correct_count}/${response.total_count} 정답`,
        metadata: {
          correctCount: response.correct_count,
          totalQuestions: response.total_count,
          totalPoints: response.total_points,
        },
      });

      // 결과 화면으로 전환 (약간의 딜레이로 애니메이션 확인 가능)
      setTimeout(() => setPhase('result'), 800);

      return thisResult;
    }

    // 연습 모드 또는 중간 문제: 단일 채점만
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_question_id: currentQuestion.id,
      p_selected_index: selectedIndex,
    });

    if (error) throw error;

    const result = data as QuizAnswerResult;

    if (isLast) {
      // 연습 모드 마지막 문제 — stats 없이 결과 화면으로
      setTimeout(() => setPhase('result'), 800);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }

    return result;
  }, [currentQuestion, currentQuestionIndex, todayQuestions, isPracticeMode]);

  const handlePlayAgain = useCallback(() => {
    setPhase('intro');
  }, []);

  if (!isLoaded || isQuestionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!todayQuestions || todayQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground text-center mb-4">
          오늘의 퀴즈가 준비되지 않았습니다.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          돌아가기
        </button>
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
