import { ReactNode } from 'react';
import { DesktopNavbar } from './DesktopNavbar';
import { DesktopFooter } from './DesktopFooter';

interface AppContainerProps {
  children: ReactNode;
}

export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="desktop-wrapper">
      {/* Desktop Navigation Bar */}
      <DesktopNavbar />
      
      {/* Main App Container */}
      <div className="app-container bg-background overflow-hidden overflow-y-auto relative lg:overflow-visible">
        <div className="lg:max-w-7xl lg:mx-auto">
          {children}
        </div>
      </div>
      
      {/* Desktop Footer */}
      <DesktopFooter />
    </div>
  );
}
