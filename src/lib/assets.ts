import { supabase } from './supabase';
import { errorMessage } from './errors';

export async function uploadCinematicAsset(file: File, folder: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filePath = `${folder.replace(/\/+$/, '')}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('cinematic_assets').upload(filePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(errorMessage(error));
  const { data: { publicUrl } } = supabase.storage.from('cinematic_assets').getPublicUrl(filePath);
  if (!publicUrl) throw new Error('Upload succeeded but no public URL came back.');
  return publicUrl;
}
