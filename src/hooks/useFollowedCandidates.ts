import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'followed-candidates';

export function useFollowedCandidates() {
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFollowedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load followed candidates:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(followedIds));
    }
  }, [followedIds, isLoaded]);

  const isFollowing = useCallback((candidateId: string) => {
    return followedIds.includes(candidateId);
  }, [followedIds]);

  const toggleFollow = useCallback((candidateId: string) => {
    setFollowedIds(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  }, []);

  const follow = useCallback((candidateId: string) => {
    setFollowedIds(prev => {
      if (!prev.includes(candidateId)) {
        return [...prev, candidateId];
      }
      return prev;
    });
  }, []);

  const unfollow = useCallback((candidateId: string) => {
    setFollowedIds(prev => prev.filter(id => id !== candidateId));
  }, []);

  return {
    followedIds,
    isFollowing,
    toggleFollow,
    follow,
    unfollow,
    isLoaded,
    followCount: followedIds.length,
  };
}
