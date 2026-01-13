import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id: string;
  total_points: number;
  current_streak: number;
  total_quizzes: number;
  correct_answers: number;
  display_name: string | null;
  avatar_url: string | null;
  region_sido: string | null;
}

export function useLeaderboard(type: 'all' | 'weekly' = 'all') {
  return useQuery({
    queryKey: ['leaderboard', type],
    queryFn: async () => {
      // Use the secure leaderboard_view instead of direct table access
      let query = supabase
        .from('leaderboard_view')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50);

      if (type === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('updated_at', weekAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as LeaderboardEntry[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useMyRank() {
  return useQuery({
    queryKey: ['my-rank'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get my stats
      const { data: myStats, error: myStatsError } = await supabase
        .from('quiz_stats')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (myStatsError) throw myStatsError;
      if (!myStats) return null;

      // Count users with more points using the view (doesn't expose user_id)
      const { count, error: countError } = await supabase
        .from('leaderboard_view')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', myStats.total_points);

      if (countError) throw countError;

      // Get total users count
      const { count: totalCount, error: totalError } = await supabase
        .from('leaderboard_view')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      return {
        rank: (count || 0) + 1,
        totalUsers: totalCount || 0,
        totalPoints: myStats.total_points,
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
