
-- 1) Profiles SELECT: restrict to owner + admin
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;

CREATE POLICY "users read own or admin all"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Safe public profile lookup (limited columns)
CREATE OR REPLACE FUNCTION public.get_public_profile(_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  city text,
  area text,
  role public.user_type,
  photo_url text,
  verified boolean,
  plan public.plan_tier,
  bio text,
  category text,
  experience_years integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.city, p.area, p.role, p.photo_url,
         p.verified, p.plan, p.bio, p.category, p.experience_years
  FROM public.profiles p
  WHERE p.id = _id;
$$;
REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

-- 2) Jobs: hide phone column from direct selects
REVOKE SELECT (phone) ON public.jobs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_job_phone(_job_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _phone text;
  _customer uuid;
  _ok boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT phone, customer_id INTO _phone, _customer FROM public.jobs WHERE id = _job_id;
  IF _phone IS NULL THEN
    RETURN NULL;
  END IF;
  IF _customer = _uid OR public.has_role(_uid, 'admin'::app_role) THEN
    RETURN _phone;
  END IF;
  SELECT (access_unlocked OR plan IN ('premium'::plan_tier, 'professional'::plan_tier))
    INTO _ok FROM public.profiles WHERE id = _uid;
  IF COALESCE(_ok, false) THEN
    RETURN _phone;
  END IF;
  RAISE EXCEPTION 'Contact details are locked. Unlock with an Access Code or upgrade your plan.';
END $$;
REVOKE ALL ON FUNCTION public.get_job_phone(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_job_phone(uuid) TO authenticated;

-- 3) Prevent users from escalating plan/verification fields on their own profile
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow bypass when called from trusted security-definer functions
  IF current_setting('app.bypass_profile_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;
  -- Admins may change anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Otherwise restore privileged fields to previous values
  NEW.plan := OLD.plan;
  NEW.verified := OLD.verified;
  NEW.documents_verified := OLD.documents_verified;
  NEW.mobile_verified := OLD.mobile_verified;
  NEW.access_unlocked := OLD.access_unlocked;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Secure access-code redemption
CREATE OR REPLACE FUNCTION public.redeem_access_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ac public.access_codes%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT * INTO _ac FROM public.access_codes
    WHERE code = upper(btrim(_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid Access Code';
  END IF;
  IF _ac.used AND _ac.assigned_to IS DISTINCT FROM _uid THEN
    RAISE EXCEPTION 'This code has already been used';
  END IF;

  UPDATE public.access_codes
    SET used = true, used_at = now(), assigned_to = _uid
    WHERE id = _ac.id;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles
    SET access_unlocked = true,
        plan = _ac.plan,
        verified = true
    WHERE id = _uid;
  PERFORM set_config('app.bypass_profile_guard', 'off', true);

  RETURN jsonb_build_object('ok', true, 'plan', _ac.plan);
END $$;
REVOKE ALL ON FUNCTION public.redeem_access_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(text) TO authenticated;
