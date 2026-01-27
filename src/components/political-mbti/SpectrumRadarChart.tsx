import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarDataPoint, SPECTRUM_DIMENSIONS, DimensionKey } from '@/types/political-mbti';

interface SpectrumRadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  showLabels?: boolean;
  showConfidence?: boolean;
  animated?: boolean;
}

export function SpectrumRadarChart({ 
  data, 
  size = 280, 
  showLabels = true,
  showConfidence = true,
  animated = true
}: SpectrumRadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const angleStep = (2 * Math.PI) / 5;
  
  // 각 꼭지점 좌표 계산
  const points = useMemo(() => {
    return data.map((d, i) => {
      const angle = -Math.PI / 2 + i * angleStep; // 12시 방향부터 시작
      const scoreRadius = (d.score / 100) * radius;
      return {
        ...d,
        x: center + scoreRadius * Math.cos(angle),
        y: center + scoreRadius * Math.sin(angle),
        labelX: center + (radius + 25) * Math.cos(angle),
        labelY: center + (radius + 25) * Math.sin(angle),
        outerX: center + radius * Math.cos(angle),
        outerY: center + radius * Math.sin(angle),
      };
    });
  }, [data, center, radius, angleStep]);

  // 폴리곤 경로
  const polygonPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }, [points]);

  // 그리드 라인
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* 배경 그리드 */}
        {gridLevels.map((level, i) => (
          <polygon
            key={i}
            points={Array.from({ length: 5 }, (_, j) => {
              const angle = -Math.PI / 2 + j * angleStep;
              const r = radius * level;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="text-border/50"
          />
        ))}

        {/* 축 라인 */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.outerX}
            y2={p.outerY}
            stroke="currentColor"
            strokeWidth={1}
            className="text-border/30"
          />
        ))}

        {/* 데이터 영역 */}
        <motion.path
          d={polygonPath}
          fill="url(#radarGradient)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          initial={animated ? { opacity: 0, scale: 0.5 } : {}}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* 그라데이션 정의 */}
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
          </radialGradient>
        </defs>

        {/* 데이터 포인트 */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={6}
            fill={p.color}
            stroke="white"
            strokeWidth={2}
            initial={animated ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
          />
        ))}

        {/* 레이블 */}
        {showLabels && points.map((p, i) => {
          const isTop = i === 0;
          const isBottom = i === 2 || i === 3;
          const textAnchor = i === 0 ? 'middle' : i < 3 ? 'start' : 'end';
          
          return (
            <g key={`label-${i}`}>
              <text
                x={p.labelX}
                y={p.labelY + (isTop ? -5 : isBottom ? 15 : 0)}
                textAnchor={textAnchor}
                className="text-xs font-medium fill-foreground"
              >
                {p.label}
              </text>
              {showConfidence && (
                <text
                  x={p.labelX}
                  y={p.labelY + (isTop ? 8 : isBottom ? 28 : 13)}
                  textAnchor={textAnchor}
                  className="text-[10px] fill-muted-foreground"
                >
                  {p.score}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 차원별 바 차트
interface DimensionBarProps {
  dimension: DimensionKey;
  score: number; // -1 to 1
  uncertainty: number;
  animated?: boolean;
  delay?: number;
}

export function DimensionBar({ dimension, score, uncertainty, animated = true, delay = 0 }: DimensionBarProps) {
  const info = SPECTRUM_DIMENSIONS[dimension];
  const percentage = Math.round((score + 1) * 50); // 0-100
  const isLeft = score < 0;
  const barWidth = Math.abs(score) * 50; // 0-50%
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className={`font-medium ${isLeft ? 'text-blue-500' : 'text-muted-foreground'}`}>
          {info.leftLabel}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {info.name}
        </span>
        <span className={`font-medium ${!isLeft ? 'text-orange-500' : 'text-muted-foreground'}`}>
          {info.rightLabel}
        </span>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        {/* 중앙선 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border z-10" />
        
        {/* 점수 바 */}
        <motion.div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: isLeft ? `${50 - barWidth}%` : '50%',
            backgroundColor: info.color,
          }}
          initial={animated ? { width: 0 } : { width: `${barWidth}%` }}
          animate={{ width: `${barWidth}%` }}
          transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* 불확실도 표시 */}
        {uncertainty > 0.3 && (
          <div 
            className="absolute top-0 h-full bg-current opacity-20"
            style={{
              left: `${50 - uncertainty * 25}%`,
              width: `${uncertainty * 50}%`,
            }}
          />
        )}
      </div>
      
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{isLeft ? percentage : 100 - percentage}%</span>
        <span>{uncertainty > 0.5 ? '낮은 확신' : uncertainty > 0.3 ? '중간 확신' : '높은 확신'}</span>
        <span>{isLeft ? 100 - percentage : percentage}%</span>
      </div>
    </div>
  );
}

// 전체 분석 카드
interface SpectrumAnalysisCardProps {
  scores: Record<DimensionKey, number>;
  uncertainty: Record<DimensionKey, number>;
}

export function SpectrumAnalysisCard({ scores, uncertainty }: SpectrumAnalysisCardProps) {
  const dimensions = Object.keys(SPECTRUM_DIMENSIONS) as DimensionKey[];
  
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-center">5차원 정치 성향 분석</h3>
      {dimensions.map((dim, i) => (
        <DimensionBar
          key={dim}
          dimension={dim}
          score={scores[dim]}
          uncertainty={uncertainty[dim]}
          delay={i * 0.1}
        />
      ))}
    </div>
  );
}
