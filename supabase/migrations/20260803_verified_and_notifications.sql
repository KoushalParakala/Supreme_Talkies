-- Additive migration: SUPR Verified from profile completeness + in-app notifications
-- Do NOT run supabase_master.sql eraser on production.

-- ═══════════════════════════════════════════════════════════════════
-- 1. evaluate_and_set_st_verified
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.profile_has_usable_role(p public.profiles)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(
      COALESCE(p.roles, '{}'::text[])
      || CASE WHEN p.role IS NOT NULL THEN ARRAY[p.role] ELSE '{}'::text[] END
    ) AS r(role_name)
    WHERE lower(r.role_name) IN (
      'writer','technician','producer','presenter','marketing','amplifier','admin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_meets_verified_checklist(p public.profiles)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  has_role BOOLEAN;
  is_tech BOOLEAN;
  has_flavor BOOLEAN;
  name_ok BOOLEAN;
BEGIN
  name_ok := p.full_name IS NOT NULL
    AND length(trim(p.full_name)) > 0
    AND lower(trim(p.full_name)) NOT IN ('anonymous creator', 'member', 'anonymous');

  IF NOT name_ok THEN RETURN FALSE; END IF;
  IF p.phone IS NULL OR length(trim(p.phone)) = 0 THEN RETURN FALSE; END IF;
  IF p.age IS NULL OR p.age <= 0 THEN RETURN FALSE; END IF;
  IF p.avatar_url IS NULL OR length(trim(p.avatar_url)) = 0 THEN RETURN FALSE; END IF;

  has_role := public.profile_has_usable_role(p);
  IF NOT has_role THEN RETURN FALSE; END IF;

  is_tech := (
    lower(COALESCE(p.role, '')) = 'technician'
    OR EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.roles, '{}'::text[])) x(r)
      WHERE lower(x.r) = 'technician'
    )
  );

  IF is_tech THEN
    has_flavor := (
      (p.niche IS NOT NULL AND length(trim(p.niche)) > 0)
      AND (
        (p.skills IS NOT NULL AND cardinality(p.skills) > 0)
        OR (p.portfolio_url IS NOT NULL AND length(trim(p.portfolio_url)) > 0)
      )
    );
  ELSE
    has_flavor := (
      (p.niche IS NOT NULL AND length(trim(p.niche)) > 0)
      OR (p.note_to_team IS NOT NULL AND length(trim(p.note_to_team)) > 0)
      OR (p.social_handle IS NOT NULL AND length(trim(p.social_handle)) > 0)
    );
  END IF;

  RETURN has_flavor;
END;
$$;

CREATE OR REPLACE FUNCTION public.evaluate_and_set_st_verified(target_uid UUID DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := COALESCE(target_uid, auth.uid());
  p public.profiles;
  should_verify BOOLEAN;
  result public.profiles;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Users may only evaluate themselves unless admin
  IF target_uid IS NOT NULL AND target_uid IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT * INTO p FROM public.profiles WHERE id = uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  should_verify := public.profile_meets_verified_checklist(p);

  IF p.st_verified IS NOT DISTINCT FROM should_verify THEN
    RETURN p;
  END IF;

  -- Bypass privileged-column guard for this trusted path
  PERFORM set_config('app.assign_role_in_progress', 'true', true);

  UPDATE public.profiles
  SET st_verified = should_verify,
      updated_at = NOW()
  WHERE id = uid
  RETURNING * INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_and_set_st_verified(UUID) TO authenticated;

-- Also re-evaluate after role assignment
CREATE OR REPLACE FUNCTION public.assign_role(new_role TEXT)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  allowed TEXT[] := ARRAY['writer','technician','producer','presenter','marketing','amplifier'];
  merged_roles TEXT[];
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (lower(new_role) = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  SELECT roles INTO merged_roles FROM public.profiles WHERE id = auth.uid();
  merged_roles := ARRAY(SELECT DISTINCT unnest(COALESCE(merged_roles, '{}') || ARRAY[lower(new_role)]));

  PERFORM set_config('app.assign_role_in_progress', 'true', true);

  UPDATE public.profiles
  SET roles = merged_roles,
      role = lower(new_role),
      updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO result;

  -- Re-evaluate verification after role change
  RETURN public.evaluate_and_set_st_verified(auth.uid());
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. notifications
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  read_at     TIMESTAMPTZ,
  meta        JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts only via SECURITY DEFINER helpers / triggers
DROP POLICY IF EXISTS "notif_no_client_insert" ON public.notifications;
CREATE POLICY "notif_no_client_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "notif_no_client_delete" ON public.notifications;
CREATE POLICY "notif_no_client_delete" ON public.notifications
  FOR DELETE TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nid UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link, meta)
  VALUES (p_user_id, p_type, p_title, p_body, p_link, COALESCE(p_meta, '{}'::jsonb))
  RETURNING id INTO nid;
  RETURN nid;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids UUID[] DEFAULT NULL)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_ids IS NULL THEN
    UPDATE public.notifications
    SET read_at = NOW()
    WHERE user_id = auth.uid() AND read_at IS NULL;
  ELSE
    UPDATE public.notifications
    SET read_at = NOW()
    WHERE user_id = auth.uid() AND id = ANY(p_ids) AND read_at IS NULL;
  END IF;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read(UUID[]) TO authenticated;

