// 5차원 정치 스펙트럼 타입 정의

export type DimensionCode = 'ECO' | 'SEC' | 'GEN' | 'FAI' | 'FUT';

export interface SpectrumScores {
  economy: number;  // -1.0 ~ 1.0
  security: number;
  gender: number;
  fairness: number;
  future: number;
}

export interface SpectrumUncertainties {
  economy: number;  // 표준편차
  security: number;
  gender: number;
  fairness: number;
  future: number;
}

export interface UserSpectrum {
  id: string;
  userId: string;
  scores: SpectrumScores;
  uncertainties: SpectrumUncertainties;
  totalAnswers: number;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpectrumQuestion {
  id: string;
  statement: string;
  leftLabel: string;
  rightLabel: string;
  targetDimension: DimensionCode;
  weights: SpectrumScores;
  discrimination: number;
  difficulty: number;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SpectrumAnswer {
  id: string;
  userId: string;
  sessionId: string;
  questionId: string;
  answerValue: number;  // -1.0 ~ 1.0
  informationGain: number | null;
  createdAt: string;
}

// 차원 정의
export const SPECTRUM_DIMENSIONS = {
  ECO: {
    code: 'ECO' as const,
    name: '경제',
    leftLabel: '국가개입',
    rightLabel: '시장자유',
    description: '경제 정책에서 국가의 역할',
    color: '#3B82F6',
  },
  SEC: {
    code: 'SEC' as const,
    name: '안보',
    leftLabel: '평화',
    rightLabel: '안보강화',
    description: '외교/안보 정책의 방향',
    color: '#EF4444',
  },
  GEN: {
    code: 'GEN' as const,
    name: '젠더/PC',
    leftLabel: '전통',
    rightLabel: '진보',
    description: '젠더/정치적 올바름에 대한 태도',
    color: '#A855F7',
  },
  FAI: {
    code: 'FAI' as const,
    name: '세대/공정',
    leftLabel: '기득권',
    rightLabel: '공정경쟁',
    description: '세대간 공정성에 대한 입장',
    color: '#F59E0B',
  },
  FUT: {
    code: 'FUT' as const,
    name: '미래/환경',
    leftLabel: '성장우선',
    rightLabel: '환경우선',
    description: '경제 성장 vs 환경 보호',
    color: '#10B981',
  },
} as const;

// 초기 스코어
export function getInitialSpectrumScores(): SpectrumScores {
  return {
    economy: 0.0,
    security: 0.0,
    gender: 0.0,
    fairness: 0.0,
    future: 0.0,
  };
}

// 초기 불확실성
export function getInitialUncertainties(): SpectrumUncertainties {
  return {
    economy: 1.0,
    security: 1.0,
    gender: 1.0,
    fairness: 1.0,
    future: 1.0,
  };
}

// 스코어를 0-100 범위로 정규화 (50 = 중립)
export function normalizeScore(score: number): number {
  return Math.round((score + 1) * 50);
}

// 불확실성을 신뢰도(0-100%)로 변환
export function uncertaintyToConfidence(uncertainty: number): number {
  // uncertainty 1.0 = 0% 신뢰도, uncertainty 0.0 = 100% 신뢰도
  return Math.round((1 - Math.min(uncertainty, 1)) * 100);
}

// Radar Chart용 데이터 포맷
export interface RadarDataPoint {
  dimension: string;
  value: number;  // 0-100
  fullMark: number;
  score: number;  // -1.0 ~ 1.0 (원본)
  confidence: number;
}

export function formatForRadarChart(
  scores: SpectrumScores, 
  uncertainties: SpectrumUncertainties
): RadarDataPoint[] {
  const dimensions: (keyof SpectrumScores)[] = ['economy', 'security', 'gender', 'fairness', 'future'];
  const dimCodes: DimensionCode[] = ['ECO', 'SEC', 'GEN', 'FAI', 'FUT'];
  
  return dimensions.map((dim, i) => ({
    dimension: SPECTRUM_DIMENSIONS[dimCodes[i]].name,
    value: normalizeScore(scores[dim]),
    fullMark: 100,
    score: scores[dim],
    confidence: uncertaintyToConfidence(uncertainties[dim]),
  }));
}
