import { Link } from 'react-router-dom';
import { ChevronRight, Zap } from 'lucide-react';
import { useGonglonAccess } from '@/hooks/useAgendas';
import { useQuickAgendas } from '@/hooks/useQuickVote';

/** 홈의 빠른 투표 입구. 공론이 공개됐고, 아직 투표하지 않은 후보 의제가 있을 때만 보인다. */
export function QuickVoteEntry({ sido }: { sido?: string }) {
  const access = useGonglonAccess();
  const { data } = useQuickAgendas(sido, access.allowed);
  const left = (data ?? []).filter((a) => !a.my_vote).length;
  if (!access.allowed || left === 0) return null;

  return (
    <Link
      to="/gonglon"
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
    >
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Zap size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold">빠른 투표 {left}개</span>
        <span className="truncate text-[13px] text-muted-foreground">찬성·반대만 눌러도 돼요. 반응이 큰 의제가 공론으로 올라가요</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
