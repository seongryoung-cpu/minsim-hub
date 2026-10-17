// Election Status Schema - 선거 상태 표준 데이터 구조

export type ElectionPhase = string;

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
  /** 선거 후 결과. 없으면 아직 입력 전 */
  electionResult?: ElectionResult;
  /** 본선 최종 득표율(%) */
  voteShare?: number;
}

export type ElectionResult = 'elected' | 'defeated' | 'not_nominated';

export const ELECTION_RESULT_LABELS: Record<ElectionResult, string> = {
  elected: '당선',
  defeated: '낙선',
  not_nominated: '본선 미진출',
};

const RESULT_ORDER: Record<ElectionResult, number> = { elected: 0, defeated: 1, not_nominated: 2 };

/** 당선 → 본선 낙선(득표율 높은 순) → 본선 미진출 → 결과 미입력 */
export const sortByElectionResult = <T extends Pick<Candidate, 'electionResult' | 'voteShare'>>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    const ra = a.electionResult ? RESULT_ORDER[a.electionResult] : 3;
    const rb = b.electionResult ? RESULT_ORDER[b.electionResult] : 3;
    return ra - rb || (b.voteShare ?? 0) - (a.voteShare ?? 0);
  });

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

// D-Day 표기: D-12 / D-DAY / 종료
export const formatDDay = (dDay: number): string => {
  if (dDay > 0) return `D-${dDay}`;
  if (dDay === 0) return 'D-DAY';
  return '종료';
};

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' */
export const formatYmd = (ymd: string | null | undefined): string => (ymd ? ymd.replace(/-/g, '.') : '');

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

/** DB 진행 단계 항목 → 오늘 기준 진행 상태 (선거일이 지나면 전 단계 완료) */
export const buildMilestones = (
  items: { id: string; title: string; short_label: string | null; start_date: string | null }[],
  electionDate: string,
): ElectionMilestone[] => {
  const over = calculateDDayTo(electionDate) < 0;
  let currentIdx = -1;
  if (!over) {
    items.forEach((m, i) => {
      if (m.start_date && calculateDDayTo(m.start_date) <= 0) currentIdx = i;
    });
    if (currentIdx === -1) currentIdx = 0;
  }
  return items.map((m, i) => ({
    id: m.id,
    label: m.title,
    shortLabel: m.short_label || m.title,
    date: m.start_date ?? '',
    isComplete: over || i < currentIdx,
    isCurrent: !over && i === currentIdx,
    isLocked: !over && i > currentIdx,
  }));
};

// 광주광역시·전라남도는 2026-07-01 전남광주통합특별시로 통합됨 (선거도 하나)
const MERGED_ELECTION_REGION: Record<string, string> = {
  '광주광역시': '전남광주통합특별시',
  '전라남도': '전남광주통합특별시',
};

/** 사용자가 고른 시·도 → 후보 데이터의 region_name */
export const electionRegionOf = (sido: string): string => MERGED_ELECTION_REGION[sido] ?? sido;

// 광역단체장 타이틀 가져오기
export const getMetropolitanTitle = (sido: string): string => {
  if (electionRegionOf(sido) === '전남광주통합특별시') return '전남광주통합특별시장';
  if (sido === '서울특별시') return '서울시장';
  if (sido === '경기도') return '경기도지사';
  if (sido === '세종특별자치시') return '세종시장';
  if (sido.includes('광역시')) return `${sido.replace('광역시', '')}시장`;
  if (sido.includes('도')) return `${sido.replace('도', '')}도지사`;
  if (sido.includes('특별자치')) return `${sido.replace('특별자치시', '').replace('특별자치도', '')}지사`;
  return '광역단체장';
};
