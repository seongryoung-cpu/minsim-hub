import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SpectrumQuestion } from '@/types/spectrum';
import { SPECTRUM_DIMENSIONS } from '@/types/spectrum';

interface SpectrumSwipeCardProps {
  question: SpectrumQuestion;
  onSwipe: (value: number) => void;
  cardNumber: number;
  totalCards: number;
}

export function SpectrumSwipeCard({
  question,
  onSwipe,
  cardNumber,
  totalCards,
}: SpectrumSwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-200, -50, 0], [1, 0.5, 0]);
  const rightOpacity = useTransform(x, [0, 50, 200], [0, 0.5, 1]);

  const dimension = SPECTRUM_DIMENSIONS[question.targetDimension];

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      // 스와이프 방향에 따라 -1.0 ~ 1.0 값 계산
      const direction = info.offset.x > 0 ? 1 : -1;
      const intensity = Math.min(Math.abs(info.offset.x) / 200, 1);
      const value = direction * intensity;
      
      setExitX(info.offset.x > 0 ? 300 : -300);
      onSwipe(value);
    }
  }, [onSwipe]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      initial={{ scale: 1, y: 0 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
    >
      {/* Left indicator */}
      <motion.div
        className="absolute -left-4 top-1/2 -translate-y-1/2 bg-red-500/90 text-white px-4 py-2 rounded-r-xl font-bold shadow-lg"
        style={{ opacity: leftOpacity }}
      >
        {question.leftLabel}
      </motion.div>

      {/* Right indicator */}
      <motion.div
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-l-xl font-bold shadow-lg"
        style={{ opacity: rightOpacity }}
      >
        {question.rightLabel}
      </motion.div>

      {/* Card */}
      <div className="h-full bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden">
        {/* Category header */}
        <div 
          className="px-6 py-3 text-center text-white font-medium"
          style={{ backgroundColor: dimension.color }}
        >
          <span className="text-sm opacity-90">{dimension.name}</span>
          <span className="mx-2 opacity-50">•</span>
          <span className="text-xs opacity-75">{cardNumber}/{totalCards}</span>
        </div>

        {/* Statement */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
          <p className="text-xl sm:text-2xl font-medium text-center leading-relaxed text-foreground">
            {question.statement}
          </p>
        </div>

        {/* Labels */}
        <div className="px-6 pb-6 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-red-500">
            <ArrowLeft size={18} />
            <span className="font-medium">{question.leftLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-500">
            <span className="font-medium">{question.rightLabel}</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface SpectrumSwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo?: () => void;
  canUndo: boolean;
  leftLabel: string;
  rightLabel: string;
}

export function SpectrumSwipeControls({
  onSwipeLeft,
  onSwipeRight,
  onUndo,
  canUndo,
  leftLabel,
  rightLabel,
}: SpectrumSwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Undo */}
      {onUndo && (
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="w-12 h-12 rounded-full"
        >
          <Undo2 size={20} />
        </Button>
      )}

      {/* Left (Disagree) */}
      <Button
        variant="outline"
        onClick={onSwipeLeft}
        className="h-14 px-6 rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
      >
        <ArrowLeft size={20} className="mr-2" />
        {leftLabel}
      </Button>

      {/* Right (Agree) */}
      <Button
        variant="outline"
        onClick={onSwipeRight}
        className="h-14 px-6 rounded-full border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500"
      >
        {rightLabel}
        <ArrowRight size={20} className="ml-2" />
      </Button>
    </div>
  );
}
