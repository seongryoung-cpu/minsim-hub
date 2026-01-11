import { motion } from 'framer-motion';
import { Trophy, User, ChevronRight, RotateCcw, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MatchResult } from '@/types/policy';

interface MatchResultScreenProps {
  results: MatchResult[];
  onRestart: () => void;
}

export function MatchResultScreen({ results, onRestart }: MatchResultScreenProps) {
  const navigate = useNavigate();
  const topMatch = results[0];
  const otherMatches = results.slice(1, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 pb-24 lg:pb-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
        >
          <Trophy size={32} className="text-primary" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-2"
        >
          정책 매칭 결과
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground"
        >
          당신의 정책 성향과 가장 맞는 후보는?
        </motion.p>
      </div>

      {/* Top Match */}
      {topMatch && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-3xl p-6 shadow-lg mb-6 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: `linear-gradient(135deg, ${topMatch.partyColor}, transparent)` }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1위 매칭
              </span>
              <span className="text-sm text-muted-foreground">
                일치도 {topMatch.matchScore}%
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${topMatch.partyColor}40, ${topMatch.partyColor}20)`,
                  border: `3px solid ${topMatch.partyColor}`,
                }}
              >
                <User size={32} style={{ color: topMatch.partyColor }} />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{topMatch.candidateName}</h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${topMatch.partyColor}20`,
                    color: topMatch.partyColor,
                  }}
                >
                  {topMatch.party}
                </span>
              </div>

              {/* Progress Circle */}
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={topMatch.partyColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 176' }}
                    animate={{ strokeDasharray: `${topMatch.matchScore * 1.76} 176` }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{topMatch.matchScore}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/candidate/${topMatch.candidateId}`)}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: topMatch.partyColor }}
            >
              후보자 상세 보기
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Other Matches */}
      {otherMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3 mb-8"
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">다른 후보와의 매칭</h3>
          {otherMatches.map((match, index) => (
            <motion.button
              key={match.candidateId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              onClick={() => navigate(`/candidate/${match.candidateId}`)}
              className="w-full bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="text-lg font-bold text-muted-foreground w-6">
                {index + 2}
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${match.partyColor}20`,
                  border: `2px solid ${match.partyColor}`,
                }}
              >
                <User size={20} style={{ color: match.partyColor }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{match.candidateName}</p>
                <p className="text-sm text-muted-foreground">{match.party}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold" style={{ color: match.partyColor }}>
                  {match.matchScore}%
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex gap-3"
      >
        <button
          onClick={onRestart}
          className="flex-1 py-4 rounded-xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          다시하기
        </button>
        <button className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
          <Share2 size={18} />
          결과 공유
        </button>
      </motion.div>
    </motion.div>
  );
}
