import { motion } from 'framer-motion';
import { User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Candidate } from '@/types/election';

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  onPress?: () => void;
}

export function CandidateCard({ candidate, index, onPress }: CandidateCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onPress) {
      onPress();
    }
    navigate(`/candidate/${candidate.id}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="w-full bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[var(--shadow-md)] flex items-center gap-4 touch-target text-left active:bg-secondary/50 transition-all hover:shadow-[var(--shadow-lg)]"
    >
      {/* Candidate Image Placeholder */}
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0"
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
          <User size={24} style={{ color: candidate.partyColor }} />
        )}
      </div>

      {/* Candidate Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-foreground sm:text-lg">{candidate.name}</span>
          <span
            className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: `${candidate.partyColor}20`,
              color: candidate.partyColor,
            }}
          >
            {candidate.party}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">{candidate.position}</p>
        <p className="text-sm sm:text-base text-secondary-foreground mt-1 truncate">{candidate.summary}</p>
      </div>

      {/* Arrow */}
      <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
}

// Skeleton Card for loading state
export function CandidateCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[var(--shadow-md)] flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-secondary rounded" />
          <div className="h-4 w-16 bg-secondary rounded-full" />
        </div>
        <div className="h-3 w-24 bg-secondary rounded" />
        <div className="h-4 w-full bg-secondary rounded" />
      </div>
      <div className="w-5 h-5 bg-secondary rounded" />
    </div>
  );
}
