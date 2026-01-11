import { motion } from 'framer-motion';
import { Sparkles, Heart, Eye, Shield, Check } from 'lucide-react';
import type { GameStep } from '@/pages/PolicyMatchGame';

interface JourneyProgressProps {
  currentStep: GameStep;
}

const JOURNEY_STEPS = [
  { key: 'intro', label: '시작', icon: Sparkles },
  { key: 'swipe', label: '정책 선택', icon: Sparkles },
  { key: 'pre-reveal', label: '원픽 선택', icon: Heart },
  { key: 'result', label: '결과 분석', icon: Eye },
  { key: 'sentiment', label: '표심 확인', icon: Shield },
] as const;

export function JourneyProgress({ currentStep }: JourneyProgressProps) {
  const currentIndex = JOURNEY_STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {JOURNEY_STEPS.slice(1).map((step, index) => {
        const stepIndex = index + 1; // Adjust for skipping intro
        const isCompleted = currentIndex > stepIndex;
        const isCurrent = currentIndex === stepIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: isCurrent ? 1 : 0.85,
                opacity: isCurrent || isCompleted ? 1 : 0.4
              }}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors
                ${isCurrent 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-secondary text-muted-foreground'
                }
              `}
            >
              {isCompleted ? (
                <Check size={12} />
              ) : (
                <Icon size={12} />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </motion.div>
            
            {index < JOURNEY_STEPS.length - 2 && (
              <div className={`w-4 h-0.5 mx-1 rounded-full transition-colors ${
                isCompleted ? 'bg-green-400' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
