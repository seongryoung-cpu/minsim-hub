import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { PoliticalEvent, EventStatus } from '@/types/event';

interface EventCardProps {
  event: PoliticalEvent;
  index: number;
}

const statusConfig: Record<EventStatus, { label: string; icon: typeof Clock; className: string }> = {
  preparing: {
    label: '준비중',
    icon: Clock,
    className: 'bg-status-preparing text-white',
  },
  active: {
    label: '진행중',
    icon: AlertCircle,
    className: 'bg-status-active text-white',
  },
  complete: {
    label: '완료',
    icon: CheckCircle,
    className: 'bg-status-complete text-white',
  },
};

const categoryColors: Record<string, string> = {
  '선거': 'bg-primary/10 text-primary',
  '조례': 'bg-accent/10 text-accent',
  '공청회': 'bg-secondary text-secondary-foreground',
  '주민참여': 'bg-status-preparing/10 text-status-preparing',
};

export function EventCard({ event, index }: EventCardProps) {
  const status = statusConfig[event.status];
  const StatusIcon = status.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card rounded-2xl p-4 shadow-app-md active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
            <StatusIcon size={12} className="inline mr-1" />
            {status.label}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[event.category]}`}>
            {event.category}
          </span>
        </div>
        <ChevronRight size={20} className="text-muted-foreground" />
      </div>

      <h3 className="font-semibold text-foreground text-lg mb-1">{event.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar size={14} className="mr-1.5" />
        {formatDate(event.date)}
      </div>
    </motion.div>
  );
}
