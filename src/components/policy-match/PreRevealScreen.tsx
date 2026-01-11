import { motion } from 'framer-motion';
import { Heart, HelpCircle, User, Sparkles } from 'lucide-react';
import type { Candidate } from '@/types/election';
import type { PreferredCandidate } from '@/types/policy';

interface PreRevealScreenProps {
  candidates: Candidate[];
  onSelect: (preference: PreferredCandidate) => void;
}

export function PreRevealScreen({ candidates, onSelect }: PreRevealScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 pb-24 lg:pb-8"
    >
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4"
        >
          <Sparkles size={32} className="text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-3"
        >
          분석이 완료되었습니다!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground leading-relaxed"
        >
          결과를 보기 전,<br />
          <span className="font-semibold text-foreground">현재 가장 호감을 느끼는 후보</span>는 누구인가요?
        </motion.p>
      </div>

      {/* Candidate Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {candidates.map((candidate, index) => (
          <motion.button
            key={candidate.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            onClick={() => onSelect({
              candidateId: candidate.id,
              candidateName: candidate.name,
            })}
            className="bg-card rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Party color accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: candidate.partyColor }}
            />
            
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${candidate.partyColor}40, ${candidate.partyColor}20)`,
                  border: `2px solid ${candidate.partyColor}`,
                }}
              >
                {candidate.image ? (
                  <img 
                    src={candidate.image} 
                    alt={candidate.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={28} style={{ color: candidate.partyColor }} />
                )}
              </div>
              
              {/* Name & Party */}
              <h3 className="font-bold text-base mb-1">{candidate.name}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${candidate.partyColor}20`,
                  color: candidate.partyColor,
                }}
              >
                {candidate.party}
              </span>
            </div>

            {/* Heart icon on hover */}
            <motion.div
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ scale: 0 }}
              whileHover={{ scale: 1.2 }}
            >
              <Heart size={18} className="text-red-400" fill="currentColor" />
            </motion.div>
          </motion.button>
        ))}
      </motion.div>

      {/* Undecided Option */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        onClick={() => onSelect(null)}
        className="w-full bg-secondary/50 hover:bg-secondary rounded-2xl p-4 shadow-sm transition-all flex items-center justify-center gap-3"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <HelpCircle size={20} className="text-muted-foreground" />
        </div>
        <span className="font-medium text-muted-foreground">
          아직 없어요 (미결정)
        </span>
      </motion.button>

      {/* Footer Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-xs text-muted-foreground mt-6"
      >
        이 선택은 결과에 영향을 주지 않습니다.<br />
        알고리즘 결과와 비교하기 위한 참고용입니다.
      </motion.p>
    </motion.div>
  );
}
