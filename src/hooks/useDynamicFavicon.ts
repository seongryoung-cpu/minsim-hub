import { useEffect } from 'react';
import { useAppSettings } from './useAppSettings';

export function useDynamicFavicon() {
  const { settings } = useAppSettings();

  useEffect(() => {
    if (!settings?.logo_url) return;

    // Find existing favicon link or create new one
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    // Update favicon to the logo URL
    link.href = settings.logo_url;
    link.type = 'image/png';

    // Also update the page title if app_name is set
    if (settings.app_name) {
      document.title = settings.app_name;
    }
  }, [settings?.logo_url, settings?.app_name]);
}
