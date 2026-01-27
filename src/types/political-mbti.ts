// 정치 성향 5차원 Bayesian 시스템 타입 정의

// 5차원 정치 성향 축
export const SPECTRUM_DIMENSIONS = {
  economy: { 
    name: '경제', 
    leftLabel: '진보', 
    rightLabel: '보수',
    description: '정부 개입 vs 시장 자율',
    color: '#3B82F6' // blue
  },
  security: { 
    name: '안보', 
    leftLabel: '평화', 
    rightLabel: '강경',
    description: '외교 우선 vs 군사력 중시',
    color: '#EF4444' // red
  },
  gender: { 
    name: '젠더', 
    leftLabel: '진보', 
    rightLabel: '전통',
    description: '성평등 vs 전통적 가치',
    color: '#A855F7' // purple
  },
  fairness: { 
    name: '공정', 
    leftLabel: '결과', 
    rightLabel: '기회',
    description: '결과 평등 vs 기회 균등',
    color: '#10B981' // emerald
  },
  future: { 
    name: '미래', 
    leftLabel: '환경', 
    rightLabel: '성장',
    description: '지속가능 vs 경제성장',
    color: '#F59E0B' // amber
  },
} as const;

export type DimensionKey = keyof typeof SPECTRUM_DIMENSIONS;

// 5차원 점수 (-1.0 to 1.0)
export interface SpectrumScores {
  economy: number;
  security: number;
  gender: number;
  fairness: number;
  future: number;
}

// 불확실도 추적
export interface SpectrumUncertainty {
  economy: number;
  security: number;
  gender: number;
  fairness: number;
  future: number;
}

// 질문 타입
export interface SpectrumQuestion {
  id: string;
  statement: string;
  leftLabel: string;
  rightLabel: string;
  targetDimension: DimensionKey;
  weights: {
    economy: number;
    security: number;
    gender: number;
    fairness: number;
    future: number;
  };
  difficulty: number;
  discrimination: number;
  sortOrder: number;
}

// 답변 타입
export interface SpectrumAnswer {
  questionId: string;
  value: number; // -1 to 1 (left to right)
  timestamp: string;
}

