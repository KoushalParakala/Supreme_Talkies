import { useState } from 'react';
import { FILMS as fallbackFilms, Film } from '../data/films';

export function useFilms() {
  const [films] = useState<Film[]>(fallbackFilms);
  const [loading] = useState(false);

  return { films, loading };
}
