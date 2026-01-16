import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'signup'
  | 'quiz_complete'
  | 'policy_match_complete'
  | 'candidate_follow'
  | 'candidate_unfollow'
  | 'profile_update'
  | 'identity_verify';

interface LogActivityParams {
  activityType: ActivityType;
  description: string;
  metadata?: Json;
}

export async function logActivity({ activityType, description, metadata = {} as Json }: LogActivityParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('activity_logs')
      .insert([{
        user_id: user?.id || null,
        activity_type: activityType,
        description,
        metadata,
      }]);
  } catch (error) {
    // Silently fail - logging should not break the app
    console.error('Failed to log activity:', error);
  }
}
