import type { NewsArticle } from '@/types/news';

// Mock news data for candidates
export const MOCK_NEWS: NewsArticle[] = [
  // 박영선 뉴스
  {
    id: 'news-1',
    candidateId: 'seoul-1',
    title: '박영선, "청년 주거 안정화가 최우선 과제"',
    summary: '서울시장 예비후보 박영선이 청년 전용 공공임대 10만 호 공급 계획을 발표했다. 전세사기 근절 대책도 함께 강화할 방침.',
    source: '서울신문',
    publishedAt: '2026-01-12T09:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-2',
    candidateId: 'seoul-1',
    title: '박영선 후보, 스타트업 생태계 활성화 공약 발표',
    summary: 'AI·블록체인 특구 조성 및 글로벌 스타트업 육성 계획을 담은 디지털 경제 허브 비전을 공개했다.',
    source: '한국경제',
    publishedAt: '2026-01-11T14:30:00Z',
    category: 'policy',
  },
  {
    id: 'news-3',
    candidateId: 'seoul-1',
    title: '[인터뷰] 박영선 "시민과 함께 만드는 새로운 서울"',
    summary: '예비후보 등록 후 첫 인터뷰에서 시민 참여형 정책 결정 시스템 도입 의지를 밝혔다.',
    source: '조선일보',
    publishedAt: '2026-01-10T10:00:00Z',
    category: 'interview',
  },
  
  // 김기현 뉴스
  {
    id: 'news-4',
    candidateId: 'seoul-2',
    title: '김기현, 지하철 1-4호선 전동차 전면 교체 공약',
    summary: '노후화된 수도권 지하철 시설 현대화를 최우선 과제로 삼겠다고 밝혔다.',
    source: '동아일보',
    publishedAt: '2026-01-12T11:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-5',
    candidateId: 'seoul-2',
    title: '김기현 후보, 소상공인 지원 확대 약속',
    summary: '전통시장 현대화와 온라인 판로 지원을 통해 골목상권을 살리겠다는 계획을 발표했다.',
    source: '매일경제',
    publishedAt: '2026-01-11T16:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-6',
    candidateId: 'seoul-2',
    title: '김기현 "실력으로 증명하는 서울 만들겠다"',
    summary: '5선 의원 경험을 바탕으로 실용적인 서울 행정을 펼치겠다고 강조했다.',
    source: '중앙일보',
    publishedAt: '2026-01-09T09:30:00Z',
    category: 'campaign',
  },
  
  // 조정훈 뉴스
  {
    id: 'news-7',
    candidateId: 'seoul-3',
    title: '조정훈, 기본소득 시범사업 추진 공약',
    summary: '청년·시니어 대상 월 30만원 기본소득 시범 지급 계획을 밝혔다.',
    source: '한겨레',
    publishedAt: '2026-01-12T08:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-8',
    candidateId: 'seoul-3',
    title: '조정훈 후보 "디지털 민주주의로 시민 참여 확대"',
    summary: '시민참여 플랫폼 구축과 온라인 주민투표 활성화를 통해 직접 민주주의를 강화하겠다고 밝혔다.',
    source: '경향신문',
    publishedAt: '2026-01-10T15:00:00Z',
    category: 'policy',
  },
  
  // 김진애 뉴스
  {
    id: 'news-9',
    candidateId: 'seoul-4',
    title: '김진애 "보행친화 도시 서울 만들겠다"',
    summary: '차 없는 거리 확대와 녹지공간 30% 증가를 목표로 한 도시 재생 계획을 발표했다.',
    source: '시사저널',
    publishedAt: '2026-01-11T12:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-10',
    candidateId: 'seoul-4',
    title: '[인터뷰] 김진애 "사람을 위한 도시, 서울"',
    summary: 'MIT 건축학 석사 출신 도시건축 전문가로서의 비전을 밝혔다.',
    source: '프레시안',
    publishedAt: '2026-01-09T11:00:00Z',
    category: 'interview',
  },
  
  // 김동연 뉴스
  {
    id: 'news-11',
    candidateId: 'gyeonggi-1',
    title: '김동연 "GTX 조기 완공으로 광역교통 혁신"',
    summary: '경기도지사 김동연이 GTX-A/B/C 노선 조기 개통 계획을 재확인했다.',
    source: '경기일보',
    publishedAt: '2026-01-12T10:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-12',
    candidateId: 'gyeonggi-1',
    title: '김동연, 반도체 클러스터 일자리 50만 개 창출 약속',
    summary: '용인·평택 반도체 벨트 조성을 통해 청년 일자리를 대폭 늘리겠다고 밝혔다.',
    source: '연합뉴스',
    publishedAt: '2026-01-11T13:00:00Z',
    category: 'policy',
  },
  
  // 김은혜 뉴스
  {
    id: 'news-13',
    candidateId: 'gyeonggi-2',
    title: '김은혜, 경기도 교통혁명 공약 발표',
    summary: '광역버스 노선 확충과 환승할인 확대를 핵심 공약으로 내세웠다.',
    source: '인천일보',
    publishedAt: '2026-01-12T14:00:00Z',
    category: 'policy',
  },
  {
    id: 'news-14',
    candidateId: 'gyeonggi-2',
    title: '김은혜 후보 "청년 일자리 10만 개 만들겠다"',
    summary: '도내 기업 채용지원금과 청년창업 지원 확대 계획을 밝혔다.',
    source: '경인일보',
    publishedAt: '2026-01-10T16:30:00Z',
    category: 'policy',
  },
  
  // 강용석 뉴스
  {
    id: 'news-15',
    candidateId: 'gyeonggi-3',
    title: '강용석 "상식이 통하는 경기도 만들겠다"',
    summary: '불필요한 규제 철폐와 인허가 절차 간소화를 약속했다.',
    source: '뉴시스',
    publishedAt: '2026-01-11T09:00:00Z',
    category: 'campaign',
  },
  {
    id: 'news-16',
    candidateId: 'gyeonggi-3',
    title: '강용석 후보, 주민 직접 참여 정책 공약',
    summary: '주요 정책에 대한 주민투표 의무화를 통해 직접 민주주의를 실현하겠다고 밝혔다.',
    source: '뉴스1',
    publishedAt: '2026-01-09T14:00:00Z',
    category: 'policy',
  },
];

// Get news for specific candidates
export function getNewsForCandidates(candidateIds: string[]): NewsArticle[] {
  return MOCK_NEWS
    .filter(news => candidateIds.includes(news.candidateId))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// Get news for a single candidate
export function getNewsForCandidate(candidateId: string): NewsArticle[] {
  return MOCK_NEWS
    .filter(news => news.candidateId === candidateId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// Get all news sorted by date
export function getAllNews(): NewsArticle[] {
  return [...MOCK_NEWS].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
