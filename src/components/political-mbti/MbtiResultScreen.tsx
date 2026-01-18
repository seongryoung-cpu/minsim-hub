import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Share2, RefreshCw, Home, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MbtiType, AxisScores } from '@/types/political-mbti';
import { MBTI_AXES } from '@/types/political-mbti';

interface MbtiResultScreenProps {
  mbtiType: MbtiType;
  axisScores: AxisScores;
  onRestart: () => void;
  onShare: () => void;
}

export function MbtiResultScreen({ mbtiType, axisScores, onRestart, onShare }: MbtiResultScreenProps) {
  const navigate = useNavigate();

  // 각 축별 퍼센티지 계산
  const getAxisPercentage = (axis: keyof AxisScores) => {
    const scores = axisScores[axis];
    const keys = Object.keys(scores) as (keyof typeof scores)[];
    const total = keys.reduce((sum, key) => sum + scores[key], 0);
    if (total === 0) return { left: 50, right: 50 };
    
    const leftKey = keys[0];
    const rightKey = keys[1];
    const leftPct = Math.round((scores[leftKey] / total) * 100);
    return { left: 100 - leftPct, right: leftPct };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col pb-24 lg:pb-8"
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border/30">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
        >
          <Home size={20} className="text-muted-foreground" />
        </button>
        <span className="font-semibold">나의 정치 MBTI</span>
        <button
          onClick={onShare}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
        >
          <Share2 size={20} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6 overflow-y-auto">
        {/* Type Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="inline-flex flex-col items-center"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">당신의 정치 유형</span>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <div
              className="text-5xl font-black tracking-wider mb-2"
              style={{ color: mbtiType.color }}
            >
              {mbtiType.typeCode}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {mbtiType.name}
            </div>
          </motion.div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <p className="text-muted-foreground leading-relaxed text-center">
            {mbtiType.description}
          </p>
        </motion.div>

        {/* Keywords */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {mbtiType.keywords.map((keyword, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${mbtiType.color}20`,
                color: mbtiType.color
              }}
            >
              #{keyword}
            </span>
          ))}
        </motion.div>

        {/* Axis Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <h3 className="font-semibold text-center mb-4">4축 분석</h3>
          {(Object.keys(MBTI_AXES) as (keyof typeof MBTI_AXES)[]).map((axis) => {
            const axisInfo = MBTI_AXES[axis];
            const pct = getAxisPercentage(axis);
            const isLeftDominant = pct.left > pct.right;
            
            return (
              <div key={axis} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isLeftDominant ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {axisInfo.left.code} {axisInfo.left.label}
                  </span>
                  <span className="text-muted-foreground">{axisInfo.name}</span>
                  <span className={`font-medium ${!isLeftDominant ? 'text-orange-500' : 'text-muted-foreground'}`}>
                    {axisInfo.right.label} {axisInfo.right.code}
                  </span>
                </div>
                <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '50%' }}
                    animate={{ width: `${pct.left}%` }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full"
                  />
                  <motion.div
                    initial={{ width: '50%' }}
                    animate={{ width: `${pct.right}%` }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-orange-500 to-orange-400 rounded-r-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pct.left}%</span>
                  <span>{pct.right}%</span>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Strengths & Weaknesses */}
        {(mbtiType.strengths.length > 0 || mbtiType.weaknesses.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-4"
          >
            {mbtiType.strengths.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-400">강점</span>
                </div>
                <ul className="space-y-1.5 text-sm text-green-700 dark:text-green-300">
                  {mbtiType.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {mbtiType.weaknesses.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-400">주의점</span>
                </div>
                <ul className="space-y-1.5 text-sm text-red-700 dark:text-red-300">
                  {mbtiType.weaknesses.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex gap-3 pt-4"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={onRestart}
            className="flex-1 h-12 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 하기
          </Button>
          <Button
            size="lg"
            onClick={onShare}
            className="flex-1 h-12 rounded-xl"
            style={{ backgroundColor: mbtiType.color }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유하기
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
