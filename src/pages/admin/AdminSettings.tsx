import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Save, Loader2, Mail, Phone, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSettings {
  contact_email: string;
  contact_phone: string;
  social_x: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
}

export function AdminSettings() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    contact_email: '',
    contact_phone: '',
    social_x: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!isAdmin) return;

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
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('설정을 불러오지 못했습니다');
      }

      setIsLoading(false);
    };

    fetchSettings();
  }, [isAdmin]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: update.value })
          .eq('key', update.key);

        if (error) throw error;
      }

      toast.success('설정이 저장되었습니다');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('저장에 실패했습니다');
    }

    setIsSaving(false);
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const settingsFields = [
    { key: 'contact_email', label: '이메일', icon: Mail, placeholder: 'contact@example.com', type: 'email' },
    { key: 'contact_phone', label: '전화번호', icon: Phone, placeholder: '02-1234-5678', type: 'tel' },
    { key: 'social_x', label: 'X (트위터)', icon: Twitter, placeholder: 'https://x.com/username', type: 'url' },
    { key: 'social_facebook', label: '페이스북', icon: Facebook, placeholder: 'https://facebook.com/page', type: 'url' },
    { key: 'social_instagram', label: '인스타그램', icon: Instagram, placeholder: 'https://instagram.com/username', type: 'url' },
    { key: 'social_youtube', label: '유튜브', icon: Youtube, placeholder: 'https://youtube.com/@channel', type: 'url' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/admin')} className="p-1 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <Settings size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">시스템 설정</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-20">
        {/* Contact & Social Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 shadow-app-md space-y-4"
        >
          <h2 className="font-semibold text-lg">연락처 & 소셜 미디어</h2>
          <p className="text-sm text-muted-foreground">
            앱에 표시될 연락처와 소셜 미디어 링크를 설정합니다.
          </p>

          <div className="space-y-4 pt-2">
            {settingsFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon size={16} className="text-muted-foreground" />
                    {field.label}
                  </label>
                  <Input
                    type={field.type}
                    value={settings[field.key as keyof AppSettings]}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))}
                    placeholder={field.placeholder}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save size={18} className="mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
