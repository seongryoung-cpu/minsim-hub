import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { QuizQuestion, QuizCategory } from '@/types/quiz';

export function useQuizQuestions(count: number = 5) {
  return useQuery({
    queryKey: ['quiz-questions', count],
    queryFn: async () => {
      // Fetch random active questions
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .limit(count * 2); // Fetch more to allow randomization

      if (error) throw error;

      // Shuffle and take the requested count
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      return selected.map((q): QuizQuestion => ({
        id: q.id,
        category: q.category as QuizCategory,
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        points: q.points,
      }));
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDailyQuiz() {
  return useQuery({
    queryKey: ['daily-quiz'],
    queryFn: async () => {
      // Use today's date as seed for consistent daily questions
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Deterministic shuffle based on date
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

      const selected = shuffled.slice(0, 5);

      return selected.map((q): QuizQuestion => ({
        id: q.id,
        category: q.category as QuizCategory,
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        points: q.points,
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
