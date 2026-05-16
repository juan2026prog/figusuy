-- 20260513100000_special_codes_and_validation.sql

-- PARTE 0: PREREQUISITOS
DO $$
BEGIN
    -- Asegurar que profiles tenga las columnas necesarias para el plan premium
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_until') THEN
        ALTER TABLE public.profiles ADD COLUMN premium_until timestamptz;
    END IF;

    -- Crear tabla xp_events si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xp_events' AND table_schema = 'public') THEN
        CREATE TABLE public.xp_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            amount int NOT NULL,
            reason text,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users view own xp events" ON public.xp_events FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- PARTE 1: SPECIAL ACCESS CODES
CREATE TABLE IF NOT EXISTS public.special_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  applies_to_user boolean NOT NULL DEFAULT true,
  applies_to_store boolean NOT NULL DEFAULT false,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  consume_founding_slot boolean NOT NULL DEFAULT false,
  grants_founding_badge boolean NOT NULL DEFAULT false,
  grants_pro boolean NOT NULL DEFAULT false,
  pro_days int,
  grants_xp boolean NOT NULL DEFAULT false,
  xp_amount int,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.special_access_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.special_access_codes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  benefits_applied jsonb
);

CREATE INDEX IF NOT EXISTS idx_special_access_codes_code ON public.special_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_special_redemptions_user ON public.special_access_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_special_redemptions_store ON public.special_access_code_redemptions(store_id);

ALTER TABLE public.special_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_access_code_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage special codes" ON public.special_access_codes;
CREATE POLICY "Admins can manage special codes"
  ON public.special_access_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'god_admin')
    )
  );

DROP POLICY IF EXISTS "Users can view active special codes" ON public.special_access_codes;
CREATE POLICY "Users can view active special codes"
  ON public.special_access_codes
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Users can view own redemptions" ON public.special_access_code_redemptions;
CREATE POLICY "Users can view own redemptions"
  ON public.special_access_code_redemptions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Store owners can view own redemptions" ON public.special_access_code_redemptions;
CREATE POLICY "Store owners can view own redemptions"
  ON public.special_access_code_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = store_id AND owner_user_id = auth.uid()
    )
  );

-- RPC for redeeming code
CREATE OR REPLACE FUNCTION public.redeem_special_access_code(
  p_code_text text,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code public.special_access_codes%rowtype;
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_benefits jsonb := '{}'::jsonb;
  v_already_redeemed boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Get code
  SELECT * INTO v_code
  FROM public.special_access_codes
  WHERE code = upper(trim(p_code_text))
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;

  IF NOT v_code.active THEN
    RAISE EXCEPTION 'Código inactivo';
  END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < v_now THEN
    RAISE EXCEPTION 'Código vencido';
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.used_count >= v_code.max_uses THEN
    RAISE EXCEPTION 'Código sin usos disponibles';
  END IF;

  IF p_store_id IS NULL AND NOT v_code.applies_to_user THEN
    RAISE EXCEPTION 'Este código no aplica a usuarios';
  END IF;

  IF p_store_id IS NOT NULL AND NOT v_code.applies_to_store THEN
    RAISE EXCEPTION 'Este código no aplica a comercios';
  END IF;

  -- Check if already redeemed
  IF p_store_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.special_access_code_redemptions
      WHERE code_id = v_code.id AND user_id = v_user_id
    ) INTO v_already_redeemed;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM public.special_access_code_redemptions
      WHERE code_id = v_code.id AND store_id = p_store_id
    ) INTO v_already_redeemed;
  END IF;

  IF v_already_redeemed THEN
    RAISE EXCEPTION 'Código ya usado';
  END IF;

  -- Check store ownership if applying to store
  IF p_store_id IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM public.locations WHERE id = p_store_id AND owner_user_id = v_user_id) THEN
      RAISE EXCEPTION 'No eres el dueño de este comercio';
    END IF;
  END IF;

  -- Apply benefits
  -- 1. Founding Member / Badge
  IF v_code.grants_founding_badge THEN
    UPDATE public.profiles
    SET founding_member = true
    WHERE id = v_user_id;
    v_benefits := jsonb_set(v_benefits, '{founding_badge}', 'true'::jsonb);
  END IF;

  -- 2. PRO access
  IF v_code.grants_pro THEN
    UPDATE public.profiles
    SET plan_name = 'plus',
        is_premium = true,
        premium_until = COALESCE(premium_until, v_now) + (COALESCE(v_code.pro_days, 30) || ' days')::interval
    WHERE id = v_user_id;
    v_benefits := jsonb_set(v_benefits, '{pro_days_granted}', to_jsonb(COALESCE(v_code.pro_days, 30)));
  END IF;

  -- 3. XP
  IF v_code.grants_xp THEN
    UPDATE public.user_progress
    SET total_xp = total_xp + COALESCE(v_code.xp_amount, 0),
        updated_at = v_now
    WHERE user_id = v_user_id;
    
    INSERT INTO public.xp_events (user_id, amount, reason)
    VALUES (v_user_id, COALESCE(v_code.xp_amount, 0), 'special_code_' || v_code.code);
    
    v_benefits := jsonb_set(v_benefits, '{xp_granted}', to_jsonb(COALESCE(v_code.xp_amount, 0)));
  END IF;

  -- 4. Store benefits
  IF p_store_id IS NOT NULL THEN
    IF v_code.grants_pro THEN
      UPDATE public.locations
      SET business_plan = 'partner_store',
          is_verified = true
      WHERE id = p_store_id;
      v_benefits := jsonb_set(v_benefits, '{store_plan}', '"partner_store"'::jsonb);
    END IF;
  END IF;

  -- Record redemption
  INSERT INTO public.special_access_code_redemptions (code_id, user_id, store_id, benefits_applied)
  VALUES (v_code.id, v_user_id, p_store_id, v_benefits);

  -- Update count
  UPDATE public.special_access_codes
  SET used_count = used_count + 1
  WHERE id = v_code.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Código activado correctamente',
    'benefits', v_benefits
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.redeem_special_access_code(text, uuid) TO authenticated;

