import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, RefreshCw } from 'lucide-react';
import { useUserSpectrum } from '@/hooks/useSpectrumTest';
import { SpectrumRadarChart } from './SpectrumRadarChart';
import { 
  createRadarData, 
  getSpectrumLabel, 
  getConfidenceLevel,
  SPECTRUM_DIMENSIONS,
  DimensionKey
} from '@/types/political-mbti';

export function SpectrumSummaryCard() {
  const navigate = useNavigate();
  const { data: spectrum, isLoading } = useUserSpectrum();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-app-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">나의 정치 성향</h3>
            <p className="text-xs text-muted-foreground">로딩 중...</p>
          </div>
        </div>
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (!spectrum) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-app-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">나의 정치 성향</h3>
            <p className="text-xs text-muted-foreground">아직 테스트를 진행하지 않았어요</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/political-mbti')}
          className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium flex items-center justify-center gap-2"
        >
          테스트 시작하기
          <ChevronRight size={18} />
        </button>
      </motion.div>
    );
  }

  const radarData = createRadarData(spectrum.scores, spectrum.uncertainty);
  const label = getSpectrumLabel(spectrum.scores);
  const confidence = getConfidenceLevel(spectrum.uncertainty);

  // 가장 강한 성향 찾기
  const dimensions = Object.keys(SPECTRUM_DIMENSIONS) as DimensionKey[];
  const strongestDim = dimensions.reduce((prev, curr) => 
    Math.abs(spectrum.scores[curr]) > Math.abs(spectrum.scores[prev]) ? curr : prev
  );
  const strongestInfo = SPECTRUM_DIMENSIONS[strongestDim];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-5 shadow-app-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">나의 정치 성향</h3>
            <p className="text-xs text-muted-foreground">
              {spectrum.totalAnswers}개 응답 · {
                confidence === 'high' ? '높은 정확도' :
                confidence === 'medium' ? '보통 정확도' : '낮은 정확도'
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/political-mbti')}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title="다시 테스트"
        >
          <RefreshCw size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Mini Radar */}
      <div className="flex justify-center mb-4">
        <SpectrumRadarChart data={radarData} size={180} showLabels={true} showConfidence={false} />
      </div>

      {/* Label */}
      <div className="text-center mb-3">
        <div className="text-lg font-bold text-primary">{label || '중도 성향'}</div>
        <div className="text-xs text-muted-foreground mt-1">
          가장 뚜렷한 영역: <span style={{ color: strongestInfo.color }}>{strongestInfo.name}</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => navigate('/political-mbti')}
        className="w-full py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2"
      >
        상세 결과 보기
        <ChevronRight size={16} />
      </button>
    </motion.div>
  );
}
