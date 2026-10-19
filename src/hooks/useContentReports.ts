import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 공론 글 신고 (주장 · 한 줄 의견)
 * - 신고만으로 자동으로 숨기지 않는다. 운영진이 확인해 숨김/유지를 정한다 (몰아 신고 악용 방지)
 * - 한 사람이 같은 글은 한 번만, 하루 20건까지 (서버에서 막음)
 */
export type ReportKind = 'claim' | 'statement';
export type ReportReason = 'abuse' | 'defamation' | 'privacy' | 'spam' | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'abuse', label: '욕설·비하', hint: '특정 사람이나 집단을 모욕하거나 비하해요' },
  { value: 'defamation', label: '명예훼손·허위 사실', hint: '사실이 아닌 내용으로 누군가를 깎아내려요' },
  { value: 'privacy', label: '개인정보 노출', hint: '이름·연락처·주소 같은 정보가 들어 있어요' },
  { value: 'spam', label: '광고·도배', hint: '의제와 상관없는 홍보나 같은 글 반복이에요' },
  { value: 'other', label: '그 밖의 문제', hint: '설명란에 적어 주세요' },
];
export const REASON_LABELS: Record<ReportReason, string> = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<ReportReason, string>;

export class ReportError extends Error {}

export function useReportContent() {
  return useMutation({
    mutationFn: async (v: { kind: ReportKind; id: string; reason: ReportReason; note: string }) => {
      const { data, error } = await supabase.rpc('report_content', {
        p_kind: v.kind,
        p_id: v.id,
        p_reason: v.reason,
        p_note: v.note.trim(),
      });
      if (error) throw error;
      const r = data as { ok?: boolean; already?: boolean; error?: string };
      if (r?.error) throw new ReportError(r.error);
      return { already: !!r?.already };
    },
  });
}

export interface ReportQueueItem {
  target_kind: ReportKind;
  target_id: string;
  agenda_id: string;
  agenda_title: string;
  body: string | null;
  is_hidden: boolean;
  author: string;
  open_count: number;
  total_count: number;
  last_at: string;
  last_resolution: 'hidden' | 'kept' | null;
  reasons: Partial<Record<ReportReason, number>> | null;
  notes: string[];
}

const QUEUE_KEY = ['admin-report-queue'] as const;

export function useAdminReportQueue(includeResolved: boolean) {
  return useQuery({
    queryKey: [...QUEUE_KEY, includeResolved],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_report_queue', { p_include_resolved: includeResolved });
      if (error) throw error;
      return (data ?? []) as unknown as ReportQueueItem[];
    },
  });
}

export function useOpenReportCount(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-open-report-count'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_open_report_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    staleTime: 60_000,
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { kind: ReportKind; id: string; action: 'hide' | 'keep' }) => {
      const { data, error } = await supabase.rpc('admin_resolve_report', { p_kind: v.kind, p_id: v.id, p_action: v.action });
      if (error) throw error;
      const r = data as { error?: string };
      if (r?.error) throw new Error(r.error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUEUE_KEY });
      void qc.invalidateQueries({ queryKey: ['admin-open-report-count'] });
      void qc.invalidateQueries({ queryKey: ['agendas', 'statements'] });
      void qc.invalidateQueries({ queryKey: ['agendas', 'claims'] });
    },
  });
}
