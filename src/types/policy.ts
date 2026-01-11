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
}

// MVP 정책 카드 데이터 (서울/경기 광역선거 관련)
export const POLICY_CARDS: PolicyCard[] = [
  {
    id: 'policy-1',
    category: '주거',
    statement: '청년 전용 공공임대주택을 10만 호 이상 공급해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree' },
      { candidateId: 'seoul-2', stance: 'neutral' },
      { candidateId: 'seoul-3', stance: 'agree' },
      { candidateId: 'seoul-4', stance: 'agree' },
      { candidateId: 'gyeonggi-1', stance: 'agree' },
      { candidateId: 'gyeonggi-2', stance: 'neutral' },
      { candidateId: 'gyeonggi-3', stance: 'disagree' },
    ],
  },
  {
    id: 'policy-2',
    category: '교통',
    statement: 'GTX 등 광역교통망 확충에 더 많은 예산을 투자해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree' },
      { candidateId: 'seoul-2', stance: 'agree' },
      { candidateId: 'seoul-3', stance: 'neutral' },
      { candidateId: 'seoul-4', stance: 'neutral' },
      { candidateId: 'gyeonggi-1', stance: 'agree' },
      { candidateId: 'gyeonggi-2', stance: 'agree' },
      { candidateId: 'gyeonggi-3', stance: 'neutral' },
    ],
  },
  {
    id: 'policy-3',
    category: '경제',
    statement: '재개발·재건축 규제를 완화해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral' },
      { candidateId: 'seoul-2', stance: 'agree' },
      { candidateId: 'seoul-3', stance: 'disagree' },
      { candidateId: 'seoul-4', stance: 'disagree' },
      { candidateId: 'gyeonggi-1', stance: 'neutral' },
      { candidateId: 'gyeonggi-2', stance: 'agree' },
      { candidateId: 'gyeonggi-3', stance: 'agree' },
    ],
  },
  {
    id: 'policy-4',
    category: '복지',
    statement: '기본소득 시범사업을 도입해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral' },
      { candidateId: 'seoul-2', stance: 'disagree' },
      { candidateId: 'seoul-3', stance: 'agree' },
      { candidateId: 'seoul-4', stance: 'agree' },
      { candidateId: 'gyeonggi-1', stance: 'agree' },
      { candidateId: 'gyeonggi-2', stance: 'disagree' },
      { candidateId: 'gyeonggi-3', stance: 'disagree' },
    ],
  },
  {
    id: 'policy-5',
    category: '환경',
    statement: '탄소중립 목표를 위해 자동차 운행을 제한해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree' },
      { candidateId: 'seoul-2', stance: 'disagree' },
      { candidateId: 'seoul-3', stance: 'agree' },
      { candidateId: 'seoul-4', stance: 'agree' },
      { candidateId: 'gyeonggi-1', stance: 'agree' },
      { candidateId: 'gyeonggi-2', stance: 'neutral' },
      { candidateId: 'gyeonggi-3', stance: 'disagree' },
    ],
  },
  {
    id: 'policy-6',
    category: '안전',
    statement: 'AI CCTV 확대 등 치안 강화에 예산을 늘려야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral' },
      { candidateId: 'seoul-2', stance: 'agree' },
      { candidateId: 'seoul-3', stance: 'disagree' },
      { candidateId: 'seoul-4', stance: 'neutral' },
      { candidateId: 'gyeonggi-1', stance: 'neutral' },
      { candidateId: 'gyeonggi-2', stance: 'agree' },
      { candidateId: 'gyeonggi-3', stance: 'agree' },
    ],
  },
  {
    id: 'policy-7',
    category: '도시',
    statement: '보행자 중심 도시를 위해 차 없는 거리를 확대해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'agree' },
      { candidateId: 'seoul-2', stance: 'neutral' },
      { candidateId: 'seoul-3', stance: 'agree' },
      { candidateId: 'seoul-4', stance: 'agree' },
      { candidateId: 'gyeonggi-1', stance: 'neutral' },
      { candidateId: 'gyeonggi-2', stance: 'neutral' },
      { candidateId: 'gyeonggi-3', stance: 'disagree' },
    ],
  },
  {
    id: 'policy-8',
    category: '행정',
    statement: '주요 정책은 주민투표로 결정해야 한다',
    leftLabel: '반대',
    rightLabel: '찬성',
    candidateAlignment: [
      { candidateId: 'seoul-1', stance: 'neutral' },
      { candidateId: 'seoul-2', stance: 'disagree' },
      { candidateId: 'seoul-3', stance: 'agree' },
      { candidateId: 'seoul-4', stance: 'agree' },
      { candidateId: 'gyeonggi-1', stance: 'neutral' },
      { candidateId: 'gyeonggi-2', stance: 'neutral' },
      { candidateId: 'gyeonggi-3', stance: 'agree' },
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
