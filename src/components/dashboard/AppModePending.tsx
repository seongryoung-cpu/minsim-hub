import { ErrorState } from '@/components/ui/error-state';

export function AppModePending({ isError, onRetry }: { isError: boolean; onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] bg-background flex items-center justify-center">
      {isError ? (
        <ErrorState
          title="화면 정보를 불러오지 못했어요"
          description="선거 일정과 화면 설정을 확인할 수 없어요. 다시 시도해주세요."
          onRetry={onRetry}
        />
      ) : (
        <div role="status" aria-label="화면 정보 불러오는 중" className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none" />
      )}
    </div>
  );
}