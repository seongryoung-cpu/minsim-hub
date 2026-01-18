import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MbtiIntroScreen } from '@/components/political-mbti/MbtiIntroScreen';
import { MbtiSwipeCard, MbtiSwipeControls } from '@/components/political-mbti/MbtiSwipeCard';
import { MbtiResultScreen } from '@/components/political-mbti/MbtiResultScreen';
import { useMbtiQuestions, useMbtiTypes, useSaveMbtiResult } from '@/hooks/usePoliticalMbti';
import { useAuthContext } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activityLogger';
import { 
  type MbtiAnswer, 
  type AxisScores, 
  type MbtiType,
  getInitialAxisScores, 
  calculateMbtiType 
} from '@/types/political-mbti';

type GameStep = 'intro' | 'swipe' | 'result';

export function PoliticalMbtiPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const saveResult = useSaveMbtiResult();

  const [currentStep, setCurrentStep] = useState<GameStep>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<MbtiAnswer[]>([]);
  const [axisScores, setAxisScores] = useState<AxisScores>(getInitialAxisScores());
  const [hasSaved, setHasSaved] = useState(false);

  // DB에서 질문과 유형 로드
  const { data: questions, isLoading: questionsLoading } = useMbtiQuestions();
  const { data: mbtiTypes, isLoading: typesLoading } = useMbtiTypes();

  const isLoading = questionsLoading || typesLoading;
  const currentQuestion = questions?.[currentIndex];
  const progress = questions?.length ? ((currentIndex) / questions.length) * 100 : 0;

  // 결과 유형 계산
  const resultType = useMemo((): MbtiType | null => {
    if (currentStep !== 'result' || !mbtiTypes) return null;
    const typeCode = calculateMbtiType(axisScores);
    return mbtiTypes.find(t => t.typeCode === typeCode) || null;
  }, [currentStep, axisScores, mbtiTypes]);

  // 스와이프 핸들러
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentQuestion || !questions) return;

    const axisValue = direction === 'left' 
      ? currentQuestion.leftAxisValue 
      : currentQuestion.rightAxisValue;

    const newAnswer: MbtiAnswer = {
      questionId: currentQuestion.id,
      axis: currentQuestion.axis,
      direction,
      axisValue,
    };

    setAnswers(prev => [...prev, newAnswer]);

    // 점수 업데이트
    setAxisScores(prev => {
      const newScores = { ...prev };
      const axis = currentQuestion.axis as keyof AxisScores;
      const value = axisValue as keyof AxisScores[typeof axis];
      
      if (newScores[axis] && value in newScores[axis]) {
        (newScores[axis] as Record<string, number>)[value] = 
          ((newScores[axis] as Record<string, number>)[value] || 0) + 1;
      }
      
      return newScores;
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 완료 → 결과 화면
      handleComplete();
    }
  }, [currentQuestion, currentIndex, questions]);

  // 완료 처리
  const handleComplete = useCallback(async () => {
    setCurrentStep('result');

    // 로그 기록
    logActivity({
      activityType: 'mbti_complete',
      description: '정치 MBTI 테스트 완료',
      metadata: { totalQuestions: questions?.length || 0 },
    });

    // 결과 저장 (로그인 사용자만)
    if (isAuthenticated && !hasSaved && mbtiTypes) {
      const typeCode = calculateMbtiType(axisScores);
      try {
        await saveResult.mutateAsync({
          typeCode,
          axisScores,
          answers,
        });
        setHasSaved(true);
        toast.success('결과가 저장되었습니다');
      } catch (error) {
        console.error('Failed to save MBTI result:', error);
      }
    }
  }, [isAuthenticated, hasSaved, mbtiTypes, axisScores, answers, questions?.length, saveResult]);

  // Undo
  const handleUndo = useCallback(() => {
    if (answers.length > 0 && currentIndex > 0) {
      const lastAnswer = answers[answers.length - 1];
      
      // 점수 롤백
      setAxisScores(prev => {
        const newScores = { ...prev };
        const axis = lastAnswer.axis as keyof AxisScores;
        const value = lastAnswer.axisValue as keyof AxisScores[typeof axis];
        
        if (newScores[axis] && value in newScores[axis]) {
          (newScores[axis] as Record<string, number>)[value] = 
            Math.max(0, ((newScores[axis] as Record<string, number>)[value] || 0) - 1);
        }
        
        return newScores;
      });

      setAnswers(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);
    }
  }, [answers, currentIndex]);

  // 재시작
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setAxisScores(getInitialAxisScores());
    setCurrentStep('swipe');
    setHasSaved(false);
  }, []);

  // 시작
  const handleStart = useCallback(() => {
    setCurrentStep('swipe');
  }, []);

  // 공유
  const handleShare = useCallback(() => {
    if (!resultType) return;
    
    const shareText = `나의 정치 MBTI는 ${resultType.typeCode} (${resultType.name})! 당신의 정치 성향은?`;
    
    if (navigator.share) {
      navigator.share({
        title: '정치 MBTI 테스트',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('클립보드에 복사되었습니다');
    }
  }, [resultType]);

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
  if (!questions?.length || !mbtiTypes?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
          <button onClick={() => navigate(-1)} className="text-primary underline">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 인트로 화면
  if (currentStep === 'intro') {
    return <MbtiIntroScreen onStart={handleStart} questionCount={questions.length} />;
  }

  // 결과 화면
  if (currentStep === 'result' && resultType) {
    return (
      <MbtiResultScreen 
        mbtiType={resultType}
        axisScores={axisScores}
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
          <span className="font-semibold">정치 MBTI</span>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary/50">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Card Counter */}
      <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-semibold">
          <span className="text-primary text-lg">{currentIndex + 1}</span>
          <span className="text-muted-foreground"> / {questions.length}</span>
        </span>
        <span className="text-xs text-muted-foreground px-3 py-1.5 bg-secondary/70 rounded-full">
          좌우로 스와이프
        </span>
      </div>

      {/* Card Stack */}
      <div className="flex-1 px-4 pb-2 relative">
        <div className="relative h-[400px] sm:h-[450px] max-w-md mx-auto">
          <AnimatePresence mode="popLayout">
            {/* Background cards */}
            {questions.slice(currentIndex + 1, currentIndex + 3).map((q, i) => (
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
              <MbtiSwipeCard
                key={currentQuestion.id}
                question={currentQuestion}
                isTop={true}
                onSwipe={handleSwipe}
                cardNumber={currentIndex + 1}
                totalCards={questions.length}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 pb-24 lg:pb-8">
        {currentQuestion && (
          <MbtiSwipeControls
            onSwipeLeft={() => handleSwipe('left')}
            onSwipeRight={() => handleSwipe('right')}
            onUndo={handleUndo}
            canUndo={answers.length > 0}
            leftLabel={currentQuestion.leftLabel}
            rightLabel={currentQuestion.rightLabel}
          />
        )}
      </div>
    </motion.div>
  );
}
