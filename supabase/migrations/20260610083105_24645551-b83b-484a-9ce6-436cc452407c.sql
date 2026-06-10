
-- 1. Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  success boolean NOT NULL DEFAULT false,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs (actor_id);
CREATE INDEX audit_logs_action_idx ON public.audit_logs (action);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policy: only SECURITY DEFINER functions and service_role write here.

-- 2. Update get_job_phone to log every attempt
CREATE OR REPLACE FUNCTION public.get_job_phone(_job_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _customer uuid;
  _phone text;
  _ok boolean;
BEGIN
  IF _uid IS NULL THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason)
      VALUES (NULL, 'contact_reveal', 'job', _job_id, false, 'unauthenticated');
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT customer_id INTO _customer FROM public.jobs WHERE id = _job_id;
  IF _customer IS NULL THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason)
      VALUES (_uid, 'contact_reveal', 'job', _job_id, false, 'job_not_found');
    RETURN NULL;
  END IF;

  SELECT mobile INTO _phone FROM public.profiles WHERE id = _customer;
  IF _phone IS NULL THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason)
      VALUES (_uid, 'contact_reveal', 'job', _job_id, false, 'no_phone_on_file');
    RETURN NULL;
  END IF;

  IF _customer = _uid OR public.has_role(_uid, 'admin'::app_role) THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason)
      VALUES (_uid, 'contact_reveal', 'job', _job_id, true, CASE WHEN _customer = _uid THEN 'owner' ELSE 'admin' END);
    RETURN _phone;
  END IF;

  SELECT (access_unlocked OR plan IN ('premium'::plan_tier, 'professional'::plan_tier))
    INTO _ok FROM public.profiles WHERE id = _uid;

  IF COALESCE(_ok, false) THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason)
      VALUES (_uid, 'contact_reveal', 'job', _job_id, true, 'plan_or_unlock');
    RETURN _phone;
  END IF;

  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason)
    VALUES (_uid, 'contact_reveal', 'job', _job_id, false, 'locked_no_plan');
  RAISE EXCEPTION 'Contact details are locked. Unlock with an Access Code or upgrade your plan.';
END $function$;

-- 3. Update redeem_access_code to log every attempt
CREATE OR REPLACE FUNCTION public.redeem_access_code(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _ac public.access_codes%ROWTYPE;
  _normalized text := upper(btrim(_code));
BEGIN
  IF _uid IS NULL THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, success, reason, details)
      VALUES (NULL, 'access_code_redeem', 'access_code', false, 'unauthenticated', jsonb_build_object('code', _normalized));
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _ac FROM public.access_codes WHERE code = _normalized;
  IF NOT FOUND THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, success, reason, details)
      VALUES (_uid, 'access_code_redeem', 'access_code', false, 'invalid_code', jsonb_build_object('code', _normalized));
    RAISE EXCEPTION 'Invalid Access Code';
  END IF;

  IF _ac.used AND _ac.assigned_to IS DISTINCT FROM _uid THEN
    INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason, details)
      VALUES (_uid, 'access_code_redeem', 'access_code', _ac.id, false, 'already_used', jsonb_build_object('code', _normalized));
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

  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, success, reason, details)
    VALUES (_uid, 'access_code_redeem', 'access_code', _ac.id, true, 'redeemed', jsonb_build_object('code', _normalized, 'plan', _ac.plan));

  RETURN jsonb_build_object('ok', true, 'plan', _ac.plan);
END $function$;
