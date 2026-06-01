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
  age?: number;
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

/**
 * Generate a DETERMINISTIC SUPR-ID fallback from the user's UUID.
 * This ensures repeated client-side auto-creation always produces the same ID
 * so it won't collide with a subsequently loaded DB value.
 * The DB trigger is still the authoritative source — this is only a fallback.
 */
function deriveSuprId(userId: string): string {
  const clean = userId.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const num = (hash % 90000) + 10000;
  return `SUPR-${num.toString().padStart(5, '0')}`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authSlow, setAuthSlow] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);
  const initialised = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);
  const loadedProfileRef = useRef<Profile | null>(null);

  const displayName = useMemo(() => {
    if (profile?.full_name && profile.full_name.trim()) {
      return profile.full_name.trim();
    }
    const metaName = (user?.user_metadata as Record<string, unknown>)?.full_name as string;
    if (metaName && metaName.trim()) {
      return metaName.trim();
    }
    const fromEmail = user?.email?.split('@')[0];
    return fromEmail ? fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1) : 'Member';
  }, [profile?.full_name, user?.user_metadata, user?.email]);

  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  const isAdmin = useMemo(() => checkIsAdmin(user, profile), [user, profile]);

  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    if (lastFetchedUserId.current === userId && loadedProfileRef.current) {
      return;
    }

    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    lastFetchedUserId.current = userId;

    fetchPromiseRef.current = (async () => {
      try {
        console.log('[fetchProfile] Starting for user:', userId);
        let profileData: Record<string, unknown> | null = null;

        // Poll up to 4× with 500ms gaps to handle DB trigger race on first login
        for (let i = 0; i < 4; i++) {
          console.log(`[fetchProfile] Poll attempt ${i + 1}`);
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (!error && data) {
            console.log(`[fetchProfile] Profile found on attempt ${i + 1}`);
            profileData = data;
            break;
          }
          if (error && error.code !== 'PGRST116') {
            console.error('[fetchProfile] Error fetching profile:', error);
            break;
          }
          if (i < 3) await new Promise(r => setTimeout(r, 500));
        }

        // If still no profile, auto-create with a DETERMINISTIC SUPR-ID
        if (!profileData) {
          console.warn('[fetchProfile] Profile not found after polling, auto-creating on frontend…');
          console.log('[fetchProfile] Calling supabase.auth.getUser()...');
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          console.log('[fetchProfile] getUser() returned:', !!currentUser);
          const googleAvatar = currentUser?.user_metadata?.avatar_url || null;
          const googleName = currentUser?.user_metadata?.full_name || '';
          const fromEmail = currentUser?.email?.split('@')[0] || 'Member';
          const newName = googleName || (fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1));
          
          const deterministicStId = deriveSuprId(userId);

          const newProfile = {
            id: userId,
            full_name: newName,
            avatar_url: googleAvatar,
            avatar_symbol: '🎬',
            st_id: deterministicStId,
            role: 'member',
            roles: ['member'],
            updated_at: new Date().toISOString(),
          };

          console.log('[fetchProfile] Attempting upsert for:', newProfile.id);
          const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id', ignoreDuplicates: false })
            .select()
            .single();

          if (insertError) {
            console.error('[fetchProfile] Error auto-creating profile:', insertError);
          }
          if (!insertError && insertedData) {
            console.log('[fetchProfile] Upsert successful');
            profileData = insertedData;
          }
        }

        if (profileData) {
          // CRITICAL: If DB returned a profile without st_id (edge case), patch it once
          if (!profileData.st_id) {
            const deterministicStId = deriveSuprId(userId);
            const { data: patched } = await supabase
              .from('profiles')
              .update({ st_id: deterministicStId })
              .eq('id', userId)
              .is('st_id', null)
              .select()
              .single();
            if (patched) profileData = patched;
            else profileData.st_id = deterministicStId;
          }

          const safeProfile = profileData as unknown as Profile;
          setProfile(safeProfile);
          loadedProfileRef.current = safeProfile;

          // Auto-sync Google avatar/name if missing (fire & forget — never touches st_id)
          supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
            const googleAvatar = currentUser?.user_metadata?.avatar_url;
            const googleName = currentUser?.user_metadata?.full_name;
            const updates: Record<string, string> = {};
            if (!safeProfile.avatar_url && googleAvatar) updates.avatar_url = googleAvatar;
            if ((!safeProfile.full_name || safeProfile.full_name === 'Anonymous Creator') && googleName) {
              updates.full_name = googleName;
            }
            if (Object.keys(updates).length > 0) {
              supabase.from('profiles').update(updates).eq('id', userId).then(() => {
                setProfile(prev => prev ? { ...prev, ...updates } : prev);
              });
            }
          });
        } else {
          setProfile(null);
          loadedProfileRef.current = null;
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfile(null);
        loadedProfileRef.current = null;
      } finally {
        setProfileAttempted(true);
        fetchPromiseRef.current = null;
      }
    })();

    return fetchPromiseRef.current;
  }, []);

  const refreshProfile = useCallback(async (userId?: string) => {
    const id = userId ?? user?.id;
    if (!id) return;

    // Clear ALL caches including any in-flight fetchProfile promise
    lastFetchedUserId.current = null;
    loadedProfileRef.current = null;
    fetchPromiseRef.current = null;

    // Ensure a fresh auth session before hitting DB
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await supabase.auth.refreshSession();
      }
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) setUser(updatedUser);
    } catch (e) {
      console.warn('refreshProfile: auth refresh failed:', e);
    }

    // Direct DB fetch — bypass fetchProfile's caching/polling entirely
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) {
        console.error('refreshProfile: fetch error:', error);
        return;
      }
      if (data) {
        const profileData = data as Record<string, unknown>;
        if (!profileData.st_id) {
          profileData.st_id = deriveSuprId(id);
          supabase.from('profiles').update({ st_id: profileData.st_id }).eq('id', id).is('st_id', null).then(() => {});
        }
        const safeProfile = profileData as unknown as Profile;
        setProfile(safeProfile);
        loadedProfileRef.current = safeProfile;
        lastFetchedUserId.current = id;
      }
    } catch (err) {
      console.error('refreshProfile error:', err);
    }
  }, [user?.id]);

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
    setProfile(null);
    setUser(null);
    setSession(null);
    setProfileAttempted(false);
    lastFetchedUserId.current = null;
    loadedProfileRef.current = null;
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      }
      localStorage.removeItem('supabase.auth.token');
    } catch (e) {
      console.warn('Storage clear failed:', e);
    }
    supabase.auth.signOut().catch((err) => console.error('Async signOut server call error:', err));
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, authSlow, profileAttempted,
      signOut, refreshProfile, displayName, avatarInitials, isAdmin,
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