-- Additive: Floor Desk moderation that actually deletes / restricts.
-- RLS DELETE was silent: admins could only remove their own lines, so STRIKE ALL
-- looked like it worked then other members' messages reappeared.
-- Do NOT run supabase_master.sql eraser on production.

CREATE TABLE IF NOT EXISTS public.green_room_restrictions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('restricted', 'blocked')),
  reason text,
  set_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.green_room_restrictions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  jwt_email text;
BEGIN
  jwt_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF jwt_email IN ('admin@supremetalkies.com', 'koushal.sub@gmail.com') THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        lower(coalesce(role, '')) = 'admin'
        OR EXISTS (
          SELECT 1 FROM unnest(coalesce(roles, ARRAY[]::text[])) r
          WHERE lower(r) = 'admin'
        )
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

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

DROP POLICY IF EXISTS "green_room_messages_delete" ON public.green_room_messages;
CREATE POLICY "green_room_messages_delete" ON public.green_room_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "green_room_messages_update" ON public.green_room_messages;
CREATE POLICY "green_room_messages_update" ON public.green_room_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

GRANT UPDATE ON TABLE public.green_room_messages TO authenticated;

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

CREATE OR REPLACE FUNCTION public.admin_delete_green_room_message(target uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT AUTHORIZED';
  END IF;
  DELETE FROM public.green_room_messages WHERE id = target;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_strike_green_room_author(target uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT AUTHORIZED';
  END IF;
  DELETE FROM public.green_room_messages WHERE author_id = target;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_floor_restriction(target uuid, next_kind text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT AUTHORIZED';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'You cannot restrict your own account';
  END IF;
  IF next_kind NOT IN ('restricted', 'blocked') THEN
    RAISE EXCEPTION 'Invalid restriction';
  END IF;
  INSERT INTO public.green_room_restrictions (user_id, kind, set_by)
  VALUES (target, next_kind, auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET kind = EXCLUDED.kind,
        set_by = EXCLUDED.set_by,
        created_at = now();
  RETURN next_kind;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_lift_floor_restriction(target uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NOT AUTHORIZED';
  END IF;
  DELETE FROM public.green_room_restrictions WHERE user_id = target;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_green_room_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_strike_green_room_author(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_floor_restriction(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lift_floor_restriction(uuid) TO authenticated;

ALTER TABLE public.green_room_messages REPLICA IDENTITY FULL;
ALTER TABLE public.green_room_restrictions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.green_room_restrictions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
