import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MbtiQuestion, MbtiType, MbtiResult, AxisScores, MbtiAnswer } from '@/types/political-mbti';

// 질문 목록 조회
export function useMbtiQuestions() {
  return useQuery({
    queryKey: ['mbti-questions'],
    queryFn: async (): Promise<MbtiQuestion[]> => {
      const { data, error } = await supabase
        .from('political_mbti_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(q => ({
        id: q.id,
        axis: q.axis as 'EI' | 'SN' | 'TF' | 'JP',
        statement: q.statement,
        leftLabel: q.left_label,
        rightLabel: q.right_label,
        leftAxisValue: q.left_axis_value,
        rightAxisValue: q.right_axis_value,
        sortOrder: q.sort_order,
      }));
    },
  });
}

// 모든 유형 조회
export function useMbtiTypes() {
  return useQuery({
    queryKey: ['mbti-types'],
    queryFn: async (): Promise<MbtiType[]> => {
      const { data, error } = await supabase
        .from('political_mbti_types')
        .select('*')
        .order('type_code', { ascending: true });

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        typeCode: t.type_code,
        name: t.name,
        description: t.description,
        keywords: t.keywords || [],
        famousFigures: t.famous_figures || [],
        strengths: t.strengths || [],
        weaknesses: t.weaknesses || [],
        compatibleTypes: t.compatible_types || [],
        incompatibleTypes: t.incompatible_types || [],
        color: t.color,
        icon: t.icon || 'user',
      }));
    },
  });
}

// 특정 유형 조회
export function useMbtiType(typeCode: string | null) {
  return useQuery({
    queryKey: ['mbti-type', typeCode],
    queryFn: async (): Promise<MbtiType | null> => {
      if (!typeCode) return null;

      const { data, error } = await supabase
        .from('political_mbti_types')
        .select('*')
        .eq('type_code', typeCode)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        typeCode: data.type_code,
        name: data.name,
        description: data.description,
        keywords: data.keywords || [],
        famousFigures: data.famous_figures || [],
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        compatibleTypes: data.compatible_types || [],
        incompatibleTypes: data.incompatible_types || [],
        color: data.color,
        icon: data.icon || 'user',
      };
    },
    enabled: !!typeCode,
  });
}

// 사용자 결과 목록 조회
export function useMbtiResults() {
  return useQuery({
    queryKey: ['mbti-results'],
    queryFn: async (): Promise<MbtiResult[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('political_mbti_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        typeCode: r.type_code,
        axisScores: r.axis_scores as unknown as AxisScores,
        answersJson: r.answers_json as unknown as MbtiAnswer[],
        fromPolicyMatch: r.from_policy_match,
        policyMatchResultId: r.policy_match_result_id,
        createdAt: r.created_at,
      }));
    },
  });
}

// 결과 저장
export function useSaveMbtiResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      typeCode: string;
      axisScores: AxisScores;
      answers: MbtiAnswer[];
      fromPolicyMatch?: boolean;
      policyMatchResultId?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { data: result, error } = await supabase
        .from('political_mbti_results')
        .insert({
          user_id: user.id,
          type_code: data.typeCode,
          axis_scores: JSON.parse(JSON.stringify(data.axisScores)),
          answers_json: JSON.parse(JSON.stringify(data.answers)),
          from_policy_match: data.fromPolicyMatch || false,
          policy_match_result_id: data.policyMatchResultId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mbti-results'] });
    },
  });
}

// 결과 삭제
export function useDeleteMbtiResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('political_mbti_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mbti-results'] });
    },
  });
}
