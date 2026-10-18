import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useElectionSchedule } from '@/hooks/useElections';
import { getAppModeState, type AppModeSetting } from '@/lib/appMode';
export { resolveAppMode, type AppModeSetting, type AppMode } from '@/lib/appMode';

export const APP_MODE_OPTIONS: { value: AppModeSetting; label: string; desc: string }[] = [
  { value: 'auto', label: '자동', desc: '선거일이 지나면 평상시 모드로 바뀝니다' },
  { value: 'election', label: '선거 모드', desc: '선거 진행 단계·후보·투표소 안내 중심' },
  { value: 'normal', label: '평상시 모드', desc: '당선인·공론·지난 선거 결과 중심' },
];

/** 관리자 설정 app_mode(자동/선거/평상시)를 실제 화면 모드로 바꿔 준다 */
export function useAppMode() {
  const schedule = useElectionSchedule();
  const query = useQuery({
    queryKey: ['app-setting', 'app_mode'],
    queryFn: async (): Promise<AppModeSetting> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_mode')
        .maybeSingle();
      if (error) throw error;
      const v = data?.value;
      return v === 'election' || v === 'normal' ? v : 'auto';
    },
    staleTime: 5 * 60_000,
  });
  const state = getAppModeState(
    query.data,
    schedule.dDay != null && Number.isFinite(schedule.dDay) ? schedule.isOver : null,
    query.isError,
    schedule.isError,
    schedule.isLoading,
  );
  return {
    ...state,
    retry: () => {
      void query.refetch();
      if (query.data === 'auto' || query.data === undefined) void schedule.refetch();
    },
  };
}
