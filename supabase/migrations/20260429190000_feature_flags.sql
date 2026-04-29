-- ==========================================
-- FEATURE FLAGS / RELEASE CONTROL SYSTEM
-- FigusUY — 2026-04-29
-- ==========================================

-- 1. FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key text UNIQUE NOT NULL,
    name text NOT NULL,
    description text DEFAULT '',
    is_enabled boolean NOT NULL DEFAULT true,
    scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'module', 'subfeature', 'experimental')),
    beta_only boolean NOT NULL DEFAULT false,
    rollout_percentage int NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    allowed_plans text[] DEFAULT '{}',
    allowed_roles text[] DEFAULT '{}',
    kill_switch boolean NOT NULL DEFAULT false,
    parent_feature_key text REFERENCES feature_flags(feature_key) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}',
    updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read flags (needed for frontend gating)
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
    FOR SELECT USING (true);

-- Only god_admin and admin can modify flags
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('god_admin', 'admin')
        )
    );

-- Indexes
CREATE INDEX idx_feature_flags_key ON public.feature_flags(feature_key);
CREATE INDEX idx_feature_flags_scope ON public.feature_flags(scope);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(is_enabled);
CREATE INDEX idx_feature_flags_parent ON public.feature_flags(parent_feature_key);

-- 2. FEATURE FLAG AUDIT LOG
CREATE TABLE IF NOT EXISTS public.feature_flag_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key text NOT NULL,
    action text NOT NULL CHECK (action IN ('enable', 'disable', 'update', 'kill_switch_on', 'kill_switch_off', 'rollout_change')),
    changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    old_value jsonb DEFAULT '{}',
    new_value jsonb DEFAULT '{}',
    reason text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flag_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view feature flag audit" ON public.feature_flag_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('god_admin', 'admin')
        )
    );

CREATE POLICY "Admins can insert feature flag audit" ON public.feature_flag_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('god_admin', 'admin')
        )
    );

CREATE INDEX idx_ff_audit_key ON public.feature_flag_audit(feature_key);
CREATE INDEX idx_ff_audit_created ON public.feature_flag_audit(created_at DESC);

-- 3. RPC: CHECK FEATURE FLAG (server-side validation)
CREATE OR REPLACE FUNCTION public.check_feature_flag(
    p_feature_key text,
    p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    flag RECORD;
    user_plan text;
    user_role text;
    user_beta boolean;
    hash_val int;
BEGIN
    -- Get the flag
    SELECT * INTO flag FROM feature_flags WHERE feature_key = p_feature_key;

    -- Flag doesn't exist → disabled by default
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Kill switch overrides everything
    IF flag.kill_switch = true THEN
        RETURN false;
    END IF;

    -- Global disable
    IF flag.is_enabled = false THEN
        RETURN false;
    END IF;

    -- Check parent flag (if child is enabled but parent is off → off)
    IF flag.parent_feature_key IS NOT NULL THEN
        IF NOT check_feature_flag(flag.parent_feature_key, p_user_id) THEN
            RETURN false;
        END IF;
    END IF;

    -- If no user context needed for public flags
    IF p_user_id IS NULL THEN
        -- Still check rollout (without user = treat as 100% only)
        IF flag.rollout_percentage < 100 THEN
            RETURN false;
        END IF;
        IF flag.beta_only THEN
            RETURN false;
        END IF;
        IF array_length(flag.allowed_plans, 1) IS NOT NULL THEN
            RETURN false;
        END IF;
        IF array_length(flag.allowed_roles, 1) IS NOT NULL THEN
            RETURN false;
        END IF;
        RETURN true;
    END IF;

    -- Get user info
    SELECT p.plan, p.is_beta_tester INTO user_plan, user_beta
    FROM profiles p WHERE p.id = p_user_id;

    SELECT ur.role INTO user_role
    FROM user_roles ur WHERE ur.user_id = p_user_id;

    -- Beta-only check
    IF flag.beta_only = true AND COALESCE(user_beta, false) = false THEN
        RETURN false;
    END IF;

    -- Plan gating
    IF array_length(flag.allowed_plans, 1) IS NOT NULL THEN
        IF COALESCE(user_plan, 'free') != ALL(flag.allowed_plans) THEN
            RETURN false;
        END IF;
    END IF;

    -- Role gating
    IF array_length(flag.allowed_roles, 1) IS NOT NULL THEN
        IF COALESCE(user_role, 'user') != ALL(flag.allowed_roles) THEN
            RETURN false;
        END IF;
    END IF;

    -- Gradual rollout (deterministic hash based on user_id + feature_key)
    IF flag.rollout_percentage < 100 THEN
        hash_val := abs(hashtext(p_user_id::text || flag.feature_key)) % 100;
        IF hash_val >= flag.rollout_percentage THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_feature_flag(text, uuid) TO authenticated, anon;

-- 4. RPC: BULK CHECK FEATURE FLAGS (for frontend bootstrapping)
CREATE OR REPLACE FUNCTION public.get_feature_flags_status(p_user_id uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
    result jsonb := '{}'::jsonb;
    flag RECORD;
BEGIN
    FOR flag IN SELECT feature_key FROM feature_flags LOOP
        result := result || jsonb_build_object(
            flag.feature_key,
            check_feature_flag(flag.feature_key, p_user_id)
        );
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_feature_flags_status(uuid) TO authenticated, anon;

-- 5. RPC: EMERGENCY KILL ALL
CREATE OR REPLACE FUNCTION public.emergency_kill_all_features()
RETURNS void AS $$
BEGIN
    -- Only god_admin can do this
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'god_admin'
    ) THEN
        RAISE EXCEPTION 'Only god_admin can trigger emergency kill';
    END IF;

    UPDATE feature_flags SET kill_switch = true, updated_at = now(), updated_by = auth.uid();

    INSERT INTO feature_flag_audit (feature_key, action, changed_by, reason)
    SELECT feature_key, 'kill_switch_on', auth.uid(), 'EMERGENCY: Kill all features'
    FROM feature_flags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.emergency_kill_all_features() TO authenticated;

-- 6. RPC: RESTORE ALL (undo emergency kill)
CREATE OR REPLACE FUNCTION public.restore_all_features()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'god_admin'
    ) THEN
        RAISE EXCEPTION 'Only god_admin can restore features';
    END IF;

    UPDATE feature_flags SET kill_switch = false, updated_at = now(), updated_by = auth.uid();

    INSERT INTO feature_flag_audit (feature_key, action, changed_by, reason)
    SELECT feature_key, 'kill_switch_off', auth.uid(), 'RESTORE: All features restored'
    FROM feature_flags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.restore_all_features() TO authenticated;

