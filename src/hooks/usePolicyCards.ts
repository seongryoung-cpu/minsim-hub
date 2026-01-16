import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PolicyCard } from '@/types/policy';

// DB 타입 정의
interface DBPolicyCard {
  id: string;
  category: string;
  statement: string;
  left_label: string;
  right_label: string;
  region_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DBPolicyAlignment {
  id: string;
  policy_card_id: string;
  candidate_id: string;
  stance: 'agree' | 'disagree' | 'neutral';
  intensity: number;
  created_at: string;
  updated_at: string;
}

// DB 데이터를 앱 타입으로 변환
function transformToPolicyCard(
  dbCard: DBPolicyCard,
  alignments: DBPolicyAlignment[]
): PolicyCard {
  return {
    id: dbCard.id,
    category: dbCard.category,
    statement: dbCard.statement,
    leftLabel: dbCard.left_label,
    rightLabel: dbCard.right_label,
    candidateAlignment: alignments.map(a => ({
      candidateId: a.candidate_id,
      stance: a.stance,
      intensity: a.intensity,
    })),
  };
}

// 정책 카드 목록 조회 (지역별 필터링)
export function usePolicyCards(regionName?: string) {
  return useQuery({
    queryKey: ['policy-cards', regionName],
    queryFn: async (): Promise<PolicyCard[]> => {
      // 정책 카드 조회
      let cardsQuery = supabase
        .from('policy_cards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // 지역 필터링 (전국 + 해당 지역)
      if (regionName) {
        cardsQuery = cardsQuery.or(`region_name.eq.전국,region_name.eq.${regionName}`);
      }

      const { data: cards, error: cardsError } = await cardsQuery;

      if (cardsError) throw cardsError;
      if (!cards || cards.length === 0) return [];

      // 정책 입장 조회
      const cardIds = cards.map(c => c.id);
      const { data: alignments, error: alignmentsError } = await supabase
        .from('policy_candidate_alignments')
        .select('*')
        .in('policy_card_id', cardIds);

      if (alignmentsError) throw alignmentsError;

      // 데이터 변환
      return cards.map(card => 
        transformToPolicyCard(
          card as DBPolicyCard,
          (alignments || []).filter(a => a.policy_card_id === card.id) as DBPolicyAlignment[]
        )
      );
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// 관리자용: 모든 정책 카드 조회 (비활성 포함)
export function useAllPolicyCardsAdmin() {
  return useQuery({
    queryKey: ['policy-cards-admin'],
    queryFn: async () => {
      const { data: cards, error: cardsError } = await supabase
        .from('policy_cards')
        .select('*')
        .order('region_name', { ascending: true })
        .order('sort_order', { ascending: true });

      if (cardsError) throw cardsError;
      
      // 정책 입장도 함께 조회
      const cardIds = (cards || []).map(c => c.id);
      let alignments: DBPolicyAlignment[] = [];
      
      if (cardIds.length > 0) {
        const { data: alignData, error: alignError } = await supabase
          .from('policy_candidate_alignments')
          .select('*')
          .in('policy_card_id', cardIds);

        if (alignError) throw alignError;
        alignments = (alignData || []) as DBPolicyAlignment[];
      }

      return {
        cards: (cards || []) as DBPolicyCard[],
        alignments,
      };
    },
  });
}

// 정책 카드 생성
export function useCreatePolicyCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category: string;
      statement: string;
      left_label: string;
      right_label: string;
      region_name: string;
      sort_order?: number;
      is_active?: boolean;
    }) => {
      const { data: card, error } = await supabase
        .from('policy_cards')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-cards'] });
      queryClient.invalidateQueries({ queryKey: ['policy-cards-admin'] });
    },
  });
}

// 정책 카드 수정
export function useUpdatePolicyCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...data 
    }: {
      id: string;
      category?: string;
      statement?: string;
      left_label?: string;
      right_label?: string;
      region_name?: string;
      sort_order?: number;
      is_active?: boolean;
    }) => {
      const { data: card, error } = await supabase
        .from('policy_cards')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-cards'] });
      queryClient.invalidateQueries({ queryKey: ['policy-cards-admin'] });
    },
  });
}

// 정책 카드 삭제
export function useDeletePolicyCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('policy_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-cards'] });
      queryClient.invalidateQueries({ queryKey: ['policy-cards-admin'] });
    },
  });
}

// 후보자 정책 입장 저장/수정
export function useSavePolicyAlignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      policy_card_id: string;
      candidate_id: string;
      stance: 'agree' | 'disagree' | 'neutral';
      intensity: number;
    }) => {
      // upsert로 저장 (이미 있으면 수정, 없으면 생성)
      const { data: alignment, error } = await supabase
        .from('policy_candidate_alignments')
        .upsert(data, {
          onConflict: 'policy_card_id,candidate_id',
        })
        .select()
        .single();

      if (error) throw error;
      return alignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-cards'] });
      queryClient.invalidateQueries({ queryKey: ['policy-cards-admin'] });
    },
  });
}

// 후보자 정책 입장 삭제
export function useDeletePolicyAlignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      policyCardId, 
      candidateId 
    }: { 
      policyCardId: string; 
      candidateId: string;
    }) => {
      const { error } = await supabase
        .from('policy_candidate_alignments')
        .delete()
        .eq('policy_card_id', policyCardId)
        .eq('candidate_id', candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-cards'] });
      queryClient.invalidateQueries({ queryKey: ['policy-cards-admin'] });
    },
  });
}

// 정책 카테고리 목록 조회
export function usePolicyCategories() {
  return useQuery({
    queryKey: ['policy-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_cards')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;

      // 중복 제거
      const categories = [...new Set((data || []).map(d => d.category))];
      return categories.sort();
    },
    staleTime: 10 * 60 * 1000, // 10분
  });
}
