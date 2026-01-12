import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronRight, Heart, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import { useToast } from '@/hooks/use-toast';
import type { Candidate, CandidatePledge } from '@/types/election';

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  onPress?: () => void;
  showFollowButton?: boolean;
}

export function CandidateCard({ candidate, index, onPress, showFollowButton = true }: CandidateCardProps) {
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollowedCandidates();
  const { toast } = useToast();
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
    
    if (!following) {
      toast({
        title: `${candidate.name} 후보를 팔로우합니다`,
        description: "새로운 공약과 뉴스를 받아보세요",
      });
    } else {
      toast({
        title: `${candidate.name} 후보 팔로우를 취소했습니다`,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className="w-full bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[var(--shadow-md)] flex items-center gap-3 sm:gap-4 hover:shadow-[var(--shadow-lg)] transition-all group"
    >
      {/* Clickable Area for Navigation */}
      <button
        onClick={handleClick}
        className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left touch-target active:opacity-80 transition-opacity"
      >
        {/* Candidate Image */}
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 relative"
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
          
          {/* Pledge Tags Preview */}
          {candidate.pledges && candidate.pledges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {candidate.pledges.slice(0, 3).map((pledge) => (
                <span
                  key={pledge.id}
                  className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                >
                  <FileText size={10} className="flex-shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-[100px]">{pledge.title}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Follow Button & Arrow */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {showFollowButton && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            onClick={handleFollowClick}
            className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all"
            aria-label={following ? '팔로우 취소' : '팔로우'}
          >
            <AnimatePresence mode="wait">
              {following ? (
                <motion.div
                  key="following"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <Heart 
                    size={22} 
                    className="text-rose-500 fill-rose-500 drop-shadow-sm" 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="not-following"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-muted-foreground group-hover:text-rose-400 transition-colors"
                >
                  <Heart size={22} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Ripple effect on follow */}
            {following && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 rounded-full bg-rose-400"
              />
            )}
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
