-- Additive: Green Room moderation (restrict/block), admin delete, weekly purge.
-- Do NOT run supabase_master.sql eraser on production.
--
-- Weekly refresh: deploy supabase/functions/purge-green-room and schedule it in
-- Supabase Dashboard → Edge Functions → purge-green-room → Schedules (daily is
-- enough; the RPC deletes anything older than 7 days). Send header
-- x-webhook-secret matching EDGE_FUNCTION_SECRET (same as weekly-digest).
-- Optional if pg_cron is enabled:
--   select cron.schedule(
--     'purge-green-room',
--     '0 4 * * *',
--     $$select public.purge_green_room_older_than_week()$$
--   );

CREATE TABLE IF NOT EXISTS public.green_room_restrictions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('restricted', 'blocked')),
  reason text,
  set_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.green_room_restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gr_restrictions_self_read" ON public.green_room_restrictions;
CREATE POLICY "gr_restrictions_self_read" ON public.green_room_restrictions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "gr_restrictions_admin" ON public.green_room_restrictions;
CREATE POLICY "gr_restrictions_admin" ON public.green_room_restrictions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.green_room_restrictions TO authenticated;

CREATE INDEX IF NOT EXISTS green_room_messages_author_idx
  ON public.green_room_messages (author_id);

CREATE OR REPLACE FUNCTION public.green_room_guard_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.green_room_restrictions
    WHERE user_id = NEW.author_id
  ) THEN
    RAISE EXCEPTION 'RESTRICTED FROM THE FLOOR';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_green_room_guard_insert ON public.green_room_messages;
CREATE TRIGGER trg_green_room_guard_insert
  BEFORE INSERT ON public.green_room_messages
  FOR EACH ROW EXECUTE FUNCTION public.green_room_guard_insert();

CREATE OR REPLACE FUNCTION public.green_room_guard_reaction()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.green_room_restrictions
    WHERE user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'RESTRICTED FROM THE FLOOR';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_green_room_guard_reaction ON public.green_room_reactions;
CREATE TRIGGER trg_green_room_guard_reaction
  BEFORE INSERT ON public.green_room_reactions
  FOR EACH ROW EXECUTE FUNCTION public.green_room_guard_reaction();

DROP POLICY IF EXISTS "green_room_messages_delete" ON public.green_room_messages;
CREATE POLICY "green_room_messages_delete" ON public.green_room_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "green_room_messages_update" ON public.green_room_messages;
CREATE POLICY "green_room_messages_update" ON public.green_room_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "green_room_reactions_delete" ON public.green_room_reactions;
CREATE POLICY "green_room_reactions_delete" ON public.green_room_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

GRANT UPDATE ON TABLE public.green_room_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.purge_green_room_older_than_week()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.green_room_messages
  WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_green_room_older_than_week() TO service_role;

ALTER TABLE public.green_room_restrictions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.green_room_restrictions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
