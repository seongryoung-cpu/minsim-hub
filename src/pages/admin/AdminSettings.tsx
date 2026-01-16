import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Save, Loader2, Mail, Phone, Twitter, Facebook, Instagram, Youtube, FileText, Shield, Info, Tag, Hash, ImageIcon, Upload, X, MousePointer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSettings {
  app_name: string;
  app_slogan: string;
  app_version: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  social_x: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  link_privacy: string;
  link_terms: string;
  enable_hover_animation: string;
}

export function AdminSettings() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>({
    app_name: '',
    app_slogan: '',
    app_version: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    social_x: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    link_privacy: '',
    link_terms: '',
    enable_hover_animation: 'true',
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
          app_name: settingsMap.app_name || '',
          app_slogan: settingsMap.app_slogan || '',
          app_version: settingsMap.app_version || '',
          logo_url: settingsMap.logo_url || '',
          contact_email: settingsMap.contact_email || '',
          contact_phone: settingsMap.contact_phone || '',
          social_x: settingsMap.social_x || '',
          social_facebook: settingsMap.social_facebook || '',
          social_instagram: settingsMap.social_instagram || '',
          social_youtube: settingsMap.social_youtube || '',
          link_privacy: settingsMap.link_privacy || '',
          link_terms: settingsMap.link_terms || '',
          enable_hover_animation: settingsMap.enable_hover_animation ?? 'true',
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('설정을 불러오지 못했습니다');
      }

      setIsLoading(false);
    };

    fetchSettings();
  }, [isAdmin]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('파일 크기는 2MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('로고가 업로드되었습니다');
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('로고 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_url: '' }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const entries = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      // Ensure rows exist for every key
      const keys = entries.map((e) => e.key);
      const { data: existing, error: existingError } = await supabase
        .from('app_settings')
        .select('key')
        .in('key', keys);

      if (existingError) throw existingError;

      const existingSet = new Set(existing?.map((r) => r.key) ?? []);
      const missing = entries.filter((e) => !existingSet.has(e.key));

      if (missing.length > 0) {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert(missing.map((m) => ({ key: m.key, value: m.value })));

        if (insertError) throw insertError;
      }

      const results = await Promise.all(
        entries.map(({ key, value }) =>
          supabase
            .from('app_settings')
            .update({ value })
            .eq('key', key)
        )
      );

      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      toast.success('설정이 저장되었습니다');

      // Re-fetch once to keep UI in sync
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (!error) {
        const settingsMap: Record<string, string> = {};
        data?.forEach((item) => {
          settingsMap[item.key] = item.value || '';
        });

        setSettings({
          app_name: settingsMap.app_name || '',
          app_slogan: settingsMap.app_slogan || '',
          app_version: settingsMap.app_version || '',
          logo_url: settingsMap.logo_url || '',
          contact_email: settingsMap.contact_email || '',
          contact_phone: settingsMap.contact_phone || '',
          social_x: settingsMap.social_x || '',
          social_facebook: settingsMap.social_facebook || '',
          social_instagram: settingsMap.social_instagram || '',
          social_youtube: settingsMap.social_youtube || '',
          link_privacy: settingsMap.link_privacy || '',
          link_terms: settingsMap.link_terms || '',
          enable_hover_animation: settingsMap.enable_hover_animation ?? 'true',
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const appInfoFields = [
    { key: 'app_name', label: '앱 이름', icon: Info, placeholder: '민심잇다', type: 'text' },
    { key: 'app_slogan', label: '슬로건', icon: Tag, placeholder: '나의 목소리가 정치가 되는 곳', type: 'text' },
    { key: 'app_version', label: '버전', icon: Hash, placeholder: '1.0.0', type: 'text' },
  ];

  const contactFields = [
    { key: 'contact_email', label: '이메일', icon: Mail, placeholder: 'contact@example.com', type: 'email' },
    { key: 'contact_phone', label: '전화번호', icon: Phone, placeholder: '02-1234-5678', type: 'tel' },
  ];

  const socialFields = [
    { key: 'social_x', label: 'X (트위터)', icon: Twitter, placeholder: 'https://x.com/username', type: 'url' },
    { key: 'social_facebook', label: '페이스북', icon: Facebook, placeholder: 'https://facebook.com/page', type: 'url' },
    { key: 'social_instagram', label: '인스타그램', icon: Instagram, placeholder: 'https://instagram.com/username', type: 'url' },
    { key: 'social_youtube', label: '유튜브', icon: Youtube, placeholder: 'https://youtube.com/@channel', type: 'url' },
  ];

  const legalFields = [
    { key: 'link_privacy', label: '개인정보처리방침', icon: Shield, placeholder: 'https://example.com/privacy', type: 'url' },
    { key: 'link_terms', label: '이용약관', icon: FileText, placeholder: 'https://example.com/terms', type: 'url' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/admin')} className="p-1 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <Settings size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">시스템 설정</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 md:p-6 shadow-app-md space-y-4 md:col-span-2"
          >
            <h2 className="font-semibold text-lg">로고 이미지</h2>
            <p className="text-sm text-muted-foreground">
              앱 로고 이미지를 업로드합니다. 권장 크기: 512x512px, 최대 2MB
            </p>
            
            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                  {settings.logo_url ? (
                    <img 
                      src={settings.logo_url} 
                      alt="App Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-muted-foreground" />
                  )}
                </div>
                {settings.logo_url && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full md:w-auto"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload size={16} className="mr-2" />
                  )}
                  {isUploading ? '업로드 중...' : '이미지 선택'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP 형식 지원
                </p>
              </div>
            </div>
          </motion.div>

          {/* UI/UX Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-xl p-4 md:p-6 shadow-app-md space-y-4 md:col-span-2"
          >
            <h2 className="font-semibold text-lg">UI/UX 설정</h2>
            <p className="text-sm text-muted-foreground">
              사용자 인터페이스 관련 설정을 관리합니다.
            </p>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MousePointer size={20} className="text-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">호버 애니메이션</label>
                    <p className="text-xs text-muted-foreground">
                      후보자 카드 등에 마우스 호버 시 애니메이션 효과를 적용합니다
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_hover_animation === 'true'}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    enable_hover_animation: checked ? 'true' : 'false'
                  }))}
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 md:p-6 shadow-app-md space-y-4"
          >
            <h2 className="font-semibold text-lg">앱 정보</h2>
            <p className="text-sm text-muted-foreground">
              앱 이름, 슬로건, 버전 정보를 설정합니다.
            </p>
            <div className="space-y-4">
              {appInfoFields.map((field, index) => {
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

          {/* Contact Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 md:p-6 shadow-app-md space-y-4"
          >
            <h2 className="font-semibold text-lg">연락처</h2>
            <div className="space-y-4">
              {contactFields.map((field, index) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
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

          {/* Social Media Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 md:p-6 shadow-app-md space-y-4"
          >
            <h2 className="font-semibold text-lg">소셜 미디어</h2>
            <div className="space-y-4">
              {socialFields.map((field, index) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
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

          {/* Legal Links Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-4 md:p-6 shadow-app-md space-y-4"
          >
            <h2 className="font-semibold text-lg">법적 고지</h2>
            <p className="text-sm text-muted-foreground">
              개인정보처리방침과 이용약관 페이지 링크를 설정합니다.
            </p>
            <div className="space-y-4">
              {legalFields.map((field, index) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
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
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto md:min-w-[200px] h-12"
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
