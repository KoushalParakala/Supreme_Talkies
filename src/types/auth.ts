import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  avatar_symbol: string;
  role: string | null;
  roles: string[] | null;
  st_id?: string;
  st_verified?: boolean;
  is_early_access?: boolean;
  availability?: boolean;
  share_streak?: number;
  last_share_at?: string;
  age?: number;
  phone?: string;
  niche?: string;
  experience?: string;
  portfolio_url?: string;
  skills?: string[];
  contact?: string;
  social_handle?: string;
  note_to_team?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authSlow: boolean;
  profileAttempted: boolean;
  profileFetchFailed: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
  displayName: string;
  avatarInitials: string;
  isAdmin: boolean;
}
