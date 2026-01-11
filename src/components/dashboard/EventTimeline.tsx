import { motion } from 'framer-motion';
import { EventCard } from './EventCard';
import type { PoliticalEvent } from '@/types/event';

interface EventTimelineProps {
  events: PoliticalEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const activeEvents = events.filter(e => e.status === 'active');
  const preparingEvents = events.filter(e => e.status === 'preparing');
  const completedEvents = events.filter(e => e.status === 'complete');

  return (
    <div className="space-y-6">
      {/* Active Events */}
      {activeEvents.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold text-muted-foreground mb-3 px-1"
          >
            🔥 진행 중인 이슈
          </motion.h2>
          <div className="space-y-3">
            {activeEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Preparing Events */}
      {preparingEvents.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-semibold text-muted-foreground mb-3 px-1"
          >
            📅 다가오는 일정
          </motion.h2>
          <div className="space-y-3">
            {preparingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index + activeEvents.length} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Events */}
      {completedEvents.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-semibold text-muted-foreground mb-3 px-1"
          >
            ✅ 완료된 일정
          </motion.h2>
          <div className="space-y-3 opacity-70">
            {completedEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index + activeEvents.length + preparingEvents.length}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
