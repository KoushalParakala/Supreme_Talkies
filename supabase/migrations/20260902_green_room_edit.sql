-- Additive: authors can edit/delete their own Green Room lines.
-- Do NOT run supabase_master.sql eraser on production.

ALTER TABLE public.green_room_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

ALTER TABLE public.green_room_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "green_room_messages_update" ON public.green_room_messages;
CREATE POLICY "green_room_messages_update" ON public.green_room_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.green_room_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.green_room_touch_edited()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'Cannot reassign a Green Room line';
  END IF;
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS green_room_messages_touch_edited ON public.green_room_messages;
CREATE TRIGGER green_room_messages_touch_edited
  BEFORE UPDATE ON public.green_room_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.green_room_touch_edited();
