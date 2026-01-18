import { motion } from 'framer-motion';
import { Compass, Zap, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MbtiBannerProps {
  onPress?: () => void;
}

export function MbtiBanner({ onPress }: MbtiBannerProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onPress) onPress();
    navigate('/political-mbti');
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-left touch-target"
      style={{
        background: 'linear-gradient(135deg, hsl(200, 80%, 50%) 0%, hsl(180, 70%, 45%) 50%, hsl(160, 75%, 45%) 100%)',
      }}
    >
      {/* Decorative elements */}
      <motion.div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-12 bottom-4 w-20 h-20 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.3 }}
      />

      {/* Floating icons */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-30"
        animate={{ x: [0, -5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Compass size={28} className="text-white" />
        <Users size={22} className="text-white" />
        <Zap size={24} className="text-white" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Compass size={18} className="text-yellow-300" />
          </motion.div>
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
            정치 MBTI 테스트
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          나의 정치 성향은?
        </h3>
        <p className="text-sm text-white/80 mb-3">
          16가지 유형으로 알아보는 정치 성향
        </p>

        <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
          <span>테스트 시작</span>
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
