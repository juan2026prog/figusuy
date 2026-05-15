-- 20260513110000_collector_hubs_validations.sql

-- Add RLS policy for collector hubs to view validations?
-- Actually, a SECURITY DEFINER RPC is safer to return exactly what they need.

CREATE OR REPLACE FUNCTION public.get_album_validations_for_hub(p_location_id uuid)
RETURNS TABLE (
  validation_id uuid,
  user_id uuid,
  user_name text,
  album_id uuid,
  album_name text,
  album_cover text,
  album_year int,
  status text,
  requested_at timestamptz,
  validated_at timestamptz,
  collector_hub_id uuid,
  location_name text,
  notes text,
  completed_at timestamptz
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

  SELECT * INTO v_location
  FROM public.locations
  WHERE id = p_location_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found';
  END IF;

  IF v_location.owner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No puedes revisar validaciones de otra tienda.';
  END IF;

  IF v_location.business_plan NOT IN ('legend', 'partner_store') THEN
    RAISE EXCEPTION 'Solo los puntos Collector Hub pueden validar albumes.';
  END IF;

  RETURN QUERY
  SELECT
    v.id AS validation_id,
    v.user_id,
    p.name AS user_name,
    v.album_id,
    a.name AS album_name,
    a.cover_url AS album_cover,
    a.year AS album_year,
    v.status,
    v.requested_at,
    v.validated_at,
    v.collector_hub_id,
    l.name AS location_name,
    v.notes,
    ua.completed_at
  FROM public.album_completion_validations v
  JOIN public.profiles p ON p.id = v.user_id
  JOIN public.albums a ON a.id = v.album_id
  LEFT JOIN public.user_albums ua ON ua.user_id = v.user_id AND ua.album_id = v.album_id
  LEFT JOIN public.locations l ON l.id = v.collector_hub_id
  WHERE v.status = 'pending' OR v.collector_hub_id = p_location_id
  ORDER BY v.requested_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_album_validations_for_hub(uuid) TO authenticated;
