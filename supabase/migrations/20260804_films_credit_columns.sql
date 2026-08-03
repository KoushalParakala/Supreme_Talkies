-- Additive migration: film credit columns expected by useFilms / AdminDashboard
-- Do NOT run supabase_master.sql eraser on production.
-- Safe to re-run after a partial failure (uses IF NOT EXISTS).

ALTER TABLE public.films ADD COLUMN IF NOT EXISTS production_note TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS logline TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS written_by TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS cinematography TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS music TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS editing TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS associate_director TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS colourist TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS publicity_design TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS presented_by TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS telugu_dubbing_team TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS supreme_talkies_team TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS credits JSONB DEFAULT '[]'::jsonb;

-- Backfill production_note from logline only when that column already had data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'films'
      AND column_name = 'logline'
  ) THEN
    UPDATE public.films
    SET production_note = logline
    WHERE (production_note IS NULL OR production_note = '')
      AND logline IS NOT NULL
      AND logline <> '';
  END IF;
END $$;
