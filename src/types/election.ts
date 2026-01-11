// Election Status Schema - 선거 상태 표준 데이터 구조

export type ElectionPhase = 'preliminary' | 'primary' | 'general' | 'confirmed';

export interface ElectionMilestone {
  id: ElectionPhase;
  label: string;
  shortLabel: string;
  date: string;
  isComplete: boolean;
  isCurrent: boolean;
  isLocked?: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  partyColor: string;
  image?: string;
  summary: string;
  position: string;
}

export interface ElectionStatus {
  regionId: string;
  regionName: string;
  electionType: '지방선거' | '국회의원선거' | '대통령선거' | '보궐선거';
  electionLevel: 'metropolitan' | 'district'; // 광역 vs 기초
  currentPhase: ElectionPhase;
  electionDate: string;
  dDay: number;
  milestones: ElectionMilestone[];
  candidates: Candidate[];
}

// D-Day 계산 함수 (2026년 6월 3일 선거일 기준)
export const calculateDDay = (): number => {
  const electionDate = new Date('2026-06-03');
  const today = new Date();
  const diffTime = electionDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 정당 색상 맵
export const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#004EA2',
  '국민의힘': '#E61E2B',
  '조국혁신당': '#00a0e2',
  '개혁신당': '#FF6B00',
  '진보당': '#D6001C',
  '기본소득당': '#00D2B4',
  '사회민주당': '#F08300',
  '무소속': '#808080',
};

// 예비후보 시기 마일스톤 (현재 1단계 진행중, 나머지 잠금)
export const PRELIMINARY_PHASE_MILESTONES: ElectionMilestone[] = [
  { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01', isComplete: false, isCurrent: true, isLocked: false },
  { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15', isComplete: false, isCurrent: false, isLocked: true },
  { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20', isComplete: false, isCurrent: false, isLocked: true },
  { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03', isComplete: false, isCurrent: false, isLocked: true },
];

// 서울시장 예비후보 데이터
export const SEOUL_MAYOR_CANDIDATES: Candidate[] = [
  {
    id: 'seoul-1',
    name: '박영선',
    party: '더불어민주당',
    partyColor: PARTY_COLORS['더불어민주당'],
    summary: '전 중소벤처기업부 장관, 4선 국회의원 출신',
    position: '서울시장 예비후보',
  },
  {
    id: 'seoul-2',
    name: '김기현',
    party: '국민의힘',
    partyColor: PARTY_COLORS['국민의힘'],
    summary: '전 국민의힘 당대표, 5선 국회의원',
    position: '서울시장 예비후보',
  },
  {
    id: 'seoul-3',
    name: '조정훈',
    party: '조국혁신당',
    partyColor: PARTY_COLORS['조국혁신당'],
    summary: '시대전환 대표, 전 국회의원',
    position: '서울시장 예비후보',
  },
  {
    id: 'seoul-4',
    name: '김진애',
    party: '무소속',
    partyColor: PARTY_COLORS['무소속'],
    summary: '도시건축 전문가, 전 열린우리당 국회의원',
    position: '서울시장 예비후보',
  },
];

// 경기도지사 예비후보 데이터
export const GYEONGGI_GOVERNOR_CANDIDATES: Candidate[] = [
  {
    id: 'gyeonggi-1',
    name: '김동연',
    party: '더불어민주당',
    partyColor: PARTY_COLORS['더불어민주당'],
    summary: '현 경기도지사, 전 경제부총리',
    position: '경기도지사 예비후보',
  },
  {
    id: 'gyeonggi-2',
    name: '김은혜',
    party: '국민의힘',
    partyColor: PARTY_COLORS['국민의힘'],
    summary: '현 국회의원, 전 대통령실 홍보수석',
    position: '경기도지사 예비후보',
  },
  {
    id: 'gyeonggi-3',
    name: '강용석',
    party: '개혁신당',
    partyColor: PARTY_COLORS['개혁신당'],
    summary: '변호사, 전 국회의원',
    position: '경기도지사 예비후보',
  },
];

// 광역단체장 선거 상태 (서울/경기 MVP)
export const METROPOLITAN_ELECTION_STATUS: Record<string, ElectionStatus> = {
  '서울특별시': {
    regionId: 'seoul-metro',
    regionName: '서울특별시',
    electionType: '지방선거',
    electionLevel: 'metropolitan',
    currentPhase: 'preliminary',
    electionDate: '2026-06-03',
    dDay: calculateDDay(),
    milestones: PRELIMINARY_PHASE_MILESTONES,
    candidates: SEOUL_MAYOR_CANDIDATES,
  },
  '경기도': {
    regionId: 'gyeonggi-metro',
    regionName: '경기도',
    electionType: '지방선거',
    electionLevel: 'metropolitan',
    currentPhase: 'preliminary',
    electionDate: '2026-06-03',
    dDay: calculateDDay(),
    milestones: PRELIMINARY_PHASE_MILESTONES,
    candidates: GYEONGGI_GOVERNOR_CANDIDATES,
  },
};

// 지역 키 생성 함수
export const getRegionKey = (sido: string, sigungu: string): string => `${sido}-${sigungu}`;

// 광역단체장 선거 상태 가져오기 (MVP: 서울/경기 우선)
export const getElectionStatus = (sido: string, sigungu: string): ElectionStatus => {
  // MVP: 서울시와 경기도는 광역단체장 선거 정보 반환
  if (METROPOLITAN_ELECTION_STATUS[sido]) {
    return {
      ...METROPOLITAN_ELECTION_STATUS[sido],
      dDay: calculateDDay(), // 항상 현재 날짜 기준으로 계산
    };
  }
  
  // 기타 지역은 기본 정보 반환
  return getDefaultElectionStatus(`${sido} ${sigungu}`);
};

// 기본 선거 상태 (지역 데이터가 없을 때)
export const getDefaultElectionStatus = (regionName: string): ElectionStatus => ({
  regionId: 'default',
  regionName,
  electionType: '지방선거',
  electionLevel: 'district',
  currentPhase: 'preliminary',
  electionDate: '2026-06-03',
  dDay: calculateDDay(),
  milestones: PRELIMINARY_PHASE_MILESTONES,
  candidates: [
    { id: 'c1', name: '후보자 A', party: '더불어민주당', partyColor: '#004EA2', summary: '정책 공약 준비중', position: '예비후보' },
    { id: 'c2', name: '후보자 B', party: '국민의힘', partyColor: '#E61E2B', summary: '정책 공약 준비중', position: '예비후보' },
  ],
});

// 광역단체장 타이틀 가져오기
export const getMetropolitanTitle = (sido: string): string => {
  if (sido === '서울특별시') return '서울시장';
  if (sido === '경기도') return '경기도지사';
  if (sido.includes('광역시')) return `${sido.replace('광역시', '')}시장`;
  if (sido.includes('도')) return `${sido.replace('도', '')}도지사`;
  if (sido.includes('특별자치')) return `${sido.replace('특별자치시', '').replace('특별자치도', '')}지사`;
  return '광역단체장';
};
