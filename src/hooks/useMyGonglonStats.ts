import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface MyGonglonStats {
  agendas: number;
  changed: number;
  statements: number;
  needs_final: number;
  needs_final_agenda_id: string | null;
}

/** 마이 '나의 공론' 숫자. 로그인했을 때만 불러온다. */
export function useMyGonglonStats() {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['my-gonglon-stats', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<MyGonglonStats | null> => {
      const { data, error } = await supabase.rpc('get_my_gonglon_stats');
      if (error) throw error;
      return (data as unknown as MyGonglonStats) ?? null;
    },
  });
}
