import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function PushNotificationToggle() {
  const { isAuthenticated } = useAuthContext();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다');
      return;
    }

    try {
      if (checked) {
        await subscribe();
        toast.success('푸시 알림이 활성화되었습니다');
      } else {
        await unsubscribe();
        toast.success('푸시 알림이 비활성화되었습니다');
      }
    } catch (error) {
      console.error('Push notification toggle error:', error);
      if (permission === 'denied') {
        toast.error('브라우저에서 알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.');
      } else {
        toast.error('푸시 알림 설정에 실패했습니다');
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-card rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <BellOff size={20} className="text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">푸시 알림</p>
          <p className="text-xs text-muted-foreground">
            이 브라우저에서 지원되지 않습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-xl justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {isSubscribed ? (
            <Bell size={20} className="text-primary" />
          ) : (
            <BellOff size={20} className="text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">푸시 알림</p>
          <p className="text-xs text-muted-foreground">
            {permission === 'denied' 
              ? '브라우저에서 차단됨' 
              : isSubscribed 
                ? '관심 후보 소식을 받습니다' 
                : '앱을 사용하지 않을 때도 알림 받기'}
          </p>
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={permission === 'denied' || !isAuthenticated}
        />
      )}
    </div>
  );
}
