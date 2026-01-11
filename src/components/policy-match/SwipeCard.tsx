import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ThumbsUp, ThumbsDown, RotateCcw, Sparkles } from 'lucide-react';
import type { PolicyCard } from '@/types/policy';
import { CATEGORY_COLORS } from '@/types/policy';

interface SwipeCardProps {
  card: PolicyCard;
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onUndo?: () => void;
}

export function SwipeCard({ card, isTop, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // 스와이프 방향에 따른 오버레이 표시
  const leftOverlayOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 100], [0, 1]);

  const categoryColor = CATEGORY_COLORS[card.category] || '#6366F1';

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      if (info.offset.x > threshold) {
        onSwipe('right');
      } else if (info.offset.x < -threshold) {
        onSwipe('left');
      }
    },
    [onSwipe]
  );

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 bg-card rounded-3xl shadow-lg"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 0.95, y: 10 }}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 1.02 }}
    >
      {/* Card Container */}
      <div 
        className="w-full h-full bg-card rounded-3xl shadow-xl overflow-hidden relative"
        style={{ 
          border: `3px solid ${categoryColor}30`,
        }}
      >
        {/* Category Header */}
        <div 
          className="p-4 text-white"
          style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}DD)` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {card.category}
            </span>
          </div>
        </div>

        {/* Statement */}
        <div className="p-6 flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-xl sm:text-2xl font-bold text-center text-foreground leading-relaxed">
            "{card.statement}"
          </p>
        </div>

        {/* Swipe Hints */}
        <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-500">
            <ThumbsDown size={20} />
            <span className="text-sm font-medium">{card.leftLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-green-500">
            <span className="text-sm font-medium">{card.rightLabel}</span>
            <ThumbsUp size={20} />
          </div>
        </div>

        {/* Left Overlay (Disagree) */}
        <motion.div
          className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none rounded-3xl"
          style={{ opacity: leftOverlayOpacity }}
        >
          <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-[-15deg] border-4 border-white">
            반대 ✕
          </div>
        </motion.div>

        {/* Right Overlay (Agree) */}
        <motion.div
          className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none rounded-3xl"
          style={{ opacity: rightOverlayOpacity }}
        >
          <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-[15deg] border-4 border-white">
            찬성 ✓
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// 스와이프 컨트롤 버튼들
interface SwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function SwipeControls({ onSwipeLeft, onSwipeRight, onUndo, canUndo }: SwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSwipeLeft}
        className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      >
        <ThumbsDown size={24} className="text-red-500" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUndo}
        disabled={!canUndo}
        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <RotateCcw size={18} className="text-muted-foreground" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSwipeRight}
        className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      >
        <ThumbsUp size={24} className="text-green-500" />
      </motion.button>
    </div>
  );
}
