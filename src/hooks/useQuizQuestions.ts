import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { QuizQuestion, QuizCategory } from '@/types/quiz';

// 정답(correct_answer)·해설(explanation)이 제외된 공개 뷰에서 조회
function mapPublicQuestion(q: {
  id: string;
  category: string;
  question: string;
  options: unknown;
  difficulty: string;
  points: number;
}): Omit<QuizQuestion, 'correctAnswer' | 'explanation'> & { correctAnswer: -1; explanation: '' } {
  return {
    id: q.id,
    category: q.category as QuizCategory,
    question: q.question,
    options: q.options as string[],
    correctAnswer: -1,     // 서버에서 채점 — 클라이언트에 정답 없음
    explanation: '',        // 채점 응답에서 받아옴
    difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
    points: q.points,
  };
}

export function useQuizQuestions(count: number = 5) {
  return useQuery({
    queryKey: ['quiz-questions', count],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions_public')
        .select('id, category, question, options, difficulty, points')
        .limit(count * 2);

      if (error) throw error;

      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map(mapPublicQuestion);
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useDailyQuiz() {
  return useQuery({
    queryKey: ['daily-quiz'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('quiz_questions_public')
        .select('id, category, question, options, difficulty, points');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // 날짜 기반 결정적 셔플 (같은 날 같은 문제 출제)
      const seededRandom = (seed: string, index: number) => {
        const hash = seed.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        return Math.abs(Math.sin(hash + index)) % 1;
      };

      const shuffled = [...data].sort((a, b) =>
        seededRandom(today, data.indexOf(a)) - seededRandom(today, data.indexOf(b))
      );

      return shuffled.slice(0, 5).map(mapPublicQuestion);
    },
    staleTime: 1000 * 60 * 60,
  });
}

// 퀴즈 전체 제출 — 서버에서 채점 + 점수 저장
export type QuizAnswerInput = { question_id: string; selected_index: number };

export type QuizAnswerResult = {
  question_id: string;
  is_correct: boolean;
  explanation: string;
  correct_index: number;
  points: number;
};

export type SubmitDailyQuizResponse = {
  saved: boolean;
  correct_count?: number;
  total_count?: number;
  total_points?: number;
  results: QuizAnswerResult[];
  error?: string;
  message?: string;
};

export async function submitDailyQuiz(
  answers: QuizAnswerInput[]
): Promise<SubmitDailyQuizResponse> {
  const { data, error } = await supabase.rpc('submit_daily_quiz', {
    p_answers: answers,
  });

  if (error) throw error;
  return data as SubmitDailyQuizResponse;
}
