import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FILMS as fallbackFilms, Film } from '../data/films';

export function useFilms() {
  // Start with local 5 films for INSTANT reel rendering (no loading screens)
  const [films, setFilms] = useState<Film[]>(fallbackFilms);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFilms() {
      try {
        const { data, error } = await supabase
          .from('films')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Map database columns to the frontend Film interface
          const mappedFilms: Film[] = data.map(f => ({
            id: f.id,
            title: f.title,
            productionNote: f.production_note,
            color: f.color,
            rating: f.rating,
            duration: f.duration,
            director: f.director,
            producer: f.producer,
            cast: f.cast_members || f.cast, // Handle both legacy and new schema
            synopsis: f.synopsis,
            specialNote: f.special_note,
            videoLink: f.video_link,
            stills: f.stills || [],
            reelImage: f.reel_image,
            posterImage: f.poster_image,
            writtenBy: f.written_by,
            cinematography: f.cinematography,
            music: f.music,
            associateDirector: f.associate_director,
            colourist: f.colourist,
            publicityDesign: f.publicity_design,
            editing: f.editing,
            comingSoon: f.coming_soon,
            presentedBy: f.presented_by,
            teluguDubbingTeam: f.telugu_dubbing_team,
            supremeTalkiesTeam: f.supreme_talkies_team,
            customCredits: f.credits || []
          }));
          
          // COMBINE the local 5 films with the new database films (6th film onwards).
          // Deduped by id so a colliding/migrated DB row can never render as a duplicate card —
          // DB rows win over the local fallback since they're the more current source of truth.
          const byId = new Map<string, Film>();
          for (const f of fallbackFilms) byId.set(f.id, f);
          for (const f of mappedFilms) byId.set(f.id, f);
          setFilms(Array.from(byId.values()));
        }
      } catch (err) {
        console.error('Error fetching films from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFilms();
  }, []);

  return { films, loading };
}
