import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { ElectionMilestone, ElectionPhase } from '@/types/election';

interface ElectionTimelineProps {
  milestones: ElectionMilestone[];
  currentPhase: ElectionPhase;
}

export function ElectionTimeline({ milestones, currentPhase }: ElectionTimelineProps) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">선거 진행 단계</h3>
        <span className="text-xs text-muted-foreground">2026 지방선거</span>
      </div>

      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />

        {/* Active progress line */}
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-primary"
          initial={{ width: '0%' }}
          animate={{
            width: `${(milestones.findIndex(m => m.isCurrent) / (milestones.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />

        {/* Milestone nodes */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, index) => (
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
                  ${milestone.isComplete
                    ? 'bg-[hsl(var(--status-complete))] text-white'
                    : milestone.isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-secondary text-muted-foreground'
                  }
                `}
              >
                {milestone.isComplete ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}

                {/* Pulse animation for current */}
                {milestone.isCurrent && (
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
                  ${milestone.isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}
                `}
              >
                {milestone.shortLabel}
              </motion.span>

              {/* Date for current milestone */}
              {milestone.isCurrent && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-1 text-[9px] text-primary/80 font-medium"
                >
                  진행중
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
