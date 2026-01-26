
# 정치 성향 MBTI 5차원 베이지안 능동 학습 시스템 설계

## 프로젝트 개요

사용자의 답변 피로도를 최소화하면서 정확한 정치적 위치를 측정하는 지능형 테스트 시스템입니다.

### 5개 차원 정의
| 차원 | 코드 | 범위 | 의미 |
|------|------|------|------|
| 경제 (Economy) | ECO | -1.0 ~ 1.0 | -1: 국가개입, +1: 시장자유 |
| 안보 (Security) | SEC | -1.0 ~ 1.0 | -1: 평화, +1: 안보강화 |
| 젠더/PC | GEN | -1.0 ~ 1.0 | -1: 전통, +1: 진보 |
| 세대/공정 (Fairness) | FAI | -1.0 ~ 1.0 | -1: 기득권, +1: 공정경쟁 |
| 미래/환경 (Future) | FUT | -1.0 ~ 1.0 | -1: 성장우선, +1: 환경우선 |

---

## 요청 사항 1: DB 스키마

### 1-1. 기존 테이블과의 관계

현재 프로젝트에는 4축 시스템 기반의 테이블이 존재합니다:
- `political_mbti_questions` (4축: EI, SN, TF, JP)
- `political_mbti_types` (16가지 유형)
- `political_mbti_results` (결과 저장)

**제안**: 기존 테이블을 유지하고, 새로운 5차원 시스템을 별도 테이블로 구축합니다.

### 1-2. 새 테이블 스키마

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 사용자 스펙트럼 테이블 (5D 좌표 + 불확실성)
CREATE TABLE user_spectrums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 5차원 스코어 (-1.0 ~ 1.0)
  economy_score FLOAT NOT NULL DEFAULT 0.0 CHECK (economy_score >= -1.0 AND economy_score <= 1.0),
  security_score FLOAT NOT NULL DEFAULT 0.0 CHECK (security_score >= -1.0 AND security_score <= 1.0),
  gender_score FLOAT NOT NULL DEFAULT 0.0 CHECK (gender_score >= -1.0 AND gender_score <= 1.0),
  fairness_score FLOAT NOT NULL DEFAULT 0.0 CHECK (fairness_score >= -1.0 AND fairness_score <= 1.0),
  future_score FLOAT NOT NULL DEFAULT 0.0 CHECK (future_score >= -1.0 AND future_score <= 1.0),
  
  -- 불확실성 지수 (각 차원별 표준편차)
  economy_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  security_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  gender_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  fairness_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  future_uncertainty FLOAT NOT NULL DEFAULT 1.0,
  
  -- 벡터 표현 (5D 좌표를 vector로 저장)
  spectrum_vector vector(5),
  
  -- 메타데이터
  total_answers INTEGER NOT NULL DEFAULT 0,
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 2. 스펙트럼 질문 테이블 (변별력 지수 포함)
CREATE TABLE spectrum_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 질문 내용
  statement TEXT NOT NULL,
  left_label TEXT NOT NULL,
  right_label TEXT NOT NULL,
  
  -- 타겟 차원 (ECO, SEC, GEN, FAI, FUT)
  target_dimension TEXT NOT NULL CHECK (target_dimension IN ('ECO', 'SEC', 'GEN', 'FAI', 'FUT')),
  
  -- 가중치 벡터 (각 차원에 미치는 영향도)
  weight_economy FLOAT NOT NULL DEFAULT 0.0,
  weight_security FLOAT NOT NULL DEFAULT 0.0,
  weight_gender FLOAT NOT NULL DEFAULT 0.0,
  weight_fairness FLOAT NOT NULL DEFAULT 0.0,
  weight_future FLOAT NOT NULL DEFAULT 0.0,
  
  -- 변별력 지수 (IRT의 discrimination parameter)
  discrimination FLOAT NOT NULL DEFAULT 1.0,
  
  -- 난이도 (IRT의 difficulty parameter)
  difficulty FLOAT NOT NULL DEFAULT 0.0,
  
  -- 질문 메타
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 사용자 답변 히스토리
CREATE TABLE spectrum_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES spectrum_questions(id),
  
  -- 답변 값 (-1.0 ~ 1.0)
  answer_value FLOAT NOT NULL CHECK (answer_value >= -1.0 AND answer_value <= 1.0),
  
  -- 이 답변이 선택된 이유 (능동 학습 로그)
  information_gain FLOAT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 인덱스 생성
