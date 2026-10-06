import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessagesSquare, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgendaList, useGonglonAccess } from '@/hooks/useAgendas';
import { AgendaHubCard, AgendaHubCardSkeleton } from '@/components/gonglon/AgendaHubCard';
import { QuickVoteDeck } from '@/components/gonglon/QuickVoteDeck';
import type { Region } from '@/types/region';

type HubTab = 'open' | 'closed' | 'mine';

const TABS: { id: HubTab; label: string }[] = [
  { id: 'open', label: '진행 중' },
  { id: 'closed', label: '결과 공개' },
  { id: 'mine', label: '내가 참여한' },
];

const EMPTY: Record<HubTab, string> = {
  open: '지금 진행 중인 의제가 없어요.',
  closed: '아직 결과가 공개된 의제가 없어요.',
  mine: '아직 참여한 의제가 없어요. 진행 중인 의제에서 의견을 남겨 보세요.',
};

/** 공론 허브: 지금 시민들이 함께 정하고 있는 의제 목록 */
export function GonglonHub({ region }: { region: Region }) {
  const access = useGonglonAccess();
  const { data: agendas, isLoading, isError, refetch } = useAgendaList(region.sido);
  const [tab, setTab] = useState<HubTab>('open');
  const [category, setCategory] = useState<string | null>(null);

  const inTab = useMemo(() => {
    const list = agendas ?? [];
    if (tab === 'open') return list.filter((a) => a.status === 'open');
    if (tab === 'closed') return list.filter((a) => a.status === 'closed');
    return list.filter((a) => a.my_first || a.my_final);
  }, [agendas, tab]);

  // 지금 탭에 있는 의제의 카테고리만 칩으로
  const categories = useMemo(
    () => Array.from(new Set(inTab.map((a) => a.category).filter((c): c is string => !!c))),
    [inTab],
  );
  const activeCategory = category && categories.includes(category) ? category : null;
  const shown = activeCategory ? inTab.filter((a) => a.category === activeCategory) : inTab;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-24 lg:pb-10"
    >
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MessagesSquare size={22} className="text-primary" aria-hidden />
            <h1 className="text-lg font-semibold text-foreground">공론</h1>
          </div>
          {access.isAdmin && (
            <Link
              to="/admin/agendas"
              className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              <Settings2 size={16} aria-hidden /> 의제 관리
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {access.isAdmin && !access.isPublic && (
          <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            지금은 관리자에게만 보여요. 의제를 채운 뒤 관리자 설정의 ‘공론 공개’를 켜면 모두에게 열려요.
          </p>
        )}

        <QuickVoteDeck sido={region.sido} />

        <h2 className="pt-2 text-[17px] font-bold">공론 중인 의제</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          쟁점을 읽고 함께 정하는 의제예요. {region.sido}와 전국 의제를 보여 드려요.
        </p>

        <div role="tablist" aria-label="의제 상태" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'h-10 rounded-[10px] text-sm transition-colors',
                tab === t.id
                  ? 'border border-border bg-card font-semibold text-foreground shadow-sm'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {categories.length > 1 && (
          <div role="group" aria-label="카테고리" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[null, ...categories].map((c) => {
              const selected = activeCategory === c;
              return (
                <button
                  key={c ?? 'all'}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'h-9 shrink-0 rounded-full px-3.5 text-[13px] transition-colors',
                    selected
                      ? 'bg-foreground font-semibold text-background'
                      : 'border border-border bg-card text-foreground/80 hover:bg-secondary',
                  )}
                >
                  {c ?? '전체'}
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3" role="tabpanel">
          {isLoading ? (
            <>
              <AgendaHubCardSkeleton />
              <AgendaHubCardSkeleton />
            </>
          ) : isError ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              의제를 불러오지 못했어요.{' '}
              <button type="button" onClick={() => refetch()} className="font-semibold text-primary">
                다시 시도
              </button>
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {EMPTY[tab]}
            </div>
          ) : (
            shown.map((a) => <AgendaHubCard key={a.id} agenda={a} />)
          )}
        </div>
      </main>
    </motion.div>
  );
}
