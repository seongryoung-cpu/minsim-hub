export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export type QuizCategory = 
  | '정치일반'
  | '경제정책'
  | '환경법안'
  | '사회복지'
  | '외교안보'
  | '선거제도';

export interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface UserQuizStats {
  totalPoints: number;
  totalQuizzes: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  categoryScores: Record<QuizCategory, { correct: number; total: number }>;
  percentile: number;
}

export const QUIZ_CATEGORIES: QuizCategory[] = [
  '정치일반',
  '경제정책',
  '환경법안',
  '사회복지',
  '외교안보',
  '선거제도',
];

export const CATEGORY_ICONS: Record<QuizCategory, string> = {
  '정치일반': '🏛️',
  '경제정책': '📊',
  '환경법안': '🌱',
  '사회복지': '🤝',
  '외교안보': '🌏',
  '선거제도': '🗳️',
};

export const DAILY_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: '선거제도',
    question: '대한민국 대통령 선거는 몇 년마다 실시되나요?',
    options: ['4년', '5년', '6년', '7년'],
    correctAnswer: 1,
    explanation: '대한민국 대통령의 임기는 5년 단임제로, 대통령 선거는 5년마다 실시됩니다.',
    difficulty: 'easy',
    points: 10,
  },
  {
    id: 'q2',
    category: '정치일반',
    question: '대한민국 국회의원의 임기는 몇 년인가요?',
    options: ['2년', '3년', '4년', '5년'],
    correctAnswer: 2,
    explanation: '국회의원의 임기는 4년이며, 4년마다 총선이 실시됩니다.',
    difficulty: 'easy',
    points: 10,
  },
  {
    id: 'q3',
    category: '경제정책',
    question: '기준금리를 결정하는 기관은 어디인가요?',
    options: ['기획재정부', '금융위원회', '한국은행', '국회'],
    correctAnswer: 2,
    explanation: '한국은행 금융통화위원회에서 기준금리를 결정합니다.',
    difficulty: 'medium',
    points: 15,
  },
  {
    id: 'q4',
    category: '환경법안',
    question: '탄소중립을 위한 2050년 목표를 법제화한 법률의 이름은?',
    options: ['환경보전법', '탄소중립기본법', '기후변화대응법', '녹색성장기본법'],
    correctAnswer: 1,
    explanation: '2021년 제정된 탄소중립기본법은 2050년까지 탄소중립 달성을 법적으로 명시했습니다.',
    difficulty: 'hard',
    points: 20,
  },
  {
    id: 'q5',
    category: '사회복지',
    question: '기초연금 수급 대상자의 기준 연령은?',
    options: ['60세 이상', '62세 이상', '65세 이상', '70세 이상'],
    correctAnswer: 2,
    explanation: '기초연금은 만 65세 이상 소득인정액이 선정기준액 이하인 분들께 지급됩니다.',
    difficulty: 'medium',
    points: 15,
  },
  {
    id: 'q6',
    category: '외교안보',
    question: '유엔 안전보장이사회 상임이사국 수는?',
    options: ['3개국', '5개국', '7개국', '10개국'],
    correctAnswer: 1,
    explanation: '미국, 영국, 프랑스, 러시아, 중국 5개국이 상임이사국입니다.',
    difficulty: 'easy',
    points: 10,
  },
  {
    id: 'q7',
    category: '선거제도',
    question: '지방선거에서 선출되지 않는 직위는?',
    options: ['시장', '도지사', '교육감', '검찰총장'],
    correctAnswer: 3,
    explanation: '검찰총장은 대통령이 임명하며, 선거로 선출되지 않습니다.',
    difficulty: 'medium',
    points: 15,
  },
  {
    id: 'q8',
    category: '정치일반',
    question: '국회 본회의 의결 정족수는?',
    options: ['재적의원 1/3 이상', '재적의원 과반수', '재적의원 2/3 이상', '출석의원 과반수'],
    correctAnswer: 3,
    explanation: '국회 본회의 의결은 재적의원 과반수 출석과 출석의원 과반수 찬성으로 의결됩니다.',
    difficulty: 'hard',
    points: 20,
  },
];
