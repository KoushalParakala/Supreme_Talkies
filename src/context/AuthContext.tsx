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
  const profileRef = useRef<Profile | null>(null);

  const displayName = useMemo(() => computeDisplayName(profile, user), [profile, user]);
  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  const isAdmin = useMemo(() => checkIsAdmin(user, profile), [user, profile]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const clearProfileState = useCallback(() => {
    setProfile(null);
    setProfileAttempted(false);
    setProfileFetchFailed(false);
    activeFetchUserIdRef.current = null;
    loadedProfileIdRef.current = null;
    profileRef.current = null;
  }, []);

  const loadProfile = useCallback(async (u: User, forceFetch = false) => {
    // Avoid redundant refetches if we already loaded profile for this user and not forcing
    if (!forceFetch && loadedProfileIdRef.current === u.id && profileRef.current !== null) {
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
        profileRef.current = fetchedProfile;
        loadedProfileIdRef.current = u.id;
        const syncedProfile = await syncGoogleProfileMetadata(fetchedProfile, u);
        if (activeFetchUserIdRef.current === u.id) {
          setProfile(syncedProfile);
          profileRef.current = syncedProfile;
        }
      } else {
        setProfile(null);
        profileRef.current = null;
        loadedProfileIdRef.current = null;
      }
    } catch (err) {
      console.error('[AuthProvider] Failed to load profile:', err);
      if (activeFetchUserIdRef.current === u.id) {
        setProfile(null);
        profileRef.current = null;
        setProfileFetchFailed(true);
        loadedProfileIdRef.current = null;
      }
    } finally {
      if (activeFetchUserIdRef.current === u.id) {
        setProfileAttempted(true);
      }
    }
  }, []);

  const refreshProfile = useCallback(async (_targetUserId?: string) => {
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
  }, [loadProfile]);

  // Boot auth once: sync session state only inside onAuthStateChange (no DB awaits).
  // Profile loading happens in a separate effect keyed on user.id — avoids the
  // documented Supabase deadlock when PostgREST is awaited inside the auth callback.
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

    const finishInit = () => {
      if (!isMounted || isInitialisedRef.current) return;
      setLoading(false);
      setAuthSlow(false);
      isInitialisedRef.current = true;
      clearTimeout(slowTimer);
      clearTimeout(safetyTimer);
    };

    const applySession = (currentSession: Session | null) => {
      if (!isMounted) return;
      setSession(currentSession);
      const nextUser = currentSession?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        profileRef.current = null;
        setProfileAttempted(true);
        setProfileFetchFailed(false);
        activeFetchUserIdRef.current = null;
        loadedProfileIdRef.current = null;
      } else if (loadedProfileIdRef.current !== nextUser.id) {
        // Restored or fresh sign-in for a user we haven't loaded yet — clear the
        // signed-out "attempted" flag so Auth/Dashboard don't treat this as
        // confirmed-missing and bounce to /role-select before the fetch finishes.
        setProfileAttempted(false);
        setProfileFetchFailed(false);
      }
      finishInit();
    };

    // Initial hydrate outside the auth-change callback
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
    }).catch((err) => {
      console.error('[AuthProvider] getSession failed:', err);
      finishInit();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      // Synchronous only — never await Supabase client calls here.
      applySession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(slowTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  // Load profile whenever the signed-in user identity changes (outside auth callback).
  useEffect(() => {
    if (!user) {
      return;
    }

    if (loadedProfileIdRef.current && loadedProfileIdRef.current !== user.id) {
      setProfile(null);
      profileRef.current = null;
      loadedProfileIdRef.current = null;
    }

    setProfileAttempted(false);
    void loadProfile(user);
    // Keyed on user.id only — TOKEN_REFRESHED replaces the user object reference
    // without changing identity and must not re-trigger a full profile fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loadProfile]);

  const signOut = useCallback(async () => {
    clearProfileState();
    setUser(null);
    setSession(null);

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthProvider] SignOut request error:', err);
    } finally {
      setLoading(false);
    }
  }, [clearProfileState]);

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
