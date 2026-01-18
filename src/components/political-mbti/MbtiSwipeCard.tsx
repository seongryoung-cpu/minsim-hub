import { useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MbtiQuestion } from '@/types/political-mbti';
import { MBTI_AXES } from '@/types/political-mbti';

interface MbtiSwipeCardProps {
  question: MbtiQuestion;
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  cardNumber: number;
  totalCards: number;
}

export function MbtiSwipeCard({ question, isTop, onSwipe, cardNumber, totalCards }: MbtiSwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.7, 1, 1, 1, 0.7]);
  
  const leftOverlayOpacity = useTransform(x, [-120, -40, 0], [1, 0.3, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 40, 120], [0, 0.3, 1]);

  const axisInfo = MBTI_AXES[question.axis];
  const axisColor = {
    EI: '#3B82F6',
    SN: '#10B981',
    TF: '#F59E0B',
    JP: '#EC4899',
  }[question.axis];

  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      if (latest > 20) {
        setSwipeDirection('right');
      } else if (latest < -20) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    });
    return () => unsubscribe();
  }, [x]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const threshold = 80;
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
        className="absolute inset-0 bg-card rounded-3xl shadow-lg border border-border/30"
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 0.92, y: 16 }}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.4, ease: 'easeOut' }
      }}
      whileTap={{ scale: 1.02 }}
    >
      {/* Card Container */}
      <div 
        className={`w-full h-full bg-card rounded-3xl shadow-2xl overflow-hidden relative transition-shadow duration-300 ${
          isDragging ? 'shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]' : ''
        }`}
        style={{ border: `2px solid ${axisColor}40` }}
      >
        {/* Axis Header */}
        <div 
          className="relative p-4 text-white overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${axisColor}, ${axisColor}CC)` }}
        >
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{question.axis}</span>
              <span className="text-sm opacity-80">• {axisInfo.name}</span>
            </div>
            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
              {cardNumber}/{totalCards}
            </div>
          </div>
        </div>

        {/* Statement */}
        <div className="p-6 flex-1 flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
          <motion.p 
            className="text-xl sm:text-2xl font-bold text-center text-foreground leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            "{question.statement}"
          </motion.p>
        </div>

        {/* Swipe Hints */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-card via-card/90 to-transparent">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center gap-2 text-blue-500"
              animate={{ 
                scale: swipeDirection === 'left' ? 1.1 : 1,
                x: swipeDirection === 'left' ? [-2, 0, -2] : 0,
              }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ChevronLeft size={18} />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">{question.leftAxisValue}</div>
                <div className="text-sm font-semibold">{question.leftLabel}</div>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-orange-500"
              animate={{ 
                scale: swipeDirection === 'right' ? 1.1 : 1,
                x: swipeDirection === 'right' ? [2, 0, 2] : 0,
              }}
            >
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{question.rightAxisValue}</div>
                <div className="text-sm font-semibold">{question.rightLabel}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ChevronRight size={18} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Left Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-3xl"
          style={{ 
            opacity: leftOverlayOpacity,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))'
          }}
        >
          <motion.div 
            className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-xl rotate-[-12deg] border-4 border-white shadow-xl"
          >
            {question.leftLabel}
          </motion.div>
        </motion.div>

        {/* Right Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-3xl"
          style={{ 
            opacity: rightOverlayOpacity,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(249,115,22,0.15))'
          }}
        >
          <motion.div 
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-xl rotate-[12deg] border-4 border-white shadow-xl"
          >
            {question.rightLabel}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// 스와이프 컨트롤
interface MbtiSwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo: () => void;
  canUndo: boolean;
  leftLabel: string;
  rightLabel: string;
}

export function MbtiSwipeControls({ 
  onSwipeLeft, 
  onSwipeRight, 
  onUndo, 
  canUndo,
  leftLabel,
  rightLabel 
}: MbtiSwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSwipeLeft}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 flex flex-col items-center justify-center shadow-lg border-2 border-blue-200 dark:border-blue-800"
      >
        <ChevronLeft size={24} className="text-blue-500" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUndo}
        disabled={!canUndo}
        className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed border border-border text-sm font-medium text-muted-foreground"
      >
        ↩
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSwipeRight}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-900/20 flex flex-col items-center justify-center shadow-lg border-2 border-orange-200 dark:border-orange-800"
      >
        <ChevronRight size={24} className="text-orange-500" />
      </motion.button>
    </div>
  );
}
