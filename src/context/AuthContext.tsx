import { createContext, useEffect, useRef, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContextType, Profile } from '../types/auth';
import { fetchUserProfile, syncGoogleProfileMetadata, computeDisplayName, getInitials, checkIsAdmin } from '../lib/profile';
import { useAuth } from '../hooks/useAuth';

export type { Profile } from '../types/auth';
export { useAuth };

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  authSlow: false,
  profileAttempted: false,
  profileFetchFailed: false,
  signOut: async () => {},
  refreshProfile: async (_userId?: string) => {},
  displayName: 'MEMBER',
  avatarInitials: 'M',
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authSlow, setAuthSlow] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);
  const [profileFetchFailed, setProfileFetchFailed] = useState(false);

  const isInitialisedRef = useRef(false);
  const activeFetchUserIdRef = useRef<string | null>(null);
  const loadedProfileIdRef = useRef<string | null>(null);

  const displayName = useMemo(() => computeDisplayName(profile, user), [profile, user]);
  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  const isAdmin = useMemo(() => checkIsAdmin(user, profile), [user, profile]);

  const loadProfile = useCallback(async (u: User, forceFetch = false) => {
    // Avoid redundant refetches if we already loaded profile for this user and not forcing
    if (!forceFetch && loadedProfileIdRef.current === u.id && profile !== null) {
      setProfileAttempted(true);
      return;
    }

    activeFetchUserIdRef.current = u.id;
    try {
      const { profile: fetchedProfile, hardError } = await fetchUserProfile(u.id, u);

      // Verify that active user hasn't changed during fetch
      if (activeFetchUserIdRef.current !== u.id) return;

      setProfileFetchFailed(hardError);

      if (fetchedProfile) {
        setProfile(fetchedProfile);
        loadedProfileIdRef.current = u.id;
        const syncedProfile = await syncGoogleProfileMetadata(fetchedProfile, u);
        if (activeFetchUserIdRef.current === u.id) {
          setProfile(syncedProfile);
        }
      } else {
        setProfile(null);
        loadedProfileIdRef.current = null;
      }
    } catch (err) {
      console.error('[AuthProvider] Failed to load profile:', err);
      if (activeFetchUserIdRef.current === u.id) {
        setProfile(null);
        setProfileFetchFailed(true);
        loadedProfileIdRef.current = null;
      }
    } finally {
      if (activeFetchUserIdRef.current === u.id) {
        setProfileAttempted(true);
      }
    }
  }, [profile]);

  const refreshProfile = useCallback(async (targetUserId?: string) => {
    const id = targetUserId ?? user?.id;
    if (!id) return;

    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (freshSession?.user) {
        setUser(freshSession.user);
        setSession(freshSession);
        await loadProfile(freshSession.user, true);
      }
    } catch (err) {
      console.error('[AuthProvider] Error during refreshProfile:', err);
    }
  }, [user?.id, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    const slowTimer = setTimeout(() => {
      if (isMounted && !isInitialisedRef.current) setAuthSlow(true);
    }, 3000);

    const safetyTimer = setTimeout(() => {
      if (isMounted && !isInitialisedRef.current) {
        console.warn('[AuthProvider] Auth initialization safety timeout reached (10s)');
        setLoading(false);
        setProfileAttempted(true);
        isInitialisedRef.current = true;
      }
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      console.log(`[AuthProvider] Auth State Event: ${event}`);

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // IMPORTANT: Only set loading = true on initial application boot.
        // NEVER set loading = true on tab focus, token refresh, or background auth events,
        // as doing so unmounts ProtectedRoute components and causes full page reloads!
        if (!isInitialisedRef.current) {
          setLoading(true);
        }
        await loadProfile(currentUser);
      } else {
        setProfile(null);
        setProfileAttempted(true);
        setProfileFetchFailed(false);
        activeFetchUserIdRef.current = null;
        loadedProfileIdRef.current = null;
      }

      if (isMounted && !isInitialisedRef.current) {
        setLoading(false);
        setAuthSlow(false);
        isInitialisedRef.current = true;
        clearTimeout(slowTimer);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(slowTimer);
      clearTimeout(safetyTimer);
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    activeFetchUserIdRef.current = null;
    loadedProfileIdRef.current = null;
    setProfile(null);
    setUser(null);
    setSession(null);
    setProfileAttempted(false);
    setProfileFetchFailed(false);

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthProvider] SignOut request error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authSlow,
        profileAttempted,
        profileFetchFailed,
        signOut,
        refreshProfile,
        displayName,
        avatarInitials,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};