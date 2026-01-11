// Election Status Schema - 선거 상태 표준 데이터 구조

export type ElectionPhase = 'preliminary' | 'primary' | 'general' | 'confirmed';

export interface ElectionMilestone {
  id: ElectionPhase;
  label: string;
  shortLabel: string;
  date: string;
  isComplete: boolean;
  isCurrent: boolean;
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
  currentPhase: ElectionPhase;
  electionDate: string;
  dDay: number;
  milestones: ElectionMilestone[];
  candidates: Candidate[];
}

// 기본 마일스톤 템플릿
export const DEFAULT_MILESTONES: Omit<ElectionMilestone, 'isComplete' | 'isCurrent'>[] = [
  { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01' },
  { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15' },
  { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20' },
  { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03' },
];

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

// 지역별 선거 상태 데이터
export const ELECTION_STATUS_DATA: Record<string, ElectionStatus> = {
  // 인천광역시 신설 구역
  '인천광역시-제물포구': {
    regionId: 'incheon-jemulpo',
    regionName: '인천광역시 제물포구',
    electionType: '지방선거',
    currentPhase: 'general',
    electionDate: '2026-06-03',
    dDay: 143,
    milestones: [
      { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01', isComplete: true, isCurrent: false },
      { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15', isComplete: true, isCurrent: false },
      { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20', isComplete: false, isCurrent: true },
      { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03', isComplete: false, isCurrent: false },
    ],
    candidates: [
      { id: 'c1', name: '김민주', party: '더불어민주당', partyColor: '#004EA2', summary: '30년 지역 봉사 경력', position: '구청장 후보' },
      { id: 'c2', name: '이국민', party: '국민의힘', partyColor: '#E61E2B', summary: '전 국회의원 보좌관', position: '구청장 후보' },
      { id: 'c3', name: '박혁신', party: '조국혁신당', partyColor: '#00a0e2', summary: '시민단체 대표 출신', position: '구청장 후보' },
    ],
  },
  '인천광역시-영종구': {
    regionId: 'incheon-yeongjong',
    regionName: '인천광역시 영종구',
    electionType: '지방선거',
    currentPhase: 'general',
    electionDate: '2026-06-03',
    dDay: 143,
    milestones: [
      { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01', isComplete: true, isCurrent: false },
      { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15', isComplete: true, isCurrent: false },
      { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20', isComplete: false, isCurrent: true },
      { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03', isComplete: false, isCurrent: false },
    ],
    candidates: [
      { id: 'c1', name: '최하늘', party: '국민의힘', partyColor: '#E61E2B', summary: '항공업계 전문가', position: '구청장 후보' },
      { id: 'c2', name: '정바다', party: '더불어민주당', partyColor: '#004EA2', summary: '전 인천시의원', position: '구청장 후보' },
    ],
  },
  '인천광역시-검단구': {
    regionId: 'incheon-geomdan',
    regionName: '인천광역시 검단구',
    electionType: '지방선거',
    currentPhase: 'primary',
    electionDate: '2026-06-03',
    dDay: 143,
    milestones: [
      { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01', isComplete: true, isCurrent: false },
      { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15', isComplete: false, isCurrent: true },
      { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20', isComplete: false, isCurrent: false },
      { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03', isComplete: false, isCurrent: false },
    ],
    candidates: [
      { id: 'c1', name: '윤새벽', party: '더불어민주당', partyColor: '#004EA2', summary: '도시개발 전문가', position: '구청장 후보' },
      { id: 'c2', name: '한미래', party: '개혁신당', partyColor: '#FF6B00', summary: '청년 정치인', position: '구청장 후보' },
    ],
  },
};

// 기본 선거 상태 (지역 데이터가 없을 때)
export const getDefaultElectionStatus = (regionName: string): ElectionStatus => ({
  regionId: 'default',
  regionName,
  electionType: '지방선거',
  currentPhase: 'general',
  electionDate: '2026-06-03',
  dDay: 143,
  milestones: [
    { id: 'preliminary', label: '예비후보 등록', shortLabel: '예비후보', date: '2026-03-01', isComplete: true, isCurrent: false },
    { id: 'primary', label: '당내 경선', shortLabel: '당내경선', date: '2026-04-15', isComplete: true, isCurrent: false },
    { id: 'general', label: '본선 대결', shortLabel: '본선대결', date: '2026-05-20', isComplete: false, isCurrent: true },
    { id: 'confirmed', label: '당선 확정', shortLabel: '당선확정', date: '2026-06-03', isComplete: false, isCurrent: false },
  ],
  candidates: [
    { id: 'c1', name: '후보자 A', party: '더불어민주당', partyColor: '#004EA2', summary: '정책 공약 준비중', position: '구청장 후보' },
    { id: 'c2', name: '후보자 B', party: '국민의힘', partyColor: '#E61E2B', summary: '정책 공약 준비중', position: '구청장 후보' },
  ],
});

// 지역 키 생성 함수
export const getRegionKey = (sido: string, sigungu: string): string => `${sido}-${sigungu}`;

// 지역별 선거 상태 가져오기
export const getElectionStatus = (sido: string, sigungu: string): ElectionStatus => {
  const key = getRegionKey(sido, sigungu);
  return ELECTION_STATUS_DATA[key] || getDefaultElectionStatus(`${sido} ${sigungu}`);
};
