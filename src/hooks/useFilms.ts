import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FILMS as fallbackFilms, Film } from '../data/films';

export function useFilms() {
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
          // Map snake_case db columns to camelCase Film interface
          const mappedFilms: Film[] = data.map(f => ({
            id: f.id,
            title: f.title,
            productionNote: f.production_note,
            color: f.color,
            rating: f.rating,
            duration: f.duration,
            director: f.director,
            producer: f.producer,
            cast: f.cast,
            synopsis: f.synopsis,
            specialNote: f.special_note,
            videoLink: f.video_link,
            stills: f.stills || [],
            reelImage: f.reel_image,
            posterImage: f.poster_image, // Used in PosterStrip if available
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
          
          // Combine fallback films with database films
          setFilms([...fallbackFilms, ...mappedFilms]);
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
