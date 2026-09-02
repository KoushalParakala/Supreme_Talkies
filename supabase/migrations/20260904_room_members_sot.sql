-- Additive: project_room_members is the single source of truth for room membership.
-- Do NOT run supabase_master.sql eraser on production.

-- 1. Backfill join rows from the legacy member_ids array
INSERT INTO public.project_room_members (room_id, user_id)
SELECT r.id, m.uid
FROM public.project_rooms r
CROSS JOIN LATERAL unnest(COALESCE(r.member_ids, '{}'::uuid[])) AS m(uid)
WHERE m.uid IS NOT NULL
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Avoid RLS recursion when members read co-members of the same room
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_room_members
    WHERE room_id = p_room_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_room_member(uuid) TO authenticated;

-- 2. Policies on the join table (RLS was enabled with none — writes were silently denied)
DROP POLICY IF EXISTS "room_members_select" ON public.project_room_members;
CREATE POLICY "room_members_select" ON public.project_room_members
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR public.is_room_member(room_id)
  );

DROP POLICY IF EXISTS "room_members_admin_write" ON public.project_room_members;
CREATE POLICY "room_members_admin_write" ON public.project_room_members
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, DELETE ON TABLE public.project_room_members TO authenticated;

-- 3. Room SELECT checks the join table, not member_ids
DROP POLICY IF EXISTS "rooms_member_or_admin" ON public.project_rooms;
CREATE POLICY "rooms_member_or_admin" ON public.project_rooms
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_room_member(id));

-- 4. Drop the split-brain column (amplifier_groups.member_ids is untouched)
ALTER TABLE public.project_rooms DROP COLUMN IF EXISTS member_ids;
