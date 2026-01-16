import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, X, Loader2 } from 'lucide-react';
import { SwipeCard, SwipeControls } from '@/components/policy-match/SwipeCard';
import { PreRevealScreen } from '@/components/policy-match/PreRevealScreen';
import { RadarResultScreen } from '@/components/policy-match/RadarResultScreen';
import { SentimentShiftScreen } from '@/components/policy-match/SentimentShiftScreen';
import { GameIntroScreen } from '@/components/policy-match/GameIntroScreen';
import { JourneyProgress } from '@/components/policy-match/JourneyProgress';
import { CategoryInsights } from '@/components/policy-match/CategoryInsights';
import { 
  POLICY_CARDS as FALLBACK_POLICY_CARDS, 
  POLICY_CATEGORIES,
  type MatchResult, 
  type UserChoice,
  type PreferredCandidate,
  type CategoryScore,
  type PolicyCard,
} from '@/types/policy';
import { usePolicyCards } from '@/hooks/usePolicyCards';
import { useSavePolicyMatchResult } from '@/hooks/usePolicyMatchResults';
import { useCandidates } from '@/hooks/useCandidates';
import { useRegion } from '@/hooks/useRegion';
import { useAuthContext } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activityLogger';
import { toast } from 'sonner';

export type GameStep = 'intro' | 'swipe' | 'pre-reveal' | 'result' | 'sentiment';

