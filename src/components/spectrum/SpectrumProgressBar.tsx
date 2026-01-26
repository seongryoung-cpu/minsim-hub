import { motion } from 'framer-motion';
import type { SpectrumUncertainties } from '@/types/spectrum';
import { SPECTRUM_DIMENSIONS } from '@/types/spectrum';
import { uncertaintyToConfidence } from '@/types/spectrum';

interface SpectrumProgressBarProps {
  uncertainties: SpectrumUncertainties;
  answeredCount: number;
  totalQuestions: number;
}

export function SpectrumProgressBar({ 
  uncertainties, 
  answeredCount,
  totalQuestions,
}: SpectrumProgressBarProps) {
  const dimensions = [
    { key: 'economy' as const, code: 'ECO' as const },
    { key: 'security' as const, code: 'SEC' as const },
    { key: 'gender' as const, code: 'GEN' as const },
    { key: 'fairness' as const, code: 'FAI' as const },
    { key: 'future' as const, code: 'FUT' as const },
  ];

  return (
    <div className="space-y-3">
      {/* 전체 진행률 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-16">진행률</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-sm font-medium w-12 text-right">
          {answeredCount}/{totalQuestions}
        </span>
      </div>

      {/* 차원별 신뢰도 */}
      <div className="grid grid-cols-5 gap-2">
        {dimensions.map(({ key, code }) => {
          const dim = SPECTRUM_DIMENSIONS[code];
          const confidence = uncertaintyToConfidence(uncertainties[key]);
          
          return (
            <div key={key} className="text-center">
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: dim.color }}
              >
                {dim.name}
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: dim.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {confidence}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
