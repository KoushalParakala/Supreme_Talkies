import { createContext, useContext, useEffect, useRef, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  age?: string;
  phone?: string;
  niche?: string;
  experience?: string;
  portfolio_url?: string;
  skills?: string[];
  contact?: string;
  social_handle?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authSlow: boolean;
  profileAttempted: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
  displayName: string;
  avatarInitials: string;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  authSlow: false,
  profileAttempted: false,
  signOut: async () => {},
  refreshProfile: async (_userId?: string) => {},
  displayName: 'MEMBER',
  avatarInitials: 'M',
  isAdmin: false,
});

function normalizeName(name: string | null | undefined): string {
  if (!name) return 'Member';
  return name.trim().replace(/\s+/g, ' ') || 'Member';
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function checkIsAdmin(user: User | null, profile: Profile | null): boolean {
  const adminEmailsStr = import.meta.env.VITE_ADMIN_EMAILS || '';
  const adminEmails = adminEmailsStr.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  if (user?.email && adminEmails.includes(user.email.toLowerCase())) return true;
  const rArray = Array.isArray(profile?.roles) ? profile.roles : [];
  if (rArray.some((r: string) => r.toLowerCase() === 'admin')) return true;
  if (profile?.role?.toLowerCase() === 'admin') return true;
  return false;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authSlow, setAuthSlow] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);
  const initialised = useRef(false);

  const displayName = useMemo(() => {
    const fromProfile = normalizeName(profile?.full_name);
    if (fromProfile !== 'Member') return fromProfile;
    const fromMeta = normalizeName((user?.user_metadata as Record<string, unknown>)?.full_name as string);
    if (fromMeta !== 'Member') return fromMeta;
    const fromEmail = user?.email?.split('@')[0];
    return fromEmail ? fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1) : 'Member';
  }, [profile?.full_name, user?.user_metadata, user?.email]);

  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  const isAdmin = useMemo(() => checkIsAdmin(user, profile), [user, profile]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        const normalized = { ...data, full_name: normalizeName(data.full_name) };
        setProfile(normalized as Profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    } finally {
      setProfileAttempted(true);
    }
  }, []);

  const refreshProfile = useCallback(async (userId?: string) => {
    const id = userId ?? user?.id;
    if (id) {
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) setUser(updatedUser);
      await fetchProfile(id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    const slowTimeout = setTimeout(() => {
      if (mounted && !initialised.current) setAuthSlow(true);
    }, 3000);
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialised.current) {
        console.warn('Auth initialization timed out after 10s.');
        setLoading(false);
        setProfileAttempted(true);
        initialised.current = true;
      }
    }, 10000);

    async function initializeAuth() {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (!mounted) return;
        if (sessionError) throw sessionError;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfileAttempted(true);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setProfileAttempted(true);
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthSlow(false);
          initialised.current = true;
          clearTimeout(slowTimeout);
          clearTimeout(safetyTimeout);
        }
      }
    }
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        if (event === 'SIGNED_IN') {
          setLoading(true);
          await fetchProfile(newSession.user.id);
          if (mounted) setLoading(false);
        } else {
          await fetchProfile(newSession.user.id);
        }
      } else {
        setProfile(null);
        setProfileAttempted(true);
      }
      if (!initialised.current && mounted) {
        setLoading(false);
        setAuthSlow(false);
        initialised.current = true;
        clearTimeout(slowTimeout);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(slowTimeout);
      clearTimeout(safetyTimeout);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSession(null);
      setProfileAttempted(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, authSlow, profileAttempted,
      signOut, refreshProfile, displayName, avatarInitials, isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
