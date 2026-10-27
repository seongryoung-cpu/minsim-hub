import { Compass, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MbtiBannerProps {
  onPress?: () => void;
}

/** 홈 '정치 성향 테스트' (디자인 시스템: 흰 카드 + 파란색 하나) */
export function MbtiBanner({ onPress }: MbtiBannerProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onPress) onPress();
    navigate('/political-mbti');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
    >
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Compass size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[16px] font-bold">나의 정치 성향은?</span>
        <span className="text-[13px] text-sub">16가지 유형으로 알아보는 정치 MBTI 테스트</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
