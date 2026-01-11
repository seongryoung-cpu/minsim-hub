export type EventStatus = 'preparing' | 'active' | 'complete';

export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  date: string;
  category: '선거' | '조례' | '공청회' | '주민참여';
  location?: string;
}

export const MOCK_EVENTS: PoliticalEvent[] = [
  {
    id: '1',
    title: '2026 지방선거',
    description: '제9회 전국동시지방선거가 시작됩니다. 투표에 참여하세요.',
    status: 'preparing',
    date: '2026-06-03',
    category: '선거',
  },
  {
    id: '2',
    title: '주민참여예산 공모',
    description: '2026년도 주민참여예산 사업 아이디어를 제안해주세요.',
    status: 'active',
    date: '2026-01-15',
    category: '주민참여',
  },
  {
    id: '3',
    title: '도시계획 조례 개정안',
    description: '지역 도시계획 조례 개정에 대한 주민 의견을 수렴합니다.',
    status: 'active',
    date: '2026-01-20',
    category: '조례',
  },
  {
    id: '4',
    title: '2025 국민투표',
    description: '헌법 개정에 관한 국민투표가 완료되었습니다.',
    status: 'complete',
    date: '2025-12-15',
    category: '선거',
  },
];
