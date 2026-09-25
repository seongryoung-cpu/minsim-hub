import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import type { AxisScores } from '@/types/political-mbti';
import { MBTI_AXES, calculateMbtiType } from '@/types/political-mbti';

interface MbtiRevealScreenProps {
  axisScores: AxisScores;
  onComplete: () => void;
}

export function MbtiRevealScreen({ axisScores, onComplete }: MbtiRevealScreenProps) {
  const [phase, setPhase] = useState<'analyzing' | 'axes' | 'reveal'>('analyzing');
  const [revealedAxes, setRevealedAxes] = useState<number>(0);
  const typeCode = calculateMbtiType(axisScores);
  const axes = Object.keys(MBTI_AXES) as (keyof typeof MBTI_AXES)[];

  useEffect(() => {
    // Phase 1: Analyzing (1.5s)
    const analyzeTimer = setTimeout(() => {
      setPhase('axes');
    }, 1500);

    return () => clearTimeout(analyzeTimer);
  }, []);

  useEffect(() => {
    if (phase === 'axes') {
      // Reveal each axis one by one
      const axisTimers = axes.map((_, i) => 
        setTimeout(() => {
          setRevealedAxes(i + 1);
          if (i === axes.length - 1) {
            // After last axis, go to reveal
            setTimeout(() => setPhase('reveal'), 800);
          }
        }, i * 600)
      );

      return () => axisTimers.forEach(t => clearTimeout(t));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, axes.length]);

  useEffect(() => {
    if (phase === 'reveal') {
      const completeTimer = setTimeout(onComplete, 2000);
      return () => clearTimeout(completeTimer);
    }
  }, [phase, onComplete]);

  // Get dominant side for each axis
  const getAxisResult = (axis: keyof typeof MBTI_AXES) => {
    const scores = axisScores[axis];
    const keys = Object.keys(scores) as (keyof typeof scores)[];
    const total = keys.reduce((sum, key) => sum + scores[key], 0);
    if (total === 0) return { dominant: keys[0], percentage: 50 };
    
    const leftKey = keys[0];
    const rightKey = keys[1];
    const leftPct = Math.round((scores[leftKey] / total) * 100);
    const rightPct = 100 - leftPct;
    
    return leftPct >= rightPct 
      ? { dominant: leftKey, percentage: leftPct }
      : { dominant: rightKey, percentage: rightPct };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-background via-primary/5 to-background flex items-center justify-center"
    >
      <div className="max-w-md w-full px-6">
        <AnimatePresence mode="wait">
          {/* Phase 1: Analyzing */}
          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1, repeat: Infinity }
                }}
                className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <h2 className="text-xl font-bold text-foreground">분석 중...</h2>
                <p className="text-muted-foreground mt-2">당신의 정치 성향을 분석하고 있습니다</p>
              </motion.div>

              {/* Loading dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-primary"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 2: Axes Reveal */}
          {phase === 'axes' && (
            <motion.div
              key="axes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.h2 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center text-lg font-semibold text-foreground mb-6"
              >
                4축 분석 결과
              </motion.h2>

              {axes.map((axis, i) => {
                const axisInfo = MBTI_AXES[axis];
                const result = getAxisResult(axis);
                const isRevealed = i < revealedAxes;
                const axisColor = {
                  EI: '#3B82F6',
                  SN: '#10B981',
                  TF: '#F59E0B',
                  JP: '#EC4899',
                }[axis];

                return (
                  <motion.div
                    key={axis}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ 
                      opacity: isRevealed ? 1 : 0.3,
                      x: isRevealed ? 0 : -30
                    }}
                    transition={{ duration: 0.4 }}
                    className="relative bg-card border border-border rounded-xl p-4 overflow-hidden"
                  >
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          className="absolute inset-0 origin-left"
                          style={{ 
                            background: `linear-gradient(90deg, ${axisColor}20, transparent)`
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={isRevealed ? { scale: [1, 1.2, 1] } : {}}
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                          style={{ backgroundColor: axisColor }}
                        >
                          {result.dominant}
                        </motion.div>
                        <div>
                          <div className="font-semibold">{axisInfo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {axisInfo.left.label} ↔ {axisInfo.right.label}
                          </div>
                        </div>
                      </div>

                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-lg font-bold"
                          style={{ color: axisColor }}
                        >
                          {result.percentage}%
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Phase 3: Final Reveal */}
          {phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-6"
            >
              {/* Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'][i % 4],
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -50],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>

              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <span className="text-lg text-muted-foreground">당신의 정치 MBTI는</span>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-7xl font-black tracking-wider bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
                >
                  {typeCode}
                </motion.div>
              </motion.div>

              {/* Glowing ring */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-64 h-64 rounded-full border-4 border-primary/30 blur-sm" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
