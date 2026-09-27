/**
 * 공론 의제 관리 (관리자 전용). RLS: agendas·agenda_issues·agenda_links 는 관리자만 쓰기,
 * agenda_statements 숨김(is_hidden) 수정도 관리자만.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const adminKeys = {
  list: ['admin-agendas', 'list'] as const,
  detail: (id: string) => ['admin-agendas', 'detail', id] as const,
  statements: (id: string) => ['admin-agendas', 'statements', id] as const,
  linkTargets: ['admin-agendas', 'link-targets'] as const,
};

function useInvalidateAll() {
  const qc = useQueryClient();
  return (agendaId?: string) => {
    qc.invalidateQueries({ queryKey: ['admin-agendas'] });
    qc.invalidateQueries({ queryKey: ['agendas'] }); // 사용자 화면 캐시도 갱신
    if (agendaId) qc.invalidateQueries({ queryKey: adminKeys.detail(agendaId) });
  };
}

/** 초안 포함 전체 의제 */
export function useAdminAgendaList(enabled = true) {
  return useQuery({
    queryKey: adminKeys.list,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** 의제 하나 + 쟁점 + 연결표(공약·정책카드 이름 포함) */
export function useAdminAgendaDetail(id: string | null) {
  return useQuery({
    queryKey: adminKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const [agendaRes, issuesRes, linksRes] = await Promise.all([
        supabase.from('agendas').select('*').eq('id', id!).maybeSingle(),
        supabase.from('agenda_issues').select('*').eq('agenda_id', id!).order('sort_order'),
        supabase
          .from('agenda_links')
          .select(
            'id, pledge_id, policy_card_id, sort_order, candidate_pledges(title, category, candidates(name)), policy_cards(statement, category)',
          )
          .eq('agenda_id', id!)
          .order('sort_order'),
      ]);
      if (agendaRes.error) throw agendaRes.error;
      if (issuesRes.error) throw issuesRes.error;
      if (linksRes.error) throw linksRes.error;
      return { agenda: agendaRes.data, issues: issuesRes.data ?? [], links: linksRes.data ?? [] };
    },
  });
}

/** 연결할 수 있는 대상: 모든 공약(후보 이름 포함) + 정책카드 */
export function useAgendaLinkTargets(enabled = true) {
  return useQuery({
    queryKey: adminKeys.linkTargets,
    enabled,
    queryFn: async () => {
      const [pledgesRes, cardsRes] = await Promise.all([
        supabase
          .from('candidate_pledges')
          .select('id, title, category, candidates(name, region_name, is_active)')
          .order('category'),
        supabase.from('policy_cards').select('id, statement, category, region_name').order('category'),
      ]);
      if (pledgesRes.error) throw pledgesRes.error;
      if (cardsRes.error) throw cardsRes.error;
      return { pledges: pledgesRes.data ?? [], policyCards: cardsRes.data ?? [] };
    },
    staleTime: 5 * 60_000,
  });
}

export type AgendaForm = Pick<
  TablesInsert<'agendas'>,
  | 'title'
  | 'summary'
  | 'split_reason'
  | 'question'
  | 'background'
  | 'category'
  | 'region_sido'
  | 'status'
  | 'is_featured'
  | 'opens_at'
  | 'closes_at'
>;

/** 의제 저장 (id 없으면 새로 만듦). 홈 배너로 지정하면 다른 의제의 홈 배너 지정은 해제 */
export function useSaveAgenda() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: AgendaForm }) => {
      const payload = { ...form };
      // 처음 '진행 중'으로 열 때 시작 시각 기록
      if (payload.status === 'open' && !payload.opens_at) payload.opens_at = new Date().toISOString();

      let agendaId = id;
      if (id) {
        const { error } = await supabase.from('agendas').update(payload as TablesUpdate<'agendas'>).eq('id', id);
        if (error) throw error;
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('agendas')
          .insert({ ...payload, created_by: auth.user?.id ?? null })
          .select('id')
          .single();
        if (error) throw error;
        agendaId = data.id;
      }

      if (payload.is_featured && agendaId) {
        const { error } = await supabase
          .from('agendas')
          .update({ is_featured: false })
          .eq('is_featured', true)
          .neq('id', agendaId);
        if (error) throw error;
      }
      return agendaId!;
    },
    onSuccess: (agendaId) => invalidate(agendaId),
  });
}

export function useDeleteAgenda() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agendas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
}

export type IssueForm = Pick<TablesInsert<'agenda_issues'>, 'title' | 'body' | 'kind' | 'sources' | 'sort_order'>;

export function useSaveIssue() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ agendaId, id, form }: { agendaId: string; id: string | null; form: IssueForm }) => {
      if (id) {
        const { error } = await supabase.from('agenda_issues').update(form).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agenda_issues').insert({ ...form, agenda_id: agendaId });
        if (error) throw error;
      }
      return agendaId;
    },
    onSuccess: (agendaId) => invalidate(agendaId),
  });
}

export function useDeleteIssue() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ agendaId, id }: { agendaId: string; id: string }) => {
      const { error } = await supabase.from('agenda_issues').delete().eq('id', id);
      if (error) throw error;
      return agendaId;
    },
    onSuccess: (agendaId) => invalidate(agendaId),
  });
}

export function useAddAgendaLink() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({
      agendaId,
      pledgeId,
      policyCardId,
    }: { agendaId: string; pledgeId?: string; policyCardId?: string }) => {
      const { error } = await supabase.from('agenda_links').insert({
        agenda_id: agendaId,
        pledge_id: pledgeId ?? null,
        policy_card_id: policyCardId ?? null,
      });
      if (error) {
        if (error.code === '23505') throw new Error('이미 연결된 대상이에요');
        throw error;
      }
      return agendaId;
    },
    onSuccess: (agendaId) => invalidate(agendaId),
  });
}

export function useDeleteAgendaLink() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ agendaId, id }: { agendaId: string; id: string }) => {
      const { error } = await supabase.from('agenda_links').delete().eq('id', id);
      if (error) throw error;
      return agendaId;
    },
    onSuccess: (agendaId) => invalidate(agendaId),
  });
}

/** 한 줄 의견 관리: 숨긴 것 포함 전부 */
export function useAdminStatements(agendaId: string | null) {
  return useQuery({
    queryKey: adminKeys.statements(agendaId ?? ''),
    enabled: !!agendaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_statements')
        .select('id, body, is_hidden, created_at')
        .eq('agenda_id', agendaId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetStatementHidden() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ agendaId, id, hidden }: { agendaId: string; id: string; hidden: boolean }) => {
      const { error } = await supabase.from('agenda_statements').update({ is_hidden: hidden }).eq('id', id);
      if (error) throw error;
      return agendaId;
    },
    onSuccess: (agendaId) => invalidate(agendaId),
  });
}
