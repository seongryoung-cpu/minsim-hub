/**
 * 베이지안 능동 학습 엔진
 * 
 * 사용자의 답변을 통해 5차원 정치 성향을 추정하고,
 * 정보 이득이 가장 큰 질문을 선택합니다.
 */

import type { 
  SpectrumScores, 
  SpectrumUncertainties, 
  SpectrumQuestion 
} from '@/types/spectrum';

const DIMENSIONS = ['economy', 'security', 'gender', 'fairness', 'future'] as const;
type Dimension = typeof DIMENSIONS[number];

/**
 * 베이지안 업데이트를 사용한 성향 스코어 업데이트
 * 
 * 수학적 원리:
 * - 사전 분포: N(μ_prior, σ²_prior)
 * - 관측값: answer_value * weight * discrimination
 * - 사후 분포: N(μ_post, σ²_post)
 * 
 * μ_post = (μ_prior/σ²_prior + x/σ²_obs) / (1/σ²_prior + 1/σ²_obs)
 * σ²_post = 1 / (1/σ²_prior + 1/σ²_obs)
 */
export function updateSpectrum(
  currentScores: SpectrumScores,
  currentUncertainties: SpectrumUncertainties,
  question: SpectrumQuestion,
  answerValue: number  // -1.0 ~ 1.0
): { scores: SpectrumScores; uncertainties: SpectrumUncertainties } {
  
  const newScores: SpectrumScores = { ...currentScores };
  const newUncertainties: SpectrumUncertainties = { ...currentUncertainties };
  
  for (const dim of DIMENSIONS) {
    const weight = question.weights[dim];
    if (Math.abs(weight) < 0.01) continue;  // 영향 없는 차원 스킵
    
    // 관측값 계산
    const observation = answerValue * weight * question.discrimination;
    
    // 관측 불확실성 (변별력이 높을수록 더 확실한 정보)
    const observationVariance = 1 / (question.discrimination * Math.abs(weight) + 0.1);
    
    // 베이지안 업데이트
    const priorMean = currentScores[dim];
    const priorVariance = Math.pow(currentUncertainties[dim], 2);
    
    const posteriorVariance = 1 / (1/priorVariance + 1/observationVariance);
    const posteriorMean = posteriorVariance * (priorMean/priorVariance + observation/observationVariance);
    
    // 범위 클리핑 (-1 ~ 1)
    newScores[dim] = Math.max(-1, Math.min(1, posteriorMean));
    newUncertainties[dim] = Math.sqrt(posteriorVariance);
  }
  
  return { scores: newScores, uncertainties: newUncertainties };
}

/**
 * 예상 정보 이득 계산
 * 
 * 공식: IG = Σ (weight_d² × uncertainty_d × discrimination)
 * 
 * 해석: 
 * - 불확실성이 높은 차원(uncertainty_d)에 대해
 * - 영향력이 큰(weight_d) 질문을
 * - 변별력(discrimination)이 높게 물어보면
 * - 정보 이득이 크다
 */
export function calculateExpectedInformationGain(
  uncertainties: SpectrumUncertainties,
  question: SpectrumQuestion
): number {
  let totalGain = 0;
  
  for (const dim of DIMENSIONS) {
    const weight = Math.abs(question.weights[dim]);
    const uncertainty = uncertainties[dim];
    
    // 정보 이득 = 불확실성 × 가중치² × 변별력
    const dimensionGain = uncertainty * Math.pow(weight, 2) * question.discrimination;
    totalGain += dimensionGain;
  }
  
  return totalGain;
}

/**
 * 정보 이득이 가장 큰 질문 선택
 */
export function selectNextQuestion(
  currentUncertainties: SpectrumUncertainties,
  availableQuestions: SpectrumQuestion[],
  answeredQuestionIds: string[]
): { question: SpectrumQuestion | null; informationGain: number } {
  
  // 미답변 질문만 필터링
  const unansweredQuestions = availableQuestions.filter(
    q => !answeredQuestionIds.includes(q.id)
  );
  
  if (unansweredQuestions.length === 0) {
    return { question: null, informationGain: 0 };
  }
  
  let bestQuestion: SpectrumQuestion | null = null;
  let bestScore = -Infinity;
  
  for (const question of unansweredQuestions) {
    const infoGain = calculateExpectedInformationGain(currentUncertainties, question);
    
    if (infoGain > bestScore) {
      bestScore = infoGain;
      bestQuestion = question;
    }
  }
  
  return { question: bestQuestion, informationGain: bestScore };
}

/**
 * 종료 조건 판단
 * 모든 차원의 불확실성이 임계값 이하면 테스트 종료
 */
export function shouldTerminate(
  uncertainties: SpectrumUncertainties, 
  threshold = 0.25,
  minQuestions = 5,
  answeredCount = 0
): boolean {
  // 최소 질문 수 충족 확인
  if (answeredCount < minQuestions) return false;
  
  const values = Object.values(uncertainties);
  const avgUncertainty = values.reduce((a, b) => a + b, 0) / values.length;
  const maxUncertainty = Math.max(...values);
  
  return avgUncertainty < threshold && maxUncertainty < threshold * 1.5;
}

/**
 * 테스트 진행률 계산 (불확실성 기반)
 */
export function calculateProgress(uncertainties: SpectrumUncertainties): number {
  const values = Object.values(uncertainties);
  const avgUncertainty = values.reduce((a, b) => a + b, 0) / values.length;
  
  // 초기 불확실성 1.0에서 목표 0.25까지의 진행률
  const initialUncertainty = 1.0;
  const targetUncertainty = 0.25;
  
  const progress = (initialUncertainty - avgUncertainty) / (initialUncertainty - targetUncertainty);
  return Math.max(0, Math.min(100, progress * 100));
}

/**
 * 각 차원의 라벨 결정 (스코어 기반)
 */
export function getDimensionLabel(dimension: Dimension, score: number): string {
  const labels: Record<Dimension, { negative: string; neutral: string; positive: string }> = {
    economy: { negative: '국가개입', neutral: '중도', positive: '시장자유' },
    security: { negative: '평화', neutral: '균형', positive: '안보강화' },
    gender: { negative: '전통', neutral: '중도', positive: '진보' },
    fairness: { negative: '기득권', neutral: '중도', positive: '공정경쟁' },
    future: { negative: '성장우선', neutral: '균형', positive: '환경우선' },
  };
  
  if (score < -0.3) return labels[dimension].negative;
  if (score > 0.3) return labels[dimension].positive;
  return labels[dimension].neutral;
}
