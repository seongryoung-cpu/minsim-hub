import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginRequiredError } from '@/hooks/useAgendas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type LoginReason = 'vote' | 'write' | 'evaluate' | 'pick' | 'interest' | 'generic';

const COPY: Record<LoginReason, { title: string; body: string }> = {
  vote: {
    title: '로그인하고 투표해요',
    body: '한 사람이 한 번만 투표할 수 있어요. 가입하면 내 선택이 기록되고, 다른 사람들의 결과도 볼 수 있어요.',
  },
  write: {
    title: '의견을 남기려면 로그인해요',
    body: '공개 닉네임으로 의견을 남기고, 내가 쓴 글을 나중에 고치거나 지울 수 있어요.',
  },
  evaluate: {
    title: '평가는 로그인한 분만 할 수 있어요',
    body: '근거와 관점을 평가해서 좋은 주장이 더 잘 보이게 도와주세요.',
  },
  pick: {
    title: '가까운 주장을 고르려면 로그인해요',
    body: '내 선택은 개인을 알아볼 수 없게 집계로만 보여요. 언제든 다시 고를 수 있어요.',
  },
  interest: {
    title: '관심을 표시하려면 로그인해요',
    body: '관심이 많은 의제는 공론으로 올라와요. 올라오면 알려 드려요.',
  },
  generic: {
    title: '로그인이 필요해요',
    body: '읽고 둘러보는 건 로그인 없이 할 수 있어요. 참여하려면 로그인하거나 가입해 주세요.',
  },
};

// 로그인 창에서 가입까지 걸리는 시간을 넉넉히 잡되, 한참 뒤에 엉뚱하게 실행되지 않게 한다
const PENDING_TTL_MS = 10 * 60 * 1000;

/**
 * 공론 참여 버튼용 로그인 유도.
 *
 *   const { requireLogin, handleError, loginModal } = useLoginPrompt();
 *   onClick={() => requireLogin('write', () => setWriteOpen(true))}
 *
 * - requireLogin(reason, action): 로그인돼 있으면 바로 action 실행.
 *   아니면 '왜 로그인해야 하는지' 안내를 먼저 보여 주고, 로그인·가입을 마치면 action을 이어서 실행한다.
 *   (입력을 다 한 뒤가 아니라 누르는 순간 안내하므로 쓰던 글을 잃지 않는다)
 * - handleError(err): mutation 실패 시. 로그인 필요면 같은 안내, 아니면 토스트.
 */
export function useLoginPrompt() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [authOpen, setAuthOpen] = useState(false);
  const [intro, setIntro] = useState<LoginReason | null>(null);
  const pending = useRef<{ run: () => void; at: number } | null>(null);

  // 로그인이 끝나면 하려던 일을 이어서 한다
  useEffect(() => {
    if (!isAuthenticated || !pending.current) return;
    const p = pending.current;
    pending.current = null;
    if (Date.now() - p.at < PENDING_TTL_MS) p.run();
  }, [isAuthenticated]);

  const requireLogin = useCallback(
    (reason: LoginReason, action: () => void) => {
      // 로그인 상태를 아직 확인 중이면 그대로 진행한다 (서버가 거절하면 handleError가 안내한다)
      if (isAuthenticated || isLoading) {
        action();
        return;
      }
      pending.current = { run: action, at: Date.now() };
      setIntro(reason);
    },
    [isAuthenticated, isLoading],
  );

  const handleError = useCallback((err: unknown) => {
    if (err instanceof LoginRequiredError) {
      setIntro('generic');
      return;
    }
    const message = err instanceof Error ? err.message : '';
    const friendly: Record<string, string> = {
      agenda_not_open: '마감된 의제예요',
      quiet_mode: '선거 기간에는 이 화면에서 반응을 받지 않아요. 의제 화면에서 참여해 주세요',
      invalid_input: '잘못된 요청이에요',
      not_found: '지금은 이 기능을 쓸 수 없어요',
      claim_limit: '한 의제에 주장은 3개까지 쓸 수 있어요',
      invalid_length: '주장은 5~80자, 근거는 500자, 예상 반론은 300자까지 쓸 수 있어요',
      reason_too_long: '이유는 80자까지 쓸 수 있어요',
      own_claim: '내가 쓴 주장은 평가할 수 없어요',
    };
    toast.error(friendly[message] ?? (message || '잠시 후 다시 시도해 주세요'));
  }, []);

  const copy = COPY[intro ?? 'generic'];

  const loginModal = (
    <>
      <Dialog
        open={intro !== null}
        onOpenChange={(o) => {
          if (!o) {
            pending.current = null;
            setIntro(null);
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-lg">{copy.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{copy.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:flex-col sm:space-x-0">
            <button
              type="button"
              onClick={() => {
                setIntro(null);
                setAuthOpen(true);
              }}
              className="h-12 w-full rounded-xl bg-primary text-[15px] font-bold text-primary-foreground"
            >
              로그인 / 가입하기
            </button>
            <button
              type="button"
              onClick={() => {
                pending.current = null;
                setIntro(null);
              }}
              className="h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground"
            >
              나중에
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );

  return { requireLogin, handleError, openLogin: () => setAuthOpen(true), loginModal };
}
