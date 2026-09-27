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

export interface CandidatePledge {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface CandidateCareer {
  id: string;
  period: string;
  title: string;
  organization: string;
}

export interface Candidate {
  id: string; // DB UUID — 팔로우·정책 매칭·연결표 등 모든 DB 작업에 사용
  slug: string; // URL 라우팅 전용 (/candidate/:slug)
  name: string;
  party: string;
  partyColor: string;
  image?: string;
  summary: string;
  position: string;
  // 상세 정보
  age?: number;
  education?: string;
  slogan?: string;
  pledges?: CandidatePledge[];
  careers?: CandidateCareer[];
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

// 현재 추적 중인 선거(2026 지방선거)와 다음 예정 선거
export const CURRENT_ELECTION = { name: '2026 지방선거', date: '2026-06-03' } as const;
export const NEXT_ELECTION = { name: '2028 총선', fullName: '제23대 국회의원 선거', date: '2028-04-12' } as const;

// 'YYYY-MM-DD'를 사용자 현지 날짜 기준 자정으로 변환 (UTC 파싱으로 하루 밀리는 문제 방지)
const toLocalDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// 특정 날짜까지 남은 일수 (오늘 = 0, 지난 날짜는 음수)
export const calculateDDayTo = (ymd: string): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((toLocalDate(ymd).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// D-Day 계산 함수 (현재 추적 중인 선거 기준)
export const calculateDDay = (): number => calculateDDayTo(CURRENT_ELECTION.date);

export const isCurrentElectionOver = (): boolean => calculateDDay() < 0;

// D-Day 표기: D-12 / D-DAY / 종료
export const formatDDay = (dDay: number): string => {
  if (dDay > 0) return `D-${dDay}`;
  if (dDay === 0) return 'D-DAY';
  return '종료';
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

// 선거 진행 마일스톤 원본 (날짜 = 해당 단계 시작일)
const BASE_MILESTONES: Omit<ElectionMilestone, 'isComplete' | 'isCurrent' | 'isLocked'>[] = [
  { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01' },
  { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15' },
  { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20' },
  { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03' },
];

// 오늘 날짜 기준으로 각 단계의 진행 상태 계산 (선거일이 지나면 전 단계 완료)
export const getElectionMilestones = (): ElectionMilestone[] => {
  const over = isCurrentElectionOver();
  let currentIdx = -1;
  if (!over) {
    BASE_MILESTONES.forEach((m, i) => {
      if (calculateDDayTo(m.date) <= 0) currentIdx = i;
    });
    if (currentIdx === -1) currentIdx = 0;
  }
  return BASE_MILESTONES.map((m, i) => ({
    ...m,
    isComplete: over || i < currentIdx,
    isCurrent: !over && i === currentIdx,
    isLocked: !over && i > currentIdx,
  }));
};

export const getCurrentPhase = (): ElectionPhase => {
  const milestones = getElectionMilestones();
  return (milestones.find((m) => m.isCurrent) ?? milestones[milestones.length - 1]).id;
};

// 기존 코드 호환용 (모듈 로드 시점 기준 값)
export const PRELIMINARY_PHASE_MILESTONES: ElectionMilestone[] = getElectionMilestones();

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
    candidates: [],
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
    candidates: [],
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
      currentPhase: getCurrentPhase(),
      milestones: getElectionMilestones(),
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
  currentPhase: getCurrentPhase(),
  electionDate: CURRENT_ELECTION.date,
  dDay: calculateDDay(),
  milestones: getElectionMilestones(),
  candidates: [],
});

// 광역단체장 타이틀 가져오기
export const getMetropolitanTitle = (sido: string): string => {
  if (sido === '서울특별시') return '서울시장';
  if (sido === '경기도') return '경기도지사';
  if (sido === '세종특별자치시') return '세종시장';
  if (sido.includes('광역시')) return `${sido.replace('광역시', '')}시장`;
  if (sido.includes('도')) return `${sido.replace('도', '')}도지사`;
  if (sido.includes('특별자치')) return `${sido.replace('특별자치시', '').replace('특별자치도', '')}지사`;
  return '광역단체장';
};
