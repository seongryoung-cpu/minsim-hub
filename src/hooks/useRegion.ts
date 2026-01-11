import { useState, useEffect, useCallback } from 'react';
import type { Region } from '@/types/region';

const STORAGE_KEY = 'minsim-region';

export function useRegion() {
  const [region, setRegionState] = useState<Region | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRegionState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  const setRegion = useCallback((newRegion: Region) => {
    setRegionState(newRegion);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRegion));
  }, []);

  const clearRegion = useCallback(() => {
    setRegionState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    region,
    setRegion,
    clearRegion,
    isLoaded,
    hasRegion: !!region,
  };
}
