import { motion } from 'framer-motion';
import { User, ChevronRight, Heart, FileText } from 'lucide-react';
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 * index, duration: 0.3 }}
        onClick={handleClick}
        className="group bg-card rounded-xl p-4 border border-border/50 hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${candidate.partyColor}20, ${candidate.partyColor}05)`,
              border: `2px solid ${candidate.partyColor}30`,
            }}
          >
            {candidate.image ? (
              <img
                src={candidate.image}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} style={{ color: candidate.partyColor }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-foreground text-base">{candidate.name}</h3>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${candidate.partyColor}15`,
                  color: candidate.partyColor,
                }}
              >
                {candidate.party}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{candidate.position}</p>
            
            {/* Summary - truncated */}
            {candidate.summary && (
              <p className="text-xs text-muted-foreground/80 line-clamp-1">
                {candidate.summary}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showFollowButton && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleFollowClick}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  following 
                    ? 'bg-rose-100 dark:bg-rose-900/30' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <Heart 
                  size={16} 
                  className={following ? "text-rose-500 fill-rose-500" : "text-muted-foreground"} 
                />
              </motion.button>
            )}
            <ChevronRight 
              size={18} 
              className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant - Mobile friendly with larger photo
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.3 }}
      onClick={handleClick}
      className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Larger Candidate Image for Mobile */}
        <div
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${candidate.partyColor}20, ${candidate.partyColor}08)`,
            border: `2px solid ${candidate.partyColor}40`,
          }}
        >
          {candidate.image ? (
            <img
              src={candidate.image}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={28} style={{ color: candidate.partyColor }} />
          )}
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground text-base">{candidate.name}</span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${candidate.partyColor}15`,
                color: candidate.partyColor,
              }}
            >
              {candidate.party}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1.5">{candidate.position}</p>
          
          {/* Pledge Tags Preview */}
          {candidate.pledges && candidate.pledges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {candidate.pledges.slice(0, 2).map((pledge) => (
                <span
                  key={pledge.id}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                >
                  <FileText size={10} className="flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{pledge.title}</span>
                </span>
              ))}
              {candidate.pledges.length > 2 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{candidate.pledges.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Follow Button & Arrow */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {showFollowButton && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleFollowClick}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                following 
                  ? 'bg-rose-100 dark:bg-rose-900/30' 
                  : 'hover:bg-secondary'
              }`}
              aria-label={following ? '팔로우 취소' : '팔로우'}
            >
              <Heart 
                size={20} 
                className={following ? "text-rose-500 fill-rose-500" : "text-muted-foreground group-hover:text-rose-400 transition-colors"} 
              />
            </motion.button>
          )}
          <ChevronRight size={20} className="text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton Card for loading state
export function CandidateCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'horizontal' }) {
  if (variant === 'horizontal') {
    return (
      <div className="bg-card rounded-xl p-4 border border-border/50 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-20 bg-secondary rounded" />
              <div className="h-4 w-14 bg-secondary rounded-full" />
            </div>
            <div className="h-3 w-28 bg-secondary rounded" />
          </div>
          <div className="w-9 h-9 bg-secondary rounded-full" />
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
    <div className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-secondary rounded" />
            <div className="h-4 w-12 bg-secondary rounded-full" />
          </div>
          <div className="h-3 w-24 bg-secondary rounded" />
          <div className="flex gap-1.5">
            <div className="h-6 w-20 bg-secondary rounded-md" />
            <div className="h-6 w-20 bg-secondary rounded-md" />
          </div>
        </div>
        <div className="w-10 h-10 bg-secondary rounded-full" />
      </div>
    </div>
  );
}
