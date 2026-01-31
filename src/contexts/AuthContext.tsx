import { createContext, useContext, ReactNode } from 'react';
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

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe default instead of throwing
    return {
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      signInWithEmail: async () => ({ data: null, error: new Error('Not initialized') as any }),
      signUpWithEmail: async () => ({ data: null, error: new Error('Not initialized') as any }),
      signInWithSocial: async () => ({ data: null, error: new Error('Not initialized') as any }),
      signOut: async () => ({ error: new Error('Not initialized') as any }),
      updateProfile: async () => ({ error: new Error('Not initialized') as any }),
      upgradeVerificationLevel: async () => ({ error: new Error('Not initialized') }),
      refreshProfile: async () => null,
    } as ReturnType<typeof useAuth>;
  }
  return context;
}
