import { motion } from 'framer-motion';
import { Heart, Brain, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PolicyMatchBannerProps {
  onPress?: () => void;
}

export function PolicyMatchBanner({ onPress }: PolicyMatchBannerProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onPress) onPress();
    navigate('/policy-match');
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-left touch-target"
      style={{
        background: 'linear-gradient(135deg, hsl(260, 80%, 55%) 0%, hsl(280, 70%, 50%) 50%, hsl(320, 75%, 55%) 100%)',
      }}
    >
      {/* Decorative elements */}
      <motion.div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-8 bottom-2 w-16 h-16 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />

      {/* Floating icons */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-30"
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Brain size={28} className="text-white" />
        <Sparkles size={20} className="text-white" />
        <Heart size={28} className="text-white" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={18} className="text-yellow-300" />
          </motion.div>
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
            정책 매칭 게임
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          나의 진짜 선택은?
        </h3>
        <p className="text-sm text-white/80 mb-3">
          머리 🧠 vs 가슴 ❤️ 게임 시작하기
        </p>

        <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
          <span>지금 시작하기</span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight size={18} />
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}
