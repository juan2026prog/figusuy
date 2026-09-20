-- Migration: 20260519000000_location_privacy_closure.sql
-- Description: Idempotent location privacy hardening, server-side chat creation with block checks, auth.uid public profiles, and legacy coordinates protection

-- 0. Persistent Distributed Rate Limiting Table & Function (Private schema, atomic upsert, backend-only)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE private.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.rate_limits FROM PUBLIC;
REVOKE ALL ON TABLE private.rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE private.rate_limits TO service_role;

-- Atomic distributed rate limiter with server-side enforced window/max limits
CREATE OR REPLACE FUNCTION private.check_geocode_rate_limit(
  p_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window INTERVAL := INTERVAL '60 seconds';
  v_max_req INT := 30; -- Maximum 30 requests per 60 seconds (strictly enforced server-side)
  v_count INT;
  v_reset_at TIMESTAMPTZ;
BEGIN
  IF p_key IS NULL OR length(p_key) < 1 OR length(p_key) > 120 THEN
    RETURN FALSE;
  END IF;

  -- Atomic INSERT ... ON CONFLICT with row lock and slot verification
  INSERT INTO private.rate_limits AS rl (key, count, reset_at)
  VALUES (p_key, 1, v_now + v_window)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE 
      WHEN rl.reset_at < v_now THEN 1
      ELSE rl.count + 1
    END,
    reset_at = CASE 
      WHEN rl.reset_at < v_now THEN v_now + v_window
      ELSE rl.reset_at
    END
  RETURNING rl.count, rl.reset_at INTO v_count, v_reset_at;

  IF v_count > v_max_req THEN
    RETURN FALSE; -- Rate limit exceeded
  END IF;

  RETURN TRUE;
END;
$$;

-- Drop obsolete signature if existing
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, INT, INT);

