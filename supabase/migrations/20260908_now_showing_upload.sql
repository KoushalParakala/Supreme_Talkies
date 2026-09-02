-- Additive: member poster uploads for film requests + admin notice on new requests.
-- Also run 20260906_now_showing.sql if the tables are missing.
-- Do NOT run supabase_master.sql eraser on production.

ALTER TABLE public.now_showing
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.now_showing_requests
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Members may upload only into now-showing-requests/{their uid}/
DROP POLICY IF EXISTS "Cinematic assets member now-showing-requests" ON storage.objects;
CREATE POLICY "Cinematic assets member now-showing-requests"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cinematic_assets'
    AND (storage.foldername(name))[1] = 'now-showing-requests'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE OR REPLACE FUNCTION public.notify_on_now_showing_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, meta)
  SELECT
    p.id,
    'now_showing_request',
    'Film request: ' || COALESCE(NEW.film_name, 'Untitled'),
    COALESCE(NEW.email, '') || CASE
      WHEN NEW.note IS NULL OR btrim(NEW.note) = '' THEN ''
      ELSE ' — ' || NEW.note
    END,
    '/dashboard',
    jsonb_build_object('request_id', NEW.id, 'film_name', NEW.film_name)
  FROM public.profiles p
  WHERE 'admin' = ANY(COALESCE(p.roles, '{}')) OR p.role = 'admin';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_now_showing_request ON public.now_showing_requests;
CREATE TRIGGER trg_notify_now_showing_request
  AFTER INSERT ON public.now_showing_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_now_showing_request();
