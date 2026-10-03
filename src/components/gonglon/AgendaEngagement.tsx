import { Link } from 'react-router-dom';
import { Bell, BellRing, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgendaClaims, useAgendaEngagement, useToggleAgendaInterest } from '@/hooks/useClaims';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';

/**
 * 의제 제목 아래 한 줄: 참여 · 읽은 사람(50명 이상일 때만) · 마감, 오른쪽에 '관심' 버튼.
 * 관심은 좋아요 대신 쓰는 신호: 누르면 요약이 바뀌거나 마감될 때 앱 안 알림을 받는다.
 */
export function AgendaMetaLine({
  agendaId,
  participants,
  closingText,
  canFollow,
}: {
  agendaId: string;
  participants: number;
  closingText: string | null;
  canFollow: boolean;
}) {
  const { data: engagement } = useAgendaEngagement(agendaId);
  const toggle = useToggleAgendaInterest();
  const { handleError, loginModal } = useLoginPrompt();
  const interested = engagement?.my_interest ?? false;

  const parts = [`참여 ${participants.toLocaleString()}명`];
  if (engagement?.viewers) parts.push(`읽은 사람 ${engagement.viewers.toLocaleString()}명`);
  if (closingText) parts.push(closingText);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] text-muted-foreground">{parts.join(' · ')}</p>
      {canFollow && engagement && (
        <button
          type="button"
          aria-pressed={interested}
          onClick={() => toggle.mutate(agendaId, { onError: handleError })}
          disabled={toggle.isPending}
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors',
            interested
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-foreground/80 hover:bg-secondary',
          )}
        >
          {interested ? <BellRing size={15} aria-hidden /> : <Bell size={15} aria-hidden />}
          관심
          {engagement.interested > 0 && <span className="tabular-nums">{engagement.interested.toLocaleString()}</span>}
        </button>
      )}
      {loginModal}
    </div>
  );
}

/** 의제 상세 → 주장 비교 화면 입구. 주장 기능이 꺼져 있으면 아무것도 그리지 않는다. */
export function ClaimsEntryCard({ agendaId }: { agendaId: string }) {
  const { data } = useAgendaClaims(agendaId, null);
  if (!data?.enabled) return null;

  const claims = data.claims ?? [];
  const myPick = data.my_pick ? claims.find((c) => c.id === data.my_pick?.claim_id) : undefined;

  return (
    <Link
      to={`/gonglon/${agendaId}/claims`}
      className="flex items-center gap-3 rounded-2xl border-[1.5px] border-primary bg-card p-4 transition-colors hover:bg-secondary/40"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-bold">주장 비교하고 가장 가까운 것 고르기</span>
        <span className="text-[13px] text-muted-foreground">
          주장 {claims.length}개 · 고른 사람 {(data.total_picks ?? 0).toLocaleString()}명
        </span>
        {myPick && (
          <span className="truncate text-[13px] text-primary">내 선택: {myPick.body}</span>
        )}
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
