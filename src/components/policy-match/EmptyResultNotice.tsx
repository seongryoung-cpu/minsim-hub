import { useNavigate } from 'react-router-dom';

/** 비교할 후보가 없어 결과를 만들 수 없을 때 (결과 화면이 빈 배열을 받아도 흰 화면이 되지 않도록) */
export function EmptyResultNotice() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-lg font-bold">결과를 만들 수 없어요</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          이 지역에는 비교할 후보 정보가 없어요. 홈에서 다른 지역을 골라 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