export function PolicyMatchGame() {
  const navigate = useNavigate();
  const { region } = useRegion();
  const { isAuthenticated } = useAuthContext();
  const saveResult = useSavePolicyMatchResult();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<UserChoice[]>([]);
  const [currentStep, setCurrentStep] = useState<GameStep>('intro');
  const [userPreference, setUserPreference] = useState<PreferredCandidate>(null);
  const [hasSaved, setHasSaved] = useState(false);

  // DB에서 정책 카드 로드
  const { data: dbPolicyCards, isLoading: cardsLoading } = usePolicyCards(region?.sido);
  
  // DB에서 후보자 로드
  const { data: dbCandidates, isLoading: candidatesLoading } = useCandidates(region?.sido);

  // DB 데이터가 있으면 사용, 없으면 폴백 데이터 사용
  const policyCards: PolicyCard[] = useMemo(() => {
    if (dbPolicyCards && dbPolicyCards.length > 0) {
      return dbPolicyCards;
    }
    // 폴백: 하드코딩된 데이터 사용
    return FALLBACK_POLICY_CARDS;
  }, [dbPolicyCards]);

  // 후보자 데이터 변환
  const candidates = useMemo(() => {
    if (dbCandidates && dbCandidates.length > 0) {
      return dbCandidates.map(c => ({
        id: c.id,
        name: c.name,
        party: c.party,
        partyColor: c.partyColor,
        image: c.image,
        summary: c.summary,
        position: c.position,
      }));
    }
    // 폴백 없음 - DB 후보자만 사용
    return [];
  }, [dbCandidates]);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const cats = [...new Set(policyCards.map(c => c.category))];
    return cats.length > 0 ? cats : POLICY_CATEGORIES;
  }, [policyCards]);

  const isLoading = cardsLoading || candidatesLoading;
  const currentCard = policyCards[currentIndex];
  const progress = policyCards.length > 0 ? ((currentIndex) / policyCards.length) * 100 : 0;

  // 카테고리별 점수 계산
  const calculateCategoryScores = useCallback((candidateId: string): CategoryScore[] => {
    const categoryData: Record<string, { userTotal: number; candidateTotal: number; count: number }> = {};

    categories.forEach(cat => {
      categoryData[cat] = { userTotal: 0, candidateTotal: 0, count: 0 };
    });

    choices.forEach(choice => {
      const card = policyCards.find(p => p.id === choice.cardId);
      if (!card) return;

      const alignment = card.candidateAlignment.find(a => a.candidateId === candidateId);
      if (!alignment) return;

      const userScore = choice.direction === 'right' ? 100 : 0;
      const candidateScore = alignment.stance === 'agree' 
        ? alignment.intensity * 20 
        : alignment.stance === 'disagree' 
          ? 100 - (alignment.intensity * 20)
          : 50;

      if (categoryData[card.category]) {
        categoryData[card.category].userTotal += userScore;
        categoryData[card.category].candidateTotal += candidateScore;
        categoryData[card.category].count += 1;
      }
    });

    return categories.map(category => ({
      category,
      userScore: categoryData[category]?.count > 0 
        ? Math.round(categoryData[category].userTotal / categoryData[category].count)
        : 50,
      candidateScore: categoryData[category]?.count > 0
        ? Math.round(categoryData[category].candidateTotal / categoryData[category].count)
        : 50,
    }));
  }, [choices, policyCards, categories]);

  // 결과 계산
  const calculateResults = useCallback((): MatchResult[] => {
    const scores: Record<string, { agree: number; total: number }> = {};

    // 각 후보자별 점수 초기화
    candidates.forEach(c => {
      scores[c.id] = { agree: 0, total: 0 };
    });

    // 사용자 선택에 따른 점수 계산 (intensity 반영)
    choices.forEach(choice => {
      const card = policyCards.find(p => p.id === choice.cardId);
      if (!card) return;

      const userAgrees = choice.direction === 'right';

      card.candidateAlignment.forEach(alignment => {
        if (!scores[alignment.candidateId]) return;

        const weight = alignment.intensity;
        
        if (alignment.stance === 'agree' && userAgrees) {
          scores[alignment.candidateId].agree += weight;
          scores[alignment.candidateId].total += weight;
        } else if (alignment.stance === 'disagree' && !userAgrees) {
          scores[alignment.candidateId].agree += weight;
          scores[alignment.candidateId].total += weight;
        } else if (alignment.stance === 'neutral') {
          scores[alignment.candidateId].agree += weight * 0.5;
          scores[alignment.candidateId].total += weight;
        } else {
          scores[alignment.candidateId].total += weight;
        }
      });
    });

    // 결과 변환 및 정렬
    const results: MatchResult[] = candidates.map(candidate => {
      const score = scores[candidate.id];
      const matchScore = score?.total > 0 
        ? Math.round((score.agree / score.total) * 100)
        : 50;

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        party: candidate.party,
        partyColor: candidate.partyColor,
        matchScore,
        agreedPolicies: [],
        disagreedPolicies: [],
        categoryScores: calculateCategoryScores(candidate.id),
      };
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [choices, candidates, policyCards, calculateCategoryScores]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentCard) return;
    
    const newChoice: UserChoice = {
      cardId: currentCard.id,
      direction,
    };
    setChoices(prev => [...prev, newChoice]);

    if (currentIndex < policyCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 스와이프 완료 → Pre-reveal 단계로
      setCurrentStep('pre-reveal');
    }
  }, [currentCard, currentIndex, policyCards.length]);

  const handleUndo = useCallback(() => {
    if (choices.length > 0 && currentIndex > 0) {
      setChoices(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);
    }
  }, [choices.length, currentIndex]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setChoices([]);
    setCurrentStep('swipe');
    setUserPreference(null);
    setHasSaved(false);
  }, []);

  const handleStart = useCallback(() => {
    setCurrentStep('swipe');
  }, []);

  const handlePreferenceSelect = useCallback((preference: PreferredCandidate) => {
    setUserPreference(preference);
    setCurrentStep('result');
    
    // 정책 매칭 완료 로깅
    logActivity({
      activityType: 'policy_match_complete',
      description: `정책 매칭 완료: ${policyCards.length}개 질문`,
      metadata: { totalQuestions: policyCards.length, preference },
    });
  }, [policyCards.length]);

  // 결과 계산 (먼저 정의해야 handleContinueToSentiment에서 사용 가능)
  const results = useMemo(() => {
    if (currentStep !== 'swipe' && currentStep !== 'intro') {
      return calculateResults();
    }
    return [];
  }, [currentStep, calculateResults]);

  const categoryScores = useMemo(() => {
    const scoresMap: Record<string, CategoryScore[]> = {};
    candidates.forEach(c => {
      scoresMap[c.id] = calculateCategoryScores(c.id);
    });
    return scoresMap;
  }, [candidates, calculateCategoryScores]);

  const handleContinueToSentiment = useCallback(async () => {
    setCurrentStep('sentiment');
    
    // 결과 저장 (로그인한 사용자만, 한 번만)
    if (isAuthenticated && !hasSaved && results.length > 0) {
      const topMatch = results[0];
      try {
        await saveResult.mutateAsync({
          region_name: region?.sido || '전국',
          top_match_candidate_id: topMatch.candidateId,
          top_match_candidate_name: topMatch.candidateName,
          top_match_score: topMatch.matchScore,
          preferred_candidate_id: userPreference?.candidateId || null,
          preferred_candidate_name: userPreference?.candidateName || null,
          results: results,
          choices: choices,
          total_questions: policyCards.length,
        });
        setHasSaved(true);
        toast.success('결과가 저장되었습니다');
      } catch (error) {
        console.error('Failed to save result:', error);
      }
    }
  }, [isAuthenticated, hasSaved, results, userPreference, region?.sido, choices, policyCards.length, saveResult]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">정책 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (policyCards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">정책 데이터가 없습니다.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary underline"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Step 0: 인트로 화면
  if (currentStep === 'intro') {
    return <GameIntroScreen onStart={handleStart} />;
  }

  // Step 2: Pre-reveal 화면
  if (currentStep === 'pre-reveal') {
    return (
      <PreRevealScreen 
        candidates={candidates} 
        onSelect={handlePreferenceSelect} 
      />
    );
  }

  // Step 3: Radar 결과 화면
  if (currentStep === 'result') {
    return (
      <RadarResultScreen 
        results={results}
        userPreference={userPreference}
        categoryScores={categoryScores}
        onContinue={handleContinueToSentiment}
      />
    );
  }

  // Step 4: Sentiment Shift 화면
  if (currentStep === 'sentiment') {
    return (
      <SentimentShiftScreen 
        results={results}
        userPreference={userPreference}
        onRestart={handleRestart}
      />
    );
  }

  // Step 1: 스와이프 게임
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
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
          
          {/* Journey Progress */}
          <JourneyProgress currentStep={currentStep} />
          
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary/50">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </header>

      {/* Card Counter */}
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-primary" />
          <span className="text-sm font-semibold">
            <span className="text-primary text-lg">{currentIndex + 1}</span>
            <span className="text-muted-foreground"> / {policyCards.length}</span>
          </span>
        </div>
        <motion.span 
          key={currentIndex}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground px-3 py-1.5 bg-secondary/70 rounded-full flex items-center gap-1"
        >
          <Heart size={10} className="text-red-400" />
          좌우로 스와이프
        </motion.span>
      </div>

      {/* Card Stack */}
      <div className="flex-1 px-4 pb-2 relative">
        <div className="relative h-[400px] sm:h-[450px] max-w-md mx-auto">
          <AnimatePresence mode="popLayout">
            {/* Background cards */}
            {policyCards.slice(currentIndex + 1, currentIndex + 3).map((card, i) => (
              <motion.div
                key={card.id}
                className="absolute inset-0 bg-card rounded-3xl shadow-lg border border-border/30"
                initial={{ scale: 0.92 - i * 0.04, y: 16 + i * 8 }}
                animate={{ scale: 0.92 - i * 0.04, y: 16 + i * 8 }}
                style={{ zIndex: -i - 1 }}
              />
            ))}

            {/* Current Card */}
            {currentCard && (
              <SwipeCard
                key={currentCard.id}
                card={currentCard}
                isTop={true}
                onSwipe={handleSwipe}
                cardNumber={currentIndex + 1}
                totalCards={policyCards.length}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category Insights (shows after 3 choices) */}
      {choices.length >= 3 && (
        <div className="px-4 pb-2">
          <CategoryInsights choices={choices} cards={policyCards} />
        </div>
      )}

      {/* Controls */}
      <div className="p-4 pb-24 lg:pb-8">
        <SwipeControls
          onSwipeLeft={() => handleSwipe('left')}
          onSwipeRight={() => handleSwipe('right')}
          onUndo={handleUndo}
          canUndo={choices.length > 0}
        />
      </div>
    </motion.div>
  );
}
