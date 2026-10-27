import { ArrowLeftRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PolicyMatchBannerProps {
  onPress?: () => void;
}

/** 정책 매칭 들어가기: 흰 카드 + 파란 아이콘 (디자인 시스템, 그라데이션 없음) */
export function PolicyMatchBanner({ onPress }: PolicyMatchBannerProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (onPress ? onPress() : navigate('/policy-match'))}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:bg-secondary/40"
    >
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <ArrowLeftRight size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold">나와 맞는 공약 찾기</span>
        <span className="block text-[13px] text-sub">정책 매칭 · 공약을 넘기며 고르면 가까운 후보를 보여 줘요</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
