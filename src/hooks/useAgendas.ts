/**
 * 공론 허브 데이터 훅 (허브 앤 스포크)
 *
 * 화면(UI)은 Lovable에서 만들고, 이 파일의 훅만 가져다 쓴다.
 *   - 허브 목록:          useAgendas()
 *   - 의제 상세:          useAgenda(id), useAgendaSummary(id), useAgendaRelatedPledges(id),
 *                         useAgendaStatements(id, sort), useCastAgendaVote(), usePostStatement(),
 *                         useReactToStatement()
 *   - 후보 공약·정책 비교: useLinkedAgendas({ pledgeIds, policyCardIds })  → 연결 카드
 *
 * 규칙 (DB 함수에서 강제됨 — supabase/migrations/20260928010000_gonglon_hub_foundation.sql)
 *   - 모든 id는 UUID. 후보 slug를 넘기지 말 것.
 *   - 의견 분포는 useAgendaSummary 의 revealed=true 일 때만 온다 (최종 의견을 낸 뒤 + 참여 5명 이상).
 *   - 연결 카드는 분포 없이 참여자 수만. quiet_mode=true 면 카드에서 첫 반응 버튼을 그리지 말 것.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Agenda = Tables<'agendas'>;
export type AgendaIssue = Tables<'agenda_issues'>;
export type AgendaChoice = 'agree' | 'disagree' | 'hold';
export type AgendaStage = 'first' | 'final';
export type AgendaVoteSource = 'pledge_card' | 'compare' | 'home' | 'hub' | 'agenda';
export type StatementSort = 'latest' | 'agreed' | 'divisive';

export const CHOICE_LABELS: Record<AgendaChoice, string> = {
  agree: '동의',
  disagree: '비동의',
  hold: '유보',
};

type ChoiceCounts = Record<AgendaChoice, number>;

export interface AgendaSummary {
  participants: number;
  my_first: AgendaChoice | null;
  my_final: AgendaChoice | null;
  /** true일 때만 distribution/shift 가 채워진다 */
  revealed: boolean;
  distribution: { first: ChoiceCounts; final: ChoiceCounts } | null;
  /** 숙의 전후 변화: 'agree>disagree' 처럼 '첫 반응>최종 의견' 키별 인원 */
  shift: Record<string, number> | null;
}

export interface LinkedAgenda {
  pledge_id: string | null;
  policy_card_id: string | null;
  agenda_id: string;
  title: string;
  status: 'open' | 'closed';
  closes_at: string | null;
  participants: number;
  my_first: AgendaChoice | null;
  my_final: AgendaChoice | null;
  quiet_mode: boolean;
}

const keys = {
  all: ['agendas'] as const,
  list: (sido?: string) => ['agendas', 'list', sido ?? 'all'] as const,
  detail: (id: string) => ['agendas', 'detail', id] as const,
  summary: (id: string) => ['agendas', 'summary', id] as const,
  related: (id: string) => ['agendas', 'related', id] as const,
  statements: (id: string, sort: StatementSort) => ['agendas', 'statements', id, sort] as const,
  linked: (pledgeIds: string[], cardIds: string[]) =>
    ['agendas', 'linked', [...pledgeIds].sort().join(','), [...cardIds].sort().join(',')] as const,
};

