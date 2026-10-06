/**
 * 공론 빠른 투표 훅
 *
 * 후보 의제(status='candidate')를 카드로 빠르게 투표한다. 규칙은 DB 함수가 강제한다
 * (supabase/migrations/20261007000000_gonglon_quick_vote.sql).
 *   - 투표는 agenda_votes 의 첫 반응(stage='first', source='quick')으로 저장 → 공론으로 올라가면 그대로 '첫 반응'
 *   - 결과는 내가 투표했고 참여 5명 이상일 때만 온다
 *   - '더 알고 싶어요'는 관심 의제(toggle_agenda_interest)를 재사용
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoginRequiredError, type AgendaChoice } from '@/hooks/useAgendas';

export interface QuickAgenda {
  id: string;
  title: string;
  summary: string;
  question: string;
  category: string | null;
  region_sido: string | null;
  created_at: string;
  my_vote: AgendaChoice | null;
  my_interest: boolean;
  results: { total: number; agree: number; disagree: number; hold: number } | null;
}

/** 빠른 투표 화면의 버튼 문구. '모르겠어요'는 공론의 '유보'와 같은 값(hold) */
export const QUICK_LABELS: Record<AgendaChoice, string> = {
  agree: '찬성',
  disagree: '반대',
  hold: '모르겠어요',
};

const quickKey = (sido?: string) => ['agendas', 'quick', sido ?? 'all'] as const;

export function useQuickAgendas(sido?: string, enabled = true) {
  return useQuery({
    queryKey: quickKey(sido),
    enabled,
    queryFn: async (): Promise<QuickAgenda[]> => {
      const { data, error } = await supabase.rpc('get_quick_agendas', { p_sido: sido ?? null });
      if (error) throw error;
      return (data as unknown as QuickAgenda[]) ?? [];
    },
    staleTime: 30_000,
  });
}

export function useQuickVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agendaId: string; choice: AgendaChoice }) => {
      const { data, error } = await supabase.rpc('cast_agenda_vote', {
        p_agenda_id: input.agendaId,
        p_stage: 'first',
        p_choice: input.choice,
        p_source: 'quick',
      });
      if (error) throw error;
      const res = data as unknown as { error?: string } | null;
      if (res?.error === 'login_required') throw new LoginRequiredError();
      if (res?.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendas', 'quick'] }),
  });
}

/** '더 알고 싶어요' 토글 */
export function useQuickInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agendaId: string) => {
      const { data, error } = await supabase.rpc('toggle_agenda_interest', { p_agenda_id: agendaId });
      if (error) {
        if (error.code === '42501') throw new LoginRequiredError();
        throw error;
      }
      const res = data as unknown as { error?: string; interested?: boolean } | null;
      if (res?.error === 'login_required') throw new LoginRequiredError();
      if (res?.error) throw new Error(res.error);
      return !!res?.interested;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendas', 'quick'] }),
  });
}

/** 관리자: 후보 의제 승격 순위 */
export function useCandidateRanking(enabled = true) {
  return useQuery({
    queryKey: ['agendas', 'candidate-ranking'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_candidate_ranking');
      if (error) throw error;
      return data ?? [];
    },
  });
}
