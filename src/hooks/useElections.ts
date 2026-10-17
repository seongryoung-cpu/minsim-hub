import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { buildMilestones, calculateDDayTo } from '@/types/election';

export type ElectionRow = Tables<'elections'>;
export type ScheduleItemRow = Tables<'election_schedule_items'>;
export type ScheduleKind = 'milestone' | 'voting' | 'checklist';

export const SCHEDULE_KIND_LABELS: Record<ScheduleKind, string> = {
  milestone: '진행 단계',
  voting: '투표 일정',
  checklist: '체크리스트',
};
export const ELECTION_ROLE_LABELS: Record<string, string> = {
  current: '현재 선거',
  next: '다음 선거',
  archived: '보관',
};

export const ELECTIONS_KEY = ['elections'];

async function fetchElections() {
  const [e, i] = await Promise.all([
    supabase.from('elections').select('*').order('sort_order'),
    supabase.from('election_schedule_items').select('*').order('sort_order'),
  ]);
  if (e.error) throw e.error;
  if (i.error) throw i.error;
  return { elections: e.data ?? [], items: i.data ?? [] };
}

export function useElectionsRaw() {
  return useQuery({ queryKey: ELECTIONS_KEY, queryFn: fetchElections, staleTime: 5 * 60_000 });
}

/** 현재/다음 선거와 일정 항목 */
export function useElectionSchedule() {
  const q = useElectionsRaw();
  const elections = q.data?.elections ?? [];
  const items = q.data?.items ?? [];
  const current = elections.find((e) => e.role === 'current') ?? null;
  const next = elections.find((e) => e.role === 'next') ?? null;
  const of = (kind: ScheduleKind) => (current ? items.filter((i) => i.election_id === current.id && i.kind === kind) : []);
  const dDay = current ? calculateDDayTo(current.election_date) : null;
  return {
    isLoading: q.isLoading,
    isError: q.isError,
    current,
    next,
    dDay,
    isOver: dDay != null && dDay < 0,
    nextDDay: next ? calculateDDayTo(next.election_date) : null,
    milestones: current ? buildMilestones(of('milestone'), current.election_date) : [],
    voting: of('voting'),
    checklist: of('checklist'),
  };
}

export function useElectionAdminMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ELECTIONS_KEY });
  const saveElection = useMutation({
    mutationFn: async (row: Partial<ElectionRow> & { name: string; election_date: string }) => {
      const { id, created_at: _c, updated_at: _u, ...rest } = row;
      const res = id
        ? await supabase.from('elections').update(rest).eq('id', id)
        : await supabase.from('elections').insert(rest);
      if (res.error) throw res.error;
    },
    onSuccess: done,
  });
  const deleteElection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('elections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  const saveItem = useMutation({
    mutationFn: async (row: Partial<ScheduleItemRow> & { election_id: string; kind: string; title: string }) => {
      const { id, created_at: _c, updated_at: _u, ...rest } = row;
      const res = id
        ? await supabase.from('election_schedule_items').update(rest).eq('id', id)
        : await supabase.from('election_schedule_items').insert(rest);
      if (res.error) throw res.error;
    },
    onSuccess: done,
  });
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('election_schedule_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  return { saveElection, deleteElection, saveItem, deleteItem };
}
