import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, CornerUpLeft, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  CHOICE_LABELS,
  ISSUE_KIND_LABELS,
  STATEMENT_MAX,
  STATEMENT_MIN,
  agendaDDay,
  effectiveAgendaStatus,
  formatAgendaDate,
  useAgenda,
  useAgendaRelatedPledges,
  useAgendaStatements,
  useAgendaSummary,
  useCastAgendaVote,
  useDeleteStatement,
  usePostStatement,
  useReactToStatement,
  type Agenda,
  type AgendaChoice,
  type AgendaIssue,
  type AgendaStatement,
  type IssueKind,
  type StatementSort,
} from '@/hooks/useAgendas';
import { candidatePath } from '@/hooks/useCandidates';
import { VoteChoiceButtons } from '@/components/gonglon/VoteChoiceButtons';
import { CHOICE_SELECTED } from '@/components/gonglon/choiceStyles';
import { ResultBars } from '@/components/gonglon/ResultBars';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import type { AgendaFrom } from '@/components/gonglon/AgendaLinkCard';
import { PageLoading } from '@/components/ui/loading-state';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AgendaDetail() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId && UUID_RE.test(rawId) ? rawId : undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: AgendaFrom } | null)?.from;

  const { data, isLoading } = useAgenda(id);
  const { data: summary } = useAgendaSummary(data ? id : undefined);

  if (id && isLoading) return <PageLoading />;

  if (!data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-muted-foreground">의제를 찾을 수 없어요.</p>
        <Link to="/gonglon" className="text-sm font-semibold text-primary">
          공론 허브로 가기
        </Link>
      </div>
    );
  }

  const { agenda, issues } = data;
  const status = summary?.status ?? effectiveAgendaStatus(agenda.status, agenda.closes_at);
  const isOpen = status === 'open';
  const dday = isOpen ? agendaDDay(agenda.closes_at) : null;

  const share = async () => {
    const url = `${window.location.origin}/gonglon/${agenda.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: agenda.title, url });
      } catch {
        /* 사용자가 공유 창을 닫음 */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('링크를 복사했어요');
    } catch {
      toast.error('복사하지 못했어요');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-28 lg:pb-12"
    >
      {from && (
        <div className="border-b border-accent/30 bg-accent/10">
          <div className="mx-auto flex min-h-12 max-w-2xl items-center gap-2 py-1 pl-3.5 pr-2">
            <CornerUpLeft size={16} className="shrink-0 text-accent" aria-hidden />
            <span className="flex-1 text-[13px] leading-snug text-foreground/80">{from.label}</span>
            <button
              type="button"
              onClick={() => navigate(from.path)}
              className="h-10 shrink-0 px-2 text-[13px] font-semibold text-accent"
            >
              돌아가기
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-1">
          <button
            type="button"
            aria-label="공론 허브로"
            onClick={() => navigate('/gonglon')}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-semibold">공론</span>
          <button
            type="button"
            aria-label="공유"
            onClick={share}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary"
          >
            <Share2 size={19} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-7 px-4 pt-5">
        {/* 제목 */}
        <section className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {agenda.category && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">{agenda.category}</span>
            )}
            <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
              {agenda.region_sido ?? '전국'}
            </span>
            {status === 'draft' ? (
              <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-muted-foreground">
                초안 · 관리자만 보여요
              </span>
            ) : isOpen ? (
              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
                진행 중{dday ? ` · ${dday}` : ''}
              </span>
            ) : (
              <span className="rounded-md bg-foreground px-2 py-0.5 text-background">마감</span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug tracking-tight">{agenda.title}</h1>
          <p className="text-[13px] text-muted-foreground">
            참여 {(summary?.participants ?? 0).toLocaleString()}명
            {agenda.closes_at && ` · ${isOpen ? '마감' : '마감됨'} ${formatAgendaDate(agenda.closes_at)}`}
          </p>
        </section>

        <BackgroundSection agenda={agenda} />

        {issues.length > 0 && <IssueCarousel issues={issues} />}

        <MyOpinionSection agenda={agenda} status={status} />

        <StatementsSection agendaId={agenda.id} isOpen={isOpen} />

        <RelatedPledgesSection agendaId={agenda.id} agendaTitle={agenda.title} />
      </main>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 배경
// ─────────────────────────────────────────────────────────────
function BackgroundSection({ agenda }: { agenda: Agenda }) {
  const [expanded, setExpanded] = useState(false);
  const rows = [
    { label: '현황', text: agenda.summary },
    { label: '쟁점', text: agenda.split_reason },
    { label: '결정', text: agenda.question },
  ].filter((r) => r.text?.trim());

  if (rows.length === 0 && !agenda.background.trim()) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-bold">배경</h2>
      {rows.map((r) => (
        <div key={r.label} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
          <span className="w-11 shrink-0 font-semibold text-muted-foreground">{r.label}</span>
          <span className="whitespace-pre-line">{r.text}</span>
        </div>
      ))}
      {agenda.background.trim() && (
        <>
          {expanded && (
            <div className="whitespace-pre-line rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed text-foreground/85">
              {agenda.background}
            </div>
          )}
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="flex h-10 items-center gap-0.5 text-sm font-semibold text-primary"
          >
            {expanded ? '배경 자료 접기' : '배경 자료 전체 보기'}
            <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} aria-hidden />
          </button>
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 쟁점 카드 (사실 · 찬성 · 반대 탭, 좌우 스와이프)
// ─────────────────────────────────────────────────────────────
const KIND_STYLE: Record<IssueKind, { card: string; chip: string }> = {
  pro: { card: 'border-primary', chip: 'bg-primary/10 text-primary' },
  con: { card: 'border-accent', chip: 'bg-accent/10 text-accent' },
  fact: { card: 'border-border', chip: 'bg-secondary text-secondary-foreground' },
  point: { card: 'border-border', chip: 'bg-secondary text-secondary-foreground' },
};

/** 탭 순서: 사실을 먼저 읽고 찬반으로 넘어가도록 */
const TAB_ORDER: IssueKind[] = ['fact', 'point', 'pro', 'con'];
const TAB_LABEL: Record<IssueKind, string> = { fact: '사실', point: '쟁점', pro: '찬성', con: '반대' };
const TAB_ACTIVE: Record<IssueKind, string> = {
  fact: 'text-foreground',
  point: 'text-foreground',
  pro: 'text-primary',
  con: 'text-accent',
};

/** 사실 · 찬성 · 반대 탭 + 좌우 스와이프 (한 번에 한 묶음씩 전체 너비로) */
function IssueCarousel({ issues }: { issues: AgendaIssue[] }) {
  const groups = TAB_ORDER.map((kind) => ({
    kind,
    items: issues.filter((i) => (i.kind in KIND_STYLE ? i.kind : 'point') === kind),
  })).filter((g) => g.items.length > 0);

  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    setIndex(i);
  };

  // 첫 방문 시 한 번만 스와이프 힌트 애니메이션
  useEffect(() => {
    if (groups.length <= 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const HINT_KEY = 'minsim-issue-swipe-hinted';
    if (localStorage.getItem(HINT_KEY)) return;
    localStorage.setItem(HINT_KEY, '1');

    const el = scroller.current;
    if (!el) return;

    // 600ms 후 살짝 오른쪽으로, 그 뒤 다시 처음으로 복귀
    const t1 = setTimeout(() => {
      el.scrollTo({ left: 60, behavior: 'smooth' });
    }, 600);
    const t2 = setTimeout(() => {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    }, 1000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  // groups.length는 마운트 시 결정되므로 exhaustive-deps 경고 무시
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-bold">쟁점 카드</h2>

      {groups.length > 1 && (
        <div role="tablist" aria-label="쟁점 종류" className="flex gap-0.5 rounded-xl bg-secondary p-[3px]">
          {groups.map((g, i) => {
            const active = i === index;
            return (
              <button
                key={g.kind}
                type="button"
                role="tab"
                id={`issue-tab-${g.kind}`}
                aria-selected={active}
                aria-controls={`issue-panel-${g.kind}`}
                onClick={() => goTo(i)}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-1 rounded-[9px] text-[13px] font-semibold transition-colors',
                  active ? cn('bg-card shadow-sm', TAB_ACTIVE[g.kind]) : 'text-muted-foreground',
                )}
              >
                {TAB_LABEL[g.kind]}
                <span className="text-[11px] font-medium tabular-nums opacity-70">{g.items.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== index) setIndex(Math.min(groups.length - 1, Math.max(0, i)));
        }}
        className="-mx-4 flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((g) => (
          <div
            key={g.kind}
            role="tabpanel"
            id={`issue-panel-${g.kind}`}
            aria-labelledby={`issue-tab-${g.kind}`}
            className="flex w-full shrink-0 snap-start snap-always flex-col gap-2.5 px-4"
          >
            {g.items.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ))}
      </div>

    </section>
  );
}

function IssueCard({ issue }: { issue: AgendaIssue }) {
  const [showSources, setShowSources] = useState(false);
  const kind = (issue.kind in KIND_STYLE ? issue.kind : 'point') as IssueKind;
  const style = KIND_STYLE[kind];

  return (
    <article
      className={cn('flex flex-col gap-2.5 rounded-2xl border-[1.5px] bg-card p-4', style.card)}
    >
      <span className={cn('self-start rounded-md px-2 py-0.5 text-xs font-bold', style.chip)}>
        {ISSUE_KIND_LABELS[kind]}
      </span>
      <h3 className="text-[15px] font-semibold leading-snug">{issue.title}</h3>
      {issue.body && <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{issue.body}</p>}
      {issue.sources.length > 0 && (
        <div className="mt-auto pt-1">
          <button
            type="button"
            aria-expanded={showSources}
            onClick={() => setShowSources((v) => !v)}
            className="flex h-8 items-center gap-0.5 text-xs text-muted-foreground"
          >
            출처 {issue.sources.length}개
            <ChevronDown size={14} className={cn('transition-transform', showSources && 'rotate-180')} aria-hidden />
          </button>
          {showSources && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {issue.sources.map((src, i) => (
                <li key={i} className="break-all">
                  {/^https?:\/\//.test(src) ? (
                    <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">
                      {safeHost(src)}
                    </a>
                  ) : (
                    src
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ─────────────────────────────────────────────────────────────
// 내 의견 (최종 의견) + 결과
// ─────────────────────────────────────────────────────────────
function MyOpinionSection({ agenda, status }: { agenda: Agenda; status: string }) {
  const { data: summary } = useAgendaSummary(agenda.id);
  const vote = useCastAgendaVote();
  const { handleError, loginModal } = useLoginPrompt();
  const isOpen = status === 'open';
  const isClosed = status === 'closed';
  const myFirst = summary?.my_first ?? null;
  const myFinal = summary?.my_final ?? null;
  const finalCount = summary?.final_participants ?? 0;

  const choose = (choice: AgendaChoice) =>
    vote.mutate({ agendaId: agenda.id, stage: 'final', choice, source: 'agenda' }, { onError: handleError });

  const heading = isClosed
    ? '공론 결과'
    : myFirst
      ? '쟁점을 읽고 나서 생각이 바뀌었나요?'
      : '쟁점을 읽고 어떻게 생각하세요?';

  return (
    <section aria-label="내 의견" className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
      {myFirst && !isClosed && (
        <div className="rounded-[10px] bg-accent/10 px-3 py-2.5 text-[13px] text-foreground/80">
          카드에서 남긴 첫 반응: <strong className="text-foreground">{CHOICE_LABELS[myFirst]}</strong>
        </div>
      )}
      <h2 className="text-[17px] font-bold">{heading}</h2>
      {agenda.question.trim() && !isClosed && (
        <p className="text-sm leading-relaxed text-foreground/80">“{agenda.question.trim()}”</p>
      )}

      {isOpen && (
        <VoteChoiceButtons label="최종 의견" value={myFinal} onChoose={choose} disabled={vote.isPending} />
      )}

      {myFinal && (
        <p className="text-sm font-semibold">
          내 최종 의견: {CHOICE_LABELS[myFinal]}
          {isOpen && <span className="ml-1 font-normal text-muted-foreground">· 다른 버튼을 누르면 바뀌어요</span>}
        </p>
      )}

      {summary?.revealed ? (
        <ResultBars summary={summary} />
      ) : isOpen && !myFinal ? (
        <p className="text-[13px] text-muted-foreground">최종 의견을 남기면 다른 시민들의 의견 분포가 보여요.</p>
      ) : finalCount < 5 ? (
        <p className="text-[13px] text-muted-foreground">
          최종 의견이 5명 이상 모이면 분포를 보여 드려요. (지금 {finalCount}명)
        </p>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          선거 기간에는 최종 의견을 남긴 분에게만 결과를 보여 드려요.
        </p>
      )}
      {loginModal}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 한 줄 의견 (답글 없음 · 동의/비동의/유보 반응만)
// ─────────────────────────────────────────────────────────────
const SORTS: { id: StatementSort; label: string }[] = [
  { id: 'agreed', label: '공감 많은 순' },
  { id: 'divisive', label: '의견 갈리는 순' },
  { id: 'latest', label: '최신순' },
];

function StatementsSection({ agendaId, isOpen }: { agendaId: string; isOpen: boolean }) {
  const [sort, setSort] = useState<StatementSort>('agreed');
  const [body, setBody] = useState('');
  const { statements, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useAgendaStatements(agendaId, sort);
  const post = usePostStatement();
  const { handleError, loginModal } = useLoginPrompt();

  const trimmed = body.trim();
  const canSubmit = trimmed.length >= STATEMENT_MIN && trimmed.length <= STATEMENT_MAX && !post.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    post.mutate(
      { agendaId, body: trimmed },
      {
        onSuccess: () => {
          setBody('');
          setSort('latest');
          toast.success('의견을 남겼어요');
        },
        onError: handleError,
      },
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold">한 줄 의견</h2>
        <div role="group" aria-label="정렬" className="flex gap-1">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sort === s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                'h-8 rounded-full px-2.5 text-xs',
                sort === s.id
                  ? 'bg-foreground font-semibold text-background'
                  : 'border border-border bg-card text-foreground/80',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isOpen ? (
        <form onSubmit={submit} className="space-y-1.5">
          <div className="flex gap-2">
            <label htmlFor="statement-input" className="sr-only">
              한 줄 의견
            </label>
            <input
              id="statement-input"
              type="text"
              value={body}
              maxLength={STATEMENT_MAX}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`한 줄로 의견을 남겨 주세요 (${STATEMENT_MAX}자)`}
              className="h-11 min-w-0 flex-1 rounded-[10px] border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 shrink-0 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              등록
            </button>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>답글은 달 수 없어요. 다른 의견에는 동의 · 비동의 · 유보로 반응해 주세요.</span>
            <span className="shrink-0 pl-2 tabular-nums">
              {body.length}/{STATEMENT_MAX}
            </span>
          </div>
        </form>
      ) : (
        <p className="text-[13px] text-muted-foreground">마감되어 더 이상 의견을 받지 않아요.</p>
      )}

      <div>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : statements.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isOpen ? '아직 한 줄 의견이 없어요. 첫 의견을 남겨 주세요.' : '남겨진 한 줄 의견이 없어요.'}
          </p>
        ) : (
          statements.map((s) => (
            <StatementItem key={s.id} statement={s} agendaId={agendaId} canReact={isOpen} onError={handleError} />
          ))
        )}
      </div>

      {hasNextPage && (
        <button
          type="button"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          className="h-11 w-full rounded-xl border border-border bg-card text-sm font-medium text-foreground/80 disabled:opacity-60"
        >
          {isFetchingNextPage ? '불러오는 중…' : '의견 더 보기'}
        </button>
      )}
      {loginModal}
    </section>
  );
}

function timeAgo(iso: string) {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (sec < 60) return '방금';
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)}시간 전`;
  if (sec < 86_400 * 7) return `${Math.floor(sec / 86_400)}일 전`;
  return formatAgendaDate(iso);
}

