import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAgenda } from '@/hooks/useAgendas';
import {
  CLAIM_STATUS_LABELS,
  PICK_REASON_MAX,
  perspectiveLabel,
  useAgendaClaims,
  useDeleteMyClaim,
  useEvaluateClaim,
  usePickClaim,
  type AgendaClaim,
  type EvidenceRating,
  type PerspectiveRating,
} from '@/hooks/useClaims';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import { ClaimWriteSheet } from '@/components/gonglon/ClaimWriteSheet';
import { PageLoading } from '@/components/ui/loading-state';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const STATUS_STYLE: Record<string, string> = {
  verified: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  review: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  new: 'bg-secondary text-secondary-foreground',
  hidden: 'border border-dashed border-border text-muted-foreground',
};

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * 공론 2단계: 주장 비교 + 가장 가까운 주장 고르기.
 * 좋아요 대신 '고른 사람 수', 검증 상태, 다른 관점 이해 평가를 보여 준다.
 * 쟁점별 화면은 ?issue=<쟁점 id> (없으면 의제 전체).
 */
export function ClaimsPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const agendaId = rawId && UUID_RE.test(rawId) ? rawId : undefined;
  const [params] = useSearchParams();
  const rawIssue = params.get('issue');
  const issueId = rawIssue && UUID_RE.test(rawIssue) ? rawIssue : null;
  const navigate = useNavigate();

  const { data: agendaData, isLoading: agendaLoading } = useAgenda(agendaId);
  const { data, isLoading } = useAgendaClaims(agendaId, issueId);
  const [expandAll, setExpandAll] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);

  if (agendaLoading || isLoading) return <PageLoading />;

  const back = () => navigate(agendaId ? `/gonglon/${agendaId}` : '/gonglon');
  const issue = issueId ? agendaData?.issues.find((i) => i.id === issueId) : undefined;

  if (!agendaData || !data?.enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-muted-foreground">주장 비교는 아직 준비 중이에요.</p>
        <Link to={agendaId ? `/gonglon/${agendaId}` : '/gonglon'} className="text-sm font-semibold text-primary">
          의제로 돌아가기
        </Link>
      </div>
    );
  }

  const claims = data.claims ?? [];
  const isOpen = data.agenda_status === 'open';

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-12">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-1">
          <button
            type="button"
            aria-label="의제로 돌아가기"
            onClick={back}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="truncate text-sm text-muted-foreground">{agendaData.agenda.title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-5">
        <section className="space-y-2">
          <p className="text-xs font-bold text-primary">{issue ? `쟁점 · ${issue.title}` : '주장 비교'}</p>
          <h1 className="text-2xl font-bold tracking-tight">어떤 주장이 내 생각과 가장 가까운가요?</h1>
          <p className="text-sm leading-relaxed text-foreground/80">
            주장 {claims.length}개 · 고른 사람 {(data.total_picks ?? 0).toLocaleString()}명. 인기순이 아니라 검증 상태와
            고른 사람 수로 정렬해요.
          </p>
        </section>

        {claims.length > 0 && (
          <button
            type="button"
            aria-expanded={expandAll}
            onClick={() => setExpandAll((v) => !v)}
            className="flex min-h-12 w-full items-center justify-between rounded-xl bg-accent/10 px-4 text-left text-sm font-semibold text-accent"
          >
            {expandAll ? '근거와 반론 접기' : '고르기 전에 각 주장의 근거와 반론 펼쳐 보기'}
            <ChevronDown size={18} className={cn('shrink-0 transition-transform', expandAll && 'rotate-180')} aria-hidden />
          </button>
        )}

        <section aria-label="주장 목록" className="space-y-3">
          {claims.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">아직 주장이 없어요. 첫 주장을 올려 주세요.</p>
            </div>
          ) : (
            claims.map((c, i) => (
              <ClaimCard
                key={c.id}
                claim={c}
                letter={LETTERS[i] ?? String(i + 1)}
                agendaId={agendaId!}
                canInteract={isOpen}
                forceOpen={expandAll}
              />
            ))
          )}
        </section>

        {claims.length > 0 && (
          <PickSection
            agendaId={agendaId!}
            claims={claims}
            myPick={data.my_pick ?? null}
            isOpen={isOpen}
            onWrite={() => setWriteOpen(true)}
          />
        )}

        {isOpen && claims.length === 0 && (
          <button
            type="button"
            onClick={() => setWriteOpen(true)}
            className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            첫 주장 쓰기
          </button>
        )}
      </main>

      <ClaimWriteSheet open={writeOpen} onOpenChange={setWriteOpen} agendaId={agendaId!} issueId={issueId} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 주장 카드
