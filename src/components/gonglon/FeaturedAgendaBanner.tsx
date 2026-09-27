import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { agendaDDay, useAgendaList, useGonglonAccess } from '@/hooks/useAgendas';

/**
 * 홈 '이번 주 공론' 배너. 관리자가 '홈 배너'로 지정한 진행 중 의제 하나를 보여준다.
 * 공론이 공개되지 않았거나 지정된 의제가 없으면 아무것도 그리지 않는다 (자리도 비우지 않음).
 */
export function FeaturedAgendaBanner({ sido }: { sido?: string }) {
  const access = useGonglonAccess();
  const { data } = useAgendaList(sido, access.allowed);
  const agenda = data?.find((a) => a.status === 'open' && a.is_featured);
  if (!access.allowed || !agenda) return null;

  const dday = agendaDDay(agenda.closes_at);

  return (
    <section
      aria-label="이번 주 공론"
      className="rounded-2xl border-[1.5px] border-primary/40 bg-primary/[0.06] p-4 space-y-2.5"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-md bg-primary px-2 py-0.5 font-bold text-primary-foreground">이번 주 공론</span>
        <span className="font-semibold text-primary">진행 중{dday ? ` · ${dday}` : ''}</span>
      </div>
      <h2 className="text-lg font-bold leading-snug text-foreground">{agenda.title}</h2>
      {agenda.summary && <p className="text-sm leading-relaxed text-foreground/80">{agenda.summary}</p>}
      <p className="text-[13px] text-muted-foreground">
        참여 {agenda.participants.toLocaleString()}명 · 한 줄 의견 {agenda.statement_count.toLocaleString()}개
      </p>
      <div className="flex items-center gap-2 pt-1">
        <Link
          to={`/gonglon/${agenda.id}`}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          {agenda.my_final ? '결과와 의견 보기' : '의견 남기기'}
        </Link>
        <Link
          to="/gonglon"
          className="flex h-11 items-center gap-0.5 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          다른 의제 보기 <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
