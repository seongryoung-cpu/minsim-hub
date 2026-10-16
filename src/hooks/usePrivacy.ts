import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type NicknameCode = 'ok' | 'invalid' | 'reserved' | 'taken';

export const NICKNAME_RULE = '한글·영문·숫자·밑줄(_) 2~12자, 띄어쓰기 없이';

export const NICKNAME_MESSAGES: Record<Exclude<NicknameCode, 'ok'>, string> = {
  invalid: `${NICKNAME_RULE}로 정해 주세요.`,
  reserved: '운영진으로 오해될 수 있는 이름은 쓸 수 없어요.',
  taken: '이미 누가 쓰고 있는 닉네임이에요.',
};

/** 화면에 보일 공개 이름. 실명일 수 있는 display_name은 쓰지 않는다. */
export function publicName(profile: { nickname?: string | null } | null | undefined) {
  return profile?.nickname?.trim() || '시민';
}

export async function checkNickname(nickname: string): Promise<NicknameCode> {
  const { data, error } = await supabase.rpc('check_nickname', { p_nickname: nickname });
  if (error) throw error;
  return data as NicknameCode;
}

export function useSetNickname() {
  const { refreshProfile } = useAuthContext();
  return useMutation({
    mutationFn: async (nickname: string): Promise<NicknameCode> => {
      const { data, error } = await supabase.rpc('set_my_nickname', { p_nickname: nickname });
      if (error) throw error;
      return data as NicknameCode;
    },
    onSuccess: async (code) => {
      if (code === 'ok') await refreshProfile();
    },
  });
}

export function useAcceptRequiredTerms() {
  const { refreshProfile } = useAuthContext();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('accept_required_terms', { p_age14: true });
      if (error) throw error;
    },
    onSuccess: () => refreshProfile(),
  });
}

export interface ConsentResult {
  consent: boolean;
  deleted: { mbti: number; policy_match: number; spectrum: number; answers: number };
}

/** 정치 성향 결과 계정 저장 동의. 끄면 서버에 저장된 성향 결과가 지워진다. */
export function usePoliticalConsent() {
  const { profile, isAuthenticated, refreshProfile } = useAuthContext();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (on: boolean): Promise<ConsentResult> => {
      const { data, error } = await supabase.rpc('set_political_consent', { p_on: on });
      if (error) throw error;
      return data as unknown as ConsentResult;
    },
    onSuccess: async (res) => {
      await refreshProfile();
      if (!res.consent) {
        for (const key of ['mbti-results', 'policy-match-results', 'user-spectrum', 'spectrum-answers', 'political-data-count']) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    },
  });
  return {
    isAuthenticated,
    hasConsent: !!profile?.political_consent_at,
    setConsent: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/** 동의 없이(이 기능이 생기기 전에) 서버에 저장된 성향 결과 개수 */
export function usePoliticalDataCount(enabled: boolean) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['political-data-count', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_political_data_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: enabled && !!user,
  });
}