// ─────────────────────────────────────────────────────────────
function ClaimCard({
  claim,
  letter,
  agendaId,
  canInteract,
  forceOpen,
}: {
  claim: AgendaClaim;
  letter: string;
  agendaId: string;
  canInteract: boolean;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const remove = useDeleteMyClaim();
  const { handleError, loginModal } = useLoginPrompt();
  const expanded = open || forceOpen;
  const hasDetail = !!claim.reason || !!claim.counter || claim.sources.length > 0;
  const perspective = perspectiveLabel(claim);

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-sm font-extrabold"
        >
          {letter}
        </span>
        <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', STATUS_STYLE[claim.status])}>
          {CLAIM_STATUS_LABELS[claim.status]}
        </span>
      </div>

      <p className="text-base font-semibold leading-snug">
        <span className="sr-only">주장 {letter}: </span>
        {claim.body}
      </p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{claim.is_mine ? '내 주장' : claim.author}</span>
        <span>고른 사람 {claim.pick_count.toLocaleString()}명</span>
        {claim.reason && <span>근거 있음</span>}
        {claim.sources.length > 0 && <span>출처 {claim.sources.length}</span>}
        {claim.counter && <span>예상 반론 있음</span>}
      </div>

      {perspective && (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-foreground/80">
          다른 관점 이해 평가 · <strong className="text-foreground">{perspective}</strong>{' '}
          <span className="text-muted-foreground">({claim.eval_count}명 평가)</span>
        </p>
      )}

      {hasDetail && !forceOpen && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 items-center gap-0.5 text-[13px] font-semibold text-primary"
        >
          {expanded ? '접기' : '근거와 반론 보기'}
          <ChevronDown size={15} className={cn('transition-transform', expanded && 'rotate-180')} aria-hidden />
        </button>
      )}

      {expanded && hasDetail && (
        <div className="space-y-3 border-t border-border pt-3 text-sm leading-relaxed">
          {claim.reason && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground">근거</p>
              <p className="whitespace-pre-line text-foreground/85">{claim.reason}</p>
            </div>
          )}
          {claim.counter && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground">예상되는 반론</p>
              <p className="whitespace-pre-line text-foreground/85">{claim.counter}</p>
            </div>
          )}
          {claim.sources.length > 0 && (
            <ul className="space-y-1">
              {claim.sources.map((src) => (
                <li key={src}>
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex min-h-8 items-center gap-1 text-xs text-primary underline"
                  >
                    {safeHost(src)} <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canInteract && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {claim.is_mine ? (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm('이 주장을 지울까요? 다른 사람이 고른 주장은 숨김 처리돼요.')) {
                  remove.mutate(
                    { agendaId, claimId: claim.id },
                    { onSuccess: () => toast.success('주장을 지웠어요'), onError: handleError },
                  );
                }
              }}
              className="flex h-9 items-center gap-1 rounded-full px-3 text-xs text-muted-foreground hover:bg-secondary"
            >
              <Trash2 size={13} aria-hidden /> 지우기
            </button>
          ) : (
            <button
              type="button"
              aria-expanded={evaluating}
              onClick={() => setEvaluating((v) => !v)}
              className="h-9 rounded-full border border-border px-3 text-xs font-semibold text-foreground/80 hover:bg-secondary"
            >
              {claim.my_evaluation ? '내 평가 바꾸기' : '이 주장 평가하기'}
            </button>
          )}
        </div>
      )}

      {evaluating && !claim.is_mine && (
        <EvaluationForm claim={claim} agendaId={agendaId} onDone={() => setEvaluating(false)} />
      )}
      {loginModal}
    </article>
  );
}

const EVIDENCE_OPTIONS: { value: EvidenceRating; label: string }[] = [
  { value: 'clear', label: '명확해요' },
  { value: 'partly', label: '일부만' },
  { value: 'unclear', label: '부족해요' },
];
const PERSPECTIVE_OPTIONS: { value: PerspectiveRating; label: string }[] = [
  { value: 'good', label: '잘 설명했어요' },
  { value: 'partly', label: '일부 설명했어요' },
  { value: 'poor', label: '부족해요' },
];

