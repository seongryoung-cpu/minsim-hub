import { motion } from 'framer-motion';
import { Vote, FileText, Users, Megaphone } from 'lucide-react';

const actions = [
  { id: 'vote', icon: Vote, label: '투표하기', color: 'bg-primary' },
  { id: 'policy', icon: FileText, label: '정책보기', color: 'bg-accent' },
  { id: 'community', icon: Users, label: '커뮤니티', color: 'bg-status-preparing' },
  { id: 'voice', icon: Megaphone, label: '민원신청', color: 'bg-status-complete' },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-2xl p-4 shadow-app-md"
    >
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">빠른 메뉴</h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center`}
              >
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
