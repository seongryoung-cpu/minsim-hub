import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  NICKNAME_MESSAGES,
  NICKNAME_RULE,
  useAcceptRequiredTerms,
  usePoliticalConsent,
  usePoliticalDataCount,
  useSetNickname,
} from '@/hooks/usePrivacy';

/**
 * 로그인한 사람에게 빠진 것만 차례로 묻는다.
 *  1) 필수 동의(약관·개인정보·만 14세) — 이 기능 전에 가입했거나 소셜로 가입한 사람
 *  2) 공개 닉네임 — 실명일 수 있는 이름 대신 쓸 이름
 *  3) 동의 없이 저장돼 있던 정치 성향 결과 — 계속 저장할지, 지울지
 * 약관·방침 화면에서는 띄우지 않는다 (읽고 와야 하므로).
 */
export function ConsentGate() {
  const { isAuthenticated, profile, isLoading, signOut } = useAuthContext();
  const location = useLocation();
  const needTerms = !!profile && (!profile.terms_agreed_at || !profile.privacy_agreed_at || !profile.age14_confirmed_at);
  const needNick = !!profile && !profile.nickname;
  const { hasConsent } = usePoliticalConsent();
  const { data: legacyCount = 0 } = usePoliticalDataCount(isAuthenticated && !!profile && !hasConsent);
  const needLegacy = !!profile && !hasConsent && legacyCount > 0;

  if (isLoading || !isAuthenticated || !profile) return null;
  if (location.pathname === '/terms' || location.pathname === '/privacy') return null;

  const step = needTerms ? 'terms' : needNick ? 'nickname' : needLegacy ? 'legacy' : null;
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-gate-title"
        className="w-full max-w-md space-y-4 rounded-t-3xl bg-card p-5 pb-8 shadow-xl sm:rounded-2xl sm:pb-5"
      >
        {step === 'terms' && <TermsStep onSignOut={() => void signOut()} />}
        {step === 'nickname' && <NicknameStep />}
        {step === 'legacy' && <LegacyStep count={legacyCount} />}
      </div>
    </div>
  );
}

function TermsStep({ onSignOut }: { onSignOut: () => void }) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age, setAge] = useState(false);
  const accept = useAcceptRequiredTerms();
  const all = terms && privacy && age;

  return (
    <>
      <div className="space-y-1">
        <h2 id="consent-gate-title" className="text-lg font-bold">계속하려면 동의가 필요해요</h2>
        <p className="text-sm text-muted-foreground">약관과 개인정보 처리 방법을 새로 정리했어요.</p>
      </div>
      <div className="space-y-2.5 rounded-xl border border-border p-3 text-sm">
        <label className="flex items-center gap-2.5 border-b border-border/60 pb-2.5 font-semibold">
          <Checkbox checked={all} onCheckedChange={(v) => { const on = v === true; setTerms(on); setPrivacy(on); setAge(on); }} />
          모두 동의 (필수)
        </label>
        <label className="flex items-center gap-2.5">
          <Checkbox checked={age} onCheckedChange={(v) => setAge(v === true)} /> 만 14세 이상이에요
        </label>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5">
            <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} /> 이용약관 동의
          </label>
          <Link to="/terms" className="text-xs text-muted-foreground underline">보기</Link>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5">
            <Checkbox checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} /> 개인정보 수집·이용 동의
          </label>
          <Link to="/privacy" className="text-xs text-muted-foreground underline">보기</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onSignOut} className="h-12 rounded-xl border border-border font-semibold">
          로그아웃
        </button>
        <button
          type="button"
          disabled={!all || accept.isPending}
          onClick={() => accept.mutate(undefined, { onError: () => toast.error('저장하지 못했어요. 다시 해 주세요.') })}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50"
        >
          {accept.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
          동의하고 계속
        </button>
      </div>
    </>
  );
}

function NicknameStep() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setNickname = useSetNickname();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = await setNickname.mutateAsync(value.trim());
      if (code !== 'ok') setError(NICKNAME_MESSAGES[code]);
    } catch {
      setError('저장하지 못했어요. 다시 해 주세요.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <h2 id="consent-gate-title" className="text-lg font-bold">공개 닉네임을 정해 주세요</h2>
        <p className="text-sm text-muted-foreground">
          주장 카드와 랭킹에는 이 이름만 보여요. 실명이나 연락처는 피해 주세요.
        </p>
      </div>
      <div className="space-y-1.5">
        <Input
          aria-label="공개 닉네임"
          value={value}
          maxLength={12}
          autoFocus
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          placeholder="예: 바른바람"
          aria-invalid={!!error}
          className="h-12"
        />
        <p className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error ?? NICKNAME_RULE}</p>
      </div>
      <button
        type="submit"
        disabled={value.trim().length < 2 || setNickname.isPending}
        className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50"
      >
        {setNickname.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        이 이름으로 할게요
      </button>
    </form>
  );
}

function LegacyStep({ count }: { count: number }) {
  const { setConsent, isPending } = usePoliticalConsent();
  const choose = async (keep: boolean) => {
    try {
      await setConsent(keep);
      toast.success(keep ? '계속 저장해 둘게요. 마이페이지에서 언제든 지울 수 있어요.' : '저장된 성향 결과를 지웠어요');
    } catch {
      toast.error('처리하지 못했어요. 다시 해 주세요.');
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <h2 id="consent-gate-title" className="text-lg font-bold">저장된 성향 결과를 어떻게 할까요?</h2>
        <p className="text-sm leading-relaxed text-foreground/80">
          예전에 한 정치 성향 테스트·정책 매칭 결과 {count}개가 계정에 저장돼 있어요. 정치 성향은 민감한 정보라
          저장하려면 따로 동의가 필요해요. 다른 사람에게 공개되지 않고, 마이페이지에서 언제든 지울 수 있어요.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => void choose(false)}
          className="h-12 rounded-xl border-[1.5px] border-border font-bold disabled:opacity-60"
        >
          지우기
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => void choose(true)}
          className="h-12 rounded-xl border-[1.5px] border-border font-bold disabled:opacity-60"
        >
          동의하고 계속 저장
        </button>
      </div>
    </>
  );
}
