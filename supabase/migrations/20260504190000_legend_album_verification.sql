ALTER TABLE public.user_albums
ADD COLUMN IF NOT EXISTS progress_state text NOT NULL DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS legend_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS legend_verified_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS legend_verified_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS legend_validation_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_albums_progress_state_check'
  ) THEN
    ALTER TABLE public.user_albums
    ADD CONSTRAINT user_albums_progress_state_check
    CHECK (progress_state IN ('in_progress', 'completed', 'legend_verified'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.legend_album_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_album_id uuid NOT NULL REFERENCES public.user_albums(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  verified_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'legend_album_validations_status_check'
  ) THEN
    ALTER TABLE public.legend_album_validations
    ADD CONSTRAINT legend_album_validations_status_check
    CHECK (status IN ('pending', 'verified'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_legend_album_validations_user ON public.legend_album_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_legend_album_validations_location ON public.legend_album_validations(location_id);
CREATE INDEX IF NOT EXISTS idx_legend_album_validations_status ON public.legend_album_validations(status);

ALTER TABLE public.legend_album_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own legend validations" ON public.legend_album_validations;
CREATE POLICY "Users can view own legend validations"
  ON public.legend_album_validations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_legend_validation_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_legend_album_validations_updated_at ON public.legend_album_validations;
CREATE TRIGGER update_legend_album_validations_updated_at
BEFORE UPDATE ON public.legend_album_validations
FOR EACH ROW
EXECUTE FUNCTION public.touch_legend_validation_updated_at();

CREATE OR REPLACE FUNCTION public.get_my_album_progress(p_album_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_album public.user_albums%rowtype;
  v_validation public.legend_album_validations%rowtype;
  v_location_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_user_album
  FROM public.user_albums
  WHERE user_id = auth.uid()
    AND album_id = p_album_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'in_progress');
  END IF;

  SELECT *
  INTO v_validation
  FROM public.legend_album_validations
  WHERE user_album_id = v_user_album.id
  LIMIT 1;

  IF v_user_album.legend_verified_location_id IS NOT NULL THEN
    SELECT name
    INTO v_location_name
    FROM public.locations
    WHERE id = v_user_album.legend_verified_location_id;
  END IF;

  RETURN jsonb_build_object(
    'user_album_id', v_user_album.id,
    'status', COALESCE(v_user_album.progress_state, 'in_progress'),
    'completed_at', v_user_album.completed_at,
    'legend_verified_at', v_user_album.legend_verified_at,
    'legend_verified_location_id', v_user_album.legend_verified_location_id,
    'legend_verified_location_name', v_location_name,
    'legend_validation_notes', v_user_album.legend_validation_notes,
    'validation_id', v_validation.id,
    'validation_status', v_validation.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_legend_album_completion(p_album_id uuid)
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

  SELECT *
  INTO v_user_album
  FROM public.user_albums
  WHERE user_id = auth.uid()
    AND album_id = p_album_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Debes activar este album antes de completarlo.';
  END IF;

  IF v_user_album.progress_state = 'legend_verified' THEN
    RETURN public.get_my_album_progress(p_album_id);
  END IF;

  SELECT total_stickers
  INTO v_total_stickers
  FROM public.albums
  WHERE id = p_album_id;

  SELECT count(*)
  INTO v_owned_count
  FROM public.stickers_owned
  WHERE user_id = auth.uid()
    AND album_id = p_album_id;

  IF COALESCE(v_owned_count, 0) < COALESCE(v_total_stickers, 0) OR COALESCE(v_total_stickers, 0) = 0 THEN
    RAISE EXCEPTION 'No puedes completar un album que aun no esta lleno.';
  END IF;

  UPDATE public.user_albums
  SET progress_state = 'completed',
      completed_at = COALESCE(completed_at, v_now),
      legend_verified_at = NULL,
      legend_verified_location_id = NULL,
      legend_verified_by_user_id = NULL,
      legend_validation_notes = NULL
  WHERE id = v_user_album.id;

  INSERT INTO public.legend_album_validations (
    user_album_id,
    user_id,
    album_id,
    status,
    requested_at,
    verified_at,
    location_id,
    verified_by_user_id,
    notes
  )
  VALUES (
    v_user_album.id,
    auth.uid(),
    p_album_id,
    'pending',
    COALESCE(v_user_album.completed_at, v_now),
    NULL,
    NULL,
    NULL,
    ''
  )
  ON CONFLICT (user_album_id)
  DO UPDATE SET
    status = 'pending',
    requested_at = COALESCE(public.legend_album_validations.requested_at, v_now),
    verified_at = NULL,
    location_id = NULL,
    verified_by_user_id = NULL,
    notes = '',
    updated_at = now();

  RETURN public.get_my_album_progress(p_album_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_legend_validations_for_location(p_location_id uuid)
RETURNS TABLE (
  validation_id uuid,
  user_album_id uuid,
  user_id uuid,
  user_name text,
  album_id uuid,
  album_name text,
  album_cover text,
  album_year int,
  status text,
  completed_at timestamptz,
  requested_at timestamptz,
  verified_at timestamptz,
  location_id uuid,
  location_name text,
  verified_by_name text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_location public.locations%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_location
  FROM public.locations
  WHERE id = p_location_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found';
  END IF;

  IF v_location.owner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No puedes revisar validaciones de otra tienda.';
  END IF;

  IF v_location.business_plan <> 'legend' THEN
    RAISE EXCEPTION 'Solo los puntos Legend pueden validar albumes.';
  END IF;

  RETURN QUERY
  SELECT
    lv.id AS validation_id,
    ua.id AS user_album_id,
    lv.user_id,
    p.name AS user_name,
    lv.album_id,
    a.name AS album_name,
    a.cover_url AS album_cover,
    a.year AS album_year,
    lv.status,
    ua.completed_at,
    lv.requested_at,
    lv.verified_at,
    lv.location_id,
    l.name AS location_name,
    verifier.name AS verified_by_name,
    lv.notes
  FROM public.legend_album_validations lv
  JOIN public.user_albums ua ON ua.id = lv.user_album_id
  JOIN public.profiles p ON p.id = lv.user_id
  JOIN public.albums a ON a.id = lv.album_id
  LEFT JOIN public.locations l ON l.id = lv.location_id
  LEFT JOIN public.profiles verifier ON verifier.id = lv.verified_by_user_id
  WHERE lv.status = 'pending'
     OR lv.location_id = p_location_id
  ORDER BY
    CASE WHEN lv.status = 'pending' THEN 0 ELSE 1 END,
    COALESCE(lv.verified_at, lv.requested_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_legend_album(
  p_validation_id uuid,
  p_location_id uuid,
  p_notes text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_location public.locations%rowtype;
  v_validation public.legend_album_validations%rowtype;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_location
  FROM public.locations
  WHERE id = p_location_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found';
  END IF;

  IF v_location.owner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No puedes validar desde otra tienda.';
  END IF;

  IF v_location.business_plan <> 'legend' THEN
    RAISE EXCEPTION 'Solo los puntos Legend pueden verificar albumes.';
  END IF;

  SELECT *
  INTO v_validation
  FROM public.legend_album_validations
  WHERE id = p_validation_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Validation not found';
  END IF;

  UPDATE public.legend_album_validations
  SET status = 'verified',
      verified_at = v_now,
      location_id = p_location_id,
      verified_by_user_id = auth.uid(),
      notes = COALESCE(p_notes, '')
  WHERE id = p_validation_id;

  UPDATE public.user_albums
  SET progress_state = 'legend_verified',
      completed_at = COALESCE(completed_at, v_validation.requested_at, v_now),
      legend_verified_at = v_now,
      legend_verified_location_id = p_location_id,
      legend_verified_by_user_id = auth.uid(),
      legend_validation_notes = COALESCE(p_notes, '')
  WHERE id = v_validation.user_album_id;

  RETURN jsonb_build_object(
    'status', 'legend_verified',
    'verified_at', v_now,
    'location_id', p_location_id,
    'location_name', v_location.name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_album_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_legend_album_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_legend_validations_for_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_legend_album(uuid, uuid, text) TO authenticated;
