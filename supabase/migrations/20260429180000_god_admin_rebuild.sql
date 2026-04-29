-- ==========================================
-- GOD ADMIN REBUILD — Database Migration
-- FigusUY — 2026-04-29
-- ==========================================

-- 1. PAYMENTS / TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    location_id uuid references locations(id) on delete set null,
    plan_type text not null check (plan_type in ('user_premium', 'business')),
    plan_name text not null,
    amount numeric not null default 0,
    currency text not null default 'UYU',
    status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method text,
    external_id text,
    metadata jsonb default '{}',
    admin_notes text,
    reviewed_by uuid references profiles(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payments" ON public.payments
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created ON public.payments(created_at DESC);

-- 2. SUBSCRIPTIONS (user premium)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade not null,
    plan_name text not null,
    status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
    starts_at timestamptz default now(),
    expires_at timestamptz,
    payment_id uuid references payments(id) on delete set null,
    auto_renew boolean default true,
    paused_by uuid references profiles(id) on delete set null,
    paused_at timestamptz,
    cancelled_at timestamptz,
    admin_notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- 3. BUSINESS SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
    id uuid primary key default gen_random_uuid(),
    location_id uuid references locations(id) on delete cascade not null,
    owner_id uuid references profiles(id) on delete set null,
    plan_name text not null default 'gratis',
    status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
    starts_at timestamptz default now(),
    expires_at timestamptz,
    payment_id uuid references payments(id) on delete set null,
    auto_renew boolean default true,
    admin_notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own business subscriptions" ON public.business_subscriptions
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage business subscriptions" ON public.business_subscriptions
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 4. USER BLOCKS
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade not null,
    blocked_by uuid references profiles(id) on delete set null,
    reason text,
    block_type text not null default 'permanent' check (block_type in ('temporary', 'permanent')),
    expires_at timestamptz,
    is_active boolean default true,
    report_id uuid,
    created_at timestamptz default now(),
    unblocked_at timestamptz,
    unblocked_by uuid references profiles(id) on delete set null,
    unblock_reason text
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user blocks" ON public.user_blocks
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'moderator')));

CREATE INDEX idx_user_blocks_user ON public.user_blocks(user_id);
CREATE INDEX idx_user_blocks_active ON public.user_blocks(is_active);

-- 5. ADMIN NOTES
CREATE TABLE IF NOT EXISTS public.admin_notes (
    id uuid primary key default gen_random_uuid(),
    entity_type text not null,
    entity_id uuid not null,
    note text not null,
    author_id uuid references profiles(id) on delete set null,
    created_at timestamptz default now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin notes" ON public.admin_notes
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'moderator', 'support', 'comercial')));

CREATE INDEX idx_admin_notes_entity ON public.admin_notes(entity_type, entity_id);

-- 6. NOTIFICATION CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    body text not null,
    type text default 'info',
    channel text default 'push' check (channel in ('push', 'email', 'in_app', 'all')),
    segment text default 'all',
    status text default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
    sent_count int default 0,
    open_count int default 0,
    click_count int default 0,
    sent_by uuid references profiles(id) on delete set null,
    sent_at timestamptz,
    metadata jsonb default '{}',
    created_at timestamptz default now()
);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification campaigns" ON public.notification_campaigns
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 7. ANALYTICS EVENTS (lightweight event tracking)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null,
    user_id uuid references profiles(id) on delete set null,
    entity_type text,
    entity_id uuid,
    metadata jsonb default '{}',
    created_at timestamptz default now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics events" ON public.analytics_events
    FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'analista')));

CREATE POLICY "Authenticated users can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- 8. ALGORITHM CONFIG (persistent)
CREATE TABLE IF NOT EXISTS public.algorithm_config (
    id uuid primary key default gen_random_uuid(),
    config_key text unique not null,
    config_value jsonb not null,
    category text default 'general',
    description text,
    updated_by uuid references profiles(id) on delete set null,
    updated_at timestamptz default now()
);

ALTER TABLE public.algorithm_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read algorithm config" ON public.algorithm_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage algorithm config" ON public.algorithm_config
    FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin')));

