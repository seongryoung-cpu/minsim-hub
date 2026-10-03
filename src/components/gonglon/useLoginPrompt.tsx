import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { AuthModal } from '@/components/auth/AuthModal';
import { LoginRequiredError } from '@/hooks/useAgendas';

/**
 * 공론 참여 버튼용 로그인 유도.
 * const { handleError, loginModal } = useLoginPrompt();
 * mutation 실패 시 handleError(err) → 로그인 필요면 로그인 창, 아니면 토스트.
 */
export function useLoginPrompt() {
  const [open, setOpen] = useState(false);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof LoginRequiredError) {
      toast('로그인하면 의견을 남길 수 있어요');
      setOpen(true);
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

  const loginModal = <AuthModal isOpen={open} onClose={() => setOpen(false)} />;

  return { handleError, openLogin: () => setOpen(true), loginModal };
}