// 사용자 스펙트럼 상태
export interface UserSpectrum {
  id: string;
  userId: string;
  scores: SpectrumScores;
  uncertainty: SpectrumUncertainty;
  totalAnswers: number;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Radar 차트 데이터
export interface RadarDataPoint {
  dimension: string;
  label: string;
  score: number; // 0-100 for chart display
  rawScore: number; // -1 to 1
  uncertainty: number;
  color: string;
}

// 초기 스펙트럼 점수
export function getInitialSpectrumScores(): SpectrumScores {
  return {
    economy: 0,
    security: 0,
    gender: 0,
    fairness: 0,
    future: 0,
  };
}

// 초기 불확실도 (높음)
export function getInitialUncertainty(): SpectrumUncertainty {
  return {
    economy: 1.0,
    security: 1.0,
    gender: 1.0,
    fairness: 1.0,
    future: 1.0,
  };
}

// -1~1 점수를 0~100 스케일로 변환
export function scoreToPercentage(score: number): number {
  return Math.round((score + 1) * 50);
}

// 0~100 스케일을 -1~1로 변환
export function percentageToScore(pct: number): number {
  return (pct / 50) - 1;
}

// Radar 차트 데이터 생성
export function createRadarData(
  scores: SpectrumScores, 
  uncertainty: SpectrumUncertainty
): RadarDataPoint[] {
  return (Object.keys(SPECTRUM_DIMENSIONS) as DimensionKey[]).map(dim => ({
    dimension: dim,
    label: SPECTRUM_DIMENSIONS[dim].name,
    score: scoreToPercentage(scores[dim]),
    rawScore: scores[dim],
    uncertainty: uncertainty[dim],
    color: SPECTRUM_DIMENSIONS[dim].color,
  }));
}

// Bayesian 점수 업데이트
export function updateBayesianScore(
  currentScore: number,
  currentUncertainty: number,
  answerValue: number,
  weight: number,
  learningRate: number = 0.3
): { score: number; uncertainty: number } {
  // 가중치가 0이면 업데이트 안함
  if (weight === 0) {
    return { score: currentScore, uncertainty: currentUncertainty };
  }

  // 답변의 기여도 (가중치 적용)
  const contribution = answerValue * Math.abs(weight) * Math.sign(weight);
  
  // 새 점수 = 이전 점수 + 학습률 * 불확실도 * 기여도
  const newScore = Math.max(-1, Math.min(1, 
    currentScore + learningRate * currentUncertainty * contribution
  ));
  
  // 불확실도 감소 (답변할수록 확신도 증가)
  const uncertaintyDecay = 0.85;
  const minUncertainty = 0.1;
  const newUncertainty = Math.max(minUncertainty, currentUncertainty * uncertaintyDecay);
  
  return { score: newScore, uncertainty: newUncertainty };
}

// Information Gain 계산 (질문 선택용)
export function calculateInformationGain(
  question: SpectrumQuestion,
  uncertainty: SpectrumUncertainty
): number {
  const weights = question.weights;
  let gain = 0;
  
  (Object.keys(weights) as DimensionKey[]).forEach(dim => {
    const w = Math.abs(weights[dim]);
    if (w > 0) {
      // 불확실도가 높은 차원 + 가중치가 큰 질문 = 높은 정보 이득
      gain += w * uncertainty[dim] * question.discrimination;
    }
  });
  
  return gain;
}

// 최적 질문 선택 (Bayesian Active Learning)
export function selectNextQuestion(
  availableQuestions: SpectrumQuestion[],
  answeredIds: Set<string>,
  uncertainty: SpectrumUncertainty
): SpectrumQuestion | null {
  const unanswered = availableQuestions.filter(q => !answeredIds.has(q.id));
  if (unanswered.length === 0) return null;
  
  // Information Gain으로 정렬
  const scored = unanswered.map(q => ({
    question: q,
    gain: calculateInformationGain(q, uncertainty)
  })).sort((a, b) => b.gain - a.gain);
  
  return scored[0].question;
}

// 정치 성향 라벨 생성
export function getSpectrumLabel(scores: SpectrumScores): string {
  const labels: string[] = [];
  
  if (scores.economy < -0.3) labels.push('경제진보');
  else if (scores.economy > 0.3) labels.push('경제보수');
  
  if (scores.security < -0.3) labels.push('평화지향');
  else if (scores.security > 0.3) labels.push('안보중시');
  
  if (scores.gender < -0.3) labels.push('젠더진보');
  else if (scores.gender > 0.3) labels.push('전통가치');
  
  if (scores.fairness < -0.3) labels.push('결과평등');
  else if (scores.fairness > 0.3) labels.push('기회균등');
  
  if (scores.future < -0.3) labels.push('환경우선');
  else if (scores.future > 0.3) labels.push('성장우선');
  
  return labels.length > 0 ? labels.join(' · ') : '중도';
}

// 신뢰도 레벨 계산
export function getConfidenceLevel(uncertainty: SpectrumUncertainty): 'low' | 'medium' | 'high' {
  const avgUncertainty = Object.values(uncertainty).reduce((a, b) => a + b, 0) / 5;
  if (avgUncertainty > 0.7) return 'low';
  if (avgUncertainty > 0.4) return 'medium';
  return 'high';
}

// ========================================
// Legacy 4축 시스템 타입 (호환성 유지용)
// ========================================

export interface MbtiQuestion {
  id: string;
  axis: 'EI' | 'SN' | 'TF' | 'JP';
  statement: string;
  leftLabel: string;
  rightLabel: string;
  leftAxisValue: string;
  rightAxisValue: string;
  sortOrder: number;
}

export interface MbtiType {
  id: string;
  typeCode: string;
  name: string;
  description: string;
  keywords: string[];
  famousFigures: string[];
  strengths: string[];
  weaknesses: string[];
  compatibleTypes: string[];
  incompatibleTypes: string[];
  color: string;
  icon: string;
}

export interface MbtiResult {
  id: string;
  userId: string;
  typeCode: string;
  axisScores: AxisScores;
  answersJson: MbtiAnswer[];
  fromPolicyMatch: boolean;
  policyMatchResultId: string | null;
  createdAt: string;
}

export interface AxisScores {
  EI: { E: number; I: number };
  SN: { S: number; N: number };
  TF: { T: number; F: number };
  JP: { J: number; P: number };
}

export interface MbtiAnswer {
  questionId: string;
  axis: string;
  direction: 'left' | 'right';
  axisValue: string;
}

export const MBTI_AXES = {
  EI: { 
    name: '경제', 
    left: { code: 'I', label: '국가개입' }, 
    right: { code: 'E', label: '시장경제' },
    description: '경제 정책에서 국가의 역할에 대한 입장'
  },
  SN: { 
    name: '사회', 
    left: { code: 'N', label: '진보' }, 
    right: { code: 'S', label: '전통' },
    description: '사회 가치와 변화에 대한 태도'
  },
  TF: { 
    name: '외교', 
    left: { code: 'F', label: '이념' }, 
    right: { code: 'T', label: '실용' },
    description: '외교 정책의 기본 방향'
  },
  JP: { 
    name: '정치', 
    left: { code: 'P', label: '변화' }, 
    right: { code: 'J', label: '질서' },
    description: '정치 참여와 시스템에 대한 태도'
  },
} as const;

export function calculateMbtiType(scores: AxisScores): string {
  const e = scores.EI.E >= scores.EI.I ? 'E' : 'I';
  const s = scores.SN.S >= scores.SN.N ? 'S' : 'N';
  const t = scores.TF.T >= scores.TF.F ? 'T' : 'F';
  const j = scores.JP.J >= scores.JP.P ? 'J' : 'P';
  return `${e}${s}${t}${j}`;
}

export function getInitialAxisScores(): AxisScores {
  return {
    EI: { E: 0, I: 0 },
    SN: { S: 0, N: 0 },
    TF: { T: 0, F: 0 },
    JP: { J: 0, P: 0 },
  };
}
