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
