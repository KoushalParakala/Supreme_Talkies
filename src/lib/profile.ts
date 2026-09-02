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
  if (rArray.some((r) => typeof r === 'string' && r.toLowerCase() === 'admin')) return true;
  if (typeof profile?.role === 'string' && profile.role.toLowerCase() === 'admin') return true;
  return false;
}

/**
 * Computes the display name from profile, user metadata, or email.
 */
export function computeDisplayName(profile: Profile | null, user: User | null): string {
  if (typeof profile?.full_name === 'string' && profile.full_name.trim()) {
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
 * Production roles a member can self-assign via assign_role RPC.
 * `member` is only the DB onboarding placeholder; `admin` is never self-service.
 */
export const ASSIGNABLE_ROLES = [
  'writer',
  'technician',
  'producer',
  'presenter',
  'marketing',
  'amplifier',
] as const;

/**
 * Returns roles that can open a dashboard. Strips placeholder `member` and `admin`
 * (admin is handled separately via checkIsAdmin).
 */
export function getUsableRoles(profile: Profile | null): string[] {
  if (!profile) return [];
  const raw: string[] = [];
  if (Array.isArray(profile.roles)) raw.push(...profile.roles);
  if (profile.role && !raw.includes(profile.role)) raw.push(profile.role);
  return Array.from(
    new Set(
      raw
        .map((role) => (typeof role === 'string' ? role.toLowerCase() : ''))
        .filter((role) => role && role !== 'admin' && role !== 'member')
    )
  );
}

/**
 * Fetches user profile with retry for the signup DB trigger, and auto-patches missing st_id.
 * Never invents a client-side fallback row — that created ghost "member" profiles on refresh.
 * New accounts get their row from handle_new_user; missing row after retries = onboarding.
 */
export async function fetchUserProfile(userId: string, _user?: User | null): Promise<FetchProfileResult> {
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
          // Row does not exist yet (trigger lag or brand-new user)
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
    // Confirmed missing (PGRST116) → onboarding with hardError false.
    // Network/RLS errors leave hardError true for the retry UI.
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

/**
 * Deduplicates an array of profile objects by primary key ID, email, or st_id.
 */
export function deduplicateProfiles<T extends { id?: string; email?: string; st_id?: string }>(profiles: T[]): T[] {
  if (!Array.isArray(profiles)) return [];
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const result: T[] = [];

  for (const item of profiles) {
    if (!item) continue;
    const id = item.id;
    const email = item.email?.toLowerCase().trim();

    if (id && seenIds.has(id)) continue;
    if (email && seenEmails.has(email)) continue;

    if (id) seenIds.add(id);
    if (email) seenEmails.add(email);
    result.push(item);
  }

  return result;
}
