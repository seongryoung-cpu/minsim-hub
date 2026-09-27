import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGonglonAccess } from '@/hooks/useAgendas';

/** 공론 라우트 보호: 공개 전에는 관리자만. 권한 확인 중에는 로딩 표시 (바로 404로 보내지 않음) */
export function GonglonGate({ children }: { children: ReactNode }) {
  const { allowed, isLoading } = useGonglonAccess();
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
}