-- Strictly restrict execution to service_role (Edge Functions only; anon/authenticated completely blocked)
REVOKE ALL ON FUNCTION private.check_geocode_rate_limit(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.check_geocode_rate_limit(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private.check_geocode_rate_limit(TEXT) TO service_role;

-- 1. Ensure user_locations_private exists with all constraints
CREATE TABLE IF NOT EXISTS public.user_locations_private (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  source TEXT DEFAULT 'gps',
  precision_level TEXT DEFAULT 'precise',
  consent_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Ensure constraints (idempotent addition)
DO $$
BEGIN
  ALTER TABLE public.user_locations_private DROP CONSTRAINT IF EXISTS user_locations_private_lat_check;
  ALTER TABLE public.user_locations_private ADD CONSTRAINT user_locations_private_lat_check CHECK (latitude >= -90.0 AND latitude <= 90.0);

  ALTER TABLE public.user_locations_private DROP CONSTRAINT IF EXISTS user_locations_private_lng_check;
  ALTER TABLE public.user_locations_private ADD CONSTRAINT user_locations_private_lng_check CHECK (longitude >= -180.0 AND longitude <= 180.0);

  ALTER TABLE public.user_locations_private DROP CONSTRAINT IF EXISTS user_locations_private_accuracy_check;
  ALTER TABLE public.user_locations_private ADD CONSTRAINT user_locations_private_accuracy_check CHECK (accuracy_m IS NULL OR accuracy_m >= 0);

  ALTER TABLE public.user_locations_private DROP CONSTRAINT IF EXISTS user_locations_private_source_check;
  ALTER TABLE public.user_locations_private ADD CONSTRAINT user_locations_private_source_check CHECK (source IN ('gps', 'manual_approx', 'none'));

  ALTER TABLE public.user_locations_private DROP CONSTRAINT IF EXISTS user_locations_private_precision_check;
  ALTER TABLE public.user_locations_private ADD CONSTRAINT user_locations_private_precision_check CHECK (precision_level IN ('precise', 'neighborhood', 'city'));
END $$;

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_user_locations_private_updated_at ON public.user_locations_private(updated_at);

-- 2. Safe normalized backfill from profiles (handling legacy 'manual' -> 'manual_approx')
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'lat'
  ) THEN
    INSERT INTO public.user_locations_private (user_id, latitude, longitude, source, precision_level, consent_at, updated_at)
    SELECT 
      id as user_id, 
      lat as latitude, 
      lng as longitude, 
      CASE 
        WHEN location_source = 'gps' THEN 'gps'
        WHEN location_source = 'manual' THEN 'manual_approx'
        WHEN location_source = 'manual_approx' THEN 'manual_approx'
        ELSE 'manual_approx'
      END as source, 
      'precise' as precision_level,
      NOW(),
      NOW()
    FROM public.profiles
    WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180
    ON CONFLICT (user_id) DO NOTHING;

    -- Nullify legacy coordinates in profiles to prevent leakage via legacy queries
    UPDATE public.profiles SET lat = NULL, lng = NULL WHERE lat IS NOT NULL OR lng IS NOT NULL;
  END IF;
END $$;

-- 3. Row Level Security on user_locations_private
ALTER TABLE public.user_locations_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own private location" ON public.user_locations_private;
CREATE POLICY "Users can view own private location"
  ON public.user_locations_private
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own private location" ON public.user_locations_private;
CREATE POLICY "Users can insert own private location"
  ON public.user_locations_private
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own private location" ON public.user_locations_private;
CREATE POLICY "Users can update own private location"
  ON public.user_locations_private
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own private location" ON public.user_locations_private;
CREATE POLICY "Users can delete own private location"
  ON public.user_locations_private
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Approximate metadata columns on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS location_visibility TEXT DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS location_precision TEXT DEFAULT 'neighborhood';

-- 5. RPC update_my_location (Security Definier with explicit grant to authenticated)
CREATE OR REPLACE FUNCTION public.update_my_location(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_accuracy_m DOUBLE PRECISION DEFAULT NULL,
  p_source TEXT DEFAULT 'gps',
  p_precision_level TEXT DEFAULT 'precise'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_latitude IS NULL OR p_latitude < -90.0 OR p_latitude > 90.0 THEN
    RAISE EXCEPTION 'Invalid latitude: must be between -90 and 90';
  END IF;

  IF p_longitude IS NULL OR p_longitude < -180.0 OR p_longitude > 180.0 THEN
    RAISE EXCEPTION 'Invalid longitude: must be between -180 and 180';
  END IF;

  IF p_accuracy_m IS NOT NULL AND p_accuracy_m < 0 THEN
    RAISE EXCEPTION 'Invalid accuracy: must be non-negative';
  END IF;

  IF p_source NOT IN ('gps', 'manual_approx', 'none') THEN
    p_source := 'gps';
  END IF;

  IF p_precision_level NOT IN ('precise', 'neighborhood', 'city') THEN
    p_precision_level := 'precise';
  END IF;

  INSERT INTO public.user_locations_private (
    user_id,
    latitude,
    longitude,
    accuracy_m,
    source,
    precision_level,
    consent_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_latitude,
    p_longitude,
    p_accuracy_m,
    p_source,
    p_precision_level,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy_m = EXCLUDED.accuracy_m,
    source = EXCLUDED.source,
    precision_level = EXCLUDED.precision_level,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'updated_at', NOW());
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_location(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_location(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) TO authenticated;

-- 6. RPC delete_my_location
CREATE OR REPLACE FUNCTION public.delete_my_location()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.user_locations_private
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_at', NOW());
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_location() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_location() TO authenticated;

-- 7. Drop legacy signatures of get_public_profile and create hardened single-parameter signature
DROP FUNCTION IF EXISTS public.get_public_profile(text, uuid);
DROP FUNCTION IF EXISTS public.get_public_profile(text);

CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_visitor_id uuid;
  v_profile RECORD;
  v_albums jsonb;
  v_reputation jsonb;
  v_progress jsonb;
  v_badges jsonb;
  v_has_match boolean := false;
  v_is_blocked boolean := false;
BEGIN
  -- Always derive identity from authenticated session (NEVER caller arguments)
  v_visitor_id := auth.uid();

  -- Get profile
  SELECT p.id, p.name, p.username, p.avatar_url, p.city, p.department, p.created_at, p.profile_visibility, p.is_public_hidden,
         (SELECT count(*) FROM trades WHERE (user_1_id = p.id OR user_2_id = p.id) AND status = 'completed') as completed_exchanges
  INTO v_profile
  FROM public.profiles p
  WHERE p.username = p_username;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check bilateral blocking
  IF v_visitor_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_blocks 
      WHERE (blocker_id = v_visitor_id AND blocked_id = v_profile.id)
         OR (blocker_id = v_profile.id AND blocked_id = v_visitor_id)
    ) INTO v_is_blocked;

    IF v_is_blocked THEN
      RETURN jsonb_build_object('error', 'Profile not available');
    END IF;
  END IF;

  IF v_profile.is_public_hidden THEN
    RETURN jsonb_build_object('error', 'Profile is hidden');
  END IF;

  IF v_profile.profile_visibility = 'private' AND (v_visitor_id IS NULL OR v_visitor_id != v_profile.id) THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;

  -- Check active match/chat
  IF v_visitor_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM chats 
      WHERE (user_1 = v_visitor_id AND user_2 = v_profile.id) 
         OR (user_1 = v_profile.id AND user_2 = v_visitor_id)
    ) INTO v_has_match;
  END IF;

  IF v_profile.profile_visibility = 'matches' AND NOT v_has_match AND (v_visitor_id IS NULL OR v_visitor_id != v_profile.id) THEN
    RETURN jsonb_build_object('error', 'Profile visible only to matches');
  END IF;

  -- Get albums
  SELECT jsonb_agg(
    jsonb_build_object(
      'album_id', a.id,
      'name', a.name,
      'cover_url', a.cover_url,
      'year', a.year,
      'visibility', ua.visibility,
      'show_progress', ua.show_progress,
      'show_missing', ua.show_missing,
      'show_repeated', ua.show_repeated,
      'progress', CASE WHEN ua.show_progress THEN
                     (SELECT count(*) FROM stickers_owned so WHERE so.user_id = v_profile.id AND so.album_id = a.id)
                  ELSE NULL END,
      'total_stickers', (SELECT count(*) FROM album_stickers as_ WHERE as_.album_id = a.id)
    )
  ) INTO v_albums
  FROM user_albums ua
  JOIN albums a ON a.id = ua.album_id
  WHERE ua.user_id = v_profile.id
    AND NOT ua.is_public_hidden
    AND (ua.visibility = 'public' OR 
        (ua.visibility = 'matches' AND v_has_match) OR 
        v_visitor_id = v_profile.id);

  -- Get reputation
  SELECT jsonb_build_object(
    'star_rating', r.star_rating,
    'reliability_score', r.reliability_score
  ) INTO v_reputation
  FROM public.user_reputation r WHERE r.user_id = v_profile.id;

  -- Get progress
  SELECT jsonb_build_object(
    'level', p.level,
    'total_points', p.total_points,
    'completed_exchanges', p.completed_exchanges
  ) INTO v_progress
  FROM public.user_progress p WHERE p.user_id = v_profile.id;

  -- Get badges
  SELECT jsonb_agg(
    jsonb_build_object('badge_id', b.badge_id, 'unlocked_at', b.unlocked_at)
  ) INTO v_badges
  FROM public.user_badges b WHERE b.user_id = v_profile.id;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'name', v_profile.name,
    'username', v_profile.username,
    'avatar_url', v_profile.avatar_url,
    'city', v_profile.city,
    'department', v_profile.department,
    'created_at', v_profile.created_at,
    'completed_exchanges', v_profile.completed_exchanges,
    'albums', COALESCE(v_albums, '[]'::jsonb),
    'reputation', v_reputation,
    'progress', v_progress,
    'badges', COALESCE(v_badges, '[]'::jsonb),
    'is_owner', (v_visitor_id = v_profile.id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

-- 8. Server-side Chat Creation RPC with Bilateral Blocking Check & Album Validation
CREATE OR REPLACE FUNCTION public.create_or_get_chat_secure(
  p_other_user_id UUID,
  p_album_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_is_blocked BOOLEAN := false;
  v_album RECORD;
  v_caller_has_album BOOLEAN := false;
  v_other_has_album BOOLEAN := false;
  v_chat RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_other_user_id IS NULL OR p_other_user_id = v_caller_id THEN
    RAISE EXCEPTION 'Invalid destination user';
  END IF;

  IF p_album_id IS NULL THEN
    RAISE EXCEPTION 'Album ID required';
  END IF;

  -- 1. Validate album exists and is active
  SELECT id, is_active INTO v_album
  FROM public.albums
  WHERE id = p_album_id;

  IF v_album IS NULL THEN
    RAISE EXCEPTION 'Album not found';
  END IF;

  IF v_album.is_active = false THEN
    RAISE EXCEPTION 'Album is inactive';
  END IF;

  -- 2. Validate bilateral album ownership/participation
  SELECT EXISTS (
    SELECT 1 FROM public.user_albums WHERE user_id = v_caller_id AND album_id = p_album_id
  ) INTO v_caller_has_album;

  SELECT EXISTS (
    SELECT 1 FROM public.user_albums WHERE user_id = p_other_user_id AND album_id = p_album_id
  ) INTO v_other_has_album;

  IF NOT v_caller_has_album OR NOT v_other_has_album THEN
    RAISE EXCEPTION 'Both users must participate in the album to chat';
  END IF;

  -- 3. Bilateral block verification
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_caller_id AND blocked_id = p_other_user_id)
       OR (blocker_id = p_other_user_id AND blocked_id = v_caller_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'Cannot initiate chat with this user';
  END IF;

  -- 4. Check existing chat
  SELECT * INTO v_chat
  FROM public.chats
  WHERE album_id = p_album_id
    AND ((user_1 = v_caller_id AND user_2 = p_other_user_id) OR (user_1 = p_other_user_id AND user_2 = v_caller_id))
  LIMIT 1;

  IF v_chat IS NOT NULL THEN
    RETURN to_jsonb(v_chat);
  END IF;

  -- 5. Insert new chat
  INSERT INTO public.chats (user_1, user_2, album_id)
  VALUES (v_caller_id, p_other_user_id, p_album_id)
  RETURNING * INTO v_chat;

  RETURN to_jsonb(v_chat);
END;
$$;

REVOKE ALL ON FUNCTION public.create_or_get_chat_secure(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_or_get_chat_secure(UUID, UUID) TO authenticated;

-- 9. Server-side Match Social RPC for Public Album Detail (Caller derived via auth.uid())
CREATE OR REPLACE FUNCTION public.get_public_album_match(
  p_username TEXT,
  p_album_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_visitor_id UUID;
  v_owner_id UUID;
  v_is_blocked BOOLEAN := false;
  v_owner_dups TEXT[];
  v_owner_missing TEXT[];
  v_visitor_dups TEXT[];
  v_visitor_missing TEXT[];
  v_can_give_visitor TEXT[];
  v_visitor_can_give TEXT[];
BEGIN
  v_visitor_id := auth.uid();
  IF v_visitor_id IS NULL THEN
    RETURN jsonb_build_object(
      'canGiveVisitor', '[]'::jsonb,
      'visitorCanGive', '[]'::jsonb,
      'mutual', false
    );
  END IF;

  -- Find album owner by username
  SELECT id INTO v_owner_id
  FROM public.profiles
  WHERE username = p_username;

  IF v_owner_id IS NULL OR v_owner_id = v_visitor_id THEN
    RETURN jsonb_build_object(
      'canGiveVisitor', '[]'::jsonb,
      'visitorCanGive', '[]'::jsonb,
      'mutual', false
    );
  END IF;

  -- Bilateral block check
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_visitor_id AND blocked_id = v_owner_id)
       OR (blocker_id = v_owner_id AND blocked_id = v_visitor_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'error', 'Match unavailable',
      'canGiveVisitor', '[]'::jsonb,
      'visitorCanGive', '[]'::jsonb,
      'mutual', false
    );
  END IF;

  -- Get owner duplicates and missing
  SELECT COALESCE(array_agg(sticker_number::text), ARRAY[]::TEXT[]) INTO v_owner_dups
  FROM public.stickers_duplicate
  WHERE user_id = v_owner_id AND album_id = p_album_id;

  SELECT COALESCE(array_agg(sticker_number::text), ARRAY[]::TEXT[]) INTO v_owner_missing
  FROM public.stickers_missing
  WHERE user_id = v_owner_id AND album_id = p_album_id;

  -- Get visitor duplicates and missing
  SELECT COALESCE(array_agg(sticker_number::text), ARRAY[]::TEXT[]) INTO v_visitor_dups
  FROM public.stickers_duplicate
  WHERE user_id = v_visitor_id AND album_id = p_album_id;

  SELECT COALESCE(array_agg(sticker_number::text), ARRAY[]::TEXT[]) INTO v_visitor_missing
  FROM public.stickers_missing
  WHERE user_id = v_visitor_id AND album_id = p_album_id;

  -- Compute overlap
  SELECT COALESCE(array_agg(elem), ARRAY[]::TEXT[]) INTO v_can_give_visitor
  FROM unnest(v_owner_dups) elem
  WHERE elem = ANY(v_visitor_missing);

  SELECT COALESCE(array_agg(elem), ARRAY[]::TEXT[]) INTO v_visitor_can_give
  FROM unnest(v_visitor_dups) elem
  WHERE elem = ANY(v_owner_missing);

  RETURN jsonb_build_object(
    'canGiveVisitor', COALESCE(to_jsonb(v_can_give_visitor), '[]'::jsonb),
    'visitorCanGive', COALESCE(to_jsonb(v_visitor_can_give), '[]'::jsonb),
    'mutual', (array_length(v_can_give_visitor, 1) > 0 AND array_length(v_visitor_can_give, 1) > 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_album_match(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_album_match(TEXT, UUID) TO authenticated, anon;
