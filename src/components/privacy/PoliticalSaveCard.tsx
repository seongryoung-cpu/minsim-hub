import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { usePoliticalConsent } from '@/hooks/usePrivacy';

interface PoliticalSaveCardProps {
  /** 동의를 받은 뒤 실제로 결과를 서버에 쓰는 함수 */
  save: () => Promise<void>;
  /** 이미 저장됐는지 (동의가 있던 사용자는 부모가 결과 화면에서 바로 저장한다) */
  saved: boolean;
}

/**
 * 결과를 본 뒤에 묻는 '계정 저장' 동의.
 * 정치 성향은 민감정보라 따로 동의를 받는다 (개인정보보호법 제23조, 추정 — 법률 검토 필요).
 * 두 버튼은 같은 크기·같은 무게로 둔다. 거절해도 결과는 계속 볼 수 있다.
 */
export function PoliticalSaveCard({ save, saved }: PoliticalSaveCardProps) {
  const { isAuthenticated, hasConsent, setConsent, isPending } = usePoliticalConsent();
  const [declined, setDeclined] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground/80">
        결과는 이 화면에서만 보여요. 로그인하면 계정에 저장해 두고 다시 볼 수 있어요.
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4 text-sm">
        <Check size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <p>
          내 계정에 저장했어요.{' '}
          <Link to="/my" className="font-semibold text-primary underline-offset-2 hover:underline">
            마이페이지
          </Link>
          에서 언제든 지울 수 있어요.
        </p>
      </div>
    );
  }

  if (hasConsent) {
    // 동의는 있는데 아직 저장 전(저장 중이거나 실패) — 다시 시도만 보여 준다
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <span>결과를 계정에 저장하는 중이거나 저장하지 못했어요.</span>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await save(); } catch { toast.error('저장하지 못했어요. 잠시 뒤 다시 해 주세요.'); }
            setBusy(false);
          }}
          className="h-10 shrink-0 rounded-full border border-border px-4 font-semibold"
        >
          다시 저장
        </button>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4 text-sm text-foreground/80">
        <span>저장하지 않았어요. 화면을 닫으면 결과는 사라져요.</span>
        <button type="button" onClick={() => setDeclined(false)} className="h-10 shrink-0 px-2 font-semibold text-primary">
          다시 선택
        </button>
      </div>
    );
  }

  const onAgree = async () => {
    setBusy(true);
    try {
      await setConsent(true);
      await save();
    } catch {
      toast.error('저장하지 못했어요. 결과는 이 화면에서 계속 볼 수 있어요.');
    }
    setBusy(false);
  };

  return (
    <section aria-labelledby="political-save-title" className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <h3 id="political-save-title" className="text-[15px] font-bold">이 결과를 내 계정에 저장할까요?</h3>
          <p className="text-[13px] leading-relaxed text-foreground/80">
            정치 성향은 민감한 정보라 따로 여쭤봐요. 저장하면 나중에 다시 보고 변화를 비교할 수 있어요.
            다른 사람에게 공개되지 않고, 통계에는 개인을 알아볼 수 없게 묶어서만 써요.
            마이페이지에서 언제든 동의를 거두면 저장된 결과가 지워져요.
          </p>
          <Link to="/privacy" className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
            자세히 보기
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy || isPending}
          onClick={() => setDeclined(true)}
          className="h-12 rounded-xl border-[1.5px] border-border bg-card text-[15px] font-bold disabled:opacity-60"
        >
          저장 안 함
        </button>
        <button
          type="button"
          disabled={busy || isPending}
          onClick={onAgree}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-border bg-card text-[15px] font-bold disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
          동의하고 저장
        </button>
      </div>
    </section>
  );
}
