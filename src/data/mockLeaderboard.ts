export interface LeaderboardUser {
  id: string;
  nickname: string;
  avatar: string;
  totalPoints: number;
  currentStreak: number;
  quizCount: number;
  accuracy: number;
  region: string;
  rank?: number;
  trend: 'up' | 'down' | 'same';
  trendValue: number;
}

// 가상의 사용자 데이터
export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  {
    id: '1',
    nickname: '정치박사',
    avatar: '🦊',
    totalPoints: 2450,
    currentStreak: 45,
    quizCount: 89,
    accuracy: 92,
    region: '서울 강남구',
    trend: 'up',
    trendValue: 2,
  },
  {
    id: '2',
    nickname: '민주시민',
    avatar: '🐯',
    totalPoints: 2280,
    currentStreak: 32,
    quizCount: 76,
    accuracy: 88,
    region: '경기 수원시',
    trend: 'same',
    trendValue: 0,
  },
  {
    id: '3',
    nickname: '투표왕',
    avatar: '🦁',
    totalPoints: 2150,
    currentStreak: 28,
    quizCount: 71,
    accuracy: 85,
    region: '부산 해운대구',
    trend: 'up',
    trendValue: 1,
  },
  {
    id: '4',
    nickname: '정책전문가',
    avatar: '🐻',
    totalPoints: 1980,
    currentStreak: 21,
    quizCount: 65,
    accuracy: 82,
    region: '인천 연수구',
    trend: 'down',
    trendValue: 1,
  },
  {
    id: '5',
    nickname: '깨어있는시민',
    avatar: '🐼',
    totalPoints: 1850,
    currentStreak: 18,
    quizCount: 58,
    accuracy: 80,
    region: '대전 서구',
    trend: 'up',
    trendValue: 3,
  },
  {
    id: '6',
    nickname: '뉴스읽는사람',
    avatar: '🐨',
    totalPoints: 1720,
    currentStreak: 15,
    quizCount: 52,
    accuracy: 78,
    region: '광주 북구',
    trend: 'down',
    trendValue: 2,
  },
  {
    id: '7',
    nickname: '정치새싹',
    avatar: '🐰',
    totalPoints: 1590,
    currentStreak: 12,
    quizCount: 48,
    accuracy: 75,
    region: '울산 남구',
    trend: 'same',
    trendValue: 0,
  },
  {
    id: '8',
    nickname: '국회의장',
    avatar: '🐸',
    totalPoints: 1480,
    currentStreak: 10,
    quizCount: 44,
    accuracy: 73,
    region: '세종시',
    trend: 'up',
    trendValue: 4,
  },
  {
    id: '9',
    nickname: '청년유권자',
    avatar: '🐵',
    totalPoints: 1350,
    currentStreak: 8,
    quizCount: 40,
    accuracy: 70,
    region: '대구 수성구',
    trend: 'down',
    trendValue: 1,
  },
  {
    id: '10',
    nickname: '참여하는시민',
    avatar: '🦋',
    totalPoints: 1220,
    currentStreak: 6,
    quizCount: 36,
    accuracy: 68,
    region: '제주시',
    trend: 'up',
    trendValue: 2,
  },
];

// 주간 리더보드 (다른 순위)
export const MOCK_WEEKLY_LEADERBOARD: LeaderboardUser[] = [
  { ...MOCK_LEADERBOARD[4], totalPoints: 320, rank: 1 },
  { ...MOCK_LEADERBOARD[0], totalPoints: 290, rank: 2 },
  { ...MOCK_LEADERBOARD[7], totalPoints: 275, rank: 3 },
  { ...MOCK_LEADERBOARD[2], totalPoints: 250, rank: 4 },
  { ...MOCK_LEADERBOARD[1], totalPoints: 235, rank: 5 },
  { ...MOCK_LEADERBOARD[5], totalPoints: 210, rank: 6 },
  { ...MOCK_LEADERBOARD[3], totalPoints: 195, rank: 7 },
  { ...MOCK_LEADERBOARD[9], totalPoints: 180, rank: 8 },
  { ...MOCK_LEADERBOARD[6], totalPoints: 165, rank: 9 },
  { ...MOCK_LEADERBOARD[8], totalPoints: 150, rank: 10 },
];
