import { useState, useEffect } from 'react';
import { Bell, Send, Loader2, Users, User, Check, History, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';

interface PushSubscriber {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  endpoint: string;
}

interface NotificationLog {
  id: string;
  admin_user_id: string;
  title: string;
  body: string;
  target_type: string;
  target_user_ids: string[] | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const NOTIFICATION_TYPES = [
  { value: 'system', label: '시스템 알림', description: '일반 공지사항' },
  { value: 'news', label: '뉴스 알림', description: '뉴스 관련 알림' },
  { value: 'candidate_updates', label: '후보자 업데이트', description: '후보자 정보 변경' },
  { value: 'quiz', label: '퀴즈 알림', description: '퀴즈 관련 알림' },
  { value: 'policy_match', label: '정책 매치', description: '정책 매치 관련 알림' },
] as const;

type NotificationType = typeof NOTIFICATION_TYPES[number]['value'];

export function PushNotificationSender() {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('send');
  const [subscribers, setSubscribers] = useState<PushSubscriber[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('system');
  const [sendToAll, setSendToAll] = useState(true);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubscribers();
      fetchLogs();
    }
  }, [isOpen]);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      // Fetch push subscribers with their profile info
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select(`
          user_id,
          endpoint
        `);

      if (error) throw error;

      // Get unique user IDs
      const uniqueUserIds = [...new Set(data?.map(s => s.user_id) || [])];

      // Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', uniqueUserIds);

      if (profileError) throw profileError;

      // Merge data
      const subscribersWithProfiles: PushSubscriber[] = uniqueUserIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const subscription = data?.find(s => s.user_id === userId);
        return {
          user_id: userId,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          endpoint: subscription?.endpoint || ''
        };
      });

      setSubscribers(subscribersWithProfiles);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
      toast.error('구독자 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs((data || []) as NotificationLog[]);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const saveLog = async (sentCount: number, failedCount: number) => {
    if (!user) return;
    
    try {
      await supabase.from('notification_logs').insert({
        admin_user_id: user.id,
        title,
        body,
        target_type: sendToAll ? 'all' : 'selected',
        target_user_ids: sendToAll ? null : selectedUsers,
        sent_count: sentCount,
        failed_count: failedCount
      });
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === subscribers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(subscribers.map(s => s.user_id));
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      toast.error('알림을 받을 사용자를 선택해주세요');
      return;
    }

    setIsSending(true);
    let totalSent = 0;
    let totalFailed = 0;
    
    try {
      if (sendToAll) {
        // Send to all subscribers
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            title,
            body,
            notification_type: notificationType,
            data: { type: notificationType, url: '/' }
          }
        });

        if (error) throw error;
        totalSent = data.sent || 0;
        totalFailed = data.failed || 0;
        toast.success(`푸시 알림 전송 완료: ${totalSent}건 성공`);
      } else {
        // Send to selected users one by one
        for (const userId of selectedUsers) {
          try {
            const { data, error } = await supabase.functions.invoke('send-push-notification', {
              body: {
                title,
                body,
                user_id: userId,
                notification_type: notificationType,
                data: { type: notificationType, url: '/' }
              }
            });

            if (error) throw error;
            totalSent += data.sent || 0;
            totalFailed += data.failed || 0;
          } catch {
            totalFailed++;
          }
        }

        toast.success(`푸시 알림 전송 완료: ${totalSent}건 성공, ${totalFailed}건 실패`);
      }

      // Save log
      await saveLog(totalSent, totalFailed);
      await fetchLogs();

      // Reset form
      setTitle('');
      setBody('');
      setNotificationType('system');
      setSelectedUsers([]);
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to send push:', error);
      toast.error('푸시 알림 전송에 실패했습니다');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-app-md">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={20} className="text-primary" />
        <h3 className="font-semibold">푸시 알림 전송</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        특정 사용자 또는 모든 구독자에게 푸시 알림을 전송합니다.
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2">
            <Send size={18} />
            알림 작성하기
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              푸시 알림 관리
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Send size={14} />
                알림 전송
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History size={14} />
                전송 기록
              </TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">알림 제목</label>
                  <Input
                    placeholder="알림 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Body Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">알림 내용</label>
                  <Textarea
                    placeholder="알림 내용을 입력하세요"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Notification Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">알림 유형</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    해당 유형을 끈 사용자에게는 알림이 전송되지 않습니다
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {NOTIFICATION_TYPES.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => setNotificationType(type.value)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          notificationType === type.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">수신 대상</label>
                  
                  {/* Send to All Toggle */}
                  <div 
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-colors mb-3 ${
                      sendToAll ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSendToAll(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        sendToAll ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {sendToAll && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-muted-foreground" />
                        <span className="font-medium">모든 구독자</span>
                        <span className="text-xs text-muted-foreground">({subscribers.length}명)</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      !sendToAll ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSendToAll(false)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !sendToAll ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {!sendToAll && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-muted-foreground" />
                        <span className="font-medium">특정 사용자 선택</span>
                        {!sendToAll && selectedUsers.length > 0 && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {selectedUsers.length}명 선택됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User List (when not sending to all) */}
                {!sendToAll && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="p-3 bg-secondary/50 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">구독자 목록</span>
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedUsers.length === subscribers.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>
                    
                    {isLoading ? (
                      <div className="p-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : subscribers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        푸시 알림을 구독한 사용자가 없습니다
                      </div>
                    ) : (
                      <ScrollArea className="h-48">
                        <div className="divide-y">
                          {subscribers.map((subscriber) => (
                            <div
                              key={subscriber.user_id}
                              className="flex items-center gap-3 p-3 hover:bg-secondary/30 cursor-pointer"
                              onClick={() => handleSelectUser(subscriber.user_id)}
                            >
                              <Checkbox 
                                checked={selectedUsers.includes(subscriber.user_id)}
                                onCheckedChange={() => handleSelectUser(subscriber.user_id)}
                              />
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {subscriber.avatar_url ? (
                                  <img 
                                    src={subscriber.avatar_url} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <User size={16} className="text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {subscriber.display_name || '익명 사용자'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {subscriber.user_id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={isSending || !title.trim() || !body.trim() || (!sendToAll && selectedUsers.length === 0)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {sendToAll 
                        ? `모든 구독자에게 전송 (${subscribers.length}명)`
                        : `선택한 사용자에게 전송 (${selectedUsers.length}명)`
                      }
                    </>
                  )}
                </button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
              {isLoadingLogs ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center">
                  <History size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">전송 기록이 없습니다</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {logs.map((log) => {
                      const timeAgo = (dateStr: string) => {
                        const now = new Date();
                        const date = new Date(dateStr);
                        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
                        
                        if (diff < 60) return '방금 전';
                        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
                        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
                        return `${Math.floor(diff / 86400)}일 전`;
                      };

                      return (
                        <div 
                          key={log.id}
                          className="p-3 bg-secondary/30 rounded-xl space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{log.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{log.body}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                              <Clock size={12} />
                              {timeAgo(log.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${
                              log.target_type === 'all' 
                                ? 'bg-blue-500/10 text-blue-600' 
                                : 'bg-purple-500/10 text-purple-600'
                            }`}>
                              {log.target_type === 'all' 
                                ? '전체 발송' 
                                : `${log.target_user_ids?.length || 0}명 지정`
                              }
                            </span>
                            <span className="text-green-600">
                              성공 {log.sent_count}
                            </span>
                            {log.failed_count > 0 && (
                              <span className="text-red-600">
                                실패 {log.failed_count}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
