-- Migration: 20260506000000_user_locations_private.sql
-- Description: Hardened private user coordinates table with strict RLS, constraints, backfill and secure RPCs

-- 1. Create table for private user coordinates with strict check constraints
CREATE TABLE IF NOT EXISTS public.user_locations_private (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy_m DOUBLE PRECISION CHECK (accuracy_m IS NULL OR accuracy_m >= 0),
  source TEXT DEFAULT 'gps' CHECK (source IN ('gps', 'manual_approx', 'none')),
  precision_level TEXT DEFAULT 'precise' CHECK (precision_level IN ('precise', 'neighborhood', 'city')),
  consent_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index for performance on queries
CREATE INDEX IF NOT EXISTS idx_user_locations_private_updated_at ON public.user_locations_private(updated_at);

-- 2. Backfill existing valid coordinates from profiles if present
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
      COALESCE(location_source, 'gps') as source, 
      'precise' as precision_level,
      NOW(),
      NOW()
    FROM public.profiles
    WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 3. Enable Row Level Security (Deny by default)
ALTER TABLE public.user_locations_private ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: ONLY the user themselves can read, insert, update, or delete their private location
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

-- 5. Ensure approximate location attributes exist on profiles (never exact coordinates)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS location_visibility TEXT DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS location_precision TEXT DEFAULT 'neighborhood';

-- 6. Secure RPC to update user's private location with strict range validation
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

-- 7. Secure RPC to delete/invalidate user's private location (GPS OFF)
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

-- 8. Hardened get_public_profile deriving caller identity strictly from auth.uid()
CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text, p_visitor_id uuid DEFAULT NULL)
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
  -- Strict identity derivation: ALWAYS use auth.uid(), ignore client spoofing
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
