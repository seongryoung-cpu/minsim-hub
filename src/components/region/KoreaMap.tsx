import { motion } from 'framer-motion';
import { SIDO_LIST, METRO_SIDO_LIST, type SidoType } from '@/types/region';
import { KOREA_MAP_FULL_BOX, KOREA_SIDO_SHAPES } from './koreaMapData';

type Box = [number, number, number, number];

interface KoreaMapProps {
  /** 강조 표시할 시·도 (현재 지역 등) */
  highlightSido?: SidoType | null;
  /** 지정하면 해당 시·도로 확대 */
  focusSido?: SidoType | null;
  /** 지도에서 시·도를 눌렀을 때 — 보조 입력 수단 (주 입력은 칩·검색) */
  onSelect?: (sido: SidoType) => void;
  className?: string;
}

const toViewBox = ([x, y, w, h]: Box) => `${x} ${y} ${w} ${h}`;

/** 확대 시 주변 지역이 조금 보이도록 여백을 둔 박스 */
function getFocusBox(sido: SidoType): Box {
  const [x, y, w, h] = KOREA_SIDO_SHAPES[sido].bbox;
  const pad = Math.max(w, h) * 0.35 + 6;
  return [x - pad, y - pad, w + pad * 2, h + pad * 2];
}

function getFillClass(sido: SidoType, highlightSido: SidoType | null | undefined, focusSido: SidoType | null | undefined, interactive: boolean) {
  const isMetro = METRO_SIDO_LIST.includes(sido);

  if (focusSido) {
    if (sido === focusSido) return 'fill-primary';
    return 'fill-muted-foreground/10';
  }

  if (sido === highlightSido) return 'fill-primary/80';

  const base = isMetro ? 'fill-muted-foreground/30' : 'fill-muted-foreground/15';
  return interactive ? `${base} hover:fill-primary/35` : base;
}

export function KoreaMap({ highlightSido, focusSido, onSelect, className }: KoreaMapProps) {
  const fullViewBox = toViewBox(KOREA_MAP_FULL_BOX);
  const targetViewBox = focusSido ? toViewBox(getFocusBox(focusSido)) : fullViewBox;
  const interactive = !!onSelect && !focusSido;

  return (
    <motion.svg
      // 확대 모드는 전체 지도에서 대상 시·도로 줌인
      initial={{ viewBox: fullViewBox }}
      animate={{ viewBox: targetViewBox }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      // 컨테이너(overflow-hidden)가 잘라주므로 viewBox 밖 주변 지역도 보이게 함
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      {SIDO_LIST.map((sido) => (
        <path
          key={sido}
          d={KOREA_SIDO_SHAPES[sido].d}
          className={`stroke-card transition-[fill] duration-150 ${getFillClass(sido, highlightSido, focusSido, interactive)} ${interactive ? 'cursor-pointer' : ''}`}
          strokeWidth={1.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          onClick={interactive ? () => onSelect?.(sido) : undefined}
        />
      ))}
      {/* 확대한 시·도는 이웃 경계선에 가려지지 않도록 맨 위에 한 번 더 그림 */}
      {focusSido && (
        <path
          d={KOREA_SIDO_SHAPES[focusSido].d}
          className="fill-primary stroke-card"
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </motion.svg>
  );
}
