-- Additive: lock profiles SELECT to authenticated; keep member_directory readable by anon.
-- Do NOT run supabase_master.sql eraser on production.

DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- member_directory is the public-safe surface (no email/phone/age).
-- security_invoker = false so anon SELECT on the view is not blocked by profiles RLS.
ALTER VIEW public.member_directory SET (security_invoker = false);
GRANT SELECT ON public.member_directory TO authenticated, anon;
