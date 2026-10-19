import { useState } from 'react';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import { REPORT_REASONS, ReportError, useReportContent, type ReportKind, type ReportReason } from '@/hooks/useContentReports';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ERRORS: Record<string, string> = {
  login_required: '로그인한 뒤 신고할 수 있어요',
  own_content: '내가 쓴 글은 신고할 수 없어요',
  not_found: '이미 숨겨졌거나 지워진 글이에요',
  report_limit: '오늘은 신고를 더 할 수 없어요. 내일 다시 해 주세요',
  invalid_input: '신고 사유를 다시 골라 주세요',
};

/** 주장·한 줄 의견 신고. 누르면 사유를 고르는 창이 열린다 (로그인 필요) */
export function ReportButton({ kind, id, className }: { kind: ReportKind; id: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const report = useReportContent();
  const { requireLogin, handleError, loginModal } = useLoginPrompt();

  const close = () => {
    setOpen(false);
    setReason(null);
    setNote('');
  };

  const submit = () => {
    if (!reason) return;
    report.mutate(
      { kind, id, reason, note },
      {
        onSuccess: ({ already }) => {
          toast.success(already ? '이미 신고한 글이에요. 운영진이 확인할게요' : '신고를 받았어요. 운영진이 확인할게요');
          close();
        },
        onError: (e) => {
          if (e instanceof ReportError) {
            toast.error(ERRORS[e.message] ?? '잠시 후 다시 시도해 주세요');
            if (e.message === 'own_content' || e.message === 'not_found') close();
            return;
          }
          handleError(e);
        },
      },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => requireLogin('report', () => setOpen(true))}
        className={cn('flex h-8 items-center gap-1 rounded-full px-2 text-xs text-muted-foreground hover:bg-secondary', className)}
      >
        <Flag size={12} aria-hidden /> 신고
      </button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg">어떤 문제가 있나요?</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              운영진이 확인한 뒤 숨길지 정해요. 신고만으로 바로 숨겨지지는 않아요. 생각이 다르다는 이유만으로는 신고하지 말아 주세요.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-1.5">
            <legend className="sr-only">신고 사유</legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={cn(
                  'flex cursor-pointer gap-2.5 rounded-xl border px-3 py-2.5',
                  reason === r.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/60',
                )}
              >
                <input
                  type="radio"
                  name={`report-${id}`}
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-1 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="block text-sm font-semibold">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">설명 (선택, 200자)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder={reason === 'other' ? '어떤 문제인지 적어 주세요' : ''}
            />
          </label>
          <DialogFooter className="gap-2 sm:flex-col sm:space-x-0">
            <button
              type="button"
              disabled={!reason || (reason === 'other' && note.trim().length < 2) || report.isPending}
              onClick={submit}
              className="h-12 w-full rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50"
            >
              신고하기
            </button>
            <button type="button" onClick={close} className="h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground">
              취소
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {loginModal}
    </>
  );
}
