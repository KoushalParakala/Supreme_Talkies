import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { errorMessage } from '../lib/errors';
import { uploadCinematicAsset } from '../lib/assets';

export interface NowShowingPoster {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: number;
}

export function useNowShowing() {
  const [posters, setPosters] = useState<NowShowingPoster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('now_showing')
        .select('id, title, image_url, link_url, position')
        .order('position', { ascending: true });
      if (!alive) return;
      if (error) console.error('now_showing fetch', error);
      setPosters((data || []) as NowShowingPoster[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const submitRequest = async (payload: {
    user_id: string;
    film_name: string;
    email: string;
    note: string;
    poster_link?: string;
    posterFile?: File | null;
  }) => {
    let poster_link = (payload.poster_link || '').trim();
    if (payload.posterFile) {
      poster_link = await uploadCinematicAsset(
        payload.posterFile,
        `now-showing-requests/${payload.user_id}`,
      );
    }
    if (!poster_link) throw new Error('Add a poster image or a poster link.');
    const { error } = await supabase.from('now_showing_requests').insert({
      user_id: payload.user_id,
      film_name: payload.film_name.trim(),
      email: payload.email.trim(),
      note: payload.note.trim() || null,
      poster_link,
      status: 'pending',
    });
    if (error) throw new Error(errorMessage(error));
    toast("REQUEST SENT — WE'LL BE IN TOUCH");
  };

  return { posters, loading, submitRequest };
}
