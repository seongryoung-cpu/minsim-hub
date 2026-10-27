import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * 민심잇다 공통 부품 (디자인 시스템, src/index.css 머리말 참고)
 * 새 화면은 이 부품과 tone-* 색을 쓴다. 그라데이션·그림자 카드는 쓰지 않는다.
 */

export type Tone = 'neutral' | 'info' | 'agree' | 'split' | 'new';

const TONE: Record<Tone, string> = {
  neutral: 'bg-secondary text-sub',
  info: 'bg-primary-soft text-primary-strong',
  agree: 'bg-tone-agree text-tone-agree-fg',
  split: 'bg-tone-split text-tone-split-fg',
  new: 'bg-tone-new text-tone-new-fg',
};

/** 작은 표시: 모서리 6px, 옅은 바탕 (예: '진행 중 · D-12', '가장 크게 갈림') */
export function Tag({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold leading-5', TONE[tone], className)}>
      {children}
    </span>
  );
}

/** 옅은 바탕 칸 (예: '대부분 동의하는 것' / '가장 갈리는 것') */
export function ToneBox({ tone, label, children, className }: { tone: Tone; label: string; children: ReactNode; className?: string }) {
  const fg = tone === 'agree' ? 'text-tone-agree-fg' : tone === 'split' ? 'text-tone-split-fg' : tone === 'new' ? 'text-tone-new-fg' : tone === 'info' ? 'text-primary-strong' : 'text-sub';
  const bg = tone === 'agree' ? 'bg-tone-agree' : tone === 'split' ? 'bg-tone-split' : tone === 'new' ? 'bg-tone-new' : tone === 'info' ? 'bg-primary-soft' : 'bg-secondary';
  return (
    <div className={cn('rounded-2xl p-3.5', bg, className)}>
      <p className={cn('text-[12px] font-bold', fg)}>{label}</p>
      <div className="mt-1 text-[14px] font-semibold leading-snug text-foreground">{children}</div>
    </div>
  );
}

/** 카드: 흰 바탕 + 테두리 1px + 모서리 16px. strong = 지금 할 일(파란 테두리) */
export function Panel({ children, className, strong = false, as: As = 'section' }: { children: ReactNode; className?: string; strong?: boolean; as?: 'section' | 'div' | 'article' }) {
  return (
    <As className={cn('rounded-2xl border bg-card', strong ? 'border-[1.5px] border-primary' : 'border-border', className)}>
      {children}
    </As>
  );
}

/** 구역 제목 17px + 오른쪽 '전체 보기' 같은 링크 */
export function SectionHeader({ title, to, action, sub, id }: { title: string; to?: string; action?: string; sub?: string; id?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
          {action ?? '전체 보기'}
        </Link>
      )}
    </div>
  );
}

/** 단계 표시: '1단계 · 첫 반응' 같은 작은 파란 글자 */
export function StageLabel({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-bold text-primary">{children}</p>;
}

/** 카드 하나 안에 줄을 그어 나열하는 목록 */
export function ListPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card', className)}>{children}</div>;
}

/** 큰 파란 버튼 (높이 48, 모서리 12) */
export const primaryButton =
  'flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground hover:bg-primary-strong disabled:opacity-60';
