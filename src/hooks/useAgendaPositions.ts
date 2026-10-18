import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

/**
 * 공론 '관련 인물 입장' (운영진 입력).
 * - 정렬: 이 의제에 대한 권한 순서 → 같은 순서 안에서는 최근 발언 먼저 (화면의 ? 설명과 같아야 함)
 * - 민심잇다는 찬반으로 분류하지 않는다. 발언 요지 + 원문 출처만.
 * - 선거 조용 모드에서는 서버(RLS)가 일반 사용자에게 내려 주지 않는다.
 */
export type AgendaPosition = Tables<'agenda_positions'>;
export type PositionRoleKind = 'bill_sponsor' | 'committee' | 'local_head' | 'party_leader' | 'other';
export type PositionSourceKind = 'minutes' | 'press' | 'sns' | 'news';

export const ROLE_ORDER: PositionRoleKind[] = ['bill_sponsor', 'committee', 'local_head', 'party_leader', 'other'];

export const ROLE_KIND_LABELS: Record<PositionRoleKind, string> = {
  bill_sponsor: '관련 법안 대표발의자',
  committee: '소관 위원회 위원장·위원',
  local_head: '관할 단체장',
  party_leader: '정당 지도부',
  other: '그 밖의 인물',
};

export const SOURCE_KIND_LABELS: Record<PositionSourceKind, string> = {
  minutes: '회의록',
  press: '보도자료',
  sns: '공식 SNS',
  news: '기사 인용',
};

export function sortPositions(list: AgendaPosition[]) {
  const rank = (k: string) => {
    const i = ROLE_ORDER.indexOf(k as PositionRoleKind);
    return i === -1 ? ROLE_ORDER.length : i;
  };
  return [...list].sort((a, b) => rank(a.role_kind) - rank(b.role_kind) || b.spoken_on.localeCompare(a.spoken_on));
}

const key = (agendaId: string) => ['agenda-positions', agendaId] as const;

export function useAgendaPositions(agendaId: string | undefined) {
  return useQuery({
    queryKey: key(agendaId ?? ''),
    enabled: !!agendaId,
    queryFn: async () => {
      const { data, error } = await supabase.from('agenda_positions').select('*').eq('agenda_id', agendaId!);
      if (error) throw error;
      return sortPositions(data ?? []);
    },
    staleTime: 5 * 60_000,
  });
}

export type PositionForm = Omit<TablesInsert<'agenda_positions'>, 'created_by' | 'created_at' | 'updated_at'>;

export function useSavePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: PositionForm) => {
      const row = {
        ...form,
        person_name: form.person_name.trim(),
        role_label: form.role_label.trim(),
        party: form.party?.trim() || null,
        summary: form.summary.trim(),
        source_url: form.source_url.trim(),
      };
      const { error } = form.id
        ? await supabase.from('agenda_positions').update(row).eq('id', form.id)
        : await supabase.from('agenda_positions').insert(row);
      if (error) throw error;
    },
    onSuccess: (_d, form) => qc.invalidateQueries({ queryKey: key(form.agenda_id) }),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; agendaId: string }) => {
      const { error } = await supabase.from('agenda_positions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: key(v.agendaId) }),
  });
}
