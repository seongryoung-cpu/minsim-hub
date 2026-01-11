// 정책 매칭 게임 데이터 타입
export interface PolicyCard {
  id: string;
  category: string;
  statement: string;
  leftLabel: string;  // 왼쪽 스와이프 의미
  rightLabel: string; // 오른쪽 스와이프 의미
  candidateAlignment: {
    candidateId: string;
    stance: 'agree' | 'disagree' | 'neutral';
    intensity: number; // 1-5 강도
  }[];
}

export interface MatchResult {
  candidateId: string;
  candidateName: string;
  party: string;
  partyColor: string;
  matchScore: number; // 0-100
  agreedPolicies: string[];
  disagreedPolicies: string[];
  categoryScores: CategoryScore[];
}

export interface CategoryScore {
  category: string;
  userScore: number;     // 사용자 점수 (0-100)
  candidateScore: number; // 후보자 점수 (0-100)
}

export type UserChoice = { cardId: string; direction: 'left' | 'right' };

export type PreferredCandidate = {
  candidateId: string;
  candidateName: string;
} | null;

export type SentimentChoice = 'switch' | 'stay' | null;

// MVP 정책 카드 데이터 (서울/경기 광역선거 관련) - 15개 질문
export const POLICY_CARDS: PolicyCard[] = [
  {
    id: 'policy-1',
    category: '주거',
    statement: '청년 전용 공공임대주택을 10만 호 이상 공급해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-1', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-3', stance: 'disagree', intensity: 2 },
    ],
  },
  {
    id: 'policy-2',
    category: '교통',
    statement: 'GTX 노선 연장, 예산 확보와 조기 개통 중 조기 개통이 우선이다',
    leftLabel: '예산확보',
    rightLabel: '조기개통',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-3', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-1', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-3', stance: 'neutral', intensity: 3 },
    ],
  },
  {
    id: 'policy-3',
    category: '경제',
    statement: '재개발·재건축 규제를 대폭 완화해야 한다',
    leftLabel: '규제유지',
    rightLabel: '규제완화',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 1 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-3', stance: 'agree', intensity: 4 },
    ],
  },
  {
    id: 'policy-4',
    category: '복지',
    statement: '청년 기본소득 시범사업을 우리 지역에서 도입해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'disagree', intensity: 1 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-1', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-2', stance: 'disagree', intensity: 1 },
      { candidateId: 'gyeonggi-3', stance: 'disagree', intensity: 2 },
    ],
  },
  {
    id: 'policy-5',
    category: '환경',
    statement: '탄소중립을 위해 도심 자동차 운행을 제한해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-2', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-1', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-3', stance: 'disagree', intensity: 2 },
    ],
  },
  {
    id: 'policy-6',
    category: '안전',
    statement: 'AI CCTV 확대 등 첨단 치안 시스템에 예산을 늘려야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-4', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-3', stance: 'agree', intensity: 4 },
    ],
  },
  {
    id: 'policy-7',
    category: '도시',
    statement: '보행자 중심 도시를 위해 차 없는 거리를 확대해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-3', stance: 'disagree', intensity: 2 },
    ],
  },
  {
    id: 'policy-8',
    category: '행정',
    statement: '주요 정책은 주민투표로 직접 결정해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-3', stance: 'agree', intensity: 4 },
    ],
  },
  {
    id: 'policy-9',
    category: '교통',
    statement: '대중교통 요금을 인상해서라도 서비스 품질을 높여야 한다',
    leftLabel: '요금동결',
    rightLabel: '요금인상',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 1 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-1', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-3', stance: 'neutral', intensity: 3 },
    ],
  },
  {
    id: 'policy-10',
    category: '경제',
    statement: '소상공인 지원보다 대기업 유치에 집중해야 한다',
    leftLabel: '소상공인',
    rightLabel: '대기업',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 1 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-1', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-3', stance: 'agree', intensity: 5 },
    ],
  },
  {
    id: 'policy-11',
    category: '복지',
    statement: '무상급식을 고등학교까지 전면 확대해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-1', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-3', stance: 'disagree', intensity: 2 },
    ],
  },
  {
    id: 'policy-12',
    category: '환경',
    statement: '그린벨트 일부를 해제해 주택을 공급해야 한다',
    leftLabel: '그린벨트유지',
    rightLabel: '그린벨트해제',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 1 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 1 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-3', stance: 'agree', intensity: 4 },
    ],
  },
  {
    id: 'policy-13',
    category: '주거',
    statement: '1인 가구를 위한 소형주택 공급에 집중해야 한다',
    leftLabel: '다양한주택',
    rightLabel: '소형주택',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-3', stance: 'agree', intensity: 5 },
      { candidateId: 'seoul-4', stance: 'agree', intensity: 5 },
      { candidateId: 'gyeonggi-1', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-2', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-3', stance: 'neutral', intensity: 3 },
    ],
  },
  {
    id: 'policy-14',
    category: '안전',
    statement: '재난 대비 예산을 다른 복지 예산보다 우선해야 한다',
    leftLabel: '복지우선',
    rightLabel: '재난우선',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-3', stance: 'agree', intensity: 4 },
    ],
  },
  {
    id: 'policy-15',
    category: '도시',
    statement: '문화시설보다 체육시설 확충에 집중해야 한다',
    leftLabel: '문화시설',
    rightLabel: '체육시설',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'seoul-2', stance: 'agree', intensity: 4 },
      { candidateId: 'seoul-3', stance: 'disagree', intensity: 2 },
      { candidateId: 'seoul-4', stance: 'disagree', intensity: 2 },
      { candidateId: 'gyeonggi-1', stance: 'neutral', intensity: 3 },
      { candidateId: 'gyeonggi-2', stance: 'agree', intensity: 4 },
      { candidateId: 'gyeonggi-3', stance: 'neutral', intensity: 3 },
    ],
  },
];

// 카테고리 색상 맵
export const CATEGORY_COLORS: Record<string, string> = {
  '주거': '#FF6B6B',
  '교통': '#4ECDC4',
  '경제': '#45B7D1',
  '복지': '#96CEB4',
  '환경': '#2ECC71',
  '안전': '#E74C3C',
  '도시': '#9B59B6',
  '행정': '#F39C12',
};

// 카테고리 목록
export const POLICY_CATEGORIES = ['주거', '교통', '경제', '복지', '환경', '안전', '도시', '행정'];

// 인사이트 생성 함수
export const generateInsight = (
  userPreference: PreferredCandidate,
  topMatch: MatchResult,
  categoryScores: CategoryScore[]
): string => {
  if (!userPreference) {
    return `정책 분석 결과, ${topMatch.candidateName} 후보와 ${topMatch.matchScore}% 일치합니다. 아직 마음에 드는 후보가 없으셨군요. 정책을 기준으로 후보를 탐색해보세요.`;
  }

  if (userPreference.candidateId === topMatch.candidateId) {
    return `축하합니다! 평소 호감을 가진 ${topMatch.candidateName} 후보가 정책적으로도 가장 일치합니다. 감성과 이성이 모두 같은 방향을 가리키고 있네요.`;
  }

  // 불일치 시 카테고리별 분석
  const mismatchCategory = categoryScores.find(c => Math.abs(c.userScore - c.candidateScore) > 30);
  const categoryInsight = mismatchCategory 
    ? `특히 ${mismatchCategory.category} 분야에서 차이가 큽니다.`
    : '';

  return `흥미로운 결과입니다. ${userPreference.candidateName} 후보에게 호감을 느끼셨지만, 정책적으로는 ${topMatch.candidateName} 후보와 ${topMatch.matchScore}% 일치합니다. ${categoryInsight}`;
};