-- PARTE 2: ALBUM COMPLETION VALIDATIONS
CREATE TABLE IF NOT EXISTS public.album_completion_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz,
  validated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  validator_type text CHECK (validator_type IN ('admin', 'collector_hub')),
  collector_hub_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  notes text,
  UNIQUE(user_id, album_id)
);

CREATE INDEX IF NOT EXISTS idx_album_comp_val_user ON public.album_completion_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_album_comp_val_status ON public.album_completion_validations(status);

ALTER TABLE public.album_completion_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own validations" ON public.album_completion_validations;
CREATE POLICY "Users view own validations"
  ON public.album_completion_validations
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all validations" ON public.album_completion_validations;
CREATE POLICY "Admins view all validations"
  ON public.album_completion_validations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'god_admin')
    )
  );

-- RPC to request validation
CREATE OR REPLACE FUNCTION public.request_album_completion_validation(p_album_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_album public.user_albums%rowtype;
  v_total_stickers int;
  v_owned_count int;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_user_album
  FROM public.user_albums
  WHERE user_id = auth.uid() AND album_id = p_album_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Debes activar este álbum antes de completarlo.';
  END IF;

  SELECT total_stickers INTO v_total_stickers
  FROM public.albums WHERE id = p_album_id;

  SELECT count(*) INTO v_owned_count
  FROM public.stickers_owned
  WHERE user_id = auth.uid() AND album_id = p_album_id;

  IF COALESCE(v_owned_count, 0) < COALESCE(v_total_stickers, 0) OR COALESCE(v_total_stickers, 0) = 0 THEN
    RAISE EXCEPTION 'No puedes completar un álbum que aún no está lleno.';
  END IF;

  -- Create or update validation request
  INSERT INTO public.album_completion_validations (
    user_id, album_id, status, requested_at
  ) VALUES (
    auth.uid(), p_album_id, 'pending', v_now
  )
  ON CONFLICT (user_id, album_id)
  DO UPDATE SET
    status = 'pending',
    requested_at = v_now,
    validated_at = NULL,
    validated_by = NULL,
    validator_type = NULL,
    collector_hub_id = NULL,
    notes = NULL;

  -- Update user_album progress_state
  UPDATE public.user_albums
  SET progress_state = 'completed',
      completed_at = COALESCE(completed_at, v_now)
  WHERE id = v_user_album.id;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_album_completion_validation(uuid) TO authenticated;

-- RPC to validate album
CREATE OR REPLACE FUNCTION public.validate_album_completion(
  p_validation_id uuid,
  p_status text,
  p_notes text,
  p_collector_hub_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_val public.album_completion_validations%rowtype;
  v_is_admin boolean;
  v_is_hub boolean := false;
  v_validator_type text;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_val FROM public.album_completion_validations WHERE id = p_validation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Validation not found';
  END IF;

  -- Check permissions
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'god_admin')) INTO v_is_admin;
  
  IF p_collector_hub_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.locations 
      WHERE id = p_collector_hub_id 
      AND owner_user_id = auth.uid() 
      AND (business_plan = 'partner_store' OR business_plan = 'legend')
    ) INTO v_is_hub;
  END IF;

  IF NOT v_is_admin AND NOT v_is_hub THEN
    RAISE EXCEPTION 'No tienes permisos para validar álbumes.';
  END IF;

  v_validator_type := CASE WHEN v_is_admin THEN 'admin' ELSE 'collector_hub' END;

  UPDATE public.album_completion_validations
  SET status = p_status,
      validated_at = v_now,
      validated_by = auth.uid(),
      validator_type = v_validator_type,
      collector_hub_id = p_collector_hub_id,
      notes = p_notes
  WHERE id = p_validation_id;

  IF p_status = 'approved' THEN
    UPDATE public.user_albums
    SET progress_state = 'legend_verified',
        legend_verified_at = v_now,
        legend_verified_by_user_id = auth.uid(),
        legend_verified_location_id = p_collector_hub_id,
        legend_validation_notes = p_notes
    WHERE user_id = v_val.user_id AND album_id = v_val.album_id;
  ELSE
    -- If rejected, revert to in_progress
    UPDATE public.user_albums
    SET progress_state = 'in_progress',
        completed_at = NULL
    WHERE user_id = v_val.user_id AND album_id = v_val.album_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.validate_album_completion(uuid, text, text, uuid) TO authenticated;
