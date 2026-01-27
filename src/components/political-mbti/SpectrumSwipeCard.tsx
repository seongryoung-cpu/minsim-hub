import { useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SpectrumQuestion } from '@/types/political-mbti';

interface SpectrumSwipeCardProps {
  question: SpectrumQuestion;
  onSwipe: (value: number) => void;
  cardNumber: number;
  totalCards: number;
}

export function SpectrumSwipeCard({ question, onSwipe, cardNumber, totalCards }: SpectrumSwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-150, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 150], [0, 1]);
  
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe(1); // 오른쪽 = 동의하지 않음 (반대)
    } else if (info.offset.x < -threshold) {
      onSwipe(-1); // 왼쪽 = 동의 (진보)
    }
  }, [onSwipe]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="h-full bg-card rounded-3xl shadow-xl border border-border/50 p-6 flex flex-col">
        {/* Category Badge */}
        <div className="flex justify-between items-center mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {question.targetDimension === 'economy' && '경제'}
            {question.targetDimension === 'security' && '안보'}
            {question.targetDimension === 'gender' && '젠더'}
            {question.targetDimension === 'fairness' && '공정'}
            {question.targetDimension === 'future' && '미래'}
          </span>
          <span className="text-xs text-muted-foreground">
            {cardNumber} / {totalCards}
          </span>
        </div>

        {/* Statement */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl font-medium text-center leading-relaxed px-2">
            {question.statement}
          </p>
        </div>

        {/* Swipe Indicators */}
        <div className="relative h-16">
          {/* 왼쪽 (동의) */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-blue-500"
            style={{ opacity: leftOpacity }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">{question.leftLabel}</span>
          </motion.div>

          {/* 오른쪽 (반대) */}
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-orange-500"
            style={{ opacity: rightOpacity }}
          >
            <span className="font-semibold">{question.rightLabel}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Hint */}
        <div className="text-center text-xs text-muted-foreground mt-2">
          좌우로 스와이프하세요
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
  rightLabel
}: SpectrumSwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Undo Button */}
      {onUndo && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      )}

      {/* Left (Agree) */}
      <Button
        variant="outline"
        size="lg"
        onClick={onSwipeLeft}
        className="flex-1 max-w-32 h-14 rounded-xl border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500"
      >
        <ArrowLeft className="w-4 h-4 mr-2 text-blue-500" />
        <span className="text-blue-500">{leftLabel}</span>
      </Button>

      {/* Right (Disagree) */}
      <Button
        variant="outline"
        size="lg"
        onClick={onSwipeRight}
        className="flex-1 max-w-32 h-14 rounded-xl border-orange-500/50 hover:bg-orange-500/10 hover:border-orange-500"
      >
        <span className="text-orange-500">{rightLabel}</span>
        <ArrowRight className="w-4 h-4 ml-2 text-orange-500" />
      </Button>
    </div>
  );
}
