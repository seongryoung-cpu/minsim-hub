import { Link } from 'react-router-dom';
import { ChevronRight, MessagesSquare } from 'lucide-react';
import type { LinkedAgenda } from '@/hooks/useAgendas';
import type { AgendaFrom } from './AgendaLinkCard';

/**
 * 후보 비교 화면의 연결 행 (이동형). 비교 화면은 여러 후보를 나란히 보는 곳이라
 * 여기서는 반응을 받지 않고 의제 상세로 보내기만 한다. 분포 없음, 참여자 수만.
 */
export function AgendaLinkRow({ agenda, from }: { agenda: LinkedAgenda; from: AgendaFrom }) {
  const closed = agenda.status === 'closed';
  return (
    <Link
      to={`/gonglon/${agenda.agenda_id}`}
      state={{ from }}
      className="flex min-h-[60px] items-center gap-2.5 rounded-xl border-[1.5px] border-accent bg-accent/[0.07] px-3 py-2.5 text-foreground transition-colors hover:bg-accent/[0.12]"
    >
      <MessagesSquare size={18} className="shrink-0 text-accent" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs font-bold text-accent">
          {closed ? '마감된 시민 공론' : '이 쟁점, 시민들은 어떻게 볼까요?'}
        </span>
        <span className="truncate text-sm font-semibold">
          {agenda.title} · 참여 {agenda.participants.toLocaleString()}명
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-accent" aria-hidden />
    </Link>
  );
}
