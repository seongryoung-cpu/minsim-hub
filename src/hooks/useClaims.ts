/**
 * 공론 2단계 훅: 주장 카드 · 가까운 주장 고르기 · 시민 평가 · 관심 의제 · 읽은 사람
 *
 * 규칙은 DB 함수가 강제한다 (supabase/migrations/20261004000000_gonglon_claims_stage2.sql)
 *   - app_settings.gonglon_claims 가 꺼져 있으면 시민에게는 enabled=false (관리자는 항상 사용)
 *   - 주장 목록에는 좋아요가 없다. 대신 '고른 사람 수'와 검증 상태, 시민 평가 요약을 준다.
 *   - 고르기는 의제(또는 쟁점)마다 한 개, 다시 고르면 바뀐다. 주장을 쓰면 자동으로 내 선택이 된다.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoginRequiredError } from '@/hooks/useAgendas';
import type { Tables } from '@/integrations/supabase/types';

export type ClaimStatus = 'new' | 'review' | 'verified' | 'hidden';
export type EvidenceRating = 'clear' | 'partly' | 'unclear';
export type PerspectiveRating = 'good' | 'partly' | 'poor';

export interface AgendaClaim {
  id: string;
  issue_id: string | null;
  body: string;
  reason: string;
  counter: string;
  sources: string[];
  status: ClaimStatus;
  created_at: string;
  author: string;
  by_staff: boolean;
  is_mine: boolean;
  pick_count: number;
  eval_count: number;
  evidence_clear: number;
  perspective_good: number;
  perspective_partly: number;
  my_evaluation: { evidence: EvidenceRating; perspective: PerspectiveRating } | null;
}

export interface AgendaClaimsResult {
  enabled: boolean;
  agenda_status?: string;
  total_picks?: number;
  my_pick?: { claim_id: string; reason: string } | null;
  claims?: AgendaClaim[];
}

export type AdminClaim = Tables<'agenda_claims'>;

/** 글자 수 (DB 제약과 같게) */
export const CLAIM_MIN = 5;
export const CLAIM_MAX = 80;
export const CLAIM_REASON_MAX = 500;
export const CLAIM_COUNTER_MAX = 300;
export const PICK_REASON_MAX = 80;

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  new: '신규',
  review: '검토 중',
  verified: '검증 완료',
  hidden: '숨김',
};

/** 다른 관점 이해 평가 요약. 평가 3개 미만이면 null (한두 명의 평가로 딱지를 붙이지 않게) */
export function perspectiveLabel(c: Pick<AgendaClaim, 'eval_count' | 'perspective_good' | 'perspective_partly'>): string | null {
  if (c.eval_count < 3) return null;
  const good = c.perspective_good / c.eval_count;
  const partlyOrBetter = (c.perspective_good + c.perspective_partly) / c.eval_count;
  if (good >= 0.6) return '잘 설명함';
  if (partlyOrBetter >= 0.6) return '일부 설명함';
  return '설명이 부족함';
}

const keys = {
  claims: (agendaId: string, issueId: string | null) => ['agendas', 'claims', agendaId, issueId ?? 'all'] as const,
  similar: (agendaId: string, issueId: string | null, text: string) =>
    ['agendas', 'similar-claims', agendaId, issueId ?? 'all', text] as const,
  engagement: (agendaId: string) => ['agendas', 'engagement', agendaId] as const,
  adminClaims: (agendaId: string) => ['agendas', 'admin-claims', agendaId] as const,
};

/** RPC 응답의 error 코드를 예외로. 로그인 필요는 LoginRequiredError 로 (useLoginPrompt 가 로그인 창을 띄움) */
function throwIfError(res: unknown) {
  const code = (res as { error?: string } | null)?.error;
  if (code === 'login_required') throw new LoginRequiredError();
  if (code) throw new Error(code);
}

