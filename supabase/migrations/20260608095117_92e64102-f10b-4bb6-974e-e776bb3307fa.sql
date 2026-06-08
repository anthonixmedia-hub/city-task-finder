
-- 1) Remove phone column from jobs; rely on poster's profile mobile via get_job_phone
ALTER TABLE public.jobs DROP COLUMN IF EXISTS phone;

CREATE OR REPLACE FUNCTION public.get_job_phone(_job_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _customer uuid;
  _phone text;
  _ok boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT customer_id INTO _customer FROM public.jobs WHERE id = _job_id;
  IF _customer IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT mobile INTO _phone FROM public.profiles WHERE id = _customer;
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

-- 2) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only what's needed
REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_job_phone(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_phone(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_access_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
