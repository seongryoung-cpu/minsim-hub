import { Link } from 'react-router-dom';
import { agendaDDay, formatAgendaDate, type AgendaListItem } from '@/hooks/useAgendas';
import { useAppMode } from '@/hooks/useAppMode';
import { useAgendaOutcome } from '@/hooks/useAgendaOutcome';
import { Tag, ToneBox } from '@/components/ds';

/** 공론 허브 목록의 의제 카드. 분포(%)는 넣지 않는다 — 목록에서 다수 쪽으로 쏠리지 않게 */
export function AgendaHubCard({ agenda }: { agenda: AgendaListItem }) {
  const dday = agenda.status === 'open' ? agendaDDay(agenda.closes_at) : null;
  const participated = agenda.my_final ? '마지막 생각 남김' : agenda.my_first ? '처음 생각 남김' : null;
  // 평상시(선거 후)에는 당선인 공약만 센다 — 지난 선거 공약은 선거 탭에서
  const appMode = useAppMode();
  const isNormal = appMode.mode === 'normal';
  const pledgeCount = appMode.mode === null ? 0 : isNormal ? agenda.elected_pledge_count ?? 0 : agenda.pledge_count;
  const pledgeLabel = isNormal ? '당선인 공약' : '관련 공약';
  // 마감된 공론: 결과 카드가 정리됐으면 '결과 나옴' + 공통분모 한 줄
  const { data: outcome } = useAgendaOutcome(agenda.id, agenda.status === 'closed');
  const common = outcome?.available ? outcome.common?.[0]?.body : undefined;

  // 첫 반응만 남기고 마지막 생각을 안 남긴 사람에게 이어서 하라고 알린다
  const needsFinal = agenda.status === 'open' && !!agenda.my_first && !agenda.my_final;

  return (
    <Link
      to={`/gonglon/${agenda.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {agenda.category && <Tag>{agenda.category}</Tag>}
        <Tag>{agenda.region_sido ?? '전국'}</Tag>
        {agenda.status === 'closed' ? (
          <Tag>마감 · {formatAgendaDate(agenda.closes_at)}</Tag>
        ) : (
          <Tag tone="info">진행 중{dday ? ` · ${dday}` : ''}</Tag>
        )}
      </div>

      <h3 className="mt-2.5 text-[17px] font-bold leading-snug tracking-[-0.01em] text-foreground">{agenda.title}</h3>
      {agenda.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-sub">{agenda.summary}</p>}
      <p className="mt-2 text-[13px] text-muted-foreground">
        참여 {agenda.participants.toLocaleString()}명 · 한 줄 의견 {agenda.statement_count.toLocaleString()}개
      </p>

      {common && (
        <ToneBox tone="agree" label="양쪽 모두 동의한 것" className="mt-3 p-3">
          <span className="line-clamp-2 text-[13px]">“{common}”</span>
        </ToneBox>
      )}

      {(pledgeCount > 0 || participated || outcome?.available || needsFinal) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {outcome?.available && <Tag tone="agree">결과 나옴</Tag>}
          {needsFinal && <Tag tone="new">마지막 생각을 아직 안 남겼어요</Tag>}
          {participated && !needsFinal && <Tag tone="info">{participated}</Tag>}
          {pledgeCount > 0 && (
            <Tag>
              {pledgeLabel} {pledgeCount}개
            </Tag>
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
