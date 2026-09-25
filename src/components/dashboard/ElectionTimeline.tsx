import { motion } from 'framer-motion';
import { CheckCircle2, Lock } from 'lucide-react';
import type { ElectionMilestone, ElectionPhase } from '@/types/election';
import { CURRENT_ELECTION } from '@/types/election';

interface ElectionTimelineProps {
  milestones: ElectionMilestone[];
  currentPhase: ElectionPhase;
}

export function ElectionTimeline({ milestones, currentPhase }: ElectionTimelineProps) {
  const currentIndex = milestones.findIndex(m => m.isCurrent);
  const allComplete = milestones.length > 0 && milestones.every(m => m.isComplete);
  const progressIndex = allComplete ? milestones.length - 1 : currentIndex;
  
  return (
    <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">선거 진행 단계</h3>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {CURRENT_ELECTION.name}{allComplete && ' · 종료'}
        </span>
      </div>

      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />

        {/* Active progress line */}
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-primary"
          initial={{ width: '0%' }}
          animate={{
            width: progressIndex >= 0 ? `${(progressIndex / (milestones.length - 1)) * 100}%` : '0%',
          }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />

        {/* Milestone nodes */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, index) => {
            const isLocked = milestone.isLocked;
            const isComplete = milestone.isComplete;
            const isCurrent = milestone.isCurrent;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className="flex flex-col items-center"
                style={{ width: `${100 / milestones.length}%` }}
              >
                {/* Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + 0.1 * index, type: 'spring', stiffness: 300 }}
                  className={`
                    relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isComplete
                      ? 'bg-[hsl(var(--status-complete))] text-white'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : isLocked
                          ? 'bg-muted text-muted-foreground/50'
                          : 'bg-secondary text-muted-foreground'
                    }
                  `}
                >
                  {isComplete ? (
                    <CheckCircle2 size={18} />
                  ) : isLocked ? (
                    <Lock size={14} className="opacity-60" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}

                  {/* Pulse animation for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + 0.1 * index }}
                  className={`
                    mt-2 text-[10px] font-medium text-center whitespace-nowrap
                    ${isCurrent 
                      ? 'text-primary font-bold' 
                      : isLocked 
                        ? 'text-muted-foreground/50' 
                        : 'text-muted-foreground'
                    }
                  `}
                >
                  {milestone.shortLabel}
                </motion.span>

                {/* Status indicator */}
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`
                    mt-1 text-[9px] font-medium
                    ${isCurrent 
                      ? 'text-primary/80' 
                      : isLocked 
                        ? 'text-muted-foreground/40' 
                        : 'text-muted-foreground/60'
                    }
                  `}
                >
                  {isCurrent ? '진행중' : isLocked ? '예정' : isComplete ? '완료' : ''}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
