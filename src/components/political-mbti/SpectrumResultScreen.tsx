import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Share2, RefreshCw, Home, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpectrumRadarChart, SpectrumAnalysisCard } from './SpectrumRadarChart';
import { 
  SpectrumScores, 
  SpectrumUncertainty, 
  createRadarData, 
  getSpectrumLabel,
  getConfidenceLevel,
  SPECTRUM_DIMENSIONS,
  DimensionKey
} from '@/types/political-mbti';

interface SpectrumResultScreenProps {
  scores: SpectrumScores;
  uncertainty: SpectrumUncertainty;
  totalAnswers: number;
  onRestart: () => void;
  onShare: () => void;
}

export function SpectrumResultScreen({ 
  scores, 
  uncertainty, 
  totalAnswers,
  onRestart, 
  onShare 
}: SpectrumResultScreenProps) {
  const navigate = useNavigate();
  const radarData = createRadarData(scores, uncertainty);
  const label = getSpectrumLabel(scores);
  const confidence = getConfidenceLevel(uncertainty);
  
  // 가장 강한 성향 찾기
  const dimensions = Object.keys(SPECTRUM_DIMENSIONS) as DimensionKey[];
  const strongestDim = dimensions.reduce((prev, curr) => 
    Math.abs(scores[curr]) > Math.abs(scores[prev]) ? curr : prev
  );
  const strongestInfo = SPECTRUM_DIMENSIONS[strongestDim];
  const strongestDirection = scores[strongestDim] < 0 ? strongestInfo.leftLabel : strongestInfo.rightLabel;

  const confidenceLabel = {
    low: '아직 더 많은 질문이 필요해요',
    medium: '어느 정도 파악되었어요',
    high: '정확하게 분석되었어요'
  }[confidence];

  const confidenceColor = {
    low: 'text-amber-500',
    medium: 'text-blue-500', 
    high: 'text-green-500'
  }[confidence];

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
        <span className="font-semibold">나의 정치 성향</span>
        <button
          onClick={onShare}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
        >
          <Share2 size={20} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6 overflow-y-auto">
        {/* Main Result */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">당신의 정치 성향</span>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          
          <div className="text-2xl font-bold text-foreground">
            {label || '중도 성향'}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm">
            <Target className="w-4 h-4" style={{ color: strongestInfo.color }} />
            <span className="text-muted-foreground">
              가장 뚜렷한 성향: <strong style={{ color: strongestInfo.color }}>{strongestInfo.name} {strongestDirection}</strong>
            </span>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <SpectrumRadarChart data={radarData} size={280} />
        </motion.div>

        {/* Confidence Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2"
        >
          <TrendingUp className={`w-4 h-4 ${confidenceColor}`} />
          <span className={`text-sm ${confidenceColor}`}>
            {totalAnswers}개 응답 · {confidenceLabel}
          </span>
        </motion.div>

        {/* Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <SpectrumAnalysisCard scores={scores} uncertainty={uncertainty} />
        </motion.div>

        {/* Dimension Descriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
        >
          <h3 className="font-semibold text-center mb-4">성향 해석</h3>
          {dimensions.map(dim => {
            const info = SPECTRUM_DIMENSIONS[dim];
            const score = scores[dim];
            if (Math.abs(score) < 0.2) return null; // 중도는 건너뜀
            
            const isLeft = score < 0;
            const strength = Math.abs(score) > 0.6 ? '강한' : '약한';
            const direction = isLeft ? info.leftLabel : info.rightLabel;
            
            return (
              <div key={dim} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div 
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <div className="text-sm">
                  <span className="font-medium">{info.name}</span>
                  <span className="text-muted-foreground"> 영역에서 </span>
                  <span className="font-medium" style={{ color: info.color }}>
                    {strength} {direction} 성향
                  </span>
                  <span className="text-muted-foreground">을 보여요.</span>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
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
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유하기
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
