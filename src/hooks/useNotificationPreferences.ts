import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  news_enabled: boolean;
  candidate_updates_enabled: boolean;
  quiz_enabled: boolean;
  policy_match_enabled: boolean;
  system_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  news_enabled: true,
  candidate_updates_enabled: true,
  quiz_enabled: true,
  policy_match_enabled: true,
  system_enabled: true,
};

export function useNotificationPreferences() {
  const { user, isAuthenticated } = useAuthContext();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchPreferences]);

  const updatePreference = useCallback(async (
    key: keyof Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    value: boolean
  ) => {
    if (!user || !preferences) return;

    setIsSaving(true);
    
    // Optimistic update
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification preference:', error);
      // Revert on error
      setPreferences(prev => prev ? { ...prev, [key]: !value } : null);
    } finally {
      setIsSaving(false);
    }
  }, [user, preferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    refetch: fetchPreferences,
  };
}
