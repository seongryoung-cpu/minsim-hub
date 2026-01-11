import { motion } from 'framer-motion';
import { Heart, HelpCircle, User, Sparkles, Brain, ArrowRight } from 'lucide-react';
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
      className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 p-4 pb-24 lg:pb-8"
    >
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        {/* Animated completion badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2, duration: 0.8 }}
          className="relative inline-block mb-6"
        >
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.4, 0, 0.4]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 80, height: 80, marginLeft: -8, marginTop: -8 }}
          />
          
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg overflow-hidden">
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: [-100, 100] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
            />
            <div className="flex items-center gap-0.5">
              <Brain size={24} className="text-white" />
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl font-bold mb-2 tracking-tight">
            분석이 완료되었습니다!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            결과를 보기 전,<br />
            <span className="text-foreground font-semibold">지금 마음 속 후보</span>는 누구인가요?
          </p>
        </motion.div>

        {/* Psychological note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium"
        >
          <Heart size={12} fill="currentColor" />
          이 선택이 결과와 어떻게 다른지 비교해볼게요
        </motion.div>
      </div>

      {/* Candidate Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-3 mb-4 max-w-lg mx-auto"
      >
        {candidates.map((candidate, index) => (
          <motion.button
            key={candidate.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.08 }}
            onClick={() => onSelect({
              candidateId: candidate.id,
              candidateName: candidate.name,
            })}
            className="bg-card rounded-2xl p-4 shadow-md hover:shadow-xl transition-all group relative overflow-hidden border border-border/50"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Party color accent bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
              style={{ backgroundColor: candidate.partyColor }}
            />
            
            {/* Hover gradient overlay */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ 
                background: `linear-gradient(135deg, ${candidate.partyColor}10, ${candidate.partyColor}05)` 
              }}
            />
            
            <div className="relative flex flex-col items-center text-center">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all group-hover:scale-110 group-hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${candidate.partyColor}30, ${candidate.partyColor}10)`,
                  border: `2.5px solid ${candidate.partyColor}`,
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
              <h3 className="font-bold text-base mb-1.5">{candidate.name}</h3>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${candidate.partyColor}15`,
                  color: candidate.partyColor,
                }}
              >
                {candidate.party}
              </span>
            </div>

            {/* Heart icon on hover */}
            <motion.div
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all"
              initial={{ scale: 0 }}
              whileHover={{ scale: 1.3 }}
            >
              <Heart size={18} className="text-red-400" fill="currentColor" />
            </motion.div>

            {/* Arrow indicator */}
            <motion.div
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ArrowRight size={16} style={{ color: candidate.partyColor }} />
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
        className="w-full max-w-lg mx-auto block bg-secondary/40 hover:bg-secondary/70 rounded-2xl p-4 shadow-sm transition-all border border-dashed border-border hover:border-muted-foreground/30"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle size={20} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-muted-foreground">
            아직 없어요 (미결정)
          </span>
        </div>
      </motion.button>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-8"
      >
        <p className="text-xs text-muted-foreground">
          이 선택은 결과에 영향을 주지 않습니다.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          알고리즘 결과와 비교하기 위한 <span className="font-medium text-primary">심리적 앵커링</span>입니다.
        </p>
      </motion.div>
    </motion.div>
  );
}
