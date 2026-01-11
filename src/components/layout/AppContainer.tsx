import { ReactNode } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopInfoPanel } from './DesktopInfoPanel';

interface AppContainerProps {
  children: ReactNode;
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="desktop-wrapper">
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <DesktopSidebar />
      
      {/* Main App Container */}
      <div className="app-container bg-background overflow-hidden overflow-y-auto relative">
        {children}
      </div>
      
      {/* Desktop Info Panel - hidden on mobile/tablet/small desktop */}
      <DesktopInfoPanel />
    </div>
  );
}
