import { motion, AnimatePresence } from 'framer-motion';

interface MbtiProgressParticlesProps {
  show: boolean;
  direction: 'left' | 'right';
}

export function MbtiProgressParticles({ show, direction }: MbtiProgressParticlesProps) {
  const colors = direction === 'left' 
    ? ['#3B82F6', '#60A5FA', '#93C5FD'] // Blue
    : ['#F97316', '#FB923C', '#FDBA74']; // Orange

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => {
            const angle = (direction === 'left' ? 180 : 0) + (Math.random() * 60 - 30);
            const distance = 100 + Math.random() * 100;
            const x = Math.cos(angle * Math.PI / 180) * distance;
            const y = Math.sin(angle * Math.PI / 180) * distance - 50;

            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: 6 + Math.random() * 8,
                  height: 6 + Math.random() * 8,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                }}
                initial={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  x,
                  y,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.6 + Math.random() * 0.4,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

interface AxisProgressIndicatorProps {
  currentIndex: number;
  totalQuestions: number;
  axisProgress: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
}

export function AxisProgressIndicator({ currentIndex, totalQuestions, axisProgress }: AxisProgressIndicatorProps) {
  const axes = [
    { key: 'EI', label: '경제', color: '#3B82F6' },
    { key: 'SN', label: '사회', color: '#10B981' },
    { key: 'TF', label: '외교', color: '#F59E0B' },
    { key: 'JP', label: '정치', color: '#EC4899' },
  ];

  const progress = (currentIndex / totalQuestions) * 100;

  return (
    <div className="space-y-3">
      {/* Main progress */}
      <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-y-0 w-8 bg-white/50 blur-sm"
          animate={{ left: `${progress - 4}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ opacity: progress > 0 ? 1 : 0 }}
        />
      </div>

      {/* Axis indicators */}
      <div className="flex justify-between gap-1">
        {axes.map(({ key, label, color }) => (
          <motion.div
            key={key}
            className="flex-1 h-1 rounded-full overflow-hidden bg-secondary/30"
            title={label}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ 
                width: `${(axisProgress[key as keyof typeof axisProgress] / (totalQuestions / 4)) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface SwipeSuccessFeedbackProps {
  show: boolean;
  direction: 'left' | 'right';
  label: string;
}

export function SwipeSuccessFeedback({ show, direction, label }: SwipeSuccessFeedbackProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          className={`absolute top-1/2 ${direction === 'left' ? 'left-8' : 'right-8'} -translate-y-1/2 z-30`}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className={`px-6 py-3 rounded-2xl font-bold text-white shadow-xl ${
              direction === 'left' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600'
            }`}
          >
            {label}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
