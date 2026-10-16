export type VerificationLevel = 'anonymous' | 'social' | 'phone' | 'identity';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  verification_level: VerificationLevel;
  phone_verified_at: string | null;
  identity_verified_at: string | null;
  identity_provider: string | null;
  nickname?: string | null;
  terms_agreed_at?: string | null;
  privacy_agreed_at?: string | null;
  age14_confirmed_at?: string | null;
  political_consent_at?: string | null;
  region_sido: string | null;
  region_sigungu: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
