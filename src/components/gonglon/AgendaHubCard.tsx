import { Link } from 'react-router-dom';
import { agendaDDay, formatAgendaDate, type AgendaListItem } from '@/hooks/useAgendas';

/** 공론 허브 목록의 의제 카드. 분포(%)는 넣지 않는다 — 목록에서 다수 쪽으로 쏠리지 않게 */
export function AgendaHubCard({ agenda }: { agenda: AgendaListItem }) {
  const dday = agenda.status === 'open' ? agendaDDay(agenda.closes_at) : null;
  const participated = agenda.my_final ? '최종 의견 남김' : agenda.my_first ? '첫 반응 남김' : null;

  return (
    <Link
      to={`/gonglon/${agenda.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {agenda.category && (
          <span className="rounded-md bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
            {agenda.category}
          </span>
        )}
        <span>{agenda.region_sido ?? '전국'}</span>
        <span className="ml-auto font-semibold">
          {agenda.status === 'closed' ? (
            <span className="text-muted-foreground">마감 · {formatAgendaDate(agenda.closes_at)}</span>
          ) : (
            dday && <span className="text-primary">{dday}</span>
          )}
        </span>
      </div>

      <h3 className="mt-2 text-[17px] font-bold leading-snug text-foreground">{agenda.title}</h3>
      {agenda.summary && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{agenda.summary}</p>
      )}
      <p className="mt-2 text-[13px] text-muted-foreground">
        참여 {agenda.participants.toLocaleString()}명 · 한 줄 의견 {agenda.statement_count.toLocaleString()}개
      </p>

      {(agenda.pledge_count > 0 || participated) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {agenda.pledge_count > 0 && (
            <span className="rounded-md border border-accent/60 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
              관련 공약 {agenda.pledge_count}개
            </span>
          )}
          {participated && (
            <span className="rounded-md border border-primary/50 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {participated}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export function AgendaHubCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="h-4 w-24 rounded bg-secondary" />
      <div className="h-5 w-3/4 rounded bg-secondary" />
      <div className="h-4 w-40 rounded bg-secondary" />
    </div>
  );
}
