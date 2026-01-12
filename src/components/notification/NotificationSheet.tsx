import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Users, Megaphone, CheckCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'election' | 'candidate' | 'news';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'election',
    title: '대선 D-30',
    message: '제21대 대통령 선거가 30일 앞으로 다가왔습니다.',
    time: '방금 전',
    read: false,
  },
  {
    id: '2',
    type: 'candidate',
    title: '이재명 후보 공약 업데이트',
    message: '경제 분야 새로운 공약이 등록되었습니다.',
    time: '1시간 전',
    read: false,
  },
  {
    id: '3',
    type: 'news',
    title: '오늘의 선거 뉴스',
    message: '주요 후보들의 지지율 변동 소식을 확인하세요.',
    time: '3시간 전',
    read: true,
  },
  {
    id: '4',
    type: 'election',
    title: '사전투표 안내',
    message: '사전투표 일정과 장소를 확인하세요.',
    time: '어제',
    read: true,
  },
];

const NOTIFICATION_ICONS = {
  election: Calendar,
  candidate: Users,
  news: Megaphone,
};

const NOTIFICATION_COLORS = {
  election: 'from-primary/20 to-primary/5 border-primary/20',
  candidate: 'from-accent/20 to-accent/5 border-accent/20',
  news: 'from-secondary/80 to-secondary/40 border-border',
};

export function NotificationSheet({ open, onOpenChange }: NotificationSheetProps) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
                  onClick={markAllAsRead}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck size={14} className="mr-1" />
                  모두 읽음
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
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
                <p className="text-xs text-muted-foreground/70 mt-1">
                  새로운 소식이 있으면 알려드릴게요
                </p>
              </motion.div>
            ) : (
              notifications.map((notification, index) => {
                const Icon = NOTIFICATION_ICONS[notification.type];
                const colorClass = NOTIFICATION_COLORS[notification.type];

                return (
                  <motion.button
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => markAsRead(notification.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      notification.read
                        ? 'bg-muted/30 border-border/30'
                        : `bg-gradient-to-br ${colorClass}`
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          notification.read
                            ? 'bg-muted'
                            : 'bg-background/80 shadow-sm'
                        }`}
                      >
                        <Icon
                          size={18}
                          className={
                            notification.read
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              notification.read
                                ? 'text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p
                          className={`text-xs mt-0.5 line-clamp-2 ${
                            notification.read
                              ? 'text-muted-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
