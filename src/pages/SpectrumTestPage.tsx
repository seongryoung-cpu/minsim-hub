import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { SpectrumIntroScreen } from '@/components/spectrum/SpectrumIntroScreen';
import { SpectrumSwipeCard, SpectrumSwipeControls } from '@/components/spectrum/SpectrumSwipeCard';
import { SpectrumProgressBar } from '@/components/spectrum/SpectrumProgressBar';
import { SpectrumResultScreen } from '@/components/spectrum/SpectrumResultScreen';

import { useSpectrumQuestions, useUpsertSpectrum, useSaveAnswer } from '@/hooks/useSpectrum';
import { useAuthContext } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activityLogger';
import { 
  updateSpectrum, 
  selectNextQuestion, 
  shouldTerminate,
} from '@/lib/bayesianEngine';
import { 
  getInitialSpectrumScores, 
  getInitialUncertainties,
  type SpectrumScores,
  type SpectrumUncertainties,
  type SpectrumQuestion,
} from '@/types/spectrum';

type GameStep = 'intro' | 'test' | 'result';

interface AnswerHistory {
  questionId: string;
  answerValue: number;
  prevScores: SpectrumScores;
  prevUncertainties: SpectrumUncertainties;
}

export function SpectrumTestPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const upsertSpectrum = useUpsertSpectrum();
  const saveAnswer = useSaveAnswer();

  const [currentStep, setCurrentStep] = useState<GameStep>('intro');
  const [sessionId] = useState(() => uuidv4());
  const [scores, setScores] = useState<SpectrumScores>(getInitialSpectrumScores());
  const [uncertainties, setUncertainties] = useState<SpectrumUncertainties>(getInitialUncertainties());
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [answerHistory, setAnswerHistory] = useState<AnswerHistory[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<SpectrumQuestion | null>(null);
  const [currentInfoGain, setCurrentInfoGain] = useState(0);

  // 질문 로드
  const { data: questions, isLoading } = useSpectrumQuestions();

  // 다음 질문 선택
  const selectNext = useCallback(() => {
    if (!questions?.length) return;
    
    const { question, informationGain } = selectNextQuestion(
      uncertainties,
      questions,
      answeredQuestionIds
    );
    
    setCurrentQuestion(question);
    setCurrentInfoGain(informationGain);
  }, [questions, uncertainties, answeredQuestionIds]);

  // 테스트 시작 시 첫 질문 선택
  useEffect(() => {
    if (currentStep === 'test' && !currentQuestion && questions?.length) {
      selectNext();
    }
  }, [currentStep, currentQuestion, questions, selectNext]);

  // 스와이프 핸들러
  const handleSwipe = useCallback((answerValue: number) => {
    if (!currentQuestion) return;

    // 히스토리 저장 (undo용)
    setAnswerHistory(prev => [...prev, {
      questionId: currentQuestion.id,
      answerValue,
      prevScores: scores,
      prevUncertainties: uncertainties,
    }]);

    // 베이지안 업데이트
    const { scores: newScores, uncertainties: newUncertainties } = updateSpectrum(
      scores,
      uncertainties,
      currentQuestion,
      answerValue
    );

    setScores(newScores);
    setUncertainties(newUncertainties);
    setAnsweredQuestionIds(prev => [...prev, currentQuestion.id]);

    // 답변 저장 (로그인 사용자만)
    if (isAuthenticated) {
      saveAnswer.mutate({
        sessionId,
        questionId: currentQuestion.id,
        answerValue,
        informationGain: currentInfoGain,
      });
    }

    // 종료 조건 확인
    const shouldEnd = shouldTerminate(
      newUncertainties, 
      0.25, 
      5, 
      answeredQuestionIds.length + 1
    );

    if (shouldEnd || answeredQuestionIds.length + 1 >= (questions?.length || 0)) {
      // 결과 화면으로
      handleComplete(newScores, newUncertainties);
    } else {
      // 다음 질문
      setTimeout(() => {
        const { question, informationGain } = selectNextQuestion(
          newUncertainties,
          questions || [],
          [...answeredQuestionIds, currentQuestion.id]
        );
        setCurrentQuestion(question);
        setCurrentInfoGain(informationGain);
      }, 200);
    }
  }, [currentQuestion, scores, uncertainties, answeredQuestionIds, questions, isAuthenticated, sessionId, currentInfoGain, saveAnswer]);

  // 완료 처리
  const handleComplete = useCallback(async (
    finalScores: SpectrumScores, 
    finalUncertainties: SpectrumUncertainties
  ) => {
    setCurrentStep('result');

    logActivity({
      activityType: 'spectrum_complete',
      description: '정치 스펙트럼 테스트 완료',
      metadata: { totalAnswers: answeredQuestionIds.length + 1 },
    });

    // 결과 저장 (로그인 사용자만)
    if (isAuthenticated) {
      try {
        await upsertSpectrum.mutateAsync({
          scores: finalScores,
          uncertainties: finalUncertainties,
          totalAnswers: answeredQuestionIds.length + 1,
          sessionId,
        });
        toast.success('결과가 저장되었습니다');
      } catch (error) {
        console.error('Failed to save spectrum:', error);
      }
    }
  }, [answeredQuestionIds.length, isAuthenticated, sessionId, upsertSpectrum]);

  // Undo
  const handleUndo = useCallback(() => {
    if (answerHistory.length === 0) return;

    const lastAnswer = answerHistory[answerHistory.length - 1];
    
    setScores(lastAnswer.prevScores);
    setUncertainties(lastAnswer.prevUncertainties);
    setAnsweredQuestionIds(prev => prev.filter(id => id !== lastAnswer.questionId));
    setAnswerHistory(prev => prev.slice(0, -1));
    
    // 이전 질문으로 돌아가기
    const prevQuestion = questions?.find(q => q.id === lastAnswer.questionId);
    if (prevQuestion) {
      setCurrentQuestion(prevQuestion);
    }
  }, [answerHistory, questions]);

  // 재시작
  const handleRestart = useCallback(() => {
    setScores(getInitialSpectrumScores());
    setUncertainties(getInitialUncertainties());
    setAnsweredQuestionIds([]);
    setAnswerHistory([]);
    setCurrentQuestion(null);
    setCurrentStep('test');
  }, []);

  // 공유
  const handleShare = useCallback(() => {
    const shareText = `나의 정치 스펙트럼 테스트 결과를 확인해보세요!`;
    
    if (navigator.share) {
      navigator.share({
        title: '정치 스펙트럼 테스트',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('클립보드에 복사되었습니다');
    }
  }, []);

  // 시작
  const handleStart = useCallback(() => {
    setCurrentStep('test');
  }, []);

  // 홈으로
  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // 로딩
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!questions?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">질문 데이터를 불러올 수 없습니다.</p>
          <button onClick={() => navigate(-1)} className="text-primary underline">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 인트로 화면
  if (currentStep === 'intro') {
    return <SpectrumIntroScreen onStart={handleStart} questionCount={questions.length} />;
  }

  // 결과 화면
  if (currentStep === 'result') {
    return (
      <SpectrumResultScreen
        scores={scores}
        uncertainties={uncertainties}
        totalAnswers={answeredQuestionIds.length}
        onRestart={handleRestart}
        onShare={handleShare}
        onHome={handleHome}
      />
    );
  }

  // 테스트 화면
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background to-background flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
          <span className="font-semibold">정치 스펙트럼 테스트</span>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 py-4">
        <SpectrumProgressBar
          uncertainties={uncertainties}
          answeredCount={answeredQuestionIds.length}
          totalQuestions={questions.length}
        />
      </div>

      {/* Card Stack */}
      <div className="flex-1 px-4 pb-2 relative">
        <div className="relative h-[400px] sm:h-[450px] max-w-md mx-auto">
          <AnimatePresence mode="popLayout">
            {/* Background cards */}
            {questions
              .filter(q => !answeredQuestionIds.includes(q.id) && q.id !== currentQuestion?.id)
              .slice(0, 2)
              .map((q, i) => (
                <motion.div
                  key={q.id}
                  className="absolute inset-0 bg-card rounded-3xl shadow-lg border border-border/30"
                  initial={{ scale: 0.92 - i * 0.04, y: 16 + i * 8 }}
                  animate={{ scale: 0.92 - i * 0.04, y: 16 + i * 8 }}
                  style={{ zIndex: -i - 1 }}
                />
              ))}

            {/* Current Card */}
            {currentQuestion && (
              <SpectrumSwipeCard
                key={currentQuestion.id}
                question={currentQuestion}
                onSwipe={handleSwipe}
                cardNumber={answeredQuestionIds.length + 1}
                totalCards={questions.length}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 pb-24 lg:pb-8">
        {currentQuestion && (
          <SpectrumSwipeControls
            onSwipeLeft={() => handleSwipe(-0.8)}
            onSwipeRight={() => handleSwipe(0.8)}
            onUndo={handleUndo}
            canUndo={answerHistory.length > 0}
            leftLabel={currentQuestion.leftLabel}
            rightLabel={currentQuestion.rightLabel}
          />
        )}
      </div>
    </motion.div>
  );
}

export default SpectrumTestPage;
