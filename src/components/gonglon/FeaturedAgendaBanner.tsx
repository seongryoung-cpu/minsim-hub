import { Link } from 'react-router-dom';
import { agendaDDay, useAgendaList, useGonglonAccess } from '@/hooks/useAgendas';
import { SectionHeader, Tag, primaryButton } from '@/components/ds';

/**
 * 홈 '오늘 시민들이 고민하는 의제'. 관리자가 '홈 배너'로 지정한 진행 중 의제 하나를 보여준다.
 * 공론이 공개되지 않았거나 지정된 의제가 없으면 아무것도 그리지 않는다 (자리도 비우지 않음).
 */
export function FeaturedAgendaBanner({ sido }: { sido?: string }) {
  const access = useGonglonAccess();
  const { data } = useAgendaList(sido, access.allowed);
  const agenda = data?.find((a) => a.status === 'open' && a.is_featured);
  if (!access.allowed || !agenda) return null;

  const dday = agendaDDay(agenda.closes_at);
  const cta = agenda.my_final ? '결과와 의견 보기' : agenda.my_first ? '마지막 생각 남기기' : '쟁점 읽고 의견 남기기';

  return (
    <section aria-labelledby="featured-title" className="space-y-3">
      <SectionHeader id="featured-title" title="오늘 시민들이 고민하는 의제" to="/gonglon" action="다른 의제" />
      <article className="space-y-3.5 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap gap-1.5">
          {agenda.category && <Tag>{agenda.category}</Tag>}
          <Tag>{agenda.region_sido ?? '전국'}</Tag>
          <Tag tone="info">진행 중{dday ? ` · ${dday}` : ''}</Tag>
        </div>
        <h3 className="text-[20px] font-bold leading-[1.35] tracking-[-0.02em]">{agenda.title}</h3>
        {agenda.summary && <p className="text-sm leading-relaxed text-sub">{agenda.summary}</p>}
        <p className="text-[13px] text-muted-foreground">
          참여 {agenda.participants.toLocaleString()}명 · 한 줄 의견 {agenda.statement_count.toLocaleString()}개
        </p>
        <Link to={`/gonglon/${agenda.id}`} className={primaryButton}>
          {cta}
        </Link>
      </article>
    </section>
  );
}
