import { motion } from 'framer-motion';
import type { SidoType } from '@/types/region';

interface KoreaMapProps {
  selectedSido: SidoType | null;
  currentSido?: SidoType | null;
  onSelect: (sido: SidoType) => void;
}

// 간결한 한국 지도 SVG 경로 데이터 - 절대 좌표 기반
const REGION_PATHS: Record<SidoType, { path: string; label: { x: number; y: number } }> = {
  '서울특별시': {
    path: 'M154 96L162 92L172 96L174 104L168 110L160 112L152 108L150 100Z',
    label: { x: 162, y: 102 }
  },
  '인천광역시': {
    path: 'M128 95L138 90L148 95L152 100L150 108L145 115L135 118L125 112L120 105L123 98Z',
    label: { x: 136, y: 105 }
  },
  '경기도': {
    path: 'M140 70L175 65L200 75L210 90L215 120L200 150L180 160L155 155L135 145L120 125L118 100L125 85Z',
    label: { x: 165, y: 115 }
  },
  '강원도': {
    path: 'M200 60L260 55L295 75L310 105L305 145L285 170L250 180L215 170L195 145L190 110L195 80Z',
    label: { x: 255, y: 115 }
  },
  '충청북도': {
    path: 'M185 155L220 150L245 160L250 180L240 200L215 210L190 205L175 190L180 170Z',
    label: { x: 215, y: 180 }
  },
  '충청남도': {
    path: 'M100 160L130 150L160 155L175 170L175 195L160 220L130 230L95 225L75 200L80 175Z',
    label: { x: 125, y: 195 }
  },
  '세종특별자치시': {
    path: 'M165 175L180 172L185 180L182 190L170 192L162 185Z',
    label: { x: 173, y: 183 }
  },
  '대전광역시': {
    path: 'M178 195L192 192L200 200L198 212L186 218L175 212L173 202Z',
    label: { x: 186, y: 205 }
  },
  '전라북도': {
    path: 'M95 225L135 220L165 225L180 240L175 270L145 290L110 285L80 265L75 240Z',
    label: { x: 125, y: 255 }
  },
  '전라남도': {
    path: 'M65 280L110 275L145 285L160 310L155 350L130 375L90 380L55 360L40 325L45 295Z',
    label: { x: 100, y: 330 }
  },
  '광주광역시': {
    path: 'M108 298L122 295L130 303L128 315L118 320L105 315L103 305Z',
    label: { x: 116, y: 308 }
  },
  '경상북도': {
    path: 'M240 145L285 140L315 155L325 190L315 230L290 255L250 260L220 250L205 220L210 180L225 160Z',
    label: { x: 270, y: 200 }
  },
  '경상남도': {
    path: 'M175 260L215 255L250 265L270 295L265 335L240 360L200 365L165 350L155 315L160 280Z',
    label: { x: 215, y: 310 }
  },
  '대구광역시': {
    path: 'M252 215L268 212L278 222L275 238L262 245L248 240L245 228Z',
    label: { x: 262, y: 228 }
  },
  '울산광역시': {
    path: 'M295 255L312 252L322 265L318 282L305 288L290 282L288 268Z',
    label: { x: 305, y: 270 }
  },
  '부산광역시': {
    path: 'M278 325L295 322L308 335L305 355L290 362L272 355L268 340Z',
    label: { x: 288, y: 342 }
  },
  '제주특별자치도': {
    path: 'M70 420L120 415L145 430L150 455L130 475L90 480L55 465L45 440L55 425Z',
    label: { x: 100, y: 448 }
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
      viewBox="0 0 350 500"
      className="w-full h-full"
      style={{ maxHeight: '55vh' }}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.05)" />
          <stop offset="100%" stopColor="hsl(var(--secondary) / 0.1)" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ocean background */}
      <rect x="0" y="0" width="350" height="500" fill="url(#oceanGradient)" rx="16" />

      {/* Regions */}
      {(Object.entries(REGION_PATHS) as [SidoType, { path: string; label: { x: number; y: number } }][]).map(
        ([sido, { path, label }]) => {
          const isSelected = selectedSido === sido;
          const isCurrent = currentSido === sido;
          const color = REGION_COLORS[sido] || '#6B7280';

          return (
            <g
              key={sido}
              onClick={() => onSelect(sido)}
              className="cursor-pointer"
              style={{ transition: 'transform 0.15s ease' }}
            >
              {/* Region path */}
              <motion.path
                d={path}
                fill={isSelected ? color : isCurrent ? `${color}90` : `${color}40`}
                stroke={isSelected ? color : isCurrent ? color : `${color}60`}
                strokeWidth={isSelected ? 2.5 : isCurrent ? 2 : 1}
                filter={isSelected ? 'url(#glow)' : 'url(#shadow)'}
                initial={false}
                animate={{
                  fill: isSelected ? color : isCurrent ? `${color}90` : `${color}40`,
                  strokeWidth: isSelected ? 2.5 : isCurrent ? 2 : 1,
                  scale: isSelected ? 1.02 : 1,
                }}
                whileHover={{ 
                  scale: 1.03,
                  fill: isSelected ? color : `${color}70`,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={{ 
                  transformOrigin: `${label.x}px ${label.y}px`,
                  transformBox: 'fill-box'
                }}
              />

              {/* Region label */}
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-[9px] font-bold pointer-events-none select-none ${
                  isSelected ? 'fill-white' : 'fill-foreground'
                }`}
                style={{ 
                  textShadow: isSelected 
                    ? '0 1px 2px rgba(0,0,0,0.3)' 
                    : '0 1px 2px rgba(255,255,255,0.9), 0 0px 4px rgba(255,255,255,0.8)' 
                }}
              >
                {sido.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace('도', '')}
              </text>

              {/* Selection indicator */}
              {isSelected && (
                <motion.circle
                  cx={label.x}
                  cy={label.y - 12}
                  r="4"
                  fill="white"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                />
              )}
            </g>
          );
        }
      )}
    </svg>
  );
}
