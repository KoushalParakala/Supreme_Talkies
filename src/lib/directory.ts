import { supabase } from './supabase';

export interface DirectoryProfile {
  id: string;
  full_name: string | null;
  avatar_symbol: string | null;
  st_id: string | null;
  st_verified: boolean | null;
  role: string | null;
  roles: string[] | null;
  niche?: string | null;
  availability?: boolean | null;
  skills?: string[] | null;
  portfolio_url?: string | null;
  note_to_team?: string | null;
  created_at?: string | null;
}

export interface PublicCrewProfile {
  full_name: string | null;
  avatar_symbol: string | null;
  st_id: string | null;
  st_verified: boolean | null;
  roles: string[] | null;
  niche?: string | null;
  availability?: boolean | null;
  note_to_team?: string | null;
  created_at?: string | null;
}

export async function fetchMemberDirectoryByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, DirectoryProfile>();

  const { data, error } = await supabase
    .from('member_directory')
    .select('*')
    .in('id', uniqueIds);

  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile as DirectoryProfile]));
}

export async function fetchMemberByStId(stId: string) {
  const normalized = stId.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('member_directory')
    .select('*')
    .eq('st_id', normalized)
    .maybeSingle();

  if (error) throw error;
  return (data as DirectoryProfile | null) ?? null;
}
