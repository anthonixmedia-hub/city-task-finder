
-- 1. site_settings: editable key/value site content
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL  ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings public read"  ON public.site_settings;
DROP POLICY IF EXISTS "site_settings admin write"  ON public.site_settings;
DROP POLICY IF EXISTS "site_settings admin update" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings admin delete" ON public.site_settings;

CREATE POLICY "site_settings public read"  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings admin write"  ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_settings admin update" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_settings admin delete" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- seed default keys (only if missing)
INSERT INTO public.site_settings(key, value) VALUES
  ('homepage', '{"hero_title":"Find Local Jobs & Workers in Your City","hero_subtitle":"Post a job for free. Workers contact you directly.","cta_primary":"Post a Job","cta_secondary":"Browse Jobs"}'::jsonb),
  ('plans',    '{"premium_price":499,"professional_price":999,"premium_label":"Premium","professional_label":"Professional","note":"One-time payment via UPI. Access code delivered on WhatsApp."}'::jsonb),
  ('contact',  '{"whatsapp":"+919999999999","email":"support@mycityrozgar.in","upi_id":"mycityrozgar@upi"}'::jsonb),
  ('footer',   '{"tagline":"MyCityRozgar.in — Local jobs, real workers.","copyright":"© MyCityRozgar.in"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Admin moderation policies on jobs
DROP POLICY IF EXISTS "admin update any job" ON public.jobs;
DROP POLICY IF EXISTS "admin delete any job" ON public.jobs;
CREATE POLICY "admin update any job" ON public.jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin delete any job" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Admin moderation on profiles (update). The privilege-escalation trigger
--    already allows admins to change protected fields.
DROP POLICY IF EXISTS "admin update any profile" ON public.profiles;
CREATE POLICY "admin update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Admin management of categories
DROP POLICY IF EXISTS "admin insert categories" ON public.categories;
DROP POLICY IF EXISTS "admin update categories" ON public.categories;
DROP POLICY IF EXISTS "admin delete categories" ON public.categories;
CREATE POLICY "admin insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. user_roles: allow admins to manage roles (grant / revoke admin)
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
DROP POLICY IF EXISTS "admin manage roles insert" ON public.user_roles;
DROP POLICY IF EXISTS "admin manage roles delete" ON public.user_roles;
CREATE POLICY "admin manage roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin manage roles delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. updated_at trigger on site_settings
DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