// ─────────────────────────────────────────────────────────────
// 주장 목록 · 비슷한 주장
// ─────────────────────────────────────────────────────────────
export function useAgendaClaims(agendaId: string | undefined, issueId: string | null = null) {
  return useQuery({
    queryKey: keys.claims(agendaId ?? '', issueId),
    enabled: !!agendaId,
    queryFn: async (): Promise<AgendaClaimsResult> => {
      const { data, error } = await supabase.rpc('get_agenda_claims', {
        p_agenda_id: agendaId!,
        p_issue_id: issueId,
      });
      if (error) throw error;
      return (data as unknown as AgendaClaimsResult) ?? { enabled: false };
    },
  });
}

/** 입력이 잠시 멈춘 뒤의 값 */
export function useDebouncedValue<T>(value: T, ms = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** 쓰는 중인 주장과 비슷한 기존 주장 (최대 3개). 5자 미만이면 조회하지 않음 */
export function useSimilarClaims(agendaId: string | undefined, issueId: string | null, text: string) {
  const q = useDebouncedValue(text.trim(), 400);
  return useQuery({
    queryKey: keys.similar(agendaId ?? '', issueId, q),
    enabled: !!agendaId && q.length >= CLAIM_MIN,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('find_similar_claims', {
        p_agenda_id: agendaId!,
        p_issue_id: issueId,
        p_text: q,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────
// 고르기 · 쓰기 · 지우기 · 평가
// ─────────────────────────────────────────────────────────────
function useInvalidateClaims() {
  const qc = useQueryClient();
  return (agendaId: string) => {
    qc.invalidateQueries({ queryKey: ['agendas', 'claims', agendaId] });
    qc.invalidateQueries({ queryKey: ['agendas', 'similar-claims', agendaId] });
  };
}

export function usePickClaim() {
  const invalidate = useInvalidateClaims();
  return useMutation({
    mutationFn: async (input: { agendaId: string; claimId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('pick_claim', {
        p_claim_id: input.claimId,
        p_reason: input.reason?.trim() ?? '',
      });
      if (error) {
        // 비로그인은 함수 실행 권한이 없어 여기로 온다
        if (error.code === '42501') throw new LoginRequiredError();
        throw error;
      }
      throwIfError(data);
    },
    onSuccess: (_d, input) => invalidate(input.agendaId),
  });
}

export function usePostClaim() {
  const invalidate = useInvalidateClaims();
  return useMutation({
    mutationFn: async (input: {
      agendaId: string;
      issueId: string | null;
      body: string;
      reason?: string;
      counter?: string;
      sources?: string[];
    }) => {
      const { data, error } = await supabase.rpc('post_claim', {
        p_agenda_id: input.agendaId,
        p_issue_id: input.issueId,
        p_body: input.body.trim(),
        p_reason: input.reason?.trim() ?? '',
        p_counter: input.counter?.trim() ?? '',
        p_sources: (input.sources ?? []).map((s) => s.trim()).filter(Boolean),
      });
      if (error) {
        if (error.code === '42501') throw new LoginRequiredError();
        throw error;
      }
      throwIfError(data);
      return (data as unknown as { id: string }).id;
    },
    onSuccess: (_id, input) => invalidate(input.agendaId),
  });
}

export function useDeleteMyClaim() {
  const invalidate = useInvalidateClaims();
  return useMutation({
    mutationFn: async (input: { agendaId: string; claimId: string }) => {
      const { data, error } = await supabase.rpc('delete_my_claim', { p_claim_id: input.claimId });
      if (error) throw error;
      throwIfError(data);
    },
    onSuccess: (_d, input) => invalidate(input.agendaId),
  });
}

export function useEvaluateClaim() {
  const invalidate = useInvalidateClaims();
  return useMutation({
    mutationFn: async (input: {
      agendaId: string;
      claimId: string;
      evidence: EvidenceRating;
      perspective: PerspectiveRating;
    }) => {
      const { data, error } = await supabase.rpc('evaluate_claim', {
        p_claim_id: input.claimId,
        p_evidence: input.evidence,
        p_perspective: input.perspective,
      });
      if (error) {
        if (error.code === '42501') throw new LoginRequiredError();
        throw error;
      }
      throwIfError(data);
    },
    onSuccess: (_d, input) => invalidate(input.agendaId),
  });
}

// ─────────────────────────────────────────────────────────────
// 관심 의제 · 읽은 사람
// ─────────────────────────────────────────────────────────────
export interface AgendaEngagement {
  viewers: number | null; // 50명 미만이면 null (숫자를 보여 주지 않음)
  interested: number;
  my_interest: boolean;
}

export function useAgendaEngagement(agendaId: string | undefined) {
  return useQuery({
    queryKey: keys.engagement(agendaId ?? ''),
    enabled: !!agendaId,
    queryFn: async (): Promise<AgendaEngagement | null> => {
      const { data, error } = await supabase.rpc('get_agenda_engagement', { p_agenda_id: agendaId! });
      if (error) throw error;
      const res = data as unknown as AgendaEngagement & { error?: string };
      if (res?.error) return null;
      return res;
    },
  });
}

export function useToggleAgendaInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agendaId: string) => {
      const { data, error } = await supabase.rpc('toggle_agenda_interest', { p_agenda_id: agendaId });
      if (error) {
        if (error.code === '42501') throw new LoginRequiredError();
        throw error;
      }
      throwIfError(data);
      return (data as unknown as { interested: boolean }).interested;
    },
    // 누르자마자 바뀌어 보이게 (실패하면 되돌림)
    onMutate: async (agendaId) => {
      const key = keys.engagement(agendaId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AgendaEngagement | null>(key);
      if (prev) {
        qc.setQueryData<AgendaEngagement>(key, {
          ...prev,
          my_interest: !prev.my_interest,
          interested: prev.interested + (prev.my_interest ? -1 : 1),
        });
      }
      return { prev };
    },
    onError: (_e, agendaId, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.engagement(agendaId), ctx.prev);
    },
    onSettled: (_d, _e, agendaId) => qc.invalidateQueries({ queryKey: keys.engagement(agendaId) }),
  });
}

const CLIENT_ID_KEY = 'minsim-client-id';

/** 비로그인 '읽은 사람' 집계용 기기 id. 개인정보가 아닌 임의 값이고, 저장할 수 없는 환경이면 세지 않는다 */
function getClientId(): string | null {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** 의제 상세를 열면 한 번 '읽음'으로 센다 (같은 사람·기기는 한 번만) */
export function useRecordAgendaView(agendaId: string | undefined) {
  useEffect(() => {
    if (!agendaId) return;
    supabase
      .rpc('record_agenda_view', { p_agenda_id: agendaId, p_client_id: getClientId() })
      .then(({ error }) => {
        if (error) console.warn('record_agenda_view failed', error.message);
      });
  }, [agendaId]);
}

// ─────────────────────────────────────────────────────────────
// 관리자
// ─────────────────────────────────────────────────────────────
/** 관리자: 의제의 모든 주장 (숨김 포함, 작성자 id 포함) */
export function useAdminClaims(agendaId: string | undefined) {
  return useQuery({
    queryKey: keys.adminClaims(agendaId ?? ''),
    enabled: !!agendaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_claims')
        .select('*')
        .eq('agenda_id', agendaId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateClaimStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agendaId: string; claimId: string; status: ClaimStatus }) => {
      const { error } = await supabase.from('agenda_claims').update({ status: input.status }).eq('id', input.claimId);
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: keys.adminClaims(input.agendaId) });
      qc.invalidateQueries({ queryKey: ['agendas', 'claims', input.agendaId] });
    },
  });
}

export function useImportIssueCardsAsClaims() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agendaId: string) => {
      const { data, error } = await supabase.rpc('import_issue_cards_as_claims', { p_agenda_id: agendaId });
      if (error) throw error;
      throwIfError(data);
      return (data as unknown as { imported: number }).imported;
    },
    onSuccess: (_n, agendaId) => {
      qc.invalidateQueries({ queryKey: keys.adminClaims(agendaId) });
      qc.invalidateQueries({ queryKey: ['agendas', 'claims', agendaId] });
    },
  });
}
