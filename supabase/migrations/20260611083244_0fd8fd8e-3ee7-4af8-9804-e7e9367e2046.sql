DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings authenticated read" ON public.site_settings FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.site_settings FROM anon;