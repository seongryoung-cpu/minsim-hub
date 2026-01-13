import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, AuthError } from '@supabase/supabase-js';
import type { UserProfile, AuthState, VerificationLevel } from '@/types/auth';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // 프로필 조회
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile | null;
  }, []);

  // 인증 상태 변경 리스너
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        
        if (user) {
          // setTimeout으로 defer하여 deadlock 방지
          setTimeout(async () => {
            const profile = await fetchProfile(user.id);
            setState({
              user,
              profile,
              isLoading: false,
              isAuthenticated: true,
            });
          }, 0);
        } else {
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) {
        fetchProfile(user.id).then(profile => {
          setState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: true,
          });
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // 이메일 로그인
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  // 이메일 회원가입
  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: displayName,
        },
      },
    });
    return { data, error };
  }, []);

  // 소셜 로그인 (카카오, 네이버, 애플 등)
  const signInWithSocial = useCallback(async (provider: 'kakao' | 'google' | 'apple') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: new Error('Not authenticated') as AuthError };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', state.user.id)
      .select()
      .single();

    if (!error && data) {
      setState(prev => ({
        ...prev,
        profile: data as UserProfile,
      }));
    }

    return { data, error };
  }, [state.user]);

  // 인증 레벨 업그레이드 (본인인증 완료 시)
  const upgradeVerificationLevel = useCallback(async (
    level: VerificationLevel,
    provider?: string
  ) => {
    if (!state.user) return { error: new Error('Not authenticated') };

    const updates: Partial<UserProfile> = {
      verification_level: level,
    };

    if (level === 'phone') {
      updates.phone_verified_at = new Date().toISOString();
    } else if (level === 'identity') {
      updates.identity_verified_at = new Date().toISOString();
      updates.identity_provider = provider;
    }

    return updateProfile(updates);
  }, [state.user, updateProfile]);

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithSocial,
    signOut,
    updateProfile,
    upgradeVerificationLevel,
    refreshProfile: () => state.user && fetchProfile(state.user.id),
  };
}
