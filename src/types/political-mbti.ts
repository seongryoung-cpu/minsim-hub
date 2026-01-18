// 정치 MBTI 타입 정의

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

// 축 정의
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

// 유형 결정 함수
export function calculateMbtiType(scores: AxisScores): string {
  const e = scores.EI.E >= scores.EI.I ? 'E' : 'I';
  const s = scores.SN.S >= scores.SN.N ? 'S' : 'N';
  const t = scores.TF.T >= scores.TF.F ? 'T' : 'F';
  const j = scores.JP.J >= scores.JP.P ? 'J' : 'P';
  return `${e}${s}${t}${j}`;
}

// 초기 점수
export function getInitialAxisScores(): AxisScores {
  return {
    EI: { E: 0, I: 0 },
    SN: { S: 0, N: 0 },
    TF: { T: 0, F: 0 },
    JP: { J: 0, P: 0 },
  };
}
