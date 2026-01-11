import { useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, RotateCcw, Sparkles, Zap } from 'lucide-react';
import type { PolicyCard } from '@/types/policy';
import { CATEGORY_COLORS } from '@/types/policy';

interface SwipeCardProps {
  card: PolicyCard;
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onUndo?: () => void;
  cardNumber: number;
  totalCards: number;
}

// 파티클 컴포넌트
function SwipeParticles({ direction, show }: { direction: 'left' | 'right' | null; show: boolean }) {
  if (!show || !direction) return null;

  const color = direction === 'right' ? '#22c55e' : '#ef4444';
  const particles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map((i) => {
        const angle = (i / 12) * 360;
        const delay = i * 0.02;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              left: '50%',
              top: '50%',
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((angle * Math.PI) / 180) * 150,
              y: Math.sin((angle * Math.PI) / 180) * 150,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.6, delay }}
          />
        );
      })}
    </div>
  );
}

// 스와이프 강도 인디케이터
function SwipeIntensityIndicator({ intensity, direction }: { intensity: number; direction: 'left' | 'right' | null }) {
  const bars = 5;
  const activeCount = Math.min(Math.floor(intensity / 20), bars);
  
  if (intensity < 10) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-2 h-6 rounded-full transition-colors duration-150 ${
            i < activeCount
              ? direction === 'right'
                ? 'bg-green-500'
                : 'bg-red-500'
              : 'bg-secondary'
          }`}
          animate={{
            scaleY: i < activeCount ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.2,
            delay: i * 0.05,
          }}
        />
      ))}
    </motion.div>
  );
}

export function SwipeCard({ card, isTop, onSwipe, cardNumber, totalCards }: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleDirection, setParticleDirection] = useState<'left' | 'right' | null>(null);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.7, 1, 1, 1, 0.7]);
  
  // 스와이프 강도 계산
  const [swipeIntensity, setSwipeIntensity] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      const intensity = Math.abs(latest);
      setSwipeIntensity(intensity);
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

  // 스와이프 방향에 따른 오버레이 표시
  const leftOverlayOpacity = useTransform(x, [-120, -40, 0], [1, 0.3, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 40, 120], [0, 0.3, 1]);
  
  // 오버레이 스케일 효과
  const leftOverlayScale = useTransform(x, [-120, -40, 0], [1, 0.9, 0.8]);
  const rightOverlayScale = useTransform(x, [0, 40, 120], [0.8, 0.9, 1]);

  const categoryColor = CATEGORY_COLORS[card.category] || '#6366F1';

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const threshold = 80;
      if (info.offset.x > threshold) {
        setParticleDirection('right');
        setShowParticles(true);
        setTimeout(() => {
          onSwipe('right');
          setShowParticles(false);
        }, 100);
      } else if (info.offset.x < -threshold) {
        setParticleDirection('left');
        setShowParticles(true);
        setTimeout(() => {
          onSwipe('left');
          setShowParticles(false);
        }, 100);
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
      {/* 스와이프 강도 인디케이터 */}
      <SwipeIntensityIndicator intensity={swipeIntensity} direction={swipeDirection} />

      {/* Card Container */}
      <div 
        className={`w-full h-full bg-card rounded-3xl shadow-2xl overflow-hidden relative transition-shadow duration-300 ${
          isDragging ? 'shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)]' : ''
        }`}
        style={{ 
          border: `2px solid ${categoryColor}40`,
        }}
      >
        {/* Category Header with gradient */}
        <div 
          className="relative p-4 text-white overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}CC)` }}
        >
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                               radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
            animate={{ x: [0, 40, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">
                {card.category}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
              <Zap size={12} />
              <span>{cardNumber}/{totalCards}</span>
            </div>
          </div>
        </div>

        {/* Statement */}
        <div className="p-6 flex-1 flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
          <motion.p 
            className="text-xl sm:text-2xl font-bold text-center text-foreground leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            "{card.statement}"
          </motion.p>
        </div>

        {/* Swipe Hints */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-card via-card/90 to-transparent">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center gap-2 text-red-500"
              animate={{ 
                x: swipeDirection === 'left' ? [-2, 0, -2] : 0,
                scale: swipeDirection === 'left' ? 1.1 : 1 
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ThumbsDown size={18} />
              </div>
              <span className="text-sm font-semibold">{card.leftLabel}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-green-500"
              animate={{ 
                x: swipeDirection === 'right' ? [2, 0, 2] : 0,
                scale: swipeDirection === 'right' ? 1.1 : 1 
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-sm font-semibold">{card.rightLabel}</span>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ThumbsUp size={18} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Left Overlay (Disagree) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-3xl"
          style={{ 
            opacity: leftOverlayOpacity,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
          }}
        >
          <motion.div 
            className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-2xl rotate-[-12deg] border-4 border-white shadow-xl"
            style={{ scale: leftOverlayScale }}
          >
            {card.leftLabel} ✕
          </motion.div>
        </motion.div>

        {/* Right Overlay (Agree) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-3xl"
          style={{ 
            opacity: rightOverlayOpacity,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(34,197,94,0.15))'
          }}
        >
          <motion.div 
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-2xl rotate-[12deg] border-4 border-white shadow-xl"
            style={{ scale: rightOverlayScale }}
          >
            {card.rightLabel} ✓
          </motion.div>
        </motion.div>

        {/* Particles */}
        <SwipeParticles direction={particleDirection} show={showParticles} />
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
    <div className="flex items-center justify-center gap-6">
      <motion.button
        whileHover={{ scale: 1.1, boxShadow: '0 10px 30px -10px rgba(239,68,68,0.5)' }}
        whileTap={{ scale: 0.9 }}
        onClick={onSwipeLeft}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 flex items-center justify-center shadow-lg border-2 border-red-200 dark:border-red-800 transition-all"
      >
        <ThumbsDown size={28} className="text-red-500" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUndo}
        disabled={!canUndo}
        className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed border border-border"
      >
        <RotateCcw size={20} className="text-muted-foreground" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1, boxShadow: '0 10px 30px -10px rgba(34,197,94,0.5)' }}
        whileTap={{ scale: 0.9 }}
        onClick={onSwipeRight}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-900/20 flex items-center justify-center shadow-lg border-2 border-green-200 dark:border-green-800 transition-all"
      >
        <ThumbsUp size={28} className="text-green-500" />
      </motion.button>
    </div>
  );
}