CREATE INDEX idx_user_spectrums_user_id ON user_spectrums(user_id);
CREATE INDEX idx_user_spectrums_vector ON user_spectrums USING ivfflat (spectrum_vector vector_cosine_ops);
CREATE INDEX idx_spectrum_questions_dimension ON spectrum_questions(target_dimension);
CREATE INDEX idx_spectrum_questions_active ON spectrum_questions(is_active);
CREATE INDEX idx_spectrum_answers_user ON spectrum_answers(user_id, session_id);
```

### 1-3. RLS 정책

```sql
-- user_spectrums RLS
ALTER TABLE user_spectrums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spectrum" ON user_spectrums
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spectrum" ON user_spectrums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spectrum" ON user_spectrums
  FOR UPDATE USING (auth.uid() = user_id);

-- spectrum_questions RLS
ALTER TABLE spectrum_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions" ON spectrum_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON spectrum_questions
  FOR ALL USING (is_admin(auth.uid()));

-- spectrum_answers RLS
ALTER TABLE spectrum_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers" ON spectrum_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON spectrum_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 요청 사항 2: 백엔드 로직 (Edge Function)

Lovable Cloud는 Python/FastAPI를 직접 지원하지 않으므로, **Deno Edge Function**으로 동일한 로직을 구현합니다.

### 2-1. 성향 업데이트 알고리즘

```typescript
// supabase/functions/spectrum-update/index.ts

interface SpectrumScores {
  economy: number;
  security: number;
  gender: number;
  fairness: number;
  future: number;
}

interface Uncertainties {
  economy: number;
  security: number;
  gender: number;
  fairness: number;
  future: number;
}

interface Question {
  weights: SpectrumScores;
  discrimination: number;
}

/**
 * 베이지안 업데이트를 사용한 성향 스코어 업데이트
 * 
 * 수학적 원리:
 * - 사전 분포: N(μ_prior, σ²_prior)
 * - 관측값: answer_value * weight
 * - 사후 분포: N(μ_post, σ²_post)
 * 
 * μ_post = (μ_prior/σ²_prior + x/σ²_obs) / (1/σ²_prior + 1/σ²_obs)
 * σ²_post = 1 / (1/σ²_prior + 1/σ²_obs)
 */
function updateSpectrum(
  currentScores: SpectrumScores,
  currentUncertainties: Uncertainties,
  question: Question,
  answerValue: number  // -1.0 ~ 1.0
): { scores: SpectrumScores; uncertainties: Uncertainties } {
  
  const dimensions = ['economy', 'security', 'gender', 'fairness', 'future'] as const;
  const newScores: SpectrumScores = { ...currentScores };
  const newUncertainties: Uncertainties = { ...currentUncertainties };
  
  for (const dim of dimensions) {
    const weight = question.weights[dim];
    if (Math.abs(weight) < 0.01) continue;  // 영향 없는 차원 스킵
    
    // 관측값 계산
    const observation = answerValue * weight * question.discrimination;
    
    // 관측 불확실성 (변별력이 높을수록 더 확실한 정보)
    const observationVariance = 1 / (question.discrimination * Math.abs(weight));
    
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
```

### 2-2. 베이지안 능동 학습 질문 선택 알고리즘

```typescript
/**
 * 정보 이득(Information Gain)이 가장 큰 질문 선택
 * 
 * 핵심 원리: 엔트로피 감소를 최대화하는 질문 선택
 * 
 * Expected Information Gain = H(current) - E[H(posterior)]
 * 
 * 실용적 근사:
 * 1. 불확실성이 높은 차원에 가중치가 높은 질문 우선
 * 2. 변별력이 높은 질문 우선
 * 3. 아직 답하지 않은 질문 중에서 선택
 */
function selectNextQuestion(
  currentUncertainties: Uncertainties,
  availableQuestions: Question[],
  answeredQuestionIds: string[]
): Question | null {
  
  // 미답변 질문만 필터링
  const unansweredQuestions = availableQuestions.filter(
    q => !answeredQuestionIds.includes(q.id)
  );
  
  if (unansweredQuestions.length === 0) return null;
  
  let bestQuestion: Question | null = null;
  let bestScore = -Infinity;
  
  for (const question of unansweredQuestions) {
    const infoGain = calculateExpectedInformationGain(
      currentUncertainties,
      question
    );
    
    if (infoGain > bestScore) {
      bestScore = infoGain;
      bestQuestion = question;
    }
  }
  
  return bestQuestion;
}

/**
 * 예상 정보 이득 계산
 * 
 * 공식: IG = Σ (weight_d × uncertainty_d × discrimination)
 * 
 * 해석: 
 * - 불확실성이 높은 차원(uncertainty_d)에 대해
 * - 영향력이 큰(weight_d) 질문을
 * - 변별력(discrimination)이 높게 물어보면
 * - 정보 이득이 크다
 */
function calculateExpectedInformationGain(
  uncertainties: Uncertainties,
  question: Question
): number {
  const dimensions = ['economy', 'security', 'gender', 'fairness', 'future'] as const;
  
  let totalGain = 0;
  
  for (const dim of dimensions) {
    const weight = Math.abs(question.weights[dim]);
    const uncertainty = uncertainties[dim];
    
    // 정보 이득 = 불확실성 × 가중치² × 변별력
    const dimensionGain = uncertainty * Math.pow(weight, 2) * question.discrimination;
    totalGain += dimensionGain;
  }
  
  return totalGain;
}

/**
 * 종료 조건 판단
 * 모든 차원의 불확실성이 임계값 이하면 테스트 종료
 */
function shouldTerminate(uncertainties: Uncertainties, threshold = 0.15): boolean {
  const values = Object.values(uncertainties);
  const avgUncertainty = values.reduce((a, b) => a + b, 0) / values.length;
  const maxUncertainty = Math.max(...values);
  
  return avgUncertainty < threshold && maxUncertainty < threshold * 1.5;
}
```