-- Script stage / status changes → notify owner
CREATE OR REPLACE FUNCTION public.notify_on_script_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.kanban_stage IS DISTINCT FROM OLD.kanban_stage
    OR NEW.status IS DISTINCT FROM OLD.status
  ) THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'script_status',
      'Script update: ' || COALESCE(NEW.title, 'Untitled'),
      'Status is now ' || upper(replace(COALESCE(NEW.kanban_stage, NEW.status, 'updated'), '_', ' ')),
      '/dashboard',
      jsonb_build_object(
        'script_id', NEW.id,
        'kanban_stage', NEW.kanban_stage,
        'status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_script_status ON public.scripts;
CREATE TRIGGER trg_notify_script_status
  AFTER UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_script_status();

-- Presentation status changes
CREATE OR REPLACE FUNCTION public.notify_on_presentation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'screening_status',
      'Screening update: ' || COALESCE(NEW.title, 'Untitled'),
      'Your screening is now ' || upper(replace(COALESCE(NEW.status, 'updated'), '_', ' ')),
      '/dashboard',
      jsonb_build_object('presentation_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_presentation_status ON public.presentations;
CREATE TRIGGER trg_notify_presentation_status
  AFTER UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_presentation_status();

-- Collab requests
CREATE OR REPLACE FUNCTION public.notify_on_collab()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.receiver_id,
      'collab_request',
      'New collaboration request',
      COALESCE(NEW.message, 'Someone wants to collaborate with you.'),
      '/dashboard',
      jsonb_build_object('collab_id', NEW.id, 'sender_id', NEW.sender_id)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.sender_id,
      'collab_response',
      'Collaboration ' || upper(COALESCE(NEW.status, 'updated')),
      'Your collaboration request was ' || lower(COALESCE(NEW.status, 'updated')) || '.',
      '/dashboard',
      jsonb_build_object('collab_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_collab ON public.collab_requests;
CREATE TRIGGER trg_notify_collab
  AFTER INSERT OR UPDATE ON public.collab_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_collab();

-- Project room member added
CREATE OR REPLACE FUNCTION public.notify_on_room_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_title TEXT;
BEGIN
  SELECT title INTO room_title FROM public.project_rooms WHERE id = NEW.room_id;
  PERFORM public.create_notification(
    NEW.user_id,
    'system',
    'Project assignment',
    'You were added to ' || COALESCE(room_title, 'a project room') || '.',
    '/dashboard',
    jsonb_build_object('room_id', NEW.room_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_room_member ON public.project_room_members;
CREATE TRIGGER trg_notify_room_member
  AFTER INSERT ON public.project_room_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_room_member();

-- Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
