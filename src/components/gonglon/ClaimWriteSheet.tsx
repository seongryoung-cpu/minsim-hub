import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CLAIM_COUNTER_MAX,
  CLAIM_MAX,
  CLAIM_MIN,
  CLAIM_REASON_MAX,
  CLAIM_STATUS_LABELS,
  usePickClaim,
  usePostClaim,
  useSimilarClaims,
  type ClaimStatus,
} from '@/hooks/useClaims';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';

const MAX_SOURCES = 5;

/**
 * 주장 쓰기. 한 문장(필수) + 근거·출처·예상 반론(선택).
 * 쓰는 동안 비슷한 기존 주장을 보여 주고, 그걸 고르는 길을 먼저 열어 둔다 (같은 주장 반복 방지).
 */
export function ClaimWriteSheet({
  open,
  onOpenChange,
  agendaId,
  issueId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendaId: string;
  issueId: string | null;
}) {
  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');
  const [counter, setCounter] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const post = usePostClaim();
  const pick = usePickClaim();
  const { handleError, loginModal } = useLoginPrompt();
  const { data: similar = [] } = useSimilarClaims(open ? agendaId : undefined, issueId, body);

  const trimmed = body.trim();
  const badSource = sources.some((s) => s.trim() && !/^https?:\/\/\S{3,}$/i.test(s.trim()));
  const canSubmit =
    trimmed.length >= CLAIM_MIN && trimmed.length <= CLAIM_MAX && !badSource && !post.isPending;

  const reset = () => {
    setBody('');
    setReason('');
    setCounter('');
    setSources([]);
  };

  const close = () => {
    onOpenChange(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    post.mutate(
      { agendaId, issueId, body: trimmed, reason, counter, sources },
      {
        onSuccess: () => {
          toast.success('주장을 올렸어요. 내 선택으로도 기록했어요');
          reset();
          close();
        },
        onError: handleError,
      },
    );
  };

  const pickExisting = (claimId: string) => {
    pick.mutate(
      { agendaId, claimId },
      {
        onSuccess: () => {
          toast.success('기존 주장을 내 선택으로 골랐어요');
          reset();
          close();
        },
        onError: handleError,
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl px-4 pb-8 pt-5">
        <SheetHeader className="text-left">
          <SheetTitle>주장 쓰기</SheetTitle>
          <SheetDescription>한 문장으로 쓰고, 근거와 예상 반론은 원하면 보태 주세요.</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="mt-5 space-y-6">
          <div className="space-y-2">
            <label htmlFor="claim-body" className="text-[15px] font-bold">
              내 주장 <span className="text-xs font-semibold text-accent">필수</span>
            </label>
            <textarea
              id="claim-body"
              rows={3}
              value={body}
              maxLength={CLAIM_MAX}
              onChange={(e) => setBody(e.target.value)}
              placeholder="예: 월세 지원은 공급이 부족한 지역부터 기간을 정해 해야 한다"
              className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>한 문장으로 써 주세요 ({CLAIM_MIN}자 이상)</span>
              <span className="tabular-nums">
                {body.length}/{CLAIM_MAX}
              </span>
            </div>
          </div>

          {similar.length > 0 && (
            <section aria-label="비슷한 주장" className="space-y-2.5 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="text-[13px] font-bold text-amber-900 dark:text-amber-200">비슷한 주장이 이미 있어요</p>
              {similar.map((c) => (
                <div key={c.id} className="space-y-2 rounded-xl bg-card p-3">
                  <p className="text-xs text-muted-foreground">{CLAIM_STATUS_LABELS[c.status as ClaimStatus] ?? ''}</p>
                  <p className="text-sm font-semibold leading-snug">{c.body}</p>
                  <button
                    type="button"
                    onClick={() => pickExisting(c.id)}
                    disabled={pick.isPending}
                    className="h-10 w-full rounded-lg border border-amber-300 bg-card text-[13px] font-semibold disabled:opacity-60 dark:border-amber-800"
                  >
                    이 주장을 내 선택으로 고르기
                  </button>
                </div>
              ))}
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80">다른 주장이라면 그대로 이어서 써 주세요.</p>
            </section>
          )}

          <div className="space-y-2">
            <label htmlFor="claim-reason" className="text-[15px] font-bold">
              왜 그렇게 생각하나요? <span className="text-xs font-medium text-muted-foreground">선택</span>
            </label>
            <textarea
              id="claim-reason"
              rows={3}
              value={reason}
              maxLength={CLAIM_REASON_MAX}
              onChange={(e) => setReason(e.target.value)}
              placeholder="근거를 짧게 적어 주세요"
              className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[15px] font-bold">
              근거 자료 <span className="text-xs font-medium text-muted-foreground">선택 · 최대 {MAX_SOURCES}개</span>
            </span>
            {sources.map((src, i) => (
              <div key={i} className="flex gap-2">
                <label htmlFor={`claim-source-${i}`} className="sr-only">
                  출처 링크 {i + 1}
                </label>
                <input
                  id={`claim-source-${i}`}
                  type="url"
                  inputMode="url"
                  value={src}
                  onChange={(e) => setSources((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))}
                  placeholder="https://"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  aria-label={`출처 링크 ${i + 1} 지우기`}
                  onClick={() => setSources((prev) => prev.filter((_, j) => j !== i))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-secondary"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            ))}
            {badSource && <p className="text-xs text-destructive">출처는 http:// 또는 https:// 로 시작하는 링크만 넣을 수 있어요.</p>}
            {sources.length < MAX_SOURCES && (
              <button
                type="button"
                onClick={() => setSources((prev) => [...prev, ''])}
                className="flex h-11 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border text-sm font-semibold text-foreground/80 hover:bg-secondary/50"
              >
                <Plus size={16} aria-hidden /> 출처 링크 추가
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="claim-counter" className="text-[15px] font-bold">
              예상되는 반론은? <span className="text-xs font-medium text-muted-foreground">선택</span>
            </label>
            <textarea
              id="claim-counter"
              rows={2}
              value={counter}
              maxLength={CLAIM_COUNTER_MAX}
              onChange={(e) => setCounter(e.target.value)}
              placeholder="다른 관점에서는 어떻게 볼까요?"
              className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">반론까지 적으면 '상대 의견 이해' 기여로 기록돼요.</p>
          </div>

          <p className="rounded-xl bg-secondary/60 px-3.5 py-3 text-xs leading-relaxed text-foreground/80">
            프로필의 표시 이름으로 공개돼요. 다른 시민이 근거와 다른 관점 이해를 평가해요. 비방과 개인정보는 숨김
            처리돼요. 한 의제에 3개까지 쓸 수 있어요.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50"
          >
            {post.isPending ? '올리는 중…' : '주장 올리기'}
          </button>
        </form>
        {loginModal}
      </SheetContent>
    </Sheet>
  );
}
