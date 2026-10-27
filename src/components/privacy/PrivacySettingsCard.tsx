import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePoliticalConsent, usePoliticalDataCount } from '@/hooks/usePrivacy';

/**
 * 마이페이지 '개인정보' 카드.
 * - 정치 성향 결과 계정 저장 동의: 켜기/끄기 (끄면 저장된 성향 결과 삭제)
 * - 회원 탈퇴: 숨기지 않고 보통 버튼으로 (동의 철회·탈퇴는 가입만큼 쉬워야 한다, 개인정보보호법 제38조 제4항 — 추정)
 */
export function PrivacySettingsCard({ onRequestDeleteAccount }: { onRequestDeleteAccount: () => void }) {
  const { hasConsent, setConsent, isPending } = usePoliticalConsent();
  const { data: storedCount = 0 } = usePoliticalDataCount(hasConsent);
  const [confirmOff, setConfirmOff] = useState(false);

  const turnOn = async () => {
    try {
      await setConsent(true);
      toast.success('앞으로 성향 결과를 계정에 저장해요');
    } catch {
      toast.error('바꾸지 못했어요. 잠시 뒤 다시 해 주세요.');
    }
  };

  const turnOff = async () => {
    try {
      const res = await setConsent(false);
      const n = res.deleted.mbti + res.deleted.policy_match + res.deleted.spectrum;
      toast.success(n > 0 ? `동의를 거두고 저장된 성향 결과 ${n}개를 지웠어요` : '동의를 거뒀어요');
    } catch {
      toast.error('바꾸지 못했어요. 잠시 뒤 다시 해 주세요.');
    }
    setConfirmOff(false);
  };

  return (
    <section aria-labelledby="privacy-card-title" className="space-y-4 rounded-2xl border border-border bg-card p-[18px]">
      <h2 id="privacy-card-title" className="flex items-center gap-2 text-[17px] font-bold">
        <ShieldCheck size={18} className="text-primary" aria-hidden /> 개인정보
      </h2>

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p id="political-consent-label" className="text-sm font-medium">정치 성향 결과 계정에 저장</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {hasConsent
              ? `켜져 있어요${storedCount > 0 ? ` · 저장된 결과 ${storedCount}개` : ''}. 끄면 저장된 성향 결과가 지워져요.`
              : '꺼져 있어요. 테스트 결과는 그 화면에서만 보여요.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 size={16} className="animate-spin text-muted-foreground" aria-hidden />}
          <Switch
            aria-labelledby="political-consent-label"
            checked={hasConsent}
            disabled={isPending}
            onCheckedChange={(on) => (on ? turnOn() : setConfirmOff(true))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="flex gap-3 text-xs">
          <Link to="/privacy" className="text-muted-foreground underline-offset-2 hover:underline">개인정보처리방침</Link>
          <Link to="/terms" className="text-muted-foreground underline-offset-2 hover:underline">이용약관</Link>
        </div>
        <button
          type="button"
          onClick={onRequestDeleteAccount}
          className="h-10 rounded-full border border-border px-4 text-[13px] font-semibold text-destructive hover:bg-destructive/5"
        >
          회원 탈퇴
        </button>
      </div>

      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>저장 동의를 거둘까요?</AlertDialogTitle>
            <AlertDialogDescription>
              계정에 저장된 정치 성향 테스트·정책 매칭 결과가 모두 지워지고 되돌릴 수 없어요. 다른 기능은 그대로 쓸 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>그대로 두기</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void turnOff(); }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              거두고 지우기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
