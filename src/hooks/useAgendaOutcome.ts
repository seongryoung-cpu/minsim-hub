import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 공론 결과 카드 (마감된 의제의 쟁점 지도). 계산은 서버 함수 get_agenda_outcome.
 * 기준값(rules)은 서버가 함께 내려 준다 — 화면 문구도 그 값을 쓴다.
 */
export interface OutcomeStatement {
  id: string;
  body: string;
  /** 찬성한 사람 중 이 문장에 동의한 비율 (0~1) */
  agree_side: number;
  /** 비동의한 쪽 중 이 문장에 동의한 비율 (0~1) */
  disagree_side: number;
  n_agree_side: number;
  n_disagree_side: number;
}

export interface OutcomeCondition {
  id: string;
  label: string;
  /** 조건 질문에 답한 사람 중 이 조건을 고른 비율 (0~1) */
  share: number;
  n: number;
}

export interface AgendaOutcome {
  available: boolean;
  reason?: 'not_found' | 'open' | 'quiet' | 'few';
  status?: string;
  participants?: number;
  final_participants?: number;
  distribution?: { agree: number; disagree: number; hold: number };
  changed?: number;
  changed_base?: number;
  common?: OutcomeStatement[];
  divisive?: OutcomeStatement[];
  conditions?: OutcomeCondition[];
  conditions_answered?: number;
  rules?: { min_final: number; min_group: number; common: number; divide: number };
}

export function useAgendaOutcome(agendaId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['agendas', 'outcome', agendaId ?? ''],
    enabled: !!agendaId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agenda_outcome', { p_agenda_id: agendaId! });
      if (error) throw error;
      return data as unknown as AgendaOutcome;
    },
    staleTime: 5 * 60_000,
  });
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