-- Insert default algorithm config
INSERT INTO public.algorithm_config (config_key, config_value, category, description) VALUES
('matching_radius', '5', 'matching', 'Radio de búsqueda base en Km'),
('premium_boost', '1.15', 'ranking', 'Boost para usuarios premium (máx 1.2x, solo desempate)'),
('sponsor_boost', '1.10', 'ranking', 'Boost para negocios sponsor (máx 1.15x)'),
('new_user_boost_days', '7', 'ranking', 'Días de boost para usuario nuevo'),
('inactivity_penalty_days', '14', 'penalties', 'Días sin actividad para penalizar'),
('inactivity_penalty_factor', '0.8', 'penalties', 'Factor de penalización por inactividad'),
('report_penalty_factor', '0.6', 'penalties', 'Factor de penalización por reportes confirmados'),
('min_score_show_match', '0.3', 'matching', 'Score mínimo para mostrar un cruce'),
('max_active_chats', '50', 'limits', 'Límite de chats activos por usuario'),
('min_rating_top_search', '4.5', 'ranking', 'Rating mínimo para Top de búsqueda'),
('ranking_mode', '"optimized"', 'ranking', 'Modo de ranking: basic / optimized / advanced'),
('business_visibility_radius', '10', 'business', 'Radio de visibilidad de negocios en Km'),
('business_inactivity_penalty_days', '7', 'business', 'Días sin actividad para penalizar negocio'),
('max_premium_boost', '1.20', 'limits', 'Límite máximo de boost premium (no supera relevancia)')
ON CONFLICT (config_key) DO NOTHING;

-- ==========================================
-- RPC FUNCTIONS FOR ANALYTICS DASHBOARD
-- ==========================================

