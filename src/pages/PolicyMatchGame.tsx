import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Heart } from 'lucide-react';
import { SwipeCard, SwipeControls } from '@/components/policy-match/SwipeCard';
import { MatchResultScreen } from '@/components/policy-match/MatchResultScreen';
import { POLICY_CARDS, type PolicyCard, type MatchResult } from '@/types/policy';
import { SEOUL_MAYOR_CANDIDATES, GYEONGGI_GOVERNOR_CANDIDATES } from '@/types/election';
import { useRegion } from '@/hooks/useRegion';

type SwipeDirection = 'left' | 'right';
type UserChoice = { cardId: string; direction: SwipeDirection };

export function PolicyMatchGame() {
  const navigate = useNavigate();
  const { region } = useRegion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<UserChoice[]>([]);
  const [isComplete, setIsComplete] = useState(false);

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

  // 결과 계산
  const calculateResults = useCallback((): MatchResult[] => {
    const scores: Record<string, { agree: number; disagree: number; total: number }> = {};

    // 각 후보자별 점수 초기화
    candidates.forEach(c => {
      scores[c.id] = { agree: 0, disagree: 0, total: 0 };
    });

    // 사용자 선택에 따른 점수 계산
    choices.forEach(choice => {
      const card = POLICY_CARDS.find(p => p.id === choice.cardId);
      if (!card) return;

      const userAgrees = choice.direction === 'right';

      card.candidateAlignment.forEach(alignment => {
        if (!scores[alignment.candidateId]) return;

        if (alignment.stance === 'agree' && userAgrees) {
          scores[alignment.candidateId].agree += 2;
          scores[alignment.candidateId].total += 2;
        } else if (alignment.stance === 'disagree' && !userAgrees) {
          scores[alignment.candidateId].agree += 2;
          scores[alignment.candidateId].total += 2;
        } else if (alignment.stance === 'neutral') {
          scores[alignment.candidateId].agree += 1;
          scores[alignment.candidateId].total += 2;
        } else if (
          (alignment.stance === 'agree' && !userAgrees) ||
          (alignment.stance === 'disagree' && userAgrees)
        ) {
          scores[alignment.candidateId].disagree += 1;
          scores[alignment.candidateId].total += 2;
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
      };
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [choices, candidates]);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const newChoice: UserChoice = {
      cardId: currentCard.id,
      direction,
    };
    setChoices(prev => [...prev, newChoice]);

    if (currentIndex < POLICY_CARDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
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
    setIsComplete(false);
  }, []);

  const results = useMemo(() => {
    if (isComplete) {
      return calculateResults();
    }
    return [];
  }, [isComplete, calculateResults]);

  // 결과 화면
  if (isComplete) {
    return <MatchResultScreen results={results} onRestart={handleRestart} />;
  }

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
            <span className="font-semibold">정책 매칭</span>
            <Heart size={18} className="text-red-500" />
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Card Counter */}
      <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {POLICY_CARDS.length}
        </span>
        <span className="text-xs text-muted-foreground">
          좌우로 스와이프하세요
        </span>
      </div>

      {/* Card Stack */}
      <div className="flex-1 px-4 pb-4 relative">
        <div className="relative h-[400px] sm:h-[450px] max-w-md mx-auto">
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
