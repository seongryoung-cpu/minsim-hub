import { Bell, BellRing, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CHOICE_LABELS, type AgendaSummary } from '@/hooks/useAgendas';
import { pct, useAgendaOutcome, type OutcomeStatement } from '@/hooks/useAgendaOutcome';
import { useAgendaEngagement, useToggleAgendaInterest } from '@/hooks/useClaims';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import { ResultBars } from '@/components/gonglon/ResultBars';

const fmtDay = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/**
 * 공론 결과 카드 — 마감된 의제 맨 위.
 * '누가 이겼나'가 아니라 쟁점 지도: ① 분포·변화 ② 양쪽 모두 동의한 것 ③ 가장 크게 갈린 것 ④ 받아들일 수 있는 조건
 * 무작위 표본이 아니므로 항상 "참여자 N명의 의견"을 붙인다.
 */
export function OutcomeCard({
  agendaId,
  title,
  summary,
  opensAt,
  closesAt,
}: {
  agendaId: string;
  title: string;
  summary: AgendaSummary | undefined;
  opensAt: string | null;
  closesAt: string | null;
}) {
  const { data: outcome, isLoading } = useAgendaOutcome(agendaId);
  const final = outcome?.final_participants ?? summary?.final_participants ?? 0;
  const rules = outcome?.rules;

  const share = async () => {
    const url = `${window.location.origin}/gonglon/${agendaId}`;
    const common = outcome?.common?.[0]?.body;
    const text = common
      ? `${title} — 참여자 ${final}명. 양쪽 모두 동의한 것: "${common}"`
      : `${title} — 참여자 ${final}명의 공론 결과`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `공론 결과 · ${title}`, text, url });
      } catch {
        /* 닫음 */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('결과 링크를 복사했어요');
    } catch {
      toast.error('복사하지 못했어요');
    }
  };

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" role="status" aria-label="결과 불러오는 중" />;
  }

  const period = [fmtDay(opensAt), fmtDay(closesAt)].filter(Boolean).join('~');

  return (
    <section aria-labelledby="outcome-title" className="space-y-4 rounded-2xl border-[1.5px] border-primary/60 bg-card p-4">
      <div className="space-y-0.5">
        <h2 id="outcome-title" className="text-[17px] font-bold">공론 결과</h2>
        <p className="text-[13px] text-muted-foreground">
          최종 의견 {final.toLocaleString()}명{period ? ` · ${period}` : ''}
        </p>
      </div>

      {outcome?.reason === 'quiet' ? (
        <p className="text-sm text-muted-foreground">선거 기간에는 공론 결과를 정리해 보여 드리지 않아요. 선거가 끝나면 다시 보여 드려요.</p>
      ) : (
        <>
          <Block n="①" title="이렇게 생각했어요">
            {summary?.revealed ? (
              <ResultBars summary={summary} />
            ) : (
              <p className="text-sm text-muted-foreground">최종 의견이 5명 이상 모이지 않아 분포를 보여 드리지 않아요.</p>
            )}
          </Block>

          {outcome?.available ? (
            <>
              <Block n="②" title="양쪽 모두 동의한 것">
                {(outcome.common ?? []).length > 0 ? (
                  <ul className="space-y-2">
                    {outcome.common!.map((s) => <StatementRow key={s.id} s={s} />)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    질문에 동의한 쪽과 비동의한 쪽이 함께 동의한 한 줄 의견은 없었어요.
                  </p>
                )}
              </Block>

              {(outcome.divisive ?? []).length > 0 && (
                <Block n="③" title="가장 크게 갈린 것">
                  <ul className="space-y-2">
                    {outcome.divisive!.map((s) => <StatementRow key={s.id} s={s} />)}
                  </ul>
                </Block>
              )}

              {(outcome.conditions ?? []).length > 0 && (
                <Block n="④" title="받아들일 수 있는 조건">
                  <ul className="space-y-1.5 text-sm">
                    {outcome.conditions!.map((c) => (
                      <li key={c.id} className="flex items-baseline justify-between gap-3">
                        <span>{c.label}</span>
                        <span className="shrink-0 tabular-nums font-semibold">{pct(c.share)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">조건 질문에 답한 {outcome.conditions_answered?.toLocaleString()}명 중 고른 비율 (여러 개 선택)</p>
                </Block>
              )}
            </>
          ) : outcome?.reason === 'few' ? (
            <p className="rounded-xl bg-secondary/60 px-3 py-2.5 text-[13px] text-foreground/80">
              최종 의견이 {rules?.min_final ?? 30}명 이상 모여야 '양쪽 모두 동의한 것'과 '갈린 것'을 정리해요. (이번 공론 {final}명)
            </p>
          ) : null}
        </>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        민심잇다 참여자 {final.toLocaleString()}명의 의견이며, 무작위 표본 조사가 아니에요.
        {rules && outcome?.available && ` '동의한 쪽'·'비동의한 쪽'은 질문에 대한 최종 의견으로 나눴고, 양쪽에서 각각 ${rules.min_group}명 이상 반응한 한 줄 의견만 계산했어요.`}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          className="flex h-10 items-center gap-1.5 rounded-full border border-border px-3.5 text-[13px] font-semibold hover:bg-secondary"
        >
          <Share2 size={15} aria-hidden /> 결과 공유하기
        </button>
        <FollowAfter agendaId={agendaId} />
      </div>
    </section>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[15px] font-bold">
        <span aria-hidden className="mr-1 text-primary">{n}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatementRow({ s }: { s: OutcomeStatement }) {
  return (
    <li className="space-y-1.5 rounded-xl bg-secondary/50 px-3 py-2.5">
      <p className="text-[15px] font-medium leading-snug">“{s.body}”</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <SideBar label={`${CHOICE_LABELS.agree}한 쪽`} value={s.agree_side} n={s.n_agree_side} />
        <SideBar label={`${CHOICE_LABELS.disagree}한 쪽`} value={s.disagree_side} n={s.n_disagree_side} />
      </div>
    </li>
  );
}

function SideBar({ label, value, n }: { label: string; value: number; n: number }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground">
        {label} <strong className="text-foreground">{pct(value)}</strong> 동의
        <span className="sr-only"> ({n}명 중)</span>
      </p>
      <span className="block h-1.5 overflow-hidden rounded-full bg-background" aria-hidden>
        <span className="block h-full rounded-full bg-primary/70" style={{ width: pct(value) }} />
      </span>
    </div>
  );
}

/** 이후 소식(지금 상황·관련 법안 변화) 알림 = 의제 '관심' */
function FollowAfter({ agendaId }: { agendaId: string }) {
  const { data: engagement } = useAgendaEngagement(agendaId);
  const toggle = useToggleAgendaInterest();
  const { requireLogin, handleError, loginModal } = useLoginPrompt();
  const on = engagement?.my_interest ?? false;
  return (
    <>
      <button
        type="button"
        aria-pressed={on}
        disabled={toggle.isPending || !engagement}
        onClick={() => requireLogin('interest', () => toggle.mutate(agendaId, { onError: handleError }))}
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold',
          on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary',
        )}
      >
        {on ? <BellRing size={15} aria-hidden /> : <Bell size={15} aria-hidden />}
        {on ? '이후 소식 받는 중' : '이후 소식 알림 받기'}
      </button>
      {loginModal}
    </>
  );
}
