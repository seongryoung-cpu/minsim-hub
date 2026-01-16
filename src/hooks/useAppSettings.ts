import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  contact_email: string;
  contact_phone: string;
  social_x: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  link_privacy: string;
  link_terms: string;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');

        if (error) throw error;

        const settingsMap: Record<string, string> = {};
        data?.forEach((item) => {
          settingsMap[item.key] = item.value || '';
        });

        setSettings({
          contact_email: settingsMap.contact_email || '',
          contact_phone: settingsMap.contact_phone || '',
          social_x: settingsMap.social_x || '',
          social_facebook: settingsMap.social_facebook || '',
          social_instagram: settingsMap.social_instagram || '',
          social_youtube: settingsMap.social_youtube || '',
          link_privacy: settingsMap.link_privacy || '',
          link_terms: settingsMap.link_terms || '',
        });
      } catch (error) {
        console.error('Failed to fetch app settings:', error);
      }

      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
}
