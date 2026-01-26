import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  UserSpectrum, 
  SpectrumQuestion, 
  SpectrumAnswer,
  SpectrumScores,
  SpectrumUncertainties,
} from '@/types/spectrum';

// DB 매핑 헬퍼
function mapDbToQuestion(row: any): SpectrumQuestion {
  return {
    id: row.id,
    statement: row.statement,
    leftLabel: row.left_label,
    rightLabel: row.right_label,
    targetDimension: row.target_dimension,
    weights: {
      economy: row.weight_economy,
      security: row.weight_security,
      gender: row.weight_gender,
      fairness: row.weight_fairness,
      future: row.weight_future,
    },
    discrimination: row.discrimination,
    difficulty: row.difficulty,
    category: row.category,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapDbToSpectrum(row: any): UserSpectrum {
  return {
    id: row.id,
    userId: row.user_id,
    scores: {
      economy: row.economy_score,
      security: row.security_score,
      gender: row.gender_score,
      fairness: row.fairness_score,
      future: row.future_score,
    },
    uncertainties: {
      economy: row.economy_uncertainty,
      security: row.security_uncertainty,
      gender: row.gender_uncertainty,
      fairness: row.fairness_uncertainty,
      future: row.future_uncertainty,
    },
    totalAnswers: row.total_answers,
    sessionId: row.session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 활성화된 질문 목록 조회
export function useSpectrumQuestions() {
  return useQuery({
    queryKey: ['spectrum-questions'],
    queryFn: async (): Promise<SpectrumQuestion[]> => {
      const { data, error } = await supabase
        .from('spectrum_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbToQuestion);
    },
  });
}

// 사용자 스펙트럼 조회
export function useUserSpectrum() {
  return useQuery({
    queryKey: ['user-spectrum'],
    queryFn: async (): Promise<UserSpectrum | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_spectrums')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return mapDbToSpectrum(data);
    },
  });
}

// 사용자 스펙트럼 생성/업데이트
export function useUpsertSpectrum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      scores: SpectrumScores;
      uncertainties: SpectrumUncertainties;
      totalAnswers: number;
      sessionId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { data: result, error } = await supabase
        .from('user_spectrums')
        .upsert({
          user_id: user.id,
          economy_score: data.scores.economy,
          security_score: data.scores.security,
          gender_score: data.scores.gender,
          fairness_score: data.scores.fairness,
          future_score: data.scores.future,
          economy_uncertainty: data.uncertainties.economy,
          security_uncertainty: data.uncertainties.security,
          gender_uncertainty: data.uncertainties.gender,
          fairness_uncertainty: data.uncertainties.fairness,
          future_uncertainty: data.uncertainties.future,
          total_answers: data.totalAnswers,
          session_id: data.sessionId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToSpectrum(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-spectrum'] });
    },
  });
}

// 답변 저장
export function useSaveAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      questionId: string;
      answerValue: number;
      informationGain?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { error } = await supabase
        .from('spectrum_answers')
        .insert({
          user_id: user.id,
          session_id: data.sessionId,
          question_id: data.questionId,
          answer_value: data.answerValue,
          information_gain: data.informationGain || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spectrum-answers'] });
    },
  });
}

// 세션의 답변 목록 조회
export function useSessionAnswers(sessionId: string | null) {
  return useQuery({
    queryKey: ['spectrum-answers', sessionId],
    queryFn: async (): Promise<SpectrumAnswer[]> => {
      if (!sessionId) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('spectrum_answers')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        questionId: row.question_id,
        answerValue: row.answer_value,
        informationGain: row.information_gain,
        createdAt: row.created_at,
      }));
    },
    enabled: !!sessionId,
  });
}
