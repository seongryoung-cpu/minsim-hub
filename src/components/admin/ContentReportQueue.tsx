import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { REASON_LABELS, useAdminReportQueue, useResolveReport, type ReportQueueItem, type ReportReason } from '@/hooks/useContentReports';

const KIND_LABEL = { claim: '주장', statement: '한 줄 의견' } as const;

/**
 * 공론 글 신고 처리 (관리자).
 * 글 하나에 한 줄. 숨기기 = 공개 화면에서 내림(되돌릴 수 있음), 유지 = 문제없음으로 닫기.
 * 숨긴 글은 '공론 의제 관리'의 한 줄 의견·주장 목록에서 다시 보이게 할 수 있다.
 */
export function ContentReportQueue() {
  const [showResolved, setShowResolved] = useState(false);
  const { data, isLoading, isError } = useAdminReportQueue(showResolved);
  const resolve = useResolveReport();
  const items = data ?? [];

  const act = (it: ReportQueueItem, action: 'hide' | 'keep') => {
    if (action === 'hide' && !window.confirm('이 글을 공개 화면에서 숨길까요? 나중에 다시 보이게 할 수 있어요.')) return;
    resolve.mutate(
      { kind: it.target_kind, id: it.target_id, action },
      {
        onSuccess: () => toast.success(action === 'hide' ? '숨겼어요' : '유지로 처리했어요'),
        onError: () => toast.error('처리하지 못했어요'),
      },
    );
  };

  return (
    <section aria-labelledby="content-reports" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="content-reports" className="flex items-center gap-1.5 text-base font-bold">
          <Flag size={16} className="text-primary" aria-hidden /> 공론 글 신고
        </h2>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          처리한 것도 보기
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        신고만으로는 자동으로 숨기지 않아요. 생각이 다르다는 이유의 신고는 '유지'로 닫아 주세요.
      </p>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-secondary" />
      ) : isError ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">신고 목록을 불러오지 못했어요</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {showResolved ? '신고된 글이 없어요' : '처리할 신고가 없어요'}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={`${it.target_kind}-${it.target_id}`} className="space-y-2 rounded-xl border border-border bg-card p-3.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="rounded-md bg-secondary px-1.5 py-0.5 font-semibold text-foreground/80">{KIND_LABEL[it.target_kind]}</span>
                <Link to={`/gonglon/${it.agenda_id}${it.target_kind === 'claim' ? '/claims' : ''}`} className="truncate text-primary underline">
                  {it.agenda_title}
                </Link>
                <span>· {it.author}</span>
                {it.is_hidden && <span className="font-semibold text-destructive">숨김</span>}
              </div>
              <p className={cn('text-sm leading-relaxed', it.is_hidden && 'text-muted-foreground line-through')}>
                {it.body ?? '(지워진 글)'}
              </p>
              <p className="text-xs">
                <strong>신고 {it.open_count > 0 ? `${it.open_count}건 대기` : `${it.total_count}건`}</strong>
                {it.reasons && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {Object.entries(it.reasons).map(([r, n]) => `${REASON_LABELS[r as ReportReason] ?? r} ${n}`).join(', ')}
                  </span>
                )}
                {it.open_count === 0 && it.last_resolution && (
                  <span className="text-muted-foreground"> · {it.last_resolution === 'hidden' ? '숨김 처리함' : '유지 처리함'}</span>
                )}
              </p>
              {it.notes.length > 0 && (
                <ul className="space-y-0.5 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-foreground/80">
                  {it.notes.map((n, i) => (
                    <li key={i}>“{n}”</li>
                  ))}
                </ul>
              )}
              {it.open_count > 0 && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={resolve.isPending}
                    onClick={() => act(it, 'hide')}
                    className="h-10 flex-1 rounded-lg bg-destructive/10 text-sm font-semibold text-destructive hover:bg-destructive/15"
                  >
                    숨기기
                  </button>
                  <button
                    type="button"
                    disabled={resolve.isPending}
                    onClick={() => act(it, 'keep')}
                    className="h-10 flex-1 rounded-lg border border-border text-sm font-semibold hover:bg-secondary"
                  >
                    유지 (문제없음)
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
