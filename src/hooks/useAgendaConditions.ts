import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoginRequiredError } from '@/hooks/useAgendas';

/**
 * 조건 질문: "어떤 조건이면 받아들일 수 있나요?" (여러 개 선택)
 * 개별 선택은 본인만 볼 수 있고, 결과 카드에는 조건별 비율로만 나온다.
 */
export interface AgendaCondition {
  id: string;
  agenda_id: string;
  label: string;
  is_exclusive: boolean;
  sort_order: number;
}

const key = (agendaId: string) => ['agendas', 'conditions', agendaId] as const;

export function useAgendaConditions(agendaId: string | undefined) {
  return useQuery({
    queryKey: key(agendaId ?? ''),
    enabled: !!agendaId,
    queryFn: async () => {
      const [{ data: conds, error }, { data: auth }] = await Promise.all([
        supabase.from('agenda_conditions').select('id, agenda_id, label, is_exclusive, sort_order').eq('agenda_id', agendaId!).order('sort_order'),
        supabase.auth.getUser(),
      ]);
      if (error) throw error;
      let myPicks: string[] = [];
      if (auth.user && (conds ?? []).length > 0) {
        const { data: picks } = await supabase.from('condition_picks').select('condition_id').eq('agenda_id', agendaId!);
        myPicks = (picks ?? []).map((p) => p.condition_id as string);
      }
      return { conditions: (conds ?? []) as AgendaCondition[], myPicks };
    },
    staleTime: 60_000,
  });
}

export function useSetConditionPicks(agendaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc('set_condition_picks', { p_agenda_id: agendaId, p_condition_ids: ids });
      if (error) throw error;
      const r = data as { error?: string };
      if (r?.error === 'login_required') throw new LoginRequiredError();
      if (r?.error) throw new Error(r.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: key(agendaId) }),
  });
}

/** 관리자: 조건 추가·수정·삭제 */
export function useSaveCondition(agendaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { id?: string; label: string; is_exclusive: boolean; sort_order: number }) => {
      const row = { agenda_id: agendaId, label: c.label.trim(), is_exclusive: c.is_exclusive, sort_order: c.sort_order };
      const { error } = c.id
        ? await supabase.from('agenda_conditions').update(row).eq('id', c.id)
        : await supabase.from('agenda_conditions').insert(row);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: key(agendaId) }),
  });
}

export function useDeleteCondition(agendaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agenda_conditions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: key(agendaId) }),
  });
}
