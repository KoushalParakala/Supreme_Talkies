-- Additive: Now Showing posters + member film requests.
-- Do NOT run supabase_master.sql eraser on production.

CREATE TABLE IF NOT EXISTS public.now_showing (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  link_url   TEXT NOT NULL,
  position   INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.now_showing_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id),
  film_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  note         TEXT,
  poster_link  TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.now_showing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_showing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "now_showing_read" ON public.now_showing;
CREATE POLICY "now_showing_read" ON public.now_showing
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "now_showing_admin_write" ON public.now_showing;
CREATE POLICY "now_showing_admin_write" ON public.now_showing
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "nsr_insert" ON public.now_showing_requests;
CREATE POLICY "nsr_insert" ON public.now_showing_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nsr_own_read" ON public.now_showing_requests;
CREATE POLICY "nsr_own_read" ON public.now_showing_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "nsr_admin_manage" ON public.now_showing_requests;
CREATE POLICY "nsr_admin_manage" ON public.now_showing_requests
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON TABLE public.now_showing TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.now_showing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.now_showing_requests TO authenticated;

CREATE INDEX IF NOT EXISTS idx_now_showing_position ON public.now_showing(position);
CREATE INDEX IF NOT EXISTS idx_nsr_user_id ON public.now_showing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_nsr_status ON public.now_showing_requests(status);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.now_showing;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.now_showing_requests;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