/** 허브 목록: 진행 중 먼저, 그다음 마감. 지역 지정 시 해당 지역 + 전국 의제 */
export function useAgendas(sido?: string) {
  return useQuery({
    queryKey: keys.list(sido),
    queryFn: async () => {
      let query = supabase
        .from('agendas')
        .select('*')
        .in('status', ['open', 'closed'])
        .order('status', { ascending: false }) // 'open' > 'closed'
        .order('created_at', { ascending: false });
      if (sido) query = query.or(`region_sido.is.null,region_sido.eq.${sido}`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

/** 홈 '이번 주 공론' 배너용 */
export function useFeaturedAgenda() {
  return useQuery({
    queryKey: [...keys.all, 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('status', 'open')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

/** 의제 상세: 의제 + 쟁점 카드 */
export function useAgenda(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const [agendaRes, issuesRes] = await Promise.all([
        supabase.from('agendas').select('*').eq('id', id!).maybeSingle(),
        supabase.from('agenda_issues').select('*').eq('agenda_id', id!).order('sort_order'),
      ]);
      if (agendaRes.error) throw agendaRes.error;
      if (issuesRes.error) throw issuesRes.error;
      if (!agendaRes.data) return null;
      return { agenda: agendaRes.data, issues: issuesRes.data ?? [] };
    },
  });
}

export function useAgendaSummary(id: string | undefined) {
  return useQuery({
    queryKey: keys.summary(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agenda_summary', { p_agenda_id: id! });
      if (error) throw error;
      const res = data as unknown as AgendaSummary & { error?: string };
      if (res?.error) throw new Error(res.error);
      return res;
    },
  });
}

/** 의제 상세의 '관련 공약' — 연결된 공약이 있는 후보를 모두 같은 형식으로 (가나다순) */
export function useAgendaRelatedPledges(id: string | undefined) {
  return useQuery({
    queryKey: keys.related(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agenda_related_pledges', { p_agenda_id: id! });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * 후보 공약·정책 비교 화면의 연결 카드.
 * 대상(공약/정책카드)마다 의제 최대 2개. 결과가 없으면 카드를 그리지 말 것(자리도 비우지 않음).
 * 반환값은 대상 id → 연결 의제 목록 Map.
 */
export function useLinkedAgendas({
  pledgeIds = [],
  policyCardIds = [],
}: { pledgeIds?: string[]; policyCardIds?: string[] }) {
  return useQuery({
    queryKey: keys.linked(pledgeIds, policyCardIds),
    enabled: pledgeIds.length + policyCardIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_linked_agendas', {
        p_pledge_ids: pledgeIds,
        p_policy_card_ids: policyCardIds,
      });
      if (error) throw error;
      const byTarget = new Map<string, LinkedAgenda[]>();
      for (const row of (data ?? []) as LinkedAgenda[]) {
        const target = row.pledge_id ?? row.policy_card_id;
        if (!target) continue;
        byTarget.set(target, [...(byTarget.get(target) ?? []), row]);
      }
      return byTarget;
    },
    staleTime: 60_000,
  });
}

export class LoginRequiredError extends Error {
  constructor() {
    super('login_required');
    this.name = 'LoginRequiredError';
  }
}

/**
 * 투표. stage='first' 는 연결 카드의 첫 반응, 'final' 은 의제 상세에서 쟁점을 읽은 뒤의 최종 의견.
 * 비로그인이면 LoginRequiredError — UI에서 로그인 유도.
 */
export function useCastAgendaVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      agendaId: string;
      stage: AgendaStage;
      choice: AgendaChoice;
      source: AgendaVoteSource;
    }) => {
      const { data, error } = await supabase.rpc('cast_agenda_vote', {
        p_agenda_id: input.agendaId,
        p_stage: input.stage,
        p_choice: input.choice,
        p_source: input.source,
      });
      if (error) throw error;
      const res = data as { ok?: boolean; error?: string };
      if (res?.error === 'login_required') throw new LoginRequiredError();
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onSuccess: (_res, input) => {
      qc.invalidateQueries({ queryKey: keys.summary(input.agendaId) });
      qc.invalidateQueries({ queryKey: ['agendas', 'linked'] });
    },
  });
}

export function useAgendaStatements(id: string | undefined, sort: StatementSort = 'latest') {
  return useQuery({
    queryKey: keys.statements(id ?? '', sort),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agenda_statements', {
        p_agenda_id: id!,
        p_sort: sort,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** 한 줄 의견 작성 (5~140자, 의제당 3개까지 — DB에서 검사) */
export function usePostStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agendaId, body }: { agendaId: string; body: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new LoginRequiredError();
      const { error } = await supabase
        .from('agenda_statements')
        .insert({ agenda_id: agendaId, user_id: auth.user.id, body: body.trim() });
      if (error) {
        if (error.message.includes('statement_limit')) {
          throw new Error('한 의제에 한 줄 의견은 3개까지 남길 수 있어요');
        }
        throw error;
      }
    },
    onSuccess: (_r, { agendaId }) => {
      qc.invalidateQueries({ queryKey: ['agendas', 'statements', agendaId] });
    },
  });
}

/** 한 줄 의견에 반응. choice=null 이면 반응 취소. 답글 기능은 없다 (Pol.is 방식) */
export function useReactToStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      statementId,
      choice,
    }: { agendaId: string; statementId: string; choice: AgendaChoice | null }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new LoginRequiredError();
      if (choice === null) {
        const { error } = await supabase
          .from('statement_reactions')
          .delete()
          .eq('statement_id', statementId)
          .eq('user_id', auth.user.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from('statement_reactions')
        .upsert({ statement_id: statementId, user_id: auth.user.id, choice });
      if (error) throw error;
    },
    onSuccess: (_r, { agendaId }) => {
      qc.invalidateQueries({ queryKey: ['agendas', 'statements', agendaId] });
    },
  });
}
