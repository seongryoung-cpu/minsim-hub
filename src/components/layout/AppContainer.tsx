import { ReactNode } from 'react';
import { DesktopNavbar } from './DesktopNavbar';
import { DesktopFooter } from './DesktopFooter';
import type { Region } from '@/types/region';

interface AppContainerProps {
  children: ReactNode;
  region?: Region;
  onRegionClick?: () => void;
}

export function AppContainer({ children, region, onRegionClick }: AppContainerProps) {
  return (
    <div className="desktop-wrapper">
      {/* Desktop Navigation Bar */}
      <DesktopNavbar region={region} onRegionClick={onRegionClick} />
      
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
