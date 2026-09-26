import { useState, useEffect, useCallback } from 'react';
import { normalizeRegion, type Region } from '@/types/region';

const STORAGE_KEY = 'minsim-region';

export function useRegion() {
  const [region, setRegionState] = useState<Region | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // 행정구역 개편 전 이름으로 저장된 경우 현재 이름으로 변환 (변환 불가 시 재선택 유도)
        const normalized = normalizeRegion(JSON.parse(stored) as Region);
        if (normalized) {
          setRegionState(normalized);
          if (JSON.stringify(normalized) !== stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
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