-- 7. Add is_beta_tester to profiles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_beta_tester'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_beta_tester boolean DEFAULT false;
    END IF;
END $$;

-- 8. SEED DEFAULT FEATURE FLAGS
-- Modules
INSERT INTO public.feature_flags (feature_key, name, description, is_enabled, scope, rollout_percentage) VALUES
('album',            'Álbum',              'Módulo principal de álbumes de figuritas',            true, 'module', 100),
('matches',          'Cruces',             'Sistema de matching entre coleccionistas',             true, 'module', 100),
('chats',            'Chats',              'Sistema de mensajería entre usuarios',                true, 'module', 100),
('favorites',        'Favoritos',          'Sistema de favoritos de usuarios',                    true, 'module', 100),
('points',           'Puntos',             'Mapa de puntos de intercambio / tiendas',             true, 'module', 100),
('stores',           'Tiendas',            'Directorio de tiendas y negocios',                    true, 'module', 100),
('premium',          'Premium',            'Planes premium y suscripciones',                      true, 'module', 100),
('promos',           'Promos',             'Sistema de promociones y visibilidad',                true, 'module', 100),
('visual_checklist', 'Visual Checklist',   'Checklist visual de figuritas con imágenes',          false, 'module', 0),
('realtime_chat',    'Realtime Chat',      'Chat en tiempo real con WebSockets',                  true, 'module', 100),
('ads_sponsored',    'Ads / Sponsored',    'Sistema de anuncios y contenido patrocinado',         true, 'module', 100),
('negocios',         'Negocios',           'Dashboard y gestión de negocios',                     true, 'module', 100),
('crm_push',         'CRM / Push',         'CRM, notificaciones push y lifecycle',                false, 'module', 0),
('seo_pages',        'SEO Pages',          'Páginas optimizadas para SEO',                        true, 'module', 100)
ON CONFLICT (feature_key) DO NOTHING;

-- Subfeatures
INSERT INTO public.feature_flags (feature_key, name, description, is_enabled, scope, parent_feature_key, rollout_percentage) VALUES
('open_chat',           'Abrir Chat',              'Permitir abrir nuevos chats desde cruces',             true,  'subfeature', 'chats',        100),
('view_matches',        'Ver Matches',             'Permitir visualizar cruces/matches',                   true,  'subfeature', 'matches',      100),
('map_points',          'Mapa de Puntos',          'Mostrar mapa interactivo de puntos de intercambio',    true,  'subfeature', 'points',       100),
('create_promo',        'Crear Promo',             'Permitir crear promociones desde dashboard',           true,  'subfeature', 'promos',       100),
('smart_suggestions',   'Smart Suggestions',       'Sugerencias inteligentes de intercambio con IA',       false, 'subfeature', 'matches',      0),
('realtime_alerts',     'Alertas en Tiempo Real',  'Alertas push en tiempo real para nuevos cruces',       false, 'subfeature', 'realtime_chat', 0),
('premium_upsell',      'Premium Upsell',          'Mostrar upsells y CTAs de premium',                   true,  'subfeature', 'premium',      100),
('sponsored_cards',     'Sponsored Cards',         'Tarjetas patrocinadas en feed',                        true,  'subfeature', 'ads_sponsored', 100)
ON CONFLICT (feature_key) DO NOTHING;
