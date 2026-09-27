import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 값이 바뀌면 오류 상태를 초기화 (예: 경로가 바뀌면 다시 그려 본다) */
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 화면 하나가 렌더 중 오류를 내도 앱 전체가 흰 화면이 되지 않도록 막는다.
 * 지연 로딩 청크를 못 받아오는 경우(배포 직후 옛 탭 등)도 여기서 걸린다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold text-foreground">화면을 불러오지 못했어요</p>
        <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요. 계속되면 새로고침해 주세요.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            새로고침
          </button>
          <a href="/" className="h-11 px-5 rounded-xl bg-secondary text-foreground font-medium inline-flex items-center">
            홈으로
          </a>
        </div>
      </div>
    );
  }
}
