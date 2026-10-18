import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/**
 * 정치인 사진 (세로 3:4 증명사진). 없거나 못 불러오면 이름 첫 글자.
 * 화면에 보일 때만 불러온다 (loading="lazy").
 */
export function PersonPhoto({
  src, initial, width, className, eager = false,
}: { src: string | null; initial: string; width: number; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const height = Math.round((width * 4) / 3);
  const show = !!src && !failed;
  return (
    <span
      aria-hidden
      style={{ width, height, fontSize: Math.round(width * 0.36) }}
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary font-bold text-foreground/60', className)}
    >
      {show ? (
        <img
          src={src}
          alt=""
          width={width}
          height={height}
          loading={eager ? 'eager' : 'lazy'}
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

/**
 * 인물 페이지 사진: 누르면 크게 본다.
 * 원본이 작은 사진(예: 136×160)은 원본 크기보다 크게 늘리지 않는다 (흐려 보이지 않게).
 */
export function PersonPhotoZoom({ src, name, initial, width }: { src: string | null; name: string; initial: string; width: number }) {
  const [open, setOpen] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <PersonPhoto src={null} initial={initial} width={width} />;

  // 크게 보기: 화면 폭 안에서 최대 360px, 원본보다는 크게 하지 않는다
  const maxW = Math.min(360, natural?.w ?? 360);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${name} 사진 크게 보기`}
        className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span
          style={{ width, height: Math.round((width * 4) / 3) }}
          className="block overflow-hidden rounded-lg bg-secondary"
        >
          <img
            src={src}
            alt=""
            loading="eager"
            decoding="async"
            onError={() => setFailed(true)}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="h-full w-full object-cover object-top"
          />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-auto max-w-[calc(100vw-32px)] border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{name} 사진</DialogTitle>
          <DialogDescription className="sr-only">출처: 열린국회정보 또는 운영진 등록 사진</DialogDescription>
          <img
            src={src}
            alt={`${name} 사진`}
            style={{ width: maxW, maxWidth: 'calc(100vw - 32px)' }}
            className="mx-auto h-auto rounded-xl bg-secondary"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
