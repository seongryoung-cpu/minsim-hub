import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Region } from '@/types/region';

/**
 * 공론 의제의 '관련 법안' (열린국회정보).
 *  - 시민 화면: get_agenda_bills (승인된 요약만, 우리 지역 의원 표결 포함)
 *  - 관리자: Edge Function assembly-bills (검색·연결·다시 가져오기·요약 초안) + agenda_bills 직접 수정
 */

export type BillStage =
  | 'proposed' | 'committee' | 'committee_done' | 'judiciary' | 'plenary_passed' | 'transferred'
  | 'promulgated' | 'merged' | 'discarded' | 'withdrawn' | 'rejected' | 'expired';

export const STAGE_LABELS: Record<BillStage, string> = {
  proposed: '발의',
  committee: '위원회 심사 중',
  committee_done: '위원회 통과',
  judiciary: '법제사법위원회 통과',
  plenary_passed: '본회의 통과',
  transferred: '정부 이송',
  promulgated: '공포',
  merged: '다른 법안에 합쳐져 반영',
  discarded: '폐기',
  withdrawn: '철회',
  rejected: '부결',
  expired: '임기 만료로 폐기',
};

/** 진행 막대에 쓰는 정상 경로 (끝난 법안은 마지막 단계가 결말 표시로 바뀐다) */
export const STAGE_PATH: BillStage[] = ['proposed', 'committee', 'committee_done', 'judiciary', 'plenary_passed', 'promulgated'];
export const ENDED_STAGES: BillStage[] = ['merged', 'discarded', 'withdrawn', 'rejected', 'expired', 'promulgated'];

/** 22대 국회 임기 종료일 (계류 법안 자동 폐기 기준). 제22대 국회 임기 2024-05-30 ~ 2028-05-29 */
export const TERM_END = '2028-05-29';

export interface LocalVote {
  name: string;
  party: string | null;
  district: string | null;
  vote: string;
}
export interface AgendaBill {
  bill_id: string;
  bill_no: string | null;
  bill_name: string;
  proposer: string | null;
  rst_proposer: string | null;
  committee: string | null;
  stage: BillStage;
  stage_changed_on: string | null;
  propose_dt: string | null;
  committee_dt: string | null;
  proc_result: string | null;
  detail_link: string | null;
  synced_at: string;
  vote: { member_total: number; total: number; yes: number; no: number; blank: number; date: string | null } | null;
  plain: { what: string | null; who: string | null; when: string | null } | null;
  events: { stage: BillStage; on: string | null }[];
  local_votes: LocalVote[];
  my_alert: boolean;
  alert_count: number;
}

// 앱 시·도 이름 → 국회 선거구 앞머리 (통합 지역명 포함)
const SIDO_PREFIX: Record<string, string[]> = {
  서울특별시: ['서울'],
  부산광역시: ['부산'],
  대구광역시: ['대구'],
  인천광역시: ['인천'],
  광주광역시: ['광주', '전남광주통합특별시'],
  대전광역시: ['대전'],
  울산광역시: ['울산'],
  세종특별자치시: ['세종', '세종특별자치시'],
  경기도: ['경기'],
  강원특별자치도: ['강원'],
  충청북도: ['충북'],
  충청남도: ['충남'],
  전북특별자치도: ['전북'],
  전라남도: ['전남', '전남광주통합특별시'],
  경상북도: ['경북'],
  경상남도: ['경남'],
  제주특별자치도: ['제주'],
};

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export const todayKst = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

const keys = {
  list: (agendaId: string, districts: string[]) => ['agenda-bills', agendaId, districts.join('|')] as const,
  admin: (agendaId: string) => ['agenda-bills-admin', agendaId] as const,
};

/** 우리 지역 선거구 이름 (표결 기록에 있는 것 중) */
export function useLocalDistricts(region: Region | null | undefined) {
  const prefixes = region?.sido ? SIDO_PREFIX[region.sido] ?? [] : [];
  const sigungu = region?.sigungu && region.sigungu !== '전체' ? region.sigungu : '';
  return useQuery({
    queryKey: ['assembly-districts', prefixes.join('|'), sigungu],
    enabled: prefixes.length > 0 && !!sigungu,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('assembly_districts_for', { p_prefixes: prefixes, p_sigungu: sigungu });
      if (error) throw error;
      return (data ?? []) as string[];
    },
    staleTime: 60 * 60_000,
  });
}

