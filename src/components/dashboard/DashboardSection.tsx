import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface DashboardSectionProps {
  title: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  };
  children: ReactNode;
  delay?: number;
}

export function DashboardSection({
  title,
  icon,
  action,
  children,
  delay = 0,
}: DashboardSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {action && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={action.onPress}
            className="flex items-center gap-1 text-xs text-primary font-medium touch-target"
          >
            {action.label}
            <ChevronRight size={14} />
          </motion.button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// Expandable slot for future content
interface ExpandableSlotProps {
  title: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
  onPress?: () => void;
}

export function ExpandableSlot({
  title,
  description,
  icon,
  comingSoon = true,
  onPress,
}: ExpandableSlotProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      className="w-full bg-card rounded-2xl p-4 shadow-[var(--shadow-md)] flex items-center gap-4 touch-target text-left border border-dashed border-border hover:border-primary/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{title}</span>
          {comingSoon && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </motion.button>
  );
}