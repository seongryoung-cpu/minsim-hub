import { useMemo, useState } from 'react';
import { Bell, BellRing, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CHOICE_LABELS,
  useAgendaStatements,
  useAgendaSummary,
  useCastAgendaVote,
  useReactToStatement,
  type AgendaChoice,
  type AgendaStatement,
} from '@/hooks/useAgendas';
import { useAgendaEngagement, useToggleAgendaInterest } from '@/hooks/useClaims';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import { VoteChoiceButtons } from '@/components/gonglon/VoteChoiceButtons';
import { ResultBars } from '@/components/gonglon/ResultBars';
import { CHOICE_SELECTED } from '@/components/gonglon/choiceStyles';
import { useAgendaConditions, useSetConditionPicks } from '@/hooks/useAgendaConditions';

const STEP_COUNT = 3;

/**
 * 1분 참여 (진행 중 의제 맨 위): 투표 → (조건 질문이 있으면) 받아들일 조건 → 다른 사람 한 줄 의견 3개에 반응 → 끝 (마감 알림)
 * - 투표는 지금까지와 같은 '최종 의견'으로 남는다 (빠른 투표 카드에서 누른 건 '첫 반응')
 * - 의견 3개는 공감 많은 것과 의견이 갈리는 것을 번갈아 골라, 한쪽 의견만 나오지 않게 한다
 * - 더 깊게 참여하려면 아래 '더 알아보기'(주장 비교, 한 줄 의견 쓰기 등)
 */
export function QuickParticipate({ agendaId, question, onMore }: { agendaId: string; question: string; onMore: () => void }) {
  const { data: summary } = useAgendaSummary(agendaId);
  const vote = useCastAgendaVote();
  const react = useReactToStatement();
  const { requireLogin, handleError, loginModal } = useLoginPrompt();
  const agreed = useAgendaStatements(agendaId, 'agreed');
  const divisive = useAgendaStatements(agendaId, 'divisive');
  const [changing, setChanging] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const { data: cond } = useAgendaConditions(agendaId);
  const setPicks = useSetConditionPicks(agendaId);
  const [condSkipped, setCondSkipped] = useState(false);
  const [condDraft, setCondDraft] = useState<string[]>([]);
  const hasConditions = (cond?.conditions.length ?? 0) > 0;
  const condAnswered = (cond?.myPicks.length ?? 0) > 0;

  const myFirst = summary?.my_first ?? null;
  const myFinal = summary?.my_final ?? null;

  // 반응할 의견 고르기: 공감 많은 순과 갈리는 순을 번갈아, 내 글 제외, 3개
  const picks = useMemo(() => {
    const a = agreed.statements.filter((s) => !s.is_mine);
    const d = divisive.statements.filter((s) => !s.is_mine);
    const out: AgendaStatement[] = [];
    const seen = new Set<string>();
    for (let i = 0; out.length < STEP_COUNT && (i < a.length || i < d.length); i++) {
      for (const s of [a.at(i), d.at(i)]) {
        if (s && !seen.has(s.id) && out.length < STEP_COUNT) {
          seen.add(s.id);
          out.push(s);
        }
      }
    }
    return out;
    // 목록이 다시 불러와져도 고른 의견이 바뀌지 않게, 처음 불러온 순서만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreed.isLoading, divisive.isLoading]);

  // 최신 반응 상태는 다시 불러온 목록에서 읽는다
  const latest = new Map([...agreed.statements, ...divisive.statements].map((s) => [s.id, s]));
  const current = picks.find((p) => !latest.get(p.id)?.my_reaction && !skipped.includes(p.id));
  const doneCount = picks.filter((p) => latest.get(p.id)?.my_reaction || skipped.includes(p.id)).length;

  const choose = (choice: AgendaChoice) =>
    requireLogin('vote', () =>
      vote.mutate(
        { agendaId, stage: 'final', choice, source: 'agenda' },
        { onSuccess: () => setChanging(false), onError: handleError },
      ),
    );

  const onReact = (s: AgendaStatement, choice: AgendaChoice) =>
    requireLogin('vote', () => react.mutate({ agendaId, statementId: s.id, choice }, { onError: handleError }));

  const step: Step =
    !myFinal || changing ? 'vote'
      : hasConditions && !condAnswered && !condSkipped ? 'conditions'
        : current ? 'react' : 'done';

  const toggleCond = (id: string, exclusive: boolean) =>
    setCondDraft((d) => {
      if (d.includes(id)) return d.filter((x) => x !== id);
      const excl = new Set((cond?.conditions ?? []).filter((c) => c.is_exclusive).map((c) => c.id));
      // '어떤 조건이어도 어렵다' 같은 선택지는 다른 것과 함께 고를 수 없다
      return exclusive ? [id] : [...d.filter((x) => !excl.has(x)), id];
    });
  const saveConditions = () =>
    requireLogin('vote', () => setPicks.mutate(condDraft, { onError: handleError }));

  return (
    <section aria-labelledby="quick-title" className="space-y-3 rounded-2xl border-[1.5px] border-primary/60 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="quick-title" className="text-[17px] font-bold">1분 참여</h2>
        <Steps step={step} doneCount={doneCount} total={picks.length} withConditions={hasConditions} />
      </div>

      {step === 'vote' && (
        <div className="space-y-3">
          {myFirst && !myFinal && (
            <p className="rounded-[10px] bg-accent/10 px-3 py-2 text-[13px] text-foreground/80">
              카드에서 남긴 첫 반응: <strong className="text-foreground">{CHOICE_LABELS[myFirst]}</strong>
            </p>
          )}
          <p className="text-[15px] font-semibold leading-relaxed">“{question}”</p>
          <VoteChoiceButtons label="내 의견" value={myFinal} onChoose={choose} disabled={vote.isPending} />
          {changing && (
            <button type="button" onClick={() => setChanging(false)} className="h-9 text-[13px] text-muted-foreground">
              바꾸지 않기
            </button>
          )}
        </div>
      )}

      {step === 'conditions' && cond && (
        <div className="space-y-3">
          <MyChoiceLine choice={myFinal} onChange={() => setChanging(true)} />
          <p className="text-[15px] font-semibold">어떤 조건이면 받아들일 수 있나요?</p>
          <p className="-mt-2 text-[13px] text-muted-foreground">여러 개 고를 수 있어요. 결과에는 비율로만 나와요.</p>
          <fieldset className="space-y-1.5">
            <legend className="sr-only">받아들일 수 있는 조건</legend>
            {cond.conditions.map((c) => {
              const on = condDraft.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm',
                    on ? 'border-primary bg-primary/5 font-semibold' : 'border-border hover:bg-secondary/60',
                  )}
                >
                  <input type="checkbox" checked={on} onChange={() => toggleCond(c.id, c.is_exclusive)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  {c.label}
                </label>
              );
            })}
          </fieldset>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={condDraft.length === 0 || setPicks.isPending}
              onClick={saveConditions}
              className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              다음
            </button>
            <button type="button" onClick={() => setCondSkipped(true)} className="h-11 px-3 text-[13px] text-muted-foreground">
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {step === 'react' && current && (
        <div className="space-y-3">
          <MyChoiceLine choice={myFinal} onChange={() => setChanging(true)} />
          <p className="text-[13px] text-muted-foreground">
            다른 사람들의 한 줄 의견 ({doneCount + 1}/{picks.length}) · 동의하나요?
          </p>
          <p className="rounded-xl bg-secondary/60 px-3 py-3 text-[15px] leading-relaxed">“{current.body}”</p>
          <div role="group" aria-label="이 의견에 반응" className="grid grid-cols-3 gap-2">
            {(['agree', 'disagree', 'hold'] as AgendaChoice[]).map((c) => (
              <button
                key={c}
                type="button"
                disabled={react.isPending}
                onClick={() => onReact(current, c)}
                className={cn('h-11 rounded-xl border-[1.5px] border-border bg-card text-sm font-semibold hover:bg-secondary', react.isPending && 'opacity-60')}
              >
                {CHOICE_LABELS[c]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSkipped((s) => [...s, current.id])}
            className="h-9 text-[13px] text-muted-foreground"
          >
            건너뛰기
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3">
          <MyChoiceLine choice={myFinal} onChange={() => setChanging(true)} />
          <p className="flex items-center gap-1.5 text-[15px] font-semibold">
            <Check size={18} className="text-primary" aria-hidden /> 참여했어요. 마감되면 결과를 알려 드릴게요
          </p>
          {summary?.revealed && <ResultBars summary={summary} />}
          {picks.length === 0 && (
            <p className="text-[13px] text-muted-foreground">아직 다른 사람의 한 줄 의견이 없어요. 아래에서 첫 의견을 남겨 주세요.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <AlertButton agendaId={agendaId} />
            <button
              type="button"
              onClick={onMore}
              className="flex h-10 items-center gap-1 rounded-full border border-border px-3.5 text-[13px] font-semibold hover:bg-secondary"
            >
              더 깊게 보기 <ChevronDown size={15} aria-hidden />
            </button>
          </div>
        </div>
      )}
      {loginModal}
    </section>
  );
}

type Step = 'vote' | 'conditions' | 'react' | 'done';

function Steps({ step, doneCount, total, withConditions }: { step: Step; doneCount: number; total: number; withConditions: boolean }) {
  const c = withConditions ? 1 : 0;
  const at = step === 'vote' ? 0 : step === 'conditions' ? 1 : step === 'react' ? 1 + c + doneCount : 1 + c + total;
  const all = 1 + c + total;
  return (
    <span className="flex items-center gap-1" aria-label={`${all}단계 중 ${Math.min(at, all)}단계 완료`}>
      {Array.from({ length: all }, (_, i) => (
        <span key={i} className={cn('h-1.5 w-5 rounded-full', i < at ? 'bg-primary' : 'bg-secondary')} />
      ))}
    </span>
  );
}

function MyChoiceLine({ choice, onChange }: { choice: AgendaChoice | null; onChange: () => void }) {
  if (!choice) return null;
  return (
    <p className="flex items-center gap-2 text-[13px]">
      내 의견
      <span className={cn('rounded-full border px-2.5 py-0.5 font-semibold', CHOICE_SELECTED[choice])}>{CHOICE_LABELS[choice]}</span>
      <button type="button" onClick={onChange} className="h-8 px-1 text-muted-foreground underline">
        바꾸기
      </button>
    </p>
  );
}

/** 마감·결과 알림 = 의제 '관심' */
function AlertButton({ agendaId }: { agendaId: string }) {
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
        {on ? '결과 알림 받는 중' : '결과 알림 받기'}
      </button>
      {loginModal}
    </>
  );
}