-- DAU / WAU / MAU
CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'dau', (SELECT count(*) FROM profiles WHERE last_active >= now() - interval '1 day'),
        'wau', (SELECT count(*) FROM profiles WHERE last_active >= now() - interval '7 days'),
        'mau', (SELECT count(*) FROM profiles WHERE last_active >= now() - interval '30 days'),
        'total_users', (SELECT count(*) FROM profiles),
        'premium_users', (SELECT count(*) FROM profiles WHERE is_premium = true),
        'registrations_7d', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
        'registrations_30d', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '30 days'),
        'active_albums', (SELECT count(DISTINCT album_id) FROM user_albums),
        'total_trades', (SELECT count(*) FROM trades),
        'trades_7d', (SELECT count(*) FROM trades WHERE created_at >= now() - interval '7 days'),
        'total_chats', (SELECT count(*) FROM chats),
        'chats_7d', (SELECT count(*) FROM chats WHERE created_at >= now() - interval '7 days'),
        'expired_chats', (SELECT count(*) FROM chats WHERE is_expired = true),
        'active_locations', (SELECT count(*) FROM locations WHERE is_active = true),
        'total_favorites', (SELECT count(*) FROM user_favorites),
        'pending_reports', (SELECT count(*) FROM reports WHERE status = 'pending'),
        'total_payments', (SELECT coalesce(sum(amount), 0) FROM payments WHERE status = 'completed'),
        'payments_30d', (SELECT coalesce(sum(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= now() - interval '30 days'),
        'active_promos', (SELECT count(*) FROM sponsored_placements WHERE is_active = true AND (ends_at IS NULL OR ends_at > now())),
        'promo_impressions_7d', (SELECT count(*) FROM sponsored_events WHERE event_type = 'impression' AND created_at >= now() - interval '7 days'),
        'promo_clicks_7d', (SELECT count(*) FROM sponsored_events WHERE event_type = 'click' AND created_at >= now() - interval '7 days'),
        'active_subscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
        'active_business_subs', (SELECT count(*) FROM business_subscriptions WHERE status = 'active')
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_analytics_summary() TO authenticated;

-- Daily activity for charts (last 14 days)
CREATE OR REPLACE FUNCTION public.get_daily_activity(days_back int default 14)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(day_data ORDER BY day_data->>'date')
    INTO result
    FROM (
        SELECT jsonb_build_object(
            'date', d::date,
            'active_users', (SELECT count(*) FROM profiles WHERE last_active::date = d::date),
            'new_users', (SELECT count(*) FROM profiles WHERE created_at::date = d::date),
            'trades', (SELECT count(*) FROM trades WHERE created_at::date = d::date),
            'chats', (SELECT count(*) FROM chats WHERE created_at::date = d::date),
            'payments', (SELECT coalesce(sum(amount), 0) FROM payments WHERE status = 'completed' AND created_at::date = d::date)
        ) as day_data
        FROM generate_series(now() - (days_back || ' days')::interval, now(), '1 day') d
    ) sub;
    RETURN coalesce(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_daily_activity(int) TO authenticated;

-- Role permissions matrix
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid primary key default gen_random_uuid(),
    role text not null,
    permission text not null,
    created_at timestamptz default now(),
    UNIQUE(role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role permissions" ON public.role_permissions
    FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin')));

-- Insert default permissions
INSERT INTO public.role_permissions (role, permission) VALUES
-- God Admin: everything
('god_admin', 'admin.dashboard'), ('god_admin', 'admin.users'), ('god_admin', 'admin.albums'), ('god_admin', 'admin.matches'),
('god_admin', 'admin.chats'), ('god_admin', 'admin.favorites'), ('god_admin', 'admin.locations'), ('god_admin', 'admin.location_requests'),
('god_admin', 'admin.business_plans'), ('god_admin', 'admin.promos'), ('god_admin', 'admin.reports'), ('god_admin', 'admin.blocks'),
('god_admin', 'admin.security'), ('god_admin', 'admin.audit'), ('god_admin', 'admin.plans'), ('god_admin', 'admin.subscriptions'),
('god_admin', 'admin.payments'), ('god_admin', 'admin.metrics'), ('god_admin', 'admin.cms'), ('god_admin', 'admin.notifications'),
('god_admin', 'admin.seo'), ('god_admin', 'admin.settings'), ('god_admin', 'admin.algorithm'), ('god_admin', 'admin.roles'),
('god_admin', 'admin.logs'), ('god_admin', 'admin.sponsored'),
-- Admin
('admin', 'admin.dashboard'), ('admin', 'admin.users'), ('admin', 'admin.albums'), ('admin', 'admin.matches'),
('admin', 'admin.chats'), ('admin', 'admin.favorites'), ('admin', 'admin.locations'), ('admin', 'admin.location_requests'),
('admin', 'admin.business_plans'), ('admin', 'admin.promos'), ('admin', 'admin.reports'), ('admin', 'admin.blocks'),
('admin', 'admin.audit'), ('admin', 'admin.plans'), ('admin', 'admin.subscriptions'), ('admin', 'admin.payments'),
('admin', 'admin.metrics'), ('admin', 'admin.cms'), ('admin', 'admin.notifications'), ('admin', 'admin.seo'),
('admin', 'admin.settings'), ('admin', 'admin.logs'), ('admin', 'admin.sponsored'),
-- Moderator
('moderator', 'admin.dashboard'), ('moderator', 'admin.reports'), ('moderator', 'admin.blocks'), ('moderator', 'admin.chats'),
('moderator', 'admin.users'), ('moderator', 'admin.audit'),
-- Support
('support', 'admin.dashboard'), ('support', 'admin.users'), ('support', 'admin.reports'), ('support', 'admin.chats'),
('support', 'admin.favorites'), ('support', 'admin.subscriptions'),
-- Comercial
('comercial', 'admin.dashboard'), ('comercial', 'admin.locations'), ('comercial', 'admin.location_requests'),
('comercial', 'admin.business_plans'), ('comercial', 'admin.promos'), ('comercial', 'admin.payments'),
('comercial', 'admin.metrics'), ('comercial', 'admin.notifications'), ('comercial', 'admin.sponsored'),
-- Analista
('analista', 'admin.dashboard'), ('analista', 'admin.metrics'), ('analista', 'admin.audit'),
('analista', 'admin.users')
ON CONFLICT (role, permission) DO NOTHING;
