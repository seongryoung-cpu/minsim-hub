import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Flame } from 'lucide-react';
import { useQuizStats } from '@/hooks/useQuizStats';
import { Tag } from '@/components/ds';

/** 홈 '오늘의 정치 퀴즈' (디자인 시스템: 흰 카드 + 파란색 하나) */
export function QuizBanner() {
  const navigate = useNavigate();
  const { stats, canPlayToday } = useQuizStats();
  const canPlay = canPlayToday();

  return (
    <button
      type="button"
      onClick={() => navigate('/quiz')}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Brain size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[16px] font-bold">오늘의 정치 퀴즈</span>
            {canPlay ? <Tag tone="info">새 퀴즈</Tag> : <Tag>오늘 완료</Tag>}
            {stats.currentStreak > 0 && (
              <Tag tone="new">
                <Flame size={12} className="mr-0.5" aria-hidden />
                {stats.currentStreak}일 연속
              </Tag>
            )}
          </span>
          <span className="text-[13px] text-sub">
            {canPlay ? '5문제 풀고 정치 문해력(PQ)을 올려 보세요' : '내일 새 퀴즈가 준비돼요'}
          </span>
          <span className="mt-1 text-[13px] text-muted-foreground">
            내 PQ <strong className="text-foreground">{stats.totalPoints}점</strong> · 상위 <strong className="text-foreground">{100 - stats.percentile}%</strong>
          </span>
        </span>
        <ChevronRight size={20} className="mt-3 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </button>
  );
}
