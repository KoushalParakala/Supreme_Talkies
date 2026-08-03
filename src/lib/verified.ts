import { Profile } from '../types/auth';
import { getUsableRoles } from './profile';

export type VerifyCheckId =
  | 'full_name'
  | 'phone'
  | 'age'
  | 'avatar'
  | 'role'
  | 'flavor';

export interface VerifyCheck {
  id: VerifyCheckId;
  label: string;
  done: boolean;
}

function hasUsableRole(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.role?.toLowerCase() === 'admin') return true;
  if (Array.isArray(profile.roles) && profile.roles.some((r) => r?.toLowerCase() === 'admin')) return true;
  return getUsableRoles(profile).length > 0;
}

function isTechnician(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.role?.toLowerCase() === 'technician') return true;
  return Array.isArray(profile.roles) && profile.roles.some((r) => r?.toLowerCase() === 'technician');
}

function flavorDone(profile: Profile | null, form?: Partial<ProfileFormSnapshot>): boolean {
  const niche = (form?.niche ?? profile?.niche ?? '').trim();
  const note = (form?.note_to_team ?? profile?.note_to_team ?? '').trim();
  const social = (form?.social_handle ?? profile?.social_handle ?? '').trim();
  const portfolio = (form?.portfolio_url ?? profile?.portfolio_url ?? '').trim();
  const skills = form?.skills ?? profile?.skills ?? [];

  if (isTechnician(profile)) {
    return !!niche && ((Array.isArray(skills) && skills.length > 0) || !!portfolio);
  }
  return !!(niche || note || social);
}

export interface ProfileFormSnapshot {
  full_name?: string;
  phone?: string;
  age?: string | number | null;
  avatar_url?: string;
  niche?: string;
  note_to_team?: string;
  social_handle?: string;
  portfolio_url?: string;
  skills?: string[];
}

export function getVerifyChecks(
  profile: Profile | null,
  form?: ProfileFormSnapshot
): VerifyCheck[] {
  const name = (form?.full_name ?? profile?.full_name ?? '').trim();
  const nameOk =
    !!name &&
    !['anonymous creator', 'member', 'anonymous'].includes(name.toLowerCase());
  const phone = (form?.phone ?? profile?.phone ?? '').trim();
  const ageRaw = form?.age ?? profile?.age;
  const ageNum = typeof ageRaw === 'string' ? parseInt(ageRaw, 10) : ageRaw;
  const ageOk = typeof ageNum === 'number' && !Number.isNaN(ageNum) && ageNum > 0;
  const avatar = (form?.avatar_url ?? profile?.avatar_url ?? '').trim();

  return [
    { id: 'full_name', label: 'Full name', done: nameOk },
    { id: 'phone', label: 'Phone', done: !!phone },
    { id: 'age', label: 'Age', done: ageOk },
    { id: 'avatar', label: 'Profile photo', done: !!avatar },
    { id: 'role', label: 'Casting role chosen', done: hasUsableRole(profile) },
    {
      id: 'flavor',
      label: isTechnician(profile)
        ? 'Niche + skills or portfolio'
        : 'Niche, social, or note to team',
      done: flavorDone(profile, form),
    },
  ];
}

export function getVerifyProgress(profile: Profile | null, form?: ProfileFormSnapshot) {
  const checks = getVerifyChecks(profile, form);
  const done = checks.filter((c) => c.done).length;
  return { checks, done, total: checks.length, complete: done === checks.length };
}
