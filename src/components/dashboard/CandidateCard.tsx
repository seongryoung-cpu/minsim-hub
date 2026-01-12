import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronRight, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import type { Candidate } from '@/types/election';

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  onPress?: () => void;
  showFollowButton?: boolean;
}

export function CandidateCard({ candidate, index, onPress, showFollowButton = true }: CandidateCardProps) {
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollowedCandidates();
  const following = isFollowing(candidate.id);

  const handleClick = () => {
    if (onPress) {
      onPress();
    }
    navigate(`/candidate/${candidate.id}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow(candidate.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className="w-full bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[var(--shadow-md)] flex items-center gap-3 sm:gap-4 hover:shadow-[var(--shadow-lg)] transition-all"
    >
      {/* Clickable Area for Navigation */}
      <button
        onClick={handleClick}
        className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left touch-target active:opacity-80 transition-opacity"
      >
        {/* Candidate Image Placeholder */}
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0"
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
            <User size={20} style={{ color: candidate.partyColor }} />
          )}
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-foreground text-sm sm:text-base">{candidate.name}</span>
            <span
              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${candidate.partyColor}20`,
                color: candidate.partyColor,
              }}
            >
              {candidate.party}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground">{candidate.position}</p>
          <p className="text-xs sm:text-sm text-secondary-foreground mt-0.5 truncate">{candidate.summary}</p>
        </div>
      </button>

      {/* Follow Button & Arrow */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {showFollowButton && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleFollowClick}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all ${
              following 
                ? 'bg-primary/15 text-primary' 
                : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
            }`}
            aria-label={following ? '팔로우 취소' : '팔로우'}
          >
            <AnimatePresence mode="wait">
              {following ? (
                <motion.div
                  key="following"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <Bell size={18} className="fill-current" />
                </motion.div>
              ) : (
                <motion.div
                  key="not-following"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                >
                  <BellOff size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
        <button
          onClick={handleClick}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="상세보기"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </motion.div>
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
