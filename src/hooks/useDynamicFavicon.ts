import { useEffect, useRef } from 'react';
import { useAppSettings } from './useAppSettings';

export function useDynamicFavicon() {
  const { settings } = useAppSettings();
  const manifestBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    // Update favicon
    if (settings?.logo_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }

      link.href = settings.logo_url;
      link.type = 'image/png';

      // Also update apple-touch-icon
      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = settings.logo_url;
    }

    // Update page title
    if (settings?.app_name) {
      document.title = settings.app_name;
    }

    // Update PWA manifest dynamically
    const manifestData = {
      name: settings?.app_name || '민심잇다',
      short_name: settings?.app_name || '민심잇다',
      description: settings?.app_slogan || '지역 정치 참여 플랫폼',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      orientation: 'portrait-primary',
      icons: settings?.logo_url ? [
        {
          src: settings.logo_url,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: settings.logo_url,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ] : [
        {
          src: '/favicon.ico',
          sizes: '64x64',
          type: 'image/x-icon'
        }
      ]
    };

    // Clean up previous blob URL
    if (manifestBlobUrl.current) {
      URL.revokeObjectURL(manifestBlobUrl.current);
    }

    // Create new manifest blob
    const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    manifestBlobUrl.current = URL.createObjectURL(blob);

    // Update or create manifest link
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestBlobUrl.current;

    // Cleanup function
    return () => {
      if (manifestBlobUrl.current) {
        URL.revokeObjectURL(manifestBlobUrl.current);
      }
    };
  }, [settings?.logo_url, settings?.app_name, settings?.app_slogan]);
}
