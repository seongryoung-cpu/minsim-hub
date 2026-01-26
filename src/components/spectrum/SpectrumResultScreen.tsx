import { motion } from 'framer-motion';
import { Share2, RotateCcw, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SpectrumRadarChart } from './SpectrumRadarChart';
import type { SpectrumScores, SpectrumUncertainties } from '@/types/spectrum';
import { 
  SPECTRUM_DIMENSIONS, 
  normalizeScore, 
  uncertaintyToConfidence 
} from '@/types/spectrum';
import { getDimensionLabel } from '@/lib/bayesianEngine';

interface SpectrumResultScreenProps {
  scores: SpectrumScores;
  uncertainties: SpectrumUncertainties;
  totalAnswers: number;
  onRestart: () => void;
  onShare: () => void;
  onHome: () => void;
}

export function SpectrumResultScreen({
  scores,
  uncertainties,
  totalAnswers,
  onRestart,
  onShare,
  onHome,
}: SpectrumResultScreenProps) {
  const dimensions = [
    { key: 'economy' as const, code: 'ECO' as const },
    { key: 'security' as const, code: 'SEC' as const },
    { key: 'gender' as const, code: 'GEN' as const },
    { key: 'fairness' as const, code: 'FAI' as const },
    { key: 'future' as const, code: 'FUT' as const },
  ];

  // 평균 신뢰도 계산
  const avgConfidence = Math.round(
    Object.values(uncertainties).reduce(
      (sum, u) => sum + uncertaintyToConfidence(u), 0
    ) / 5
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="h-14 flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={onHome}>
            <Home size={20} />
          </Button>
          <h1 className="font-semibold">나의 정치 스펙트럼</h1>
          <Button variant="ghost" size="icon" onClick={onShare}>
            <Share2 size={20} />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
        {/* Summary Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {totalAnswers}개 질문 응답 완료
              </p>
              <p className="text-lg font-medium">
                신뢰도 <span className="text-primary font-bold">{avgConfidence}%</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <SpectrumRadarChart 
                scores={scores} 
                uncertainties={uncertainties}
                size="lg"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Dimension Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="font-semibold text-lg">차원별 분석</h2>
          
          {dimensions.map(({ key, code }, index) => {
            const dim = SPECTRUM_DIMENSIONS[code];
            const score = scores[key];
            const confidence = uncertaintyToConfidence(uncertainties[key]);
            const label = getDimensionLabel(key, score);
            const percentage = normalizeScore(score);
            
            return (
              <motion.div
                key={key}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dim.color }}
                        />
                        <span className="font-medium">{dim.name}</span>
                      </div>
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: dim.color }}
                      >
                        {label}
                      </span>
                    </div>
                    
                    {/* Score bar */}
                    <div className="relative h-6 bg-secondary rounded-full overflow-hidden mb-2">
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border z-10" />
                      
                      {/* Score indicator */}
                      <motion.div
                        className="absolute top-1 bottom-1 w-4 rounded-full"
                        style={{ 
                          backgroundColor: dim.color,
                          left: `calc(${percentage}% - 8px)`,
                        }}
                        initial={{ left: '50%' }}
                        animate={{ left: `calc(${percentage}% - 8px)` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{dim.leftLabel}</span>
                      <span className="text-foreground">신뢰도 {confidence}%</span>
                      <span>{dim.rightLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Button 
            onClick={onShare} 
            className="w-full h-12"
            size="lg"
          >
            <Share2 size={20} className="mr-2" />
            결과 공유하기
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onRestart}
            className="w-full h-12"
            size="lg"
          >
            <RotateCcw size={20} className="mr-2" />
            다시 테스트하기
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
