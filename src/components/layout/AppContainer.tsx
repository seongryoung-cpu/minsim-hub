import { ReactNode } from 'react';

interface AppContainerProps {
  children: ReactNode;
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="desktop-wrapper">
      <div className="app-container bg-background overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
