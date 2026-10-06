import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaChoice } from '@/hooks/useAgendas';
import { QUICK_LABELS, useQuickAgendas, useQuickInterest, useQuickVote, type QuickAgenda } from '@/hooks/useQuickVote';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';

const CHOICES: AgendaChoice[] = ['agree', 'disagree', 'hold'];

const CHOICE_BUTTON: Record<AgendaChoice, string> = {
  agree: 'border-primary/50 text-primary hover:bg-primary/10',
  disagree: 'border-accent/50 text-accent hover:bg-accent/10',
  hold: 'border-border text-foreground/80 hover:bg-secondary',
};
const CHOICE_BAR: Record<AgendaChoice, string> = {
  agree: 'bg-primary',
  disagree: 'bg-accent',
  hold: 'bg-slate-500',
};

/**
 * 공론 탭 맨 위 '빠른 투표'. 후보 의제를 한 장씩 넘기며 찬성·반대·모르겠어요를 고른다.
 * 투표하면 결과(5명 이상일 때)를 바로 보여 주고, '다음'으로 넘어간다. 건너뛴 카드는 저장하지 않는다.
 * 후보 의제가 없으면 아무것도 그리지 않는다.
 */
export function QuickVoteDeck({ sido }: { sido?: string }) {
  const { data: list } = useQuickAgendas(sido);
  const vote = useQuickVote();
  const interest = useQuickInterest();
  const { handleError, loginModal } = useLoginPrompt();
  const reduceMotion = useReducedMotion();

  const [skipped, setSkipped] = useState<string[]>([]);
  // 방금 투표해서 결과를 보여 주는 카드 (다음을 누르기 전까지 유지)
  const [justVoted, setJustVoted] = useState<{ id: string; choice: AgendaChoice } | null>(null);

  if (!list || list.length === 0) return null;

  const queue = list.filter((a) => !a.my_vote && !skipped.includes(a.id) && a.id !== justVoted?.id);
  const showing: QuickAgenda | undefined = justVoted ? list.find((a) => a.id === justVoted.id) : queue[0];
  const votedCount = list.filter((a) => a.my_vote).length;

  const cast = (agenda: QuickAgenda, choice: AgendaChoice) => {
    vote.mutate(
      { agendaId: agenda.id, choice },
      { onSuccess: () => setJustVoted({ id: agenda.id, choice }), onError: handleError },
    );
  };

  return (
    <section aria-labelledby="quick-vote-title" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="quick-vote-title" className="flex items-center gap-1.5 text-[17px] font-bold">
          <Zap size={18} className="text-primary" aria-hidden /> 빠른 투표
        </h2>
        <span className="text-xs text-muted-foreground">
          {queue.length > 0 ? `${queue.length}개 남음` : `${votedCount}개 투표함`}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {showing ? (
          <motion.article
            key={showing.id}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              {showing.category && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">{showing.category}</span>
              )}
              <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                {showing.region_sido ?? '전국'}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold leading-snug tracking-tight">{showing.question || showing.title}</h3>
              {showing.summary && <p className="text-sm leading-relaxed text-foreground/80">{showing.summary}</p>}
            </div>

            {justVoted?.id === showing.id ? (
              <QuickResult agenda={showing} myChoice={justVoted.choice} />
            ) : (
              <div role="group" aria-label="빠른 투표" className="grid grid-cols-3 gap-2">
                {CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={vote.isPending}
                    onClick={() => cast(showing, c)}
                    className={cn(
                      'h-12 rounded-xl border-[1.5px] bg-card text-[15px] font-bold transition-colors disabled:opacity-60',
                      CHOICE_BUTTON[c],
                    )}
                  >
                    {QUICK_LABELS[c]}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-pressed={showing.my_interest}
                disabled={interest.isPending}
                onClick={() => interest.mutate(showing.id, { onError: handleError })}
                className={cn(
                  'flex h-10 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold transition-colors',
                  showing.my_interest
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground/80 hover:bg-secondary',
                )}
              >
                {showing.my_interest && <Check size={14} aria-hidden />}더 알고 싶어요
              </button>
              {justVoted?.id === showing.id ? (
                <button
                  type="button"
                  onClick={() => setJustVoted(null)}
                  className="h-10 rounded-full bg-foreground px-4 text-[13px] font-bold text-background"
                >
                  {queue.length > 0 ? '다음 카드' : '마치기'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSkipped((s) => [...s, showing.id])}
                  className="h-10 px-2 text-[13px] font-semibold text-muted-foreground"
                >
                  건너뛰기
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              '더 알고 싶어요'가 많은 의제는 쟁점을 정리해 공론으로 올리고, 누른 분께 알려 드려요.
            </p>
          </motion.article>
        ) : (
          <motion.div
            key="done"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 rounded-2xl border border-dashed border-border p-5 text-center"
          >
            <p className="text-sm font-semibold">지금 올라온 카드는 다 봤어요</p>
            <p className="text-xs text-muted-foreground">새 카드가 올라오면 여기에 보여 드려요.</p>
            {skipped.length > 0 && (
              <button
                type="button"
                onClick={() => setSkipped([])}
                className="mt-1 h-10 px-3 text-[13px] font-semibold text-primary"
              >
                건너뛴 카드 {skipped.length}개 다시 보기
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {loginModal}
    </section>
  );
}

function QuickResult({ agenda, myChoice }: { agenda: QuickAgenda; myChoice: AgendaChoice }) {
  const r = agenda.results;
  if (!r) {
    return (
      <div className="rounded-xl bg-secondary/60 p-3.5 text-sm">
        <p className="font-semibold">
          내 선택: <span className="text-primary">{QUICK_LABELS[myChoice]}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">5명 이상 모이면 다른 사람들의 선택을 보여 드려요.</p>
      </div>
    );
  }
  const pct = (n: number) => Math.round((n / Math.max(r.total, 1)) * 100);
  return (
    <div className="space-y-2.5 rounded-xl bg-secondary/60 p-3.5" aria-label={`참여 ${r.total}명 결과`}>
      {CHOICES.map((c) => (
        <div key={c} className="space-y-1">
          <div className="flex justify-between text-[13px]">
            <span className={cn('font-semibold', c === myChoice && 'text-primary')}>
              {QUICK_LABELS[c]}
              {c === myChoice && ' · 내 선택'}
            </span>
            <span className="tabular-nums text-muted-foreground">{pct(r[c])}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div className={cn('h-full rounded-full', CHOICE_BAR[c])} style={{ width: `${pct(r[c])}%` }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">참여 {r.total.toLocaleString()}명 · 참여자 의견이며 여론조사가 아니에요</p>
    </div>
  );
}
