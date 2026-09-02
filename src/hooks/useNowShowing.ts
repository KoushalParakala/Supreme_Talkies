import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

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
    poster_link: string;
  }) => {
    const { error } = await supabase.from('now_showing_requests').insert({
      user_id: payload.user_id,
      film_name: payload.film_name.trim(),
      email: payload.email.trim(),
      note: payload.note.trim() || null,
      poster_link: payload.poster_link.trim(),
      status: 'pending',
    });
    if (error) throw error;
    toast('REQUEST SENT — WE\'LL BE IN TOUCH');
  };

  return { posters, loading, submitRequest };
}
