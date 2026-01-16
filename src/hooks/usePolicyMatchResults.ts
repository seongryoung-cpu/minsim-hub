import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MatchResult, UserChoice } from '@/types/policy';

export interface PolicyMatchResult {
  id: string;
  user_id: string;
  region_name: string;
  top_match_candidate_id: string | null;
  top_match_candidate_name: string;
  top_match_score: number;
  preferred_candidate_id: string | null;
  preferred_candidate_name: string | null;
  results_json: MatchResult[];
  choices_json: UserChoice[];
  total_questions: number;
  created_at: string;
}

// 사용자의 정책 매칭 결과 목록 조회
export function usePolicyMatchResults() {
  return useQuery({
    queryKey: ['policy-match-results'],
    queryFn: async (): Promise<PolicyMatchResult[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('policy_match_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return (data || []).map(d => ({
        ...d,
        results_json: d.results_json as unknown as MatchResult[],
        choices_json: d.choices_json as unknown as UserChoice[],
      }));
    },
  });
}

// 특정 결과 상세 조회
export function usePolicyMatchResult(id: string | null) {
  return useQuery({
    queryKey: ['policy-match-result', id],
    queryFn: async (): Promise<PolicyMatchResult | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('policy_match_results')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        results_json: data.results_json as unknown as MatchResult[],
        choices_json: data.choices_json as unknown as UserChoice[],
      };
    },
    enabled: !!id,
  });
}

// 정책 매칭 결과 저장
export function useSavePolicyMatchResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      region_name: string;
      top_match_candidate_id: string | null;
      top_match_candidate_name: string;
      top_match_score: number;
      preferred_candidate_id: string | null;
      preferred_candidate_name: string | null;
      results: MatchResult[];
      choices: UserChoice[];
      total_questions: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      // candidate_id가 uuid인지 확인 (하드코딩된 id는 null로 처리)
      const isValidUuid = (id: string | null) => {
        if (!id) return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id) ? id : null;
      };

      const insertData = {
        user_id: user.id,
        region_name: data.region_name,
        top_match_candidate_id: isValidUuid(data.top_match_candidate_id),
        top_match_candidate_name: data.top_match_candidate_name,
        top_match_score: data.top_match_score,
        preferred_candidate_id: isValidUuid(data.preferred_candidate_id),
        preferred_candidate_name: data.preferred_candidate_name,
        results_json: JSON.parse(JSON.stringify(data.results)),
        choices_json: JSON.parse(JSON.stringify(data.choices)),
        total_questions: data.total_questions,
      };

      const { data: result, error } = await supabase
        .from('policy_match_results')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-match-results'] });
    },
  });
}

// 정책 매칭 결과 삭제
export function useDeletePolicyMatchResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('policy_match_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-match-results'] });
    },
  });
}
