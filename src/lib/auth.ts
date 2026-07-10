import {User} from '@supabase/supabase-js';
import type {Profile} from '../context/AuthContext';

/**
 * @deprecated Use isAdmin from useAuth() hook instead.
 * Kept for backward compatibility in edge cases.
 */
export function isAdminUser(user:User|null,profile:Profile|null):boolean{
  const adminEmailsStr=import.meta.env.VITE_ADMIN_EMAILS||'';
  const adminEmails=adminEmailsStr.split(',').map((e:string)=>e.trim().toLowerCase()).filter(Boolean);
  if (user?.email&&adminEmails.includes(user.email.toLowerCase())) return true;
  const rArray=Array.isArray(profile?.roles)?profile.roles:[];
  if (rArray.some((r:string)=>r.toLowerCase()==='admin')) return true;
  if (profile?.role?.toLowerCase()==='admin') return true;
  return false;
}

/**
 * Generate a DETERMINISTIC SUPR-ID fallback from the user's UUID.
 */
export function deriveSuprId(userId: string): string {
  const clean = userId.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const num = (hash % 90000) + 10000;
  return `SUPR-${num.toString().padStart(5, '0')}`;
}

