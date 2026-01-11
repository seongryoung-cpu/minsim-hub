import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Heart } from 'lucide-react';
import { SwipeCard, SwipeControls } from '@/components/policy-match/SwipeCard';
import { PreRevealScreen } from '@/components/policy-match/PreRevealScreen';
import { RadarResultScreen } from '@/components/policy-match/RadarResultScreen';
import { SentimentShiftScreen } from '@/components/policy-match/SentimentShiftScreen';
import { 
  POLICY_CARDS, 
  POLICY_CATEGORIES,
  type PolicyCard, 
  type MatchResult, 
  type UserChoice,
  type PreferredCandidate,
  type CategoryScore,
} from '@/types/policy';
import { SEOUL_MAYOR_CANDIDATES, GYEONGGI_GOVERNOR_CANDIDATES } from '@/types/election';
import { useRegion } from '@/hooks/useRegion';

type GameStep = 'swipe' | 'pre-reveal' | 'result' | 'sentiment';

export function PolicyMatchGame() {
  const navigate = useNavigate();
  const { region } = useRegion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<UserChoice[]>([]);
  const [currentStep, setCurrentStep] = useState<GameStep>('swipe');
  const [userPreference, setUserPreference] = useState<PreferredCandidate>(null);

  // 지역에 따른 후보자 필터링
  const candidates = useMemo(() => {
    if (region?.sido === '서울특별시') {
      return SEOUL_MAYOR_CANDIDATES;
    } else if (region?.sido === '경기도') {
      return GYEONGGI_GOVERNOR_CANDIDATES;
    }
    return [...SEOUL_MAYOR_CANDIDATES, ...GYEONGGI_GOVERNOR_CANDIDATES];
  }, [region?.sido]);

  const currentCard = POLICY_CARDS[currentIndex];
  const progress = ((currentIndex) / POLICY_CARDS.length) * 100;

  // 카테고리별 점수 계산
  const calculateCategoryScores = useCallback((candidateId: string): CategoryScore[] => {
    const categoryData: Record<string, { userTotal: number; candidateTotal: number; count: number }> = {};

    POLICY_CATEGORIES.forEach(cat => {
      categoryData[cat] = { userTotal: 0, candidateTotal: 0, count: 0 };
    });

    choices.forEach(choice => {
      const card = POLICY_CARDS.find(p => p.id === choice.cardId);
      if (!card) return;

      const alignment = card.candidateAlignment.find(a => a.candidateId === candidateId);
      if (!alignment) return;

      const userScore = choice.direction === 'right' ? 100 : 0;
      const candidateScore = alignment.stance === 'agree' 
        ? alignment.intensity * 20 
        : alignment.stance === 'disagree' 
          ? 100 - (alignment.intensity * 20)
          : 50;

      categoryData[card.category].userTotal += userScore;
      categoryData[card.category].candidateTotal += candidateScore;
      categoryData[card.category].count += 1;
    });

    return POLICY_CATEGORIES.map(category => ({
      category,
      userScore: categoryData[category].count > 0 
        ? Math.round(categoryData[category].userTotal / categoryData[category].count)
        : 50,
      candidateScore: categoryData[category].count > 0
        ? Math.round(categoryData[category].candidateTotal / categoryData[category].count)
        : 50,
    }));
  }, [choices]);

  // 결과 계산
  const calculateResults = useCallback((): MatchResult[] => {
    const scores: Record<string, { agree: number; total: number }> = {};

    // 각 후보자별 점수 초기화
    candidates.forEach(c => {
      scores[c.id] = { agree: 0, total: 0 };
    });

    // 사용자 선택에 따른 점수 계산 (intensity 반영)
    choices.forEach(choice => {
      const card = POLICY_CARDS.find(p => p.id === choice.cardId);
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
      const matchScore = score.total > 0 
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
  }, [choices, candidates, calculateCategoryScores]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const newChoice: UserChoice = {
      cardId: currentCard.id,
      direction,
    };
    setChoices(prev => [...prev, newChoice]);

    if (currentIndex < POLICY_CARDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 스와이프 완료 → Pre-reveal 단계로
      setCurrentStep('pre-reveal');
    }
  }, [currentCard?.id, currentIndex]);

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
  }, []);

  const handlePreferenceSelect = useCallback((preference: PreferredCandidate) => {
    setUserPreference(preference);
    setCurrentStep('result');
  }, []);

  const handleContinueToSentiment = useCallback(() => {
    setCurrentStep('sentiment');
  }, []);

  const results = useMemo(() => {
    if (currentStep !== 'swipe') {
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
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            <span className="font-semibold">정책 밸런스 게임</span>
            <Heart size={18} className="text-red-500" />
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-secondary">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Card Counter */}
      <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-medium">
          <span className="text-primary">{currentIndex + 1}</span>
          <span className="text-muted-foreground"> / {POLICY_CARDS.length}</span>
        </span>
        <span className="text-xs text-muted-foreground px-3 py-1 bg-secondary rounded-full">
          좌우로 스와이프
        </span>
      </div>

      {/* Card Stack */}
      <div className="flex-1 px-4 pb-4 relative">
        <div className="relative h-[420px] sm:h-[480px] max-w-md mx-auto">
          <AnimatePresence mode="popLayout">
            {/* Background cards */}
            {POLICY_CARDS.slice(currentIndex + 1, currentIndex + 3).map((card, i) => (
              <motion.div
                key={card.id}
                className="absolute inset-0 bg-card rounded-3xl shadow-md"
                initial={{ scale: 0.9 - i * 0.05, y: 20 + i * 10 }}
                animate={{ scale: 0.9 - i * 0.05, y: 20 + i * 10 }}
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
              />
            )}
          </AnimatePresence>
        </div>
      </div>

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
