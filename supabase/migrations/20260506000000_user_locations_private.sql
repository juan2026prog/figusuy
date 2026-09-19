-- Migration: 20260506000000_user_locations_private.sql
-- Description: Hardened private user coordinates table with strict RLS and RPCs

-- 1. Create table for private user coordinates
CREATE TABLE IF NOT EXISTS public.user_locations_private (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  source TEXT DEFAULT 'gps', -- 'gps' | 'manual_approx'
  precision_level TEXT DEFAULT 'precise', -- 'precise' | 'neighborhood' | 'city'
  consent_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index for performance on queries
CREATE INDEX IF NOT EXISTS idx_user_locations_private_updated_at ON public.user_locations_private(updated_at);

-- 2. Enable Row Level Security (Deny by default)
ALTER TABLE public.user_locations_private ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: ONLY the user themselves can read, insert, update, or delete their private location
CREATE POLICY "Users can view own private location"
  ON public.user_locations_private
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own private location"
  ON public.user_locations_private
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own private location"
  ON public.user_locations_private
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own private location"
  ON public.user_locations_private
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Ensure approximate location attributes exist on profiles (never exact coordinates)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS location_visibility TEXT DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS location_precision TEXT DEFAULT 'neighborhood';

-- 5. Secure RPC to update user's private location
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

-- 6. Secure RPC to delete/invalidate user's private location (GPS OFF)
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
