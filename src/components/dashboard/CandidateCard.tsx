import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronRight, Heart, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import { useToast } from '@/hooks/use-toast';
import type { Candidate } from '@/types/election';

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  onPress?: () => void;
  showFollowButton?: boolean;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function CandidateCard({ 
  candidate, 
  index, 
  onPress, 
  showFollowButton = true,
  variant = 'default'
}: CandidateCardProps) {
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

  // Compact variant for sidebar
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 * index, duration: 0.3 }}
        onClick={handleClick}
        className="group flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all"
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${candidate.partyColor}30, ${candidate.partyColor}10)`,
            boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${candidate.partyColor}`,
          }}
        >
          {candidate.image ? (
            <img
              src={candidate.image}
              alt={candidate.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={16} style={{ color: candidate.partyColor }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-sm truncate">{candidate.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{
                backgroundColor: `${candidate.partyColor}15`,
                color: candidate.partyColor,
              }}
            >
              {candidate.party}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{candidate.position}</p>
        </div>

        {/* Follow & Arrow */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {showFollowButton && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleFollowClick}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              aria-label={following ? '팔로우 취소' : '팔로우'}
            >
              <Heart 
                size={16} 
                className={following ? "text-rose-500 fill-rose-500" : "text-muted-foreground group-hover:text-rose-400 transition-colors"} 
              />
            </motion.button>
          )}
          <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.div>
    );
  }

  // Horizontal variant for desktop main content
  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 * index, duration: 0.4 }}
        onClick={handleClick}
        className="group bg-card rounded-2xl p-5 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 cursor-pointer transition-all"
      >
        <div className="flex items-start gap-5">
          {/* Large Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${candidate.partyColor}25, ${candidate.partyColor}08)`,
            }}
          >
            {candidate.image ? (
              <img
                src={candidate.image}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} style={{ color: candidate.partyColor }} />
            )}
            {/* Party color indicator */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: candidate.partyColor }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground text-lg">{candidate.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${candidate.partyColor}15`,
                      color: candidate.partyColor,
                    }}
                  >
                    {candidate.party}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{candidate.position}</p>
              </div>

              {/* Follow Button */}
              {showFollowButton && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={handleFollowClick}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    following 
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
                >
                  <Heart size={14} className={following ? "fill-current" : ""} />
                  <span>{following ? '팔로잉' : '팔로우'}</span>
                </motion.button>
              )}
            </div>

            {/* Summary */}
            {candidate.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {candidate.summary}
              </p>
            )}

            {/* Pledge Tags */}
            {candidate.pledges && candidate.pledges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {candidate.pledges.slice(0, 3).map((pledge) => (
                  <button
                    key={pledge.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/candidate/${candidate.id}?tab=pledges`);
                    }}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors border border-primary/10"
                  >
                    <FileText size={12} />
                    <span className="truncate max-w-[120px]">{pledge.title}</span>
                  </button>
                ))}
                {candidate.pledges.length > 3 && (
                  <span className="text-xs text-muted-foreground px-2 py-1.5">
                    +{candidate.pledges.length - 3}개 더
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 self-center">
            <ArrowRight 
              size={20} 
              className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-3 hover:shadow-md hover:border-primary/20 transition-all group"
    >
      {/* Clickable Area for Navigation */}
      <button
        onClick={handleClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left touch-target active:opacity-80 transition-opacity"
      >
        {/* Candidate Image */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${candidate.partyColor}25, ${candidate.partyColor}10)`,
          }}
        >
          {candidate.image ? (
            <img
              src={candidate.image}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} style={{ color: candidate.partyColor }} />
          )}
          {/* Party indicator dot */}
          <div 
            className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card"
            style={{ backgroundColor: candidate.partyColor }}
          />
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-foreground text-sm">{candidate.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${candidate.partyColor}15`,
                color: candidate.partyColor,
              }}
            >
              {candidate.party}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{candidate.position}</p>
          
          {/* Pledge Tags Preview */}
          {candidate.pledges && candidate.pledges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {candidate.pledges.slice(0, 2).map((pledge) => (
                <span
                  key={pledge.id}
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground"
                >
                  <FileText size={9} className="flex-shrink-0" />
                  <span className="truncate max-w-[70px]">{pledge.title}</span>
                </span>
              ))}
              {candidate.pledges.length > 2 && (
                <span className="text-[10px] text-muted-foreground px-1">
                  +{candidate.pledges.length - 2}
                </span>
              )}
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
            className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all"
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
                    size={18} 
                    className="text-rose-500 fill-rose-500" 
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
                  <Heart size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
        <button
          onClick={handleClick}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="상세보기"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Skeleton Card for loading state
export function CandidateCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'horizontal' }) {
  if (variant === 'horizontal') {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 animate-pulse">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-secondary" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 bg-secondary rounded" />
              <div className="h-5 w-16 bg-secondary rounded-full" />
            </div>
            <div className="h-4 w-32 bg-secondary rounded" />
            <div className="h-4 w-full bg-secondary rounded" />
            <div className="flex gap-2">
              <div className="h-7 w-24 bg-secondary rounded-lg" />
              <div className="h-7 w-24 bg-secondary rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-secondary" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-20 bg-secondary rounded" />
          <div className="h-3 w-16 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-secondary rounded" />
          <div className="h-4 w-12 bg-secondary rounded-full" />
        </div>
        <div className="h-3 w-20 bg-secondary rounded" />
      </div>
      <div className="w-7 h-7 bg-secondary rounded-full" />
    </div>
  );
}
