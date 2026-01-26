import { useMemo } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Radar, 
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import type { SpectrumScores, SpectrumUncertainties, RadarDataPoint } from '@/types/spectrum';
import { formatForRadarChart, SPECTRUM_DIMENSIONS } from '@/types/spectrum';

interface SpectrumRadarChartProps {
  scores: SpectrumScores;
  uncertainties: SpectrumUncertainties;
  showConfidence?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SpectrumRadarChart({ 
  scores, 
  uncertainties, 
  showConfidence = true,
  size = 'md',
}: SpectrumRadarChartProps) {
  const data = useMemo(() => formatForRadarChart(scores, uncertainties), [scores, uncertainties]);
  
  const heights = { sm: 200, md: 300, lg: 400 };
  const height = heights[size];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const dataPoint = payload[0].payload as RadarDataPoint;
    const dimKey = Object.keys(SPECTRUM_DIMENSIONS).find(
      key => SPECTRUM_DIMENSIONS[key as keyof typeof SPECTRUM_DIMENSIONS].name === dataPoint.dimension
    ) as keyof typeof SPECTRUM_DIMENSIONS;
    const dim = SPECTRUM_DIMENSIONS[dimKey];
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm" style={{ color: dim.color }}>
          {dataPoint.dimension}
        </p>
        <div className="mt-1 space-y-1 text-xs">
          <p className="text-muted-foreground">
            {dim.leftLabel} ← → {dim.rightLabel}
          </p>
          <p>
            <span className="text-foreground font-medium">
              {dataPoint.score > 0 ? dim.rightLabel : dataPoint.score < 0 ? dim.leftLabel : '중립'}
            </span>
            <span className="text-muted-foreground"> ({dataPoint.score.toFixed(2)})</span>
          </p>
          {showConfidence && (
            <p className="text-muted-foreground">
              신뢰도: {dataPoint.confidence}%
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ 
              fill: 'hsl(var(--foreground))', 
              fontSize: size === 'sm' ? 10 : 12,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="정치 스펙트럼"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
