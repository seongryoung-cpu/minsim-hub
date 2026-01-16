import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Users, Megaphone, CheckCheck, Trash2, Newspaper, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  election: Calendar,
  candidate: Users,
  news: Newspaper,
  default: Megaphone,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  election: 'from-primary/20 to-primary/5 border-primary/20',
  candidate: 'from-accent/20 to-accent/5 border-accent/20',
  news: 'from-red-500/20 to-red-500/5 border-red-500/20',
  default: 'from-secondary/80 to-secondary/40 border-border',
};

export function NotificationSheet({ open, onOpenChange }: NotificationSheetProps) {
  const { isAuthenticated } = useAuthContext();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();

  const handleNotificationClick = (notification: { id: string; data: Record<string, unknown>; is_read: boolean }) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Open article URL if available
    const articleUrl = notification.data?.article_url as string;
    if (articleUrl) {
      window.open(articleUrl, '_blank');
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
    } catch {
      return dateString;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={16} className="text-primary" />
              </div>
              <span>알림</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>

            {notifications.length > 0 && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck size={14} className="mr-1" />
                  모두 읽음
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllNotifications()}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} className="mr-1" />
                  전체 삭제
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell size={28} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">로그인이 필요합니다</p>
              <p className="text-xs text-muted-foreground/70 mt-1 text-center">
                로그인하면 관심 후보의<br />새 소식을 알림으로 받을 수 있어요
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                >
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Bell size={28} className="text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium">알림이 없습니다</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 text-center">
                    관심 후보를 팔로우하면<br />새 소식을 알림으로 받을 수 있어요
                  </p>
                </motion.div>
              ) : (
                notifications.map((notification, index) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
                  const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.default;
                  const hasLink = !!notification.data?.article_url;

                  return (
                    <motion.button
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        notification.is_read
                          ? 'bg-muted/30 border-border/30'
                          : `bg-gradient-to-br ${colorClass}`
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            notification.is_read
                              ? 'bg-muted'
                              : 'bg-background/80 shadow-sm'
                          }`}
                        >
                          <Icon
                            size={18}
                            className={
                              notification.is_read
                                ? 'text-muted-foreground'
                                : 'text-foreground'
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-semibold truncate ${
                                notification.is_read
                                  ? 'text-muted-foreground'
                                  : 'text-foreground'
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p
                            className={`text-xs mt-0.5 line-clamp-2 ${
                              notification.is_read
                                ? 'text-muted-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {notification.body}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatTime(notification.created_at)}
                            </span>
                            {hasLink && (
                              <ExternalLink size={12} className="text-muted-foreground/40" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
