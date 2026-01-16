import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Newspaper, Users, Brain, Trophy, Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { PushNotificationToggle } from '@/components/notification/PushNotificationToggle';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAuthContext } from '@/contexts/AuthContext';

interface NotificationSettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

function NotificationSettingItem({ 
  icon, 
  title, 
  description, 
  enabled, 
  onToggle,
  disabled 
}: NotificationSettingItemProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-xl justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { preferences, isLoading, isSaving, updatePreference } = useNotificationPreferences();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="h-14 flex items-center px-4 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-lg text-foreground">알림 설정</h1>
          </div>
        </header>
        <main className="p-4">
          <div className="bg-card rounded-2xl p-6 text-center">
            <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-muted-foreground">
              알림 설정을 변경하려면 먼저 로그인해주세요.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg text-foreground">알림 설정</h1>
          {isSaving && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
          )}
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Push Notification Master Toggle */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            푸시 알림
          </h2>
          <div className="shadow-app-md rounded-2xl overflow-hidden">
            <PushNotificationToggle />
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            푸시 알림을 활성화하면 앱을 사용하지 않을 때도 알림을 받을 수 있습니다.
          </p>
        </motion.section>

        {/* In-App Notification Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            알림 유형별 설정
          </h2>
          <div className="space-y-2">
            <NotificationSettingItem
              icon={<Newspaper size={20} className="text-primary" />}
              title="뉴스 알림"
              description="관심 후보자 관련 뉴스가 등록되면 알림"
              enabled={preferences?.news_enabled ?? true}
              onToggle={(value) => updatePreference('news_enabled', value)}
              disabled={isSaving}
            />
            <NotificationSettingItem
              icon={<Users size={20} className="text-primary" />}
              title="후보자 업데이트"
              description="팔로우한 후보자의 공약, 일정 변경 시 알림"
              enabled={preferences?.candidate_updates_enabled ?? true}
              onToggle={(value) => updatePreference('candidate_updates_enabled', value)}
              disabled={isSaving}
            />
            <NotificationSettingItem
              icon={<Brain size={20} className="text-primary" />}
              title="정책 매치 알림"
              description="새로운 정책 카드가 추가되면 알림"
              enabled={preferences?.policy_match_enabled ?? true}
              onToggle={(value) => updatePreference('policy_match_enabled', value)}
              disabled={isSaving}
            />
            <NotificationSettingItem
              icon={<Trophy size={20} className="text-primary" />}
              title="퀴즈 알림"
              description="새로운 퀴즈, 리더보드 순위 변동 시 알림"
              enabled={preferences?.quiz_enabled ?? true}
              onToggle={(value) => updatePreference('quiz_enabled', value)}
              disabled={isSaving}
            />
            <NotificationSettingItem
              icon={<Settings size={20} className="text-primary" />}
              title="시스템 알림"
              description="앱 업데이트, 공지사항 등 시스템 알림"
              enabled={preferences?.system_enabled ?? true}
              onToggle={(value) => updatePreference('system_enabled', value)}
              disabled={isSaving}
            />
          </div>
        </motion.section>

        {/* Info Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-secondary/50 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Bell size={20} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium">알림 설정 안내</p>
              <p className="text-xs text-muted-foreground mt-1">
                각 알림 유형을 개별적으로 설정할 수 있습니다. 푸시 알림이 꺼져 있으면 
                앱 내 알림만 받게 됩니다. 브라우저에서 알림이 차단된 경우 
                브라우저 설정에서 알림을 허용해주세요.
              </p>
            </div>
          </div>
        </motion.section>
      </main>
    </motion.div>
  );
}
