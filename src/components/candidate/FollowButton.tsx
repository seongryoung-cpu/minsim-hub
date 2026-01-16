import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, Heart } from 'lucide-react';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';

interface FollowButtonProps {
  candidateId: string;
  candidateName: string;
  partyColor: string;
  variant?: 'default' | 'compact' | 'icon';
}

export function FollowButton({ 
  candidateId, 
  candidateName, 
  partyColor, 
  variant = 'default' 
}: FollowButtonProps) {
  const { isFollowing, toggleFollow } = useFollowedCandidates();
  const following = isFollowing(candidateId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow(candidateId);
  };

  if (variant === 'icon') {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          following 
            ? 'text-red-500' 
            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
        }`}
      >
        <AnimatePresence mode="wait">
          {following ? (
            <motion.div
              key="following"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={22} className="fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="not-following"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Heart size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          following
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary hover:bg-secondary/80 text-foreground'
        }`}
      >
        <AnimatePresence mode="wait">
          {following ? (
            <motion.div
              key="following"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1.5"
            >
              <UserCheck size={14} />
              <span>팔로잉</span>
            </motion.div>
          ) : (
            <motion.div
              key="not-following"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>팔로우</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
        following
          ? 'bg-secondary text-foreground'
          : 'text-white'
      }`}
      style={!following ? { backgroundColor: partyColor } : undefined}
    >
      <AnimatePresence mode="wait">
        {following ? (
          <motion.div
            key="following"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <UserCheck size={18} />
            <span>팔로잉 중</span>
          </motion.div>
        ) : (
          <motion.div
            key="not-following"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>{candidateName} 팔로우</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