function StatementItem({
  statement,
  agendaId,
  canReact,
  onError,
}: {
  statement: AgendaStatement;
  agendaId: string;
  canReact: boolean;
  onError: (err: unknown) => void;
}) {
  const react = useReactToStatement();
  const remove = useDeleteStatement();
  const mine = statement.my_reaction as AgendaChoice | null;
  const counts: Record<AgendaChoice, number> = {
    agree: statement.agree,
    disagree: statement.disagree,
    hold: statement.hold,
  };

  const onReact = (choice: AgendaChoice) =>
    react.mutate(
      { agendaId, statementId: statement.id, choice: mine === choice ? null : choice },
      { onError },
    );

  return (
    <article className="space-y-2 border-b border-border/70 py-3.5">
      <p className="text-[15px] leading-relaxed">{statement.body}</p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {statement.is_mine && <span className="font-semibold text-primary">내 의견</span>}
        {statement.is_mine && <span aria-hidden>·</span>}
        <span>{timeAgo(statement.created_at)}</span>
        {statement.is_mine && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('이 의견을 지울까요?')) {
                remove.mutate({ agendaId, statementId: statement.id }, { onError });
              }
            }}
            disabled={remove.isPending}
            className="ml-auto flex h-8 items-center gap-1 rounded-full px-2 hover:bg-secondary"
          >
            <Trash2 size={13} aria-hidden /> 지우기
          </button>
        )}
      </div>
      <div role="group" aria-label="이 의견에 반응" className="flex gap-1.5">
        {(['agree', 'disagree', 'hold'] as AgendaChoice[]).map((choice) => {
          const selected = mine === choice;
          return (
            <button
              key={choice}
              type="button"
              aria-pressed={selected}
              disabled={!canReact || statement.is_mine || react.isPending}
              onClick={() => onReact(choice)}
              className={cn(
                'h-9 rounded-full border px-3 text-[13px] tabular-nums transition-colors disabled:cursor-default',
                selected ? CHOICE_SELECTED[choice] : 'border-border bg-card text-foreground/80 enabled:hover:bg-secondary',
              )}
            >
              {CHOICE_LABELS[choice]} {counts[choice]}
            </button>
          );
        })}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// 관련 공약 (연결된 공약이 있는 후보 전부, 같은 형식, 가나다순)
// ─────────────────────────────────────────────────────────────
function RelatedPledgesSection({ agendaId, agendaTitle }: { agendaId: string; agendaTitle: string }) {
  const { data: pledges } = useAgendaRelatedPledges(agendaId);
  if (!pledges || pledges.length === 0) return null;

  return (
    <section className="space-y-2.5">
      <h2 className="text-[17px] font-bold">이 의제와 관련된 공약</h2>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        연결된 공약이 있는 후보를 모두 같은 형식으로, 이름 가나다순으로 보여줘요. 후보의 찬반 입장을 뜻하지 않아요.
      </p>
      {pledges.map((p) => (
        <Link
          key={p.pledge_id}
          to={`${candidatePath({ id: p.candidate_id, slug: p.candidate_slug })}?tab=pledges`}
          state={{ fromAgenda: agendaTitle }}
          className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/50"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
          >
            {p.candidate_name.slice(0, 1)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {p.candidate_name}
              {p.party ? ` · ${p.party}` : ''}
            </span>
            <span className="truncate text-[15px] font-semibold">{p.pledge_title}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ))}
    </section>
  );
}
