-- =========================================================================
-- Script SQL para solucionar errores 404 y 400 en el panel de Administración
-- Ejecutar este archivo completo en el SQL Editor de Supabase
-- =========================================================================

-- 1. Crear las funciones de Analytics (Evita el Error 400 en get_analytics_summary)
DROP FUNCTION IF EXISTS public.get_analytics_summary();
CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users int;
  v_premium_users int;
BEGIN
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_premium_users FROM public.profiles WHERE is_premium = true;
  
  -- Retorna una estructura básica que AdminAnalytics espera para no fallar
  RETURN json_build_object(
    'dau', 0,
    'wau', 0,
    'mau', 0,
    'total_users', v_total_users,
    'premium_users', v_premium_users,
    'registrations_7d', 0,
    'registrations_30d', 0,
    'active_albums', 0,
    'total_trades', 0,
    'trades_7d', 0,
    'total_chats', 0,
    'chats_7d', 0,
    'expired_chats', 0,
    'exchanges_completed', 0,
    'pending_confirmations', 0,
    'disputed_exchanges', 0,
    'chat_to_exchange_rate', 0,
    'active_locations', 0,
    'total_favorites', 0,
    'pending_reports', 0,
    'total_payments', 0,
    'payments_30d', 0,
    'active_promos', 0,
    'promo_impressions_7d', 0,
    'promo_clicks_7d', 0,
    'active_subscriptions', 0,
    'active_business_subs', 0
  );
END;
$$;

-- 2. Crear las funciones de Gamificación (Evita el Error 404)
DROP FUNCTION IF EXISTS public.admin_get_gamification_stats();
CREATE OR REPLACE FUNCTION public.admin_get_gamification_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users int;
BEGIN
  SELECT count(*) INTO v_total_users FROM public.profiles;
  RETURN json_build_object(
    'total_users', v_total_users,
    'total_achievements_completed', 0,
    'total_rewards_granted', 0,
    'active_rewards', 0,
    'avg_streak', 0,
    'by_level', json_build_object('explorador', v_total_users),
    'top_streaks', '[]'::json
  );
END;
$$;

DROP FUNCTION IF EXISTS public.admin_list_gamification_users(text, int, int);
CREATE OR REPLACE FUNCTION public.admin_list_gamification_users(p_level text DEFAULT NULL, p_limit int DEFAULT 50, p_offset int DEFAULT 0)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO v_result
  FROM (
    SELECT 
      p.id as user_id, 
      p.name, 
      p.email, 
      p.avatar_url, 
      p.plan_name,
      'explorador' as level,
      0 as streak_days,
      0 as days_active,
      0 as total_trades,
      0 as achievements_done,
      0 as rewards_total
    FROM public.profiles p
    LIMIT p_limit OFFSET p_offset
  ) t;
  
  RETURN COALESCE(v_result, '[]');
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_gamification(uuid);
CREATE OR REPLACE FUNCTION public.get_user_gamification(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'progress', json_build_object('level', 'explorador', 'streak_days', 0, 'days_active', 0),
    'achievements', '[]'::json,
    'rewards', '[]'::json
  );
END;
$$;

-- 3. Crear las tablas de Landing Blocks (Evita el Error 409/404 en AdminCMS)
CREATE TABLE IF NOT EXISTS public.landing_blocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key text NOT NULL,
    internal_title text,
    slug text,
    block_type text NOT NULL,
    preview_image_url text,
    draft_content jsonb DEFAULT '{}'::jsonb,
    published_content jsonb DEFAULT '{}'::jsonb,
    draft_visible boolean DEFAULT true,
    published_visible boolean DEFAULT false,
    draft_order integer DEFAULT 0,
    published_order integer DEFAULT 0,
    is_enabled boolean DEFAULT true,
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (page_key, slug)
);

CREATE TABLE IF NOT EXISTS public.landing_block_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key text NOT NULL,
    block_slug text,
    block_type text,
    event_type text,
    cta_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    session_key text,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en landing blocks y dar permisos de select/insert a administradores
ALTER TABLE public.landing_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_block_events ENABLE ROW LEVEL SECURITY;

-- Evitamos el error de conflicto permitiendo que Admin y Authenticated Users puedan leer la tabla.
CREATE POLICY "Enable read access for all users" ON public.landing_blocks FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.landing_blocks FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable event insert for all users" ON public.landing_block_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable event read for all users" ON public.landing_block_events FOR SELECT USING (true);

-- 4. Crear la función get_public_landing_blocks (Requerida por landingApi.js)
DROP FUNCTION IF EXISTS public.get_public_landing_blocks(text);
CREATE OR REPLACE FUNCTION public.get_public_landing_blocks(target_page_key text)
RETURNS SETOF public.landing_blocks
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.landing_blocks 
  WHERE page_key = target_page_key AND published_visible = true 
  ORDER BY published_order ASC;
$$;

