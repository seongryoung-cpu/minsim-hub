import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * 정치인 사진 (없거나 못 불러오면 이름 첫 글자).
 * 사진은 3:4로 줄여 두었고, 동그라미 안에서 얼굴이 보이게 위쪽을 기준으로 자른다.
 * 화면에 보일 때만 불러온다 (loading="lazy").
 */
export function PersonPhoto({
  src, initial, size, className,
}: { src: string | null; initial: string; size: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const show = !!src && !failed;
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-bold text-foreground/70', className)}
    >
      {show ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        initial
      )}
    </span>
  );
}
