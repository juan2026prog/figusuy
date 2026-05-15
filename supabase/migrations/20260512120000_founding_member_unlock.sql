-- ==========================================
-- Founding member unlock flow
-- ==========================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS founding_member boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_trial_until timestamptz;

CREATE OR REPLACE FUNCTION public.get_early_access_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_profiles bigint := 0;
  v_limit integer := 250;
BEGIN
  SELECT count(*) INTO v_total_profiles
  FROM public.profiles;

  RETURN jsonb_build_object(
    'total_profiles', v_total_profiles,
    'limit', v_limit,
    'slots_remaining', GREATEST(v_limit - v_total_profiles, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_founding_badge(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_total_profiles bigint := 0;
  v_limit integer := 250;
  v_trial_until timestamptz := now() + interval '7 days';
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'eligible', false,
      'reason', 'missing_user_id'
    );
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('figusuy:founding-member'));

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'eligible', false,
      'reason', 'profile_not_found'
    );
  END IF;

  IF COALESCE(v_profile.founding_member, false) = true THEN
    INSERT INTO public.user_badges (user_id, badge_key)
    VALUES (p_user_id, 'desde_el_comienzo')
    ON CONFLICT (user_id, badge_key) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'eligible', true,
      'already_assigned', true,
      'founding_member', true,
      'trial_until', v_profile.plan_trial_until
    );
  END IF;

  SELECT count(*)
  INTO v_total_profiles
  FROM public.profiles;

  IF v_total_profiles > v_limit THEN
    RETURN jsonb_build_object(
      'success', true,
      'eligible', false,
      'reason', 'limit_reached',
      'slots_remaining', 0
    );
  END IF;

  UPDATE public.profiles
  SET
    founding_member = true,
    plan_trial_until = v_trial_until,
    is_premium = true,
    plan_name = CASE
      WHEN COALESCE(NULLIF(trim(plan_name), ''), 'gratis') = 'gratis' THEN 'pro'
      ELSE plan_name
    END
  WHERE id = p_user_id;

  INSERT INTO public.user_badges (user_id, badge_key)
  VALUES (p_user_id, 'desde_el_comienzo')
  ON CONFLICT (user_id, badge_key) DO NOTHING;

  INSERT INTO public.user_rewards (
    user_id,
    reward_type,
    reward_value,
    source,
    expires_at,
    resolved_as
  )
  VALUES (
    p_user_id,
    'pro_days',
    '7 dias',
    'founding_member',
    v_trial_until,
    'pro'
  );

  RETURN jsonb_build_object(
    'success', true,
    'eligible', true,
    'founding_member', true,
    'trial_until', v_trial_until,
    'slots_remaining', GREATEST(v_limit - v_total_profiles, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_profile_founding_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assign_founding_badge(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_assign_founding_badge ON public.profiles;

CREATE TRIGGER tr_profiles_assign_founding_badge
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_founding_member();

GRANT EXECUTE ON FUNCTION public.get_early_access_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_early_access_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_early_access_stats() TO service_role;

GRANT EXECUTE ON FUNCTION public.assign_founding_badge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_founding_badge(uuid) TO service_role;