export function useAgendaBills(agendaId: string | undefined, districts: string[]) {
  return useQuery({
    queryKey: keys.list(agendaId ?? '', districts),
    enabled: !!agendaId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agenda_bills', { p_agenda_id: agendaId!, p_districts: districts });
      if (error) throw error;
      return (data ?? []) as unknown as AgendaBill[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useToggleBillAlert(agendaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (billId: string) => {
      const { data, error } = await supabase.rpc('toggle_bill_alert', { p_bill_id: billId });
      if (error) throw new Error(error.message.includes('login_required') ? 'login_required' : error.message);
      return data as boolean;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda-bills', agendaId] }),
  });
}

// ─────────────────────────────────────────────────────────────
// 관리자
// ─────────────────────────────────────────────────────────────
export interface BillSearchResult {
  bill_id: string;
  bill_no: string | null;
  bill_name: string;
  proposer: string | null;
  proposer_kind: string | null;
  committee: string | null;
  propose_dt: string | null;
  proc_result: string | null;
  pass_gubun: string | null;
}

async function callAssembly<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('assembly-bills', { body });
  if (error) {
    // 함수가 돌려준 오류 메시지를 꺼낸다
    const ctx = (error as { context?: Response }).context;
    let msg = error.message;
    try { msg = (await ctx?.json())?.error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function useSearchBills() {
  return useMutation({
    mutationFn: (q: string) => callAssembly<{ bills: BillSearchResult[] }>({ action: 'search', q }).then((r) => r.bills),
  });
}

export interface AdminAgendaBill {
  id: string;
  agenda_id: string;
  bill_id: string;
  sort_order: number;
  plain_what: string | null;
  plain_who: string | null;
  plain_when: string | null;
  plain_approved_at: string | null;
  plain_draft: { what?: string; who?: string; when?: string; read_reason?: boolean; at?: string } | null;
  assembly_bills: {
    bill_name: string;
    bill_no: string | null;
    proposer: string | null;
    rst_proposer: string | null;
    committee: string | null;
    stage: BillStage;
    detail_link: string | null;
    synced_at: string;
  } | null;
}

export function useAdminAgendaBills(agendaId: string) {
  return useQuery({
    queryKey: keys.admin(agendaId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_bills')
        .select('id, agenda_id, bill_id, sort_order, plain_what, plain_who, plain_when, plain_approved_at, plain_draft, assembly_bills(bill_name, bill_no, proposer, rst_proposer, committee, stage, detail_link, synced_at)')
        .eq('agenda_id', agendaId)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as AdminAgendaBill[];
    },
  });
}

function useInvalidateBills(agendaId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: keys.admin(agendaId) });
    void qc.invalidateQueries({ queryKey: ['agenda-bills', agendaId] });
  };
}

export function useLinkBill(agendaId: string) {
  const done = useInvalidateBills(agendaId);
  return useMutation({
    mutationFn: (billId: string) => callAssembly({ action: 'link', agenda_id: agendaId, bill_id: billId }),
    onSuccess: done,
  });
}

export function useRefreshBill(agendaId: string) {
  const done = useInvalidateBills(agendaId);
  return useMutation({
    mutationFn: (billId: string) => callAssembly({ action: 'refresh', bill_id: billId }),
    onSuccess: done,
  });
}

export function useSummarizeBill(agendaId: string) {
  const done = useInvalidateBills(agendaId);
  return useMutation({
    mutationFn: (agendaBillId: string) => callAssembly({ action: 'summarize', agenda_bill_id: agendaBillId }),
    onSuccess: done,
  });
}

export function useSavePlainSummary(agendaId: string) {
  const done = useInvalidateBills(agendaId);
  return useMutation({
    mutationFn: async (v: { id: string; what: string; who: string; when: string; approve: boolean }) => {
      const { error } = await supabase
        .from('agenda_bills')
        .update({
          plain_what: v.what.trim() || null,
          plain_who: v.who.trim() || null,
          plain_when: v.when.trim() || null,
          plain_approved_at: v.approve ? new Date().toISOString() : null,
        })
        .eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: done,
  });
}

export function useUnlinkBill(agendaId: string) {
  const done = useInvalidateBills(agendaId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agenda_bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: done,
  });
}
