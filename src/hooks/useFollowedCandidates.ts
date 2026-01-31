import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'followed-candidates';

export function useFollowedCandidates() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load from database if authenticated, otherwise from localStorage
  useEffect(() => {
    const loadFollowedCandidates = async () => {
      setIsLoading(true);
      
      if (isAuthenticated && user) {
        try {
          const { data, error } = await supabase
            .from('user_followed_candidates')
            .select('candidate_id')
            .eq('user_id', user.id);

          if (error) {
            console.error('Failed to load followed candidates from DB:', error);
            // Fallback to localStorage
            loadFromLocalStorage();
          } else {
            const ids = data?.map(row => row.candidate_id) || [];
            setFollowedIds(ids);
          }
        } catch (e) {
          console.error('Failed to load followed candidates:', e);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      
      setIsLoaded(true);
      setIsLoading(false);
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFollowedIds(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
    };

    loadFollowedCandidates();
  }, [isAuthenticated, user]);

  // Sync localStorage data to DB when user logs in
  useEffect(() => {
    const syncLocalStorageToDb = async () => {
      if (!isAuthenticated || !user || !isLoaded) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const localIds: string[] = JSON.parse(stored);
          if (localIds.length > 0) {
            // Get existing DB records
            const { data: existingData } = await supabase
              .from('user_followed_candidates')
              .select('candidate_id')
              .eq('user_id', user.id);

            const existingIds = new Set(existingData?.map(row => row.candidate_id) || []);
            
            // Find new IDs to insert
            const newIds = localIds.filter(id => !existingIds.has(id));
            
            if (newIds.length > 0) {
              const insertData = newIds.map(candidateId => ({
                user_id: user.id,
                candidate_id: candidateId,
              }));

              await supabase
                .from('user_followed_candidates')
                .insert(insertData);

              // Merge with existing IDs
              setFollowedIds(prev => [...new Set([...prev, ...newIds])]);
            }

            // Clear localStorage after syncing
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to sync localStorage to DB:', e);
      }
    };

    syncLocalStorageToDb();
  }, [isAuthenticated, user, isLoaded]);

  // Save to localStorage for non-authenticated users
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(followedIds));
    }
  }, [followedIds, isLoaded, isAuthenticated]);

  const isFollowing = useCallback((candidateId: string) => {
    return followedIds.includes(candidateId);
  }, [followedIds]);

  const toggleFollow = useCallback(async (candidateId: string) => {
    const isCurrentlyFollowing = followedIds.includes(candidateId);
    
    if (isAuthenticated && user) {
      try {
        if (isCurrentlyFollowing) {
          // Unfollow - delete from DB
          const { error } = await supabase
            .from('user_followed_candidates')
            .delete()
            .eq('user_id', user.id)
            .eq('candidate_id', candidateId);

          if (error) throw error;
          setFollowedIds(prev => prev.filter(id => id !== candidateId));
        } else {
          // Follow - insert to DB
          const { error } = await supabase
            .from('user_followed_candidates')
            .insert({ user_id: user.id, candidate_id: candidateId });

          if (error) throw error;
          setFollowedIds(prev => [...prev, candidateId]);
        }
        // Invalidate query cache to refresh UI
        queryClient.invalidateQueries({ queryKey: ['followed-candidates-details'] });
      } catch (e) {
        console.error('Failed to toggle follow:', e);
      }
    } else {
      // Not authenticated - use localStorage
      setFollowedIds(prev => {
        if (prev.includes(candidateId)) {
          return prev.filter(id => id !== candidateId);
        } else {
          return [...prev, candidateId];
        }
      });
    }
  }, [followedIds, isAuthenticated, user, queryClient]);

  const follow = useCallback(async (candidateId: string) => {
    if (followedIds.includes(candidateId)) return;

    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('user_followed_candidates')
          .insert({ user_id: user.id, candidate_id: candidateId });

        if (error) throw error;
        setFollowedIds(prev => [...prev, candidateId]);
      } catch (e) {
        console.error('Failed to follow:', e);
      }
    } else {
      setFollowedIds(prev => [...prev, candidateId]);
    }
  }, [followedIds, isAuthenticated, user]);

  const unfollow = useCallback(async (candidateId: string) => {
    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('user_followed_candidates')
          .delete()
          .eq('user_id', user.id)
          .eq('candidate_id', candidateId);

        if (error) throw error;
        setFollowedIds(prev => prev.filter(id => id !== candidateId));
      } catch (e) {
        console.error('Failed to unfollow:', e);
      }
    } else {
      setFollowedIds(prev => prev.filter(id => id !== candidateId));
    }
  }, [isAuthenticated, user]);

  return {
    followedIds,
    isFollowing,
    toggleFollow,
    follow,
    unfollow,
    isLoaded,
    isLoading,
    followCount: followedIds.length,
  };
}
