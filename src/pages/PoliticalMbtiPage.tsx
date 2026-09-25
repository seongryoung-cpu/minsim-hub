import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SpectrumIntroScreen } from '@/components/political-mbti/SpectrumIntroScreen';
import { SpectrumSwipeCard, SpectrumSwipeControls } from '@/components/political-mbti/SpectrumSwipeCard';
import { SpectrumResultScreen } from '@/components/political-mbti/SpectrumResultScreen';
import { useSpectrumQuestions, useSaveSpectrum, useSaveSpectrumAnswer } from '@/hooks/useSpectrumTest';
import { useAuthContext } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activityLogger';
import { 
  type SpectrumScores, 
  type SpectrumUncertainty,
  type SpectrumQuestion,
  type DimensionKey,
  getInitialSpectrumScores, 
  getInitialUncertainty,
  updateBayesianScore,
  selectNextQuestion,
  getSpectrumLabel
} from '@/types/political-mbti';

type GameStep = 'intro' | 'swipe' | 'result';

export function PoliticalMbtiPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const saveSpectrum = useSaveSpectrum();
  const saveAnswer = useSaveSpectrumAnswer();

  const [currentStep, setCurrentStep] = useState<GameStep>('intro');
  const [scores, setScores] = useState<SpectrumScores>(getInitialSpectrumScores());
  const [uncertainty, setUncertainty] = useState<SpectrumUncertainty>(getInitialUncertainty());
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState<SpectrumQuestion | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [hasSaved, setHasSaved] = useState(false);

  // DB에서 질문 로드
  const { data: questions, isLoading } = useSpectrumQuestions();

  // 답변 수
  const totalAnswers = answeredIds.size;

  // 다음 질문 선택 (Bayesian Active Learning)
  useEffect(() => {
    if (currentStep === 'swipe' && questions && questions.length > 0) {
      const next = selectNextQuestion(questions, answeredIds, uncertainty);
      setCurrentQuestion(next);
      
      // 모든 질문 완료 시 결과로
      if (!next && answeredIds.size > 0) {
        handleComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, questions, answeredIds, uncertainty]);

  // 스와이프 핸들러
  const handleSwipe = useCallback((value: number) => {
    if (!currentQuestion) return;

    // 점수 업데이트 (Bayesian)
    const dimensions: DimensionKey[] = ['economy', 'security', 'gender', 'fairness', 'future'];
    const newScores = { ...scores };
    const newUncertainty = { ...uncertainty };

    dimensions.forEach(dim => {
      const weight = currentQuestion.weights[dim];
      if (weight !== 0) {
        const result = updateBayesianScore(
          scores[dim],
          uncertainty[dim],
          value,
          weight
        );
        newScores[dim] = result.score;
        newUncertainty[dim] = result.uncertainty;
      }
    });

    setScores(newScores);
    setUncertainty(newUncertainty);
    setAnsweredIds(prev => new Set([...prev, currentQuestion.id]));

    // 답변 저장 (비동기)
    if (isAuthenticated) {
      saveAnswer.mutate({
        questionId: currentQuestion.id,
        value,
        sessionId,
      });
    }
  }, [currentQuestion, scores, uncertainty, isAuthenticated, saveAnswer, sessionId]);

  // 완료 처리
  const handleComplete = useCallback(async () => {
    setCurrentStep('result');

    // 로그 기록
    logActivity({
      activityType: 'spectrum_complete',
      description: '정치 성향 테스트 완료',
      metadata: { totalAnswers: answeredIds.size },
    });

    // 결과 저장 (로그인 사용자만)
    if (isAuthenticated && !hasSaved) {
      try {
        await saveSpectrum.mutateAsync({
          scores,
          uncertainty,
          totalAnswers: answeredIds.size,
          sessionId,
        });
        setHasSaved(true);
        toast.success('결과가 저장되었습니다');
      } catch (error) {
        console.error('Failed to save spectrum result:', error);
      }
    }
  }, [isAuthenticated, hasSaved, scores, uncertainty, answeredIds.size, saveSpectrum, sessionId]);

  // 재시작
  const handleRestart = useCallback(() => {
    setScores(getInitialSpectrumScores());
    setUncertainty(getInitialUncertainty());
    setAnsweredIds(new Set());
    setCurrentQuestion(null);
    setCurrentStep('swipe');
    setHasSaved(false);
  }, []);

  // 시작
  const handleStart = useCallback(() => {
    setCurrentStep('swipe');
  }, []);

  // 공유
  const handleShare = useCallback(() => {
    const label = getSpectrumLabel(scores);
    const shareText = `나의 정치 성향: ${label || '중도'}! 당신의 정치 성향은?`;
    
    if (navigator.share) {
      navigator.share({
        title: '정치 성향 테스트',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('클립보드에 복사되었습니다');
    }
  }, [scores]);

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
          <p className="text-muted-foreground">질문을 불러올 수 없습니다.</p>
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
        uncertainty={uncertainty}
        totalAnswers={totalAnswers}
        onRestart={handleRestart}
        onShare={handleShare}
      />
    );
  }

  // 스와이프 화면
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
          <span className="font-semibold">정치 성향 테스트</span>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">
            <span className="text-primary text-lg">{totalAnswers + 1}</span>
            <span className="text-muted-foreground"> / {questions.length}</span>
          </span>
          <span className="text-xs text-muted-foreground px-3 py-1.5 bg-secondary/70 rounded-full">
            좌우로 스와이프
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalAnswers / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 px-4 py-4 relative">
        <div className="relative h-[400px] sm:h-[450px] max-w-md mx-auto">
          <AnimatePresence mode="popLayout">
            {/* Background cards */}
            {questions
              .filter(q => !answeredIds.has(q.id) && q.id !== currentQuestion?.id)
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
                cardNumber={totalAnswers + 1}
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
            onSwipeLeft={() => handleSwipe(-1)}
            onSwipeRight={() => handleSwipe(1)}
            canUndo={false}
            leftLabel={currentQuestion.leftLabel}
            rightLabel={currentQuestion.rightLabel}
          />
        )}
      </div>
    </motion.div>
  );
}
