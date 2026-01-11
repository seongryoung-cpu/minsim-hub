import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Shield, Heart, Bell, Check, Share2, RotateCcw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MatchResult, PreferredCandidate, SentimentChoice } from '@/types/policy';

interface SentimentShiftScreenProps {
  results: MatchResult[];
  userPreference: PreferredCandidate;
  onRestart: () => void;
}

export function SentimentShiftScreen({ 
  results, 
  userPreference,
  onRestart 
}: SentimentShiftScreenProps) {
  const navigate = useNavigate();
  const [selectedChoice, setSelectedChoice] = useState<SentimentChoice>(null);
  const [savedCandidate, setSavedCandidate] = useState<string | null>(null);
  
  const topMatch = results[0];
  const preferredResult = userPreference 
    ? results.find(r => r.candidateId === userPreference.candidateId)
    : null;

  const isMatched = userPreference?.candidateId === topMatch.candidateId;

  const handleChoice = (choice: SentimentChoice) => {
    setSelectedChoice(choice);
    
    // 선택에 따른 후보 저장
    if (choice === 'switch') {
      setSavedCandidate(topMatch.candidateId);
    } else if (choice === 'stay' && userPreference) {
      setSavedCandidate(userPreference.candidateId);
    }
  };

  const handleSaveAndNotify = () => {
    // TODO: 실제 저장 로직 및 알림 설정
    console.log('Saved candidate:', savedCandidate);
    navigate('/');
  };

  // 이미 일치하는 경우 간소화된 화면
  if (isMatched || !userPreference) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background p-4 pb-24 lg:pb-8 flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
          >
            <Check size={40} className="text-green-500" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-3"
          >
            {isMatched ? '완벽한 매칭!' : '분석 완료!'}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8 leading-relaxed"
          >
            {isMatched 
              ? '감성과 이성이 모두 같은 방향을 가리키고 있어요.'
              : `정책 분석 결과 ${topMatch.candidateName} 후보와 가장 일치합니다.`
            }
          </motion.p>

          {/* Save Candidate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-card rounded-2xl p-6 shadow-lg mb-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `${topMatch.partyColor}20`,
                  border: `3px solid ${topMatch.partyColor}`,
                }}
              >
                <User size={28} style={{ color: topMatch.partyColor }} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">{topMatch.candidateName}</h3>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${topMatch.partyColor}20`,
                    color: topMatch.partyColor,
                  }}
                >
                  {topMatch.party}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold" style={{ color: topMatch.partyColor }}>
                  {topMatch.matchScore}%
                </span>
                <p className="text-xs text-muted-foreground">일치</p>
              </div>
            </div>
            
            <button
              onClick={handleSaveAndNotify}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: topMatch.partyColor }}
            >
              <Heart size={18} />
              관심 후보로 저장하기
            </button>
          </motion.div>

          {/* Notification Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Bell size={14} />
            <span>저장 시 당내경선, 본선 공약 업데이트 알림을 받습니다</span>
          </motion.div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-4 rounded-xl bg-secondary font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            다시하기
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            결과 공유
          </button>
        </div>
      </motion.div>
    );
  }

  // 불일치 시 선택 화면
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 pb-24 lg:pb-8"
    >
      {/* Header */}
      <div className="text-center mb-8 pt-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-3"
        >
          마음의 변화가 있으신가요?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground leading-relaxed"
        >
          정책 분석 결과를 보신 후,<br />
          어떤 생각이 드시나요?
        </motion.p>
      </div>

      {/* Choice Cards */}
      <div className="space-y-4 mb-8">
        {/* Switch to Algorithm Recommendation */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => handleChoice('switch')}
          className={`w-full bg-card rounded-2xl p-5 text-left transition-all ${
            selectedChoice === 'switch' 
              ? 'ring-2 ring-indigo-500 shadow-lg' 
              : 'shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <RefreshCw size={24} className="text-indigo-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                정책이 더 중요해요
                {selectedChoice === 'switch' && (
                  <Check size={18} className="text-indigo-500" />
                )}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {topMatch.candidateName}
                </span> 후보의 정책이 저와 맞네요.<br />
                추천 후보로 마음이 기울었습니다.
              </p>
            </div>
          </div>
        </motion.button>

        {/* Stay with Original Preference */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => handleChoice('stay')}
          className={`w-full bg-card rounded-2xl p-5 text-left transition-all ${
            selectedChoice === 'stay' 
              ? 'ring-2 ring-red-500 shadow-lg' 
              : 'shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                인물과 정당을 믿어요
                {selectedChoice === 'stay' && (
                  <Check size={18} className="text-red-500" />
                )}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                정책이 달라도{' '}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {userPreference.candidateName}
                </span> 후보를<br />
                계속 지지하겠습니다.
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Selected Candidate Summary */}
      {selectedChoice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-lg mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: `${selectedChoice === 'switch' ? topMatch.partyColor : preferredResult?.partyColor}20`,
                border: `3px solid ${selectedChoice === 'switch' ? topMatch.partyColor : preferredResult?.partyColor}`,
              }}
            >
              <User 
                size={24} 
                style={{ color: selectedChoice === 'switch' ? topMatch.partyColor : preferredResult?.partyColor }} 
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">나의 관심 후보</p>
              <h3 className="font-bold text-lg">
                {selectedChoice === 'switch' ? topMatch.candidateName : preferredResult?.candidateName}
              </h3>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${selectedChoice === 'switch' ? topMatch.partyColor : preferredResult?.partyColor}20`,
                  color: selectedChoice === 'switch' ? topMatch.partyColor : preferredResult?.partyColor,
                }}
              >
                {selectedChoice === 'switch' ? topMatch.party : preferredResult?.party}
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveAndNotify}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: selectedChoice === 'switch' ? topMatch.partyColor : preferredResult?.partyColor 
            }}
          >
            <Heart size={18} />
            관심 후보로 저장하기
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
            <Bell size={12} />
            <span>당내경선, 본선 공약 업데이트 알림 받기</span>
          </div>
        </motion.div>
      )}

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-3"
      >
        <button
          onClick={onRestart}
          className="flex-1 py-4 rounded-xl bg-secondary font-semibold flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          다시하기
        </button>
        <button 
          onClick={() => navigate('/')}
          className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
        >
          <Share2 size={18} />
          결과 공유
        </button>
      </motion.div>
    </motion.div>
  );
}
