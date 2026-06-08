
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.user_type AS ENUM ('customer', 'worker');
CREATE TYPE public.plan_tier AS ENUM ('free', 'premium', 'professional');
CREATE TYPE public.job_status AS ENUM ('active', 'closed', 'completed');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========== profiles ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  mobile TEXT,
  email TEXT,
  city TEXT DEFAULT 'Dumka',
  area TEXT,
  role public.user_type NOT NULL DEFAULT 'customer',
  plan public.plan_tier NOT NULL DEFAULT 'free',
  photo_url TEXT,
  bio TEXT,
  category TEXT,
  experience_years INT,
  access_unlocked BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  mobile_verified BOOLEAN NOT NULL DEFAULT false,
  documents_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, mobile, city, area, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'mobile',
    COALESCE(NEW.raw_user_meta_data->>'city', 'Dumka'),
    NEW.raw_user_meta_data->>'area',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_type, 'customer')
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== user_roles ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =========== categories ===========
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated, anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);

-- =========== jobs ===========
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min INT,
  budget_max INT,
  city TEXT NOT NULL DEFAULT 'Dumka',
  area TEXT,
  phone TEXT NOT NULL,
  preferred_time TEXT,
  urgent BOOLEAN NOT NULL DEFAULT false,
  status public.job_status NOT NULL DEFAULT 'active',
  responses_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs public read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "auth users post jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "owners update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "owners delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = customer_id);
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX jobs_city_status_idx ON public.jobs(city, status, created_at DESC);
CREATE INDEX jobs_category_idx ON public.jobs(category_slug, created_at DESC);

-- =========== access_codes ===========
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan public.plan_tier NOT NULL DEFAULT 'premium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
-- Users can SELECT only when redeeming (we'll use a server function for redemption with service role).
CREATE POLICY "users see codes assigned to them" ON public.access_codes FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage codes" ON public.access_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== applications ===========
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);
GRANT SELECT, INSERT, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workers see own apps" ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = worker_id OR auth.uid() IN (SELECT customer_id FROM public.jobs WHERE id = job_id));
CREATE POLICY "workers apply" ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "workers withdraw own" ON public.job_applications FOR DELETE TO authenticated
  USING (auth.uid() = worker_id);

-- Seed categories
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
('House Cleaning','house-cleaning','sparkles',1),
('Bathroom Cleaning','bathroom-cleaning','droplets',2),
('Kitchen Cleaning','kitchen-cleaning','utensils',3),
('Sofa Cleaning','sofa-cleaning','sofa',4),
('Water Tank Cleaning','water-tank-cleaning','container',5),
('Electrician','electrician','zap',6),
('Plumber','plumber','wrench',7),
('Carpenter','carpenter','hammer',8),
('Painter','painter','paint-bucket',9),
('Mason / Rajmistri','mason','brick-wall',10),
('AC Repair','ac-repair','air-vent',11),
('Refrigerator Repair','fridge-repair','refrigerator',12),
('Washing Machine Repair','washing-machine-repair','washing-machine',13),
('Laptop Repair','laptop-repair','laptop',14),
('Computer Repair','computer-repair','monitor',15),
('Data Entry','data-entry','keyboard',16),
('Typing Work','typing','type',17),
('Computer Operator','computer-operator','computer',18),
('Graphic Designer','graphic-designer','palette',19),
('Video Editor','video-editor','video',20),
('Website Developer','website-developer','code',21),
('Mobile Repair','mobile-repair','smartphone',22),
('Driver','driver','car',23),
('Delivery Boy','delivery','bike',24),
('Shifting Helper','shifting-helper','truck',25),
('General Labour','general-labour','hard-hat',26),
('Cook','cook','chef-hat',27),
('Maid','maid','home',28),
('Babysitter','babysitter','baby',29),
('Home Tutor','home-tutor','book-open',30),
('Security Guard','security-guard','shield',31),
('Tailor','tailor','scissors',32),
('Beautician','beautician','sparkle',33);
