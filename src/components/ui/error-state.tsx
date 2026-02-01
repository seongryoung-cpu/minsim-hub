import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isOffline?: boolean;
  className?: string;
}

export function ErrorState({
  title = '오류가 발생했습니다',
  description = '잠시 후 다시 시도해주세요',
  onRetry,
  isOffline = false,
  className = '',
}: ErrorStateProps) {
  const Icon = isOffline ? WifiOff : AlertTriangle;
  const displayTitle = isOffline ? '네트워크 연결 없음' : title;
  const displayDescription = isOffline 
    ? '인터넷 연결을 확인해주세요' 
    : description;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Icon size={32} className="text-destructive" />
      </div>
      <h3 className="font-semibold text-lg text-foreground mb-2">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{displayDescription}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw size={14} />
          다시 시도
        </Button>
      )}
    </motion.div>
  );
}
