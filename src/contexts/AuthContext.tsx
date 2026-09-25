import { createContext, useContext, ReactNode } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

type AuthContextType = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe default instead of throwing
    return {
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      signInWithEmail: async () => ({ data: null, error: new Error('Not initialized') as unknown as AuthError }),
      signUpWithEmail: async () => ({ data: null, error: new Error('Not initialized') as unknown as AuthError }),
      signInWithSocial: async () => ({ data: null, error: new Error('Not initialized') as unknown as AuthError }),
      signOut: async () => ({ error: new Error('Not initialized') as unknown as AuthError }),
      updateProfile: async () => ({ error: new Error('Not initialized') as unknown as AuthError }),
      upgradeVerificationLevel: async () => ({ error: new Error('Not initialized') }),
      refreshProfile: async () => null,
    } as ReturnType<typeof useAuth>;
  }
  return context;
}
