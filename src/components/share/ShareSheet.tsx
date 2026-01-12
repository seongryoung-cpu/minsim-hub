import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { Link, Check, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  url?: string;
}

const SHARE_OPTIONS = [
  {
    id: 'kakao',
    name: '카카오톡',
    icon: MessageCircle,
    color: 'bg-[#FEE500] text-[#3C1E1E]',
    action: 'kakao',
  },
  {
    id: 'twitter',
    name: 'X (트위터)',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: 'bg-black text-white dark:bg-white dark:text-black',
    action: 'twitter',
  },
  {
    id: 'facebook',
    name: '페이스북',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: 'bg-[#1877F2] text-white',
    action: 'facebook',
  },
  {
    id: 'copy',
    name: '링크 복사',
    icon: Link,
    color: 'bg-secondary text-foreground',
    action: 'copy',
  },
];

export function ShareSheet({
  open,
  onOpenChange,
  title = '민심잇다',
  description = '나의 목소리가 정치가 되는 곳',
  url,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const shareText = `${title} - ${description}`;

  const handleShare = async (action: string) => {
    switch (action) {
      case 'kakao':
        // 카카오톡 공유 (실제 구현 시 Kakao SDK 필요)
        if (navigator.share) {
          try {
            await navigator.share({ title, text: description, url: shareUrl });
            onOpenChange(false);
          } catch {
            // 사용자가 취소한 경우
          }
        } else {
          toast({
            title: '카카오톡 공유',
            description: '모바일 앱에서 이용 가능합니다.',
          });
        }
        break;

      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        onOpenChange(false);
        break;

      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        onOpenChange(false);
        break;

      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast({
            title: '링크가 복사되었습니다',
            description: '원하는 곳에 붙여넣기 하세요.',
          });
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast({
            title: '복사 실패',
            description: '링크를 복사할 수 없습니다.',
            variant: 'destructive',
          });
        }
        break;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 justify-center">
            <Send size={18} className="text-primary" />
            공유하기
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-4 gap-4 py-4">
          {SHARE_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isCopyButton = option.action === 'copy';

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleShare(option.action)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center transition-transform active:scale-95`}
                >
                  {isCopyButton && copied ? (
                    <Check size={20} />
                  ) : (
                    <Icon />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {isCopyButton && copied ? '복사됨' : option.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-2 p-3 bg-secondary/50 rounded-xl">
          <p className="text-xs text-muted-foreground text-center truncate">
            {shareUrl}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
