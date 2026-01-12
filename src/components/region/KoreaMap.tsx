import { motion } from 'framer-motion';
import type { SidoType } from '@/types/region';

interface KoreaMapProps {
  selectedSido: SidoType | null;
  currentSido?: SidoType | null;
  onSelect: (sido: SidoType) => void;
}

// 시/도별 SVG 경로 데이터 (간소화된 한국 지도)
const REGION_PATHS: Record<SidoType, { path: string; label: { x: number; y: number } }> = {
  '서울특별시': {
    path: 'M145,95 L155,90 L165,95 L165,105 L155,110 L145,105 Z',
    label: { x: 155, y: 102 }
  },
  '인천광역시': {
    path: 'M125,95 L140,90 L145,100 L140,110 L125,110 L120,100 Z',
    label: { x: 132, y: 102 }
  },
  '경기도': {
    path: 'M120,70 L170,65 L185,80 L190,100 L180,120 L170,130 L145,135 L120,125 L105,110 L110,90 Z',
    label: { x: 155, y: 80 }
  },
  '강원도': {
    path: 'M175,50 L220,45 L250,70 L255,100 L240,130 L200,140 L175,130 L170,100 L175,70 Z',
    label: { x: 215, y: 90 }
  },
  '충청북도': {
    path: 'M155,135 L190,130 L205,145 L200,175 L170,185 L150,175 L145,155 Z',
    label: { x: 175, y: 158 }
  },
  '충청남도': {
    path: 'M95,130 L145,125 L150,155 L140,180 L115,195 L85,185 L75,160 L80,140 Z',
    label: { x: 115, y: 160 }
  },
  '세종특별자치시': {
    path: 'M140,150 L155,148 L158,160 L150,168 L138,165 Z',
    label: { x: 148, y: 158 }
  },
  '대전광역시': {
    path: 'M145,175 L165,172 L170,185 L160,195 L145,192 L140,182 Z',
    label: { x: 155, y: 184 }
  },
  '전라북도': {
    path: 'M80,195 L140,185 L155,200 L150,230 L115,250 L75,240 L65,215 Z',
    label: { x: 110, y: 218 }
  },
  '광주광역시': {
    path: 'M85,255 L105,250 L115,260 L110,275 L90,278 L80,268 Z',
    label: { x: 98, y: 265 }
  },
  '전라남도': {
    path: 'M60,245 L115,235 L130,255 L145,290 L130,320 L95,335 L55,320 L40,290 L45,260 Z',
    label: { x: 95, y: 290 }
  },
  '경상북도': {
    path: 'M175,140 L240,130 L265,155 L270,200 L250,230 L210,240 L175,225 L165,195 L170,160 Z',
    label: { x: 220, y: 185 }
  },
  '대구광역시': {
    path: 'M205,210 L225,205 L235,220 L230,235 L210,240 L200,228 Z',
    label: { x: 218, y: 222 }
  },
  '울산광역시': {
    path: 'M255,220 L275,215 L285,235 L275,255 L255,255 L248,240 Z',
    label: { x: 268, y: 238 }
  },
  '부산광역시': {
    path: 'M240,265 L265,258 L280,275 L275,295 L250,300 L235,285 Z',
    label: { x: 258, y: 280 }
  },
  '경상남도': {
    path: 'M145,230 L200,220 L235,245 L250,280 L230,310 L180,320 L140,300 L130,265 Z',
    label: { x: 185, y: 275 }
  },
  '제주특별자치도': {
    path: 'M70,370 L130,365 L145,385 L135,405 L85,410 L60,395 L55,378 Z',
    label: { x: 100, y: 388 }
  },
};

// 시/도별 색상
const REGION_COLORS: Record<string, string> = {
  '서울특별시': '#4F46E5',
  '인천광역시': '#7C3AED',
  '경기도': '#2563EB',
  '강원도': '#059669',
  '충청북도': '#0891B2',
  '충청남도': '#0D9488',
  '세종특별자치시': '#6366F1',
  '대전광역시': '#8B5CF6',
  '전라북도': '#D97706',
  '광주광역시': '#EA580C',
  '전라남도': '#DC2626',
  '경상북도': '#DB2777',
  '대구광역시': '#E11D48',
  '울산광역시': '#BE185D',
  '부산광역시': '#9333EA',
  '경상남도': '#C026D3',
  '제주특별자치도': '#F59E0B',
};

export function KoreaMap({ selectedSido, currentSido, onSelect }: KoreaMapProps) {
  return (
    <svg
      viewBox="0 0 320 430"
      className="w-full h-full"
      style={{ maxHeight: '50vh' }}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.05)" />
          <stop offset="100%" stopColor="hsl(var(--secondary) / 0.1)" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ocean background */}
      <rect x="0" y="0" width="320" height="430" fill="url(#oceanGradient)" rx="16" />

      {/* Regions */}
      {(Object.entries(REGION_PATHS) as [SidoType, { path: string; label: { x: number; y: number } }][]).map(
        ([sido, { path, label }]) => {
          const isSelected = selectedSido === sido;
          const isCurrent = currentSido === sido;
          const color = REGION_COLORS[sido] || '#6B7280';

          return (
            <motion.g
              key={sido}
              onClick={() => onSelect(sido)}
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ transformOrigin: `${label.x}px ${label.y}px` }}
            >
              {/* Region path */}
              <motion.path
                d={path}
                fill={isSelected ? color : isCurrent ? `${color}90` : `${color}40`}
                stroke={isSelected ? color : isCurrent ? color : `${color}60`}
                strokeWidth={isSelected ? 3 : isCurrent ? 2 : 1.5}
                filter={isSelected ? 'url(#glow)' : 'url(#shadow)'}
                initial={false}
                animate={{
                  fill: isSelected ? color : isCurrent ? `${color}90` : `${color}40`,
                  strokeWidth: isSelected ? 3 : isCurrent ? 2 : 1.5,
                }}
                transition={{ duration: 0.2 }}
                className="hover:brightness-110"
              />

              {/* Region label - only for larger regions or selected */}
              {(isSelected || isCurrent || !['서울특별시', '인천광역시', '세종특별자치시', '대전광역시', '광주광역시', '대구광역시', '울산광역시', '부산광역시'].includes(sido)) && (
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[8px] font-bold pointer-events-none select-none ${
                    isSelected ? 'fill-white' : 'fill-foreground/80'
                  }`}
                  style={{ textShadow: isSelected ? 'none' : '0 1px 2px rgba(255,255,255,0.8)' }}
                >
                  {sido.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace('도', '')}
                </text>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <motion.circle
                  cx={label.x}
                  cy={label.y - 15}
                  r="4"
                  fill="white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                />
              )}
            </motion.g>
          );
        }
      )}

      {/* Jeju separator line */}
      <line
        x1="50"
        y1="350"
        x2="150"
        y2="350"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.5"
      />
    </svg>
  );
}
