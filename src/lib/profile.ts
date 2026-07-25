import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { deriveSuprId } from './auth';
import { Profile } from '../types/auth';

/**
 * Derives avatar initials from a full name.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Checks whether the current profile grants admin access.
 */
export function checkIsAdmin(_user: User | null, profile: Profile | null): boolean {
  const rArray = Array.isArray(profile?.roles) ? profile.roles : [];
  if (rArray.some((r: string) => typeof r === 'string' && r.toLowerCase() === 'admin')) return true;
  if (profile?.role?.toLowerCase() === 'admin') return true;
  return false;
}

/**
 * Computes the display name from profile, user metadata, or email.
 */
export function computeDisplayName(profile: Profile | null, user: User | null): string {
  if (profile?.full_name && profile.full_name.trim()) {
    return profile.full_name.trim();
  }
  const metaName = (user?.user_metadata as Record<string, unknown> | undefined)?.full_name;
  if (typeof metaName === 'string' && metaName.trim()) {
    return metaName.trim();
  }
  const fromEmail = user?.email?.split('@')[0];
  return fromEmail ? fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1) : 'Member';
}

export interface FetchProfileResult {
  profile: Profile | null;
  hardError: boolean;
}

/**
 * Fetches user profile with clean retry mechanism for DB triggers and auto-patches missing st_id.
 */
export async function fetchUserProfile(userId: string): Promise<FetchProfileResult> {
  const backoffs = [0, 200, 500];
  let hardError = false;
  let profileData: Record<string, unknown> | null = null;

  for (let i = 0; i < backoffs.length; i++) {
    if (backoffs[i] > 0) {
      await new Promise((r) => setTimeout(r, backoffs[i]));
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        profileData = data as Record<string, unknown>;
        hardError = false;
        break;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // Row does not exist yet (could be immediate post-signup before trigger finishes)
          hardError = false;
        } else {
          console.error(`[fetchUserProfile] DB error (attempt ${i + 1}):`, error);
          hardError = true;
          break;
        }
      }
    } catch (err) {
      console.error(`[fetchUserProfile] Unexpected error (attempt ${i + 1}):`, err);
      hardError = true;
      break;
    }
  }

  if (!profileData) {
    return { profile: null, hardError };
  }

  // Auto-patch missing st_id if needed
  if (!profileData.st_id) {
    const deterministicStId = deriveSuprId(userId);
    try {
      const { data: patched } = await supabase
        .from('profiles')
        .update({ st_id: deterministicStId })
        .eq('id', userId)
        .is('st_id', null)
        .select()
        .single();

      if (patched) {
        profileData = patched as Record<string, unknown>;
      } else {
        profileData.st_id = deterministicStId;
      }
    } catch (patchErr) {
      console.warn('[fetchUserProfile] Failed to patch st_id:', patchErr);
      profileData.st_id = deterministicStId;
    }
  }

  const safeProfile = profileData as unknown as Profile;
  return { profile: safeProfile, hardError: false };
}

/**
 * Synchronizes user metadata (e.g. Google avatar and name) into profile if missing.
 */
export async function syncGoogleProfileMetadata(profile: Profile, user: User): Promise<Profile> {
  const googleAvatar = user.user_metadata?.avatar_url as string | undefined;
  const googleName = user.user_metadata?.full_name as string | undefined;
  const updates: Record<string, string> = {};

  if (!profile.avatar_url && googleAvatar) {
    updates.avatar_url = googleAvatar;
  }
  if ((!profile.full_name || profile.full_name === 'Anonymous Creator') && googleName) {
    updates.full_name = googleName;
  }

  if (Object.keys(updates).length === 0) {
    return profile;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (!error) {
      return { ...profile, ...updates };
    }
  } catch (err) {
    console.warn('[syncGoogleProfileMetadata] Sync error:', err);
  }

  return profile;
}
