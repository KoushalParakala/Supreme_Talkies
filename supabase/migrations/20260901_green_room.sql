-- Additive: Green Room conversation (text + reel links, no image uploads this pass)
-- Do NOT run supabase_master.sql eraser on production.

CREATE TABLE IF NOT EXISTS public.green_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text,
  reel_film_id uuid REFERENCES public.films(id) ON DELETE SET NULL,
  external_link text,
  external_link_title text,
  external_link_image text,
  reply_to_id uuid REFERENCES public.green_room_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.green_room_reactions (
  message_id uuid NOT NULL REFERENCES public.green_room_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('hype', 'loved', 'clap')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, kind)
);

CREATE INDEX IF NOT EXISTS green_room_messages_created_idx
  ON public.green_room_messages (created_at ASC);
CREATE INDEX IF NOT EXISTS green_room_messages_reel_idx
  ON public.green_room_messages (reel_film_id)
  WHERE reel_film_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS green_room_messages_reply_idx
  ON public.green_room_messages (reply_to_id)
  WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS green_room_reactions_message_idx
  ON public.green_room_reactions (message_id);

ALTER TABLE public.green_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_room_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "green_room_messages_select" ON public.green_room_messages;
CREATE POLICY "green_room_messages_select" ON public.green_room_messages
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "green_room_messages_insert" ON public.green_room_messages;
CREATE POLICY "green_room_messages_insert" ON public.green_room_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "green_room_messages_delete" ON public.green_room_messages;
CREATE POLICY "green_room_messages_delete" ON public.green_room_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "green_room_reactions_select" ON public.green_room_reactions;
CREATE POLICY "green_room_reactions_select" ON public.green_room_reactions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "green_room_reactions_insert" ON public.green_room_reactions;
CREATE POLICY "green_room_reactions_insert" ON public.green_room_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "green_room_reactions_delete" ON public.green_room_reactions;
CREATE POLICY "green_room_reactions_delete" ON public.green_room_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON TABLE public.green_room_messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.green_room_reactions TO authenticated;

ALTER TABLE public.green_room_reactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.green_room_messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.green_room_reactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
