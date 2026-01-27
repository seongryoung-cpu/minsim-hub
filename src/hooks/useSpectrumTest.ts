import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { 
  SpectrumQuestion, 
  SpectrumScores, 
  SpectrumUncertainty,
  DimensionKey,
  SpectrumAnswer,
  UserSpectrum
} from '@/types/political-mbti';

// 5차원 질문 조회
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

      return (data || []).map(q => ({
        id: q.id,
        statement: q.statement,
        leftLabel: q.left_label,
        rightLabel: q.right_label,
        targetDimension: q.target_dimension as DimensionKey,
        weights: {
          economy: q.weight_economy,
          security: q.weight_security,
          gender: q.weight_gender,
          fairness: q.weight_fairness,
          future: q.weight_future,
        },
        difficulty: q.difficulty,
        discrimination: q.discrimination,
        sortOrder: q.sort_order,
      }));
    },
  });
}

// 현재 사용자 스펙트럼 조회
export function useUserSpectrum() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['user-spectrum', user?.id],
    queryFn: async (): Promise<UserSpectrum | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_spectrums')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        scores: {
          economy: data.economy_score,
          security: data.security_score,
          gender: data.gender_score,
          fairness: data.fairness_score,
          future: data.future_score,
        },
        uncertainty: {
          economy: data.economy_uncertainty,
          security: data.security_uncertainty,
          gender: data.gender_uncertainty,
          fairness: data.fairness_uncertainty,
          future: data.future_uncertainty,
        },
        totalAnswers: data.total_answers,
        sessionId: data.session_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!user,
  });
}

// 스펙트럼 결과 저장
export function useSaveSpectrum() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: {
      scores: SpectrumScores;
      uncertainty: SpectrumUncertainty;
      totalAnswers: number;
      sessionId?: string;
    }) => {
      if (!user) throw new Error('로그인이 필요합니다');

      const { data: existing } = await supabase
        .from('user_spectrums')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        economy_score: data.scores.economy,
        security_score: data.scores.security,
        gender_score: data.scores.gender,
        fairness_score: data.scores.fairness,
        future_score: data.scores.future,
        economy_uncertainty: data.uncertainty.economy,
        security_uncertainty: data.uncertainty.security,
        gender_uncertainty: data.uncertainty.gender,
        fairness_uncertainty: data.uncertainty.fairness,
        future_uncertainty: data.uncertainty.future,
        total_answers: data.totalAnswers,
        session_id: data.sessionId || crypto.randomUUID(),
      };

      if (existing) {
        const { error } = await supabase
          .from('user_spectrums')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_spectrums')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-spectrum'] });
    },
  });
}

// 개별 답변 저장
export function useSaveSpectrumAnswer() {
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: {
      questionId: string;
      value: number;
      sessionId: string;
      informationGain?: number;
    }) => {
      if (!user) throw new Error('로그인이 필요합니다');

      const { error } = await supabase
        .from('spectrum_answers')
        .insert({
          user_id: user.id,
          question_id: data.questionId,
          answer_value: data.value,
          session_id: data.sessionId,
          information_gain: data.informationGain || null,
        });

      if (error) throw error;
    },
  });
}

// 사용자 답변 히스토리 조회
export function useSpectrumAnswers(sessionId?: string) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['spectrum-answers', user?.id, sessionId],
    queryFn: async (): Promise<SpectrumAnswer[]> => {
      if (!user) return [];

      let query = supabase
        .from('spectrum_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(a => ({
        questionId: a.question_id,
        value: a.answer_value,
        timestamp: a.created_at,
      }));
    },
    enabled: !!user,
  });
}