### 2-3. Edge Function 전체 구현

```typescript
// supabase/functions/spectrum-engine/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { action, ...params } = await req.json();

  try {
    switch (action) {
      case 'start_session':
        return handleStartSession(supabase);
        
      case 'get_next_question':
        return handleGetNextQuestion(supabase, params);
        
      case 'submit_answer':
        return handleSubmitAnswer(supabase, params);
        
      case 'get_result':
        return handleGetResult(supabase);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 요청 사항 3: 시각화 데이터 구조

### 3-1. Radar Chart JSON 응답 규격

```typescript
interface SpectrumResultResponse {
  // 사용자 정보
  userId: string;
  sessionId: string;
  totalAnswers: number;
  
  // 5D 좌표 (Radar Chart 데이터)
  radarData: {
    labels: ['경제', '안보', '젠더/PC', '세대/공정', '미래/환경'];
    datasets: [{
      label: '나의 정치 스펙트럼';
      data: [number, number, number, number, number];  // -1.0 ~ 1.0
      // 정규화된 값 (0 ~ 100) for 시각화
      normalizedData: [number, number, number, number, number];
    }];
  };
  
  // 상세 차원 정보
  dimensions: {
    economy: {
      code: 'ECO';
      score: number;
      uncertainty: number;
      label: string;  // 예: "국가개입" or "시장자유"
      leftLabel: '국가개입';
      rightLabel: '시장자유';
      percentage: number;  // 0-100 (50 = 중립)
    };
    security: { ... };
    gender: { ... };
    fairness: { ... };
    future: { ... };
  };
  
  // 신뢰도 지표
  confidence: {
    overall: number;  // 0-100%
    perDimension: {
      economy: number;
      security: number;
      gender: number;
      fairness: number;
      future: number;
    };
  };
  
  // 유사 정치인/정당 매칭 (선택적)
  matches?: {
    politicians: Array<{
      name: string;
      party: string;
      similarity: number;
    }>;
  };
}
```

### 3-2. 프론트엔드 Radar Chart 컴포넌트 구조

```tsx
// src/components/spectrum/SpectrumRadarChart.tsx

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

interface SpectrumRadarChartProps {
  data: {
    dimension: string;
    value: number;  // 0-100 (50 = 중립)
    label: string;
  }[];
}

export function SpectrumRadarChart({ data }: SpectrumRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" />
        <Radar
          name="정치 스펙트럼"
          dataKey="value"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

---

## 구현 순서

### Phase 1: 데이터베이스 마이그레이션
1. pgvector 확장 활성화 (Lovable Cloud에서 지원 확인 필요)
2. user_spectrums, spectrum_questions, spectrum_answers 테이블 생성
3. RLS 정책 적용
4. 인덱스 생성

### Phase 2: Edge Function 개발
1. spectrum-engine Edge Function 생성
2. 베이지안 업데이트 로직 구현
3. 능동 학습 질문 선택 알고리즘 구현
4. API 엔드포인트 테스트

### Phase 3: 프론트엔드 구현
1. 새로운 SpectrumTestPage 컴포넌트 생성
2. 기존 스와이프 카드 UI 재활용
3. Radar Chart 결과 화면 구현
4. 관리자 질문 관리 페이지

### Phase 4: 통합 및 테스트
1. 기존 정치 MBTI와 병행 운영 또는 교체 결정
2. 사용자 테스트 데이터 수집
3. 알고리즘 파라미터 튜닝

---

## 기술적 제약사항

1. **pgvector 지원**: Lovable Cloud에서 pgvector 확장 지원 여부 확인 필요. 미지원 시 벡터 검색 기능은 일반 쿼리로 대체.

2. **Edge Function 제한**: Deno 런타임에서 복잡한 수학 연산은 성능 고려 필요. 무거운 계산은 캐싱 활용.

3. **기존 시스템과의 공존**: 현재 4축 MBTI 시스템을 유지하면서 5차원 스펙트럼 시스템을 별도로 구축. 사용자가 둘 다 이용 가능.