function EvaluationForm({ claim, agendaId, onDone }: { claim: AgendaClaim; agendaId: string; onDone: () => void }) {
  const [evidence, setEvidence] = useState<EvidenceRating | null>(claim.my_evaluation?.evidence ?? null);
  const [perspective, setPerspective] = useState<PerspectiveRating | null>(claim.my_evaluation?.perspective ?? null);
  const evaluate = useEvaluateClaim();
  const { handleError, loginModal } = useLoginPrompt();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!evidence || !perspective) return;
    evaluate.mutate(
      { agendaId, claimId: claim.id, evidence, perspective },
      {
        onSuccess: () => {
          toast.success('평가를 남겼어요');
          onDone();
        },
        onError: handleError,
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-secondary/50 p-3.5">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[13px] font-semibold">근거가 명확한가요?</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {EVIDENCE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={evidence === o.value}
              onClick={() => setEvidence(o.value)}
              className={cn(
                'h-10 rounded-lg border text-[13px]',
                evidence === o.value ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border bg-card',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[13px] font-semibold">자신과 다른 관점도 정확하게 설명하나요?</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {PERSPECTIVE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={perspective === o.value}
              onClick={() => setPerspective(o.value)}
              className={cn(
                'min-h-10 rounded-lg border px-1 text-[13px] leading-tight',
                perspective === o.value ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border bg-card',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={!evidence || !perspective || evaluate.isPending}
        className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        평가 남기기
      </button>
      {loginModal}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// 가장 가까운 주장 고르기
// ─────────────────────────────────────────────────────────────
function PickSection({
  agendaId,
  claims,
  myPick,
  isOpen,
  onWrite,
}: {
  agendaId: string;
  claims: AgendaClaim[];
  myPick: { claim_id: string; reason: string } | null;
  isOpen: boolean;
  onWrite: () => void;
}) {
  const { isAuthenticated } = useAuthContext();
  const [selected, setSelected] = useState<string | null>(myPick?.claim_id ?? null);
  const [reason, setReason] = useState(myPick?.reason ?? '');
  const pick = usePickClaim();
  const { handleError, openLogin, loginModal } = useLoginPrompt();

  // 서버 값이 늦게 오거나 바뀌면 따라간다
  useEffect(() => {
    setSelected(myPick?.claim_id ?? null);
    setReason(myPick?.reason ?? '');
  }, [myPick?.claim_id, myPick?.reason]);

  const changed = selected !== (myPick?.claim_id ?? null) || reason.trim() !== (myPick?.reason ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    if (!selected) return;
    pick.mutate(
      { agendaId, claimId: selected, reason },
      { onSuccess: () => toast.success(myPick ? '선택을 바꿨어요' : '선택했어요'), onError: handleError },
    );
  };

  return (
    <section aria-labelledby="pick-title" className="space-y-3 rounded-2xl border-[1.5px] border-primary bg-card p-4">
      <h2 id="pick-title" className="text-base font-bold">
        내 생각과 가장 가까운 주장은?
      </h2>
      {!isOpen ? (
        <p className="text-sm text-muted-foreground">마감되어 더 이상 고를 수 없어요.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div role="radiogroup" aria-labelledby="pick-title" className="space-y-2">
            {claims.map((c, i) => {
              const checked = selected === c.id;
              return (
                <label
                  key={c.id}
                  className={cn(
                    'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm',
                    checked ? 'border-[1.5px] border-primary bg-primary/10 font-semibold' : 'border-border',
                  )}
                >
                  <input
                    type="radio"
                    name="claim-pick"
                    value={c.id}
                    checked={checked}
                    onChange={() => setSelected(c.id)}
                    className="h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <span className="leading-snug">
                    {LETTERS[i] ?? i + 1} · {c.body}
                  </span>
                </label>
              );
            })}
          </div>
          <label htmlFor="pick-reason" className="sr-only">
            고른 이유 한 줄
          </label>
          <input
            id="pick-reason"
            value={reason}
            maxLength={PICK_REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            placeholder="왜 그렇게 생각하나요? (한 줄, 선택)"
            className="h-12 w-full rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!selected || pick.isPending || (!!myPick && !changed)}
            className="h-12 w-full rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50"
          >
            {myPick ? (changed ? '선택 바꾸기' : '선택 완료') : '선택 완료'}
          </button>
          {myPick && !changed && (
            <p className="text-center text-xs text-muted-foreground">언제든 다시 고를 수 있어요. 마지막 선택만 반영돼요.</p>
          )}
          <button
            type="button"
            onClick={onWrite}
            className="mx-auto block min-h-9 px-2 text-[13px] font-semibold text-primary"
          >
            여기 없어요 · 내 주장 쓰기
          </button>
        </form>
      )}
      {loginModal}
    </section>
  );
}
