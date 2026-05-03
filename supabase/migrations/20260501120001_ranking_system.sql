-- ==========================================
-- RANKING SYSTEM — Database Migration
-- FigusUY — 2026-05-01
-- ==========================================

-- 1. USER RANKINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_rankings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    final_user_rank numeric DEFAULT 0,
    match_relevance_score numeric DEFAULT 0,
    trust_score numeric DEFAULT 0,
    activity_score numeric DEFAULT 0,
    match_quality_score numeric DEFAULT 0,
    profile_score numeric DEFAULT 0,
    premium_boost_applied numeric DEFAULT 0,
    penalties jsonb DEFAULT '{}',
    rank_reason jsonb DEFAULT '{}',
    badges text[] DEFAULT '{}',
    last_scored_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ranking" ON public.user_rankings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user rankings" ON public.user_rankings
    FOR ALL USING (EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('god_admin', 'admin')
    ));

CREATE INDEX IF NOT EXISTS idx_user_rankings_user ON public.user_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rankings_rank ON public.user_rankings(final_user_rank DESC);

-- 2. BUSINESS RANKINGS TABLE
CREATE TABLE IF NOT EXISTS public.business_rankings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    final_business_rank numeric DEFAULT 0,
    relevance_score numeric DEFAULT 0,
    engagement_score numeric DEFAULT 0,
    trust_score numeric DEFAULT 0,
    profile_quality_score numeric DEFAULT 0,
    activity_score numeric DEFAULT 0,
    plan_boost_applied numeric DEFAULT 0,
    sponsor_boost_applied numeric DEFAULT 0,
    penalties jsonb DEFAULT '{}',
    rank_reason jsonb DEFAULT '{}',
    badges text[] DEFAULT '{}',
    last_scored_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read business rankings" ON public.business_rankings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage business rankings" ON public.business_rankings
    FOR ALL USING (EXISTS (
        SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('god_admin', 'admin')
    ));

CREATE INDEX IF NOT EXISTS idx_business_rankings_location ON public.business_rankings(location_id);
CREATE INDEX IF NOT EXISTS idx_business_rankings_rank ON public.business_rankings(final_business_rank DESC);
CREATE INDEX IF NOT EXISTS idx_business_rankings_scored ON public.business_rankings(last_scored_at);

-- 3. ADD RANKING WEIGHT CONFIGS TO algorithm_config
INSERT INTO public.algorithm_config (config_key, config_value, category, description) VALUES
-- User ranking weights
('user_match_relevance_weight', '0.40', 'ranking', 'Peso de relevancia de match en ranking de usuario'),
('user_trust_weight', '0.20', 'ranking', 'Peso de confianza en ranking de usuario'),
('user_activity_weight', '0.15', 'ranking', 'Peso de actividad en ranking de usuario'),
('user_match_quality_weight', '0.15', 'ranking', 'Peso de calidad de match en ranking de usuario'),
('user_profile_weight', '0.10', 'ranking', 'Peso de perfil completo en ranking de usuario'),
-- Business ranking weights
('business_relevance_weight', '0.35', 'ranking', 'Peso de relevancia en ranking de negocio'),
('business_engagement_weight', '0.20', 'ranking', 'Peso de engagement en ranking de negocio'),
('business_trust_weight', '0.20', 'ranking', 'Peso de confianza en ranking de negocio'),
('business_profile_quality_weight', '0.15', 'ranking', 'Peso de calidad de perfil en ranking de negocio'),
('business_activity_weight', '0.05', 'ranking', 'Peso de actividad en ranking de negocio'),
-- Boost limits
('sponsor_boost_max', '1.15', 'limits', 'Límite máximo de boost sponsor (no supera relevancia)'),
-- Penalty weights
('report_penalty_weight', '0.15', 'penalties', 'Penalización por reporte confirmado'),
('inactivity_penalty_weight', '0.10', 'penalties', 'Penalización por inactividad'),
('distance_penalty_weight', '0.05', 'penalties', 'Penalización por distancia')
ON CONFLICT (config_key) DO NOTHING;

-- 4. RPC: CALCULATE USER RANKING
CREATE OR REPLACE FUNCTION public.calculate_user_ranking(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    p record;
    cfg jsonb;
    w_relevance numeric; w_trust numeric; w_activity numeric; w_quality numeric; w_profile numeric;
    s_relevance numeric := 0; s_trust numeric := 0; s_activity numeric := 0;
    s_quality numeric := 0; s_profile numeric := 0;
    boost numeric := 0; final_rank numeric := 0;
    pens jsonb := '{}'; reasons jsonb := '{}';
    user_badges text[] := '{}';
    report_count int; block_count int; days_inactive int;
    album_count int; trade_count int; chat_count int;
    max_boost numeric;
BEGIN
    -- Load user profile
    SELECT * INTO p FROM profiles WHERE id = target_user_id;
    IF NOT FOUND THEN RETURN '{"error":"user_not_found"}'::jsonb; END IF;

    -- Load config weights
    SELECT jsonb_object_agg(config_key, config_value) INTO cfg
    FROM algorithm_config WHERE category IN ('ranking', 'penalties', 'limits');

    w_relevance := coalesce((cfg->>'user_match_relevance_weight')::numeric, 0.40);
    w_trust     := coalesce((cfg->>'user_trust_weight')::numeric, 0.20);
    w_activity  := coalesce((cfg->>'user_activity_weight')::numeric, 0.15);
    w_quality   := coalesce((cfg->>'user_match_quality_weight')::numeric, 0.15);
    w_profile   := coalesce((cfg->>'user_profile_weight')::numeric, 0.10);
    max_boost   := LEAST(coalesce((cfg->>'max_premium_boost')::numeric, 1.20), 1.20);

    -- A. Match Relevance Score (based on sticker data)
    SELECT count(DISTINCT album_id) INTO album_count FROM user_albums WHERE user_id = target_user_id;
    SELECT count(*) INTO trade_count FROM trades
        WHERE (user_1 = target_user_id OR user_2 = target_user_id);
    s_relevance := LEAST((album_count * 15) + (trade_count * 10), 100);

    -- B. Trust Score
    SELECT count(*) INTO report_count FROM reports
        WHERE reported_user_id = target_user_id AND status = 'resolved';
    SELECT count(*) INTO block_count FROM user_blocks
        WHERE user_id = target_user_id AND is_active = true;

    s_trust := 100;
    s_trust := s_trust - (report_count * 15);
    s_trust := s_trust - (block_count * 25);
    IF p.is_verified THEN s_trust := s_trust + 10; END IF;
    IF p.rating IS NOT NULL AND p.rating >= 4 THEN s_trust := s_trust + 5; END IF;
    s_trust := GREATEST(s_trust, 0);

    -- C. Activity Score
    days_inactive := EXTRACT(EPOCH FROM (now() - coalesce(p.last_active, p.created_at))) / 86400;
    IF days_inactive <= 1 THEN s_activity := 100;
    ELSIF days_inactive <= 3 THEN s_activity := 85;
    ELSIF days_inactive <= 7 THEN s_activity := 65;
    ELSIF days_inactive <= 14 THEN s_activity := 40;
    ELSIF days_inactive <= 30 THEN s_activity := 20;
    ELSE s_activity := 5; END IF;

    -- D. Match Quality Score
    SELECT count(*) INTO chat_count FROM chats
        WHERE (user_1 = target_user_id OR user_2 = target_user_id);
    s_quality := LEAST((trade_count * 20) + (chat_count * 5), 100);

    -- E. Profile Score
    s_profile := 0;
    IF p.name IS NOT NULL AND length(p.name) > 1 THEN s_profile := s_profile + 25; END IF;
    IF p.avatar_url IS NOT NULL THEN s_profile := s_profile + 25; END IF;
    IF p.city IS NOT NULL OR p.department IS NOT NULL THEN s_profile := s_profile + 20; END IF;
    IF p.lat IS NOT NULL AND p.lng IS NOT NULL THEN s_profile := s_profile + 20; END IF;
    IF album_count > 0 THEN s_profile := s_profile + 10; END IF;

    -- Penalties
    IF report_count > 0 THEN
        pens := pens || jsonb_build_object('reports', report_count);
    END IF;
    IF days_inactive > 14 THEN
        pens := pens || jsonb_build_object('inactivity_days', days_inactive);
    END IF;
    IF s_profile < 50 THEN
        pens := pens || jsonb_build_object('incomplete_profile', true);
    END IF;

    -- Premium boost (limited, tiebreaker only)
    IF p.is_premium THEN
        boost := coalesce((cfg->>'premium_boost')::numeric, 1.15);
        boost := LEAST(boost, max_boost);
    ELSE
        boost := 1.0;
    END IF;

    -- Final calculation
    final_rank := (
        (s_relevance * w_relevance) +
        (s_trust * w_trust) +
        (s_activity * w_activity) +
        (s_quality * w_quality) +
        (s_profile * w_profile)
    );

    -- Apply boost as multiplier (capped)
    IF boost > 1.0 THEN
        final_rank := final_rank * boost;
    END IF;
    final_rank := LEAST(final_rank, 100);

    -- Badges
    IF s_activity >= 80 THEN user_badges := array_append(user_badges, 'activo'); END IF;
    IF s_trust >= 85 THEN user_badges := array_append(user_badges, 'confiable'); END IF;
    IF s_quality >= 60 THEN user_badges := array_append(user_badges, 'buen_cruce'); END IF;
    IF final_rank >= 85 THEN user_badges := array_append(user_badges, 'top_cruce'); END IF;
    IF days_inactive <= 7 AND p.created_at > now() - interval '30 days' THEN
        user_badges := array_append(user_badges, 'nuevo');
    END IF;

    reasons := jsonb_build_object(
        'formula', 'relevance*w + trust*w + activity*w + quality*w + profile*w',
        'boost_type', CASE WHEN p.is_premium THEN p.plan_name ELSE 'none' END,
        'boost_value', boost
    );

    -- Upsert ranking
    INSERT INTO user_rankings (user_id, final_user_rank, match_relevance_score, trust_score,
        activity_score, match_quality_score, profile_score, premium_boost_applied,
        penalties, rank_reason, badges, last_scored_at)
    VALUES (target_user_id, final_rank, s_relevance, s_trust, s_activity, s_quality,
        s_profile, CASE WHEN boost > 1.0 THEN boost ELSE 0 END, pens, reasons, user_badges, now())
    ON CONFLICT (user_id) DO UPDATE SET
        final_user_rank = EXCLUDED.final_user_rank,
        match_relevance_score = EXCLUDED.match_relevance_score,
        trust_score = EXCLUDED.trust_score,
        activity_score = EXCLUDED.activity_score,
        match_quality_score = EXCLUDED.match_quality_score,
        profile_score = EXCLUDED.profile_score,
        premium_boost_applied = EXCLUDED.premium_boost_applied,
        penalties = EXCLUDED.penalties,
        rank_reason = EXCLUDED.rank_reason,
        badges = EXCLUDED.badges,
        last_scored_at = now();

    RETURN jsonb_build_object(
        'user_id', target_user_id,
        'final_rank', final_rank,
        'subscores', jsonb_build_object(
            'relevance', s_relevance, 'trust', s_trust,
            'activity', s_activity, 'quality', s_quality, 'profile', s_profile
        ),
        'boost', boost, 'penalties', pens, 'badges', to_jsonb(user_badges)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_user_ranking(uuid) TO authenticated;

-- 5. RPC: CALCULATE BUSINESS RANKING
CREATE OR REPLACE FUNCTION public.calculate_business_ranking(target_location_id uuid)
RETURNS jsonb AS $$
DECLARE
    loc record;
    cfg jsonb;
    w_relevance numeric; w_engagement numeric; w_trust numeric; w_profile numeric; w_activity numeric;
    s_relevance numeric := 0; s_engagement numeric := 0; s_trust numeric := 0;
    s_profile numeric := 0; s_activity numeric := 0;
    plan_boost numeric := 0; sponsor_boost numeric := 0;
    final_rank numeric := 0;
    pens jsonb := '{}'; reasons jsonb := '{}';
    biz_badges text[] := '{}';
    report_count int; days_inactive int;
    max_sponsor numeric;
BEGIN
    SELECT * INTO loc FROM locations WHERE id = target_location_id;
    IF NOT FOUND THEN RETURN '{"error":"location_not_found"}'::jsonb; END IF;

    SELECT jsonb_object_agg(config_key, config_value) INTO cfg
    FROM algorithm_config WHERE category IN ('ranking', 'penalties', 'limits', 'business');

    w_relevance  := coalesce((cfg->>'business_relevance_weight')::numeric, 0.35);
    w_engagement := coalesce((cfg->>'business_engagement_weight')::numeric, 0.20);
    w_trust      := coalesce((cfg->>'business_trust_weight')::numeric, 0.20);
    w_profile    := coalesce((cfg->>'business_profile_quality_weight')::numeric, 0.15);
    w_activity   := coalesce((cfg->>'business_activity_weight')::numeric, 0.05);
    max_sponsor  := LEAST(coalesce((cfg->>'sponsor_boost_max')::numeric, 1.15), 1.15);

    -- A. Relevance (type correctness, zone data)
    s_relevance := 50;
    IF loc.type IN ('store', 'safe_point', 'cafe', 'kiosk') THEN s_relevance := s_relevance + 20; END IF;
    IF loc.lat IS NOT NULL AND loc.lng IS NOT NULL THEN s_relevance := s_relevance + 15; END IF;
    IF loc.city IS NOT NULL THEN s_relevance := s_relevance + 15; END IF;

    -- B. Engagement
    s_engagement := LEAST(coalesce(loc.views_count, 0) * 2 + coalesce(loc.favorites_count, 0) * 10, 100);

    -- C. Trust
    SELECT count(*) INTO report_count FROM reports
        WHERE entity_type = 'location' AND entity_id = target_location_id::text AND status = 'resolved';
    s_trust := 100 - (report_count * 20);
    IF loc.is_active THEN s_trust := s_trust + 0; ELSE s_trust := s_trust - 30; END IF;
    s_trust := GREATEST(s_trust, 0);

    -- D. Profile Quality
    s_profile := 0;
    IF loc.name IS NOT NULL AND length(loc.name) > 2 THEN s_profile := s_profile + 20; END IF;
    IF loc.address IS NOT NULL THEN s_profile := s_profile + 15; END IF;
    IF loc.whatsapp IS NOT NULL THEN s_profile := s_profile + 20; END IF;
    IF loc.lat IS NOT NULL THEN s_profile := s_profile + 15; END IF;
    IF loc.metadata IS NOT NULL AND loc.metadata ? 'hours' THEN s_profile := s_profile + 15; END IF;
    IF loc.metadata IS NOT NULL AND loc.metadata ? 'description' THEN s_profile := s_profile + 15; END IF;

    -- E. Activity
    days_inactive := EXTRACT(EPOCH FROM (now() - coalesce(loc.updated_at, loc.created_at))) / 86400;
    IF days_inactive <= 7 THEN s_activity := 100;
    ELSIF days_inactive <= 14 THEN s_activity := 70;
    ELSIF days_inactive <= 30 THEN s_activity := 40;
    ELSE s_activity := 10; END IF;

    -- Plan boost (limited tiebreaker)
    IF loc.business_plan = 'dominio' THEN
        plan_boost := 1.10;
        sponsor_boost := LEAST(coalesce((cfg->>'sponsor_boost')::numeric, 1.10), max_sponsor);
    ELSIF loc.business_plan = 'turbo' THEN
        plan_boost := 1.05;
    ELSE
        plan_boost := 1.0;
    END IF;

    -- Penalties
    IF report_count > 0 THEN pens := pens || jsonb_build_object('reports', report_count); END IF;
    IF NOT loc.is_active THEN pens := pens || jsonb_build_object('inactive', true); END IF;
    IF s_profile < 50 THEN pens := pens || jsonb_build_object('incomplete_profile', true); END IF;
    IF loc.whatsapp IS NULL THEN pens := pens || jsonb_build_object('no_whatsapp', true); END IF;

    -- Final calculation
    final_rank := (
        (s_relevance * w_relevance) +
        (s_engagement * w_engagement) +
        (s_trust * w_trust) +
        (s_profile * w_profile) +
        (s_activity * w_activity)
    );

    IF plan_boost > 1.0 THEN final_rank := final_rank * plan_boost; END IF;
    final_rank := LEAST(final_rank, 100);

    -- Badges
    IF s_trust >= 80 THEN biz_badges := array_append(biz_badges, 'verificado'); END IF;
    IF final_rank >= 75 THEN biz_badges := array_append(biz_badges, 'recomendado'); END IF;
    IF final_rank >= 90 THEN biz_badges := array_append(biz_badges, 'punto_destacado'); END IF;
    IF loc.business_plan IN ('turbo', 'dominio') THEN biz_badges := array_append(biz_badges, 'tienda_aliada'); END IF;
    IF loc.business_plan = 'dominio' THEN biz_badges := array_append(biz_badges, 'patrocinado'); END IF;

    reasons := jsonb_build_object(
        'formula', 'relevance*w + engagement*w + trust*w + profile*w + activity*w',
        'plan', loc.business_plan,
        'plan_boost', plan_boost,
        'sponsor_boost', sponsor_boost
    );

    INSERT INTO business_rankings (location_id, final_business_rank, relevance_score,
        engagement_score, trust_score, profile_quality_score, activity_score,
        plan_boost_applied, sponsor_boost_applied, penalties, rank_reason, badges, last_scored_at)
    VALUES (target_location_id, final_rank, s_relevance, s_engagement, s_trust,
        s_profile, s_activity, CASE WHEN plan_boost > 1.0 THEN plan_boost ELSE 0 END,
        CASE WHEN sponsor_boost > 0 THEN sponsor_boost ELSE 0 END,
        pens, reasons, biz_badges, now())
    ON CONFLICT (location_id) DO UPDATE SET
        final_business_rank = EXCLUDED.final_business_rank,
        relevance_score = EXCLUDED.relevance_score,
        engagement_score = EXCLUDED.engagement_score,
        trust_score = EXCLUDED.trust_score,
        profile_quality_score = EXCLUDED.profile_quality_score,
        activity_score = EXCLUDED.activity_score,
        plan_boost_applied = EXCLUDED.plan_boost_applied,
        sponsor_boost_applied = EXCLUDED.sponsor_boost_applied,
        penalties = EXCLUDED.penalties,
        rank_reason = EXCLUDED.rank_reason,
        badges = EXCLUDED.badges,
        last_scored_at = now();

    RETURN jsonb_build_object(
        'location_id', target_location_id,
        'final_rank', final_rank,
        'subscores', jsonb_build_object(
            'relevance', s_relevance, 'engagement', s_engagement, 'trust', s_trust,
            'profile', s_profile, 'activity', s_activity
        ),
        'plan_boost', plan_boost, 'sponsor_boost', sponsor_boost,
        'penalties', pens, 'badges', to_jsonb(biz_badges)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_business_ranking(uuid) TO authenticated;

-- 6. RPC: BATCH RECALCULATE
CREATE OR REPLACE FUNCTION public.recalculate_all_rankings()
RETURNS jsonb AS $$
DECLARE
    u record; l record;
    user_count int := 0; biz_count int := 0;
BEGIN
    FOR u IN SELECT id FROM profiles WHERE is_blocked IS NOT TRUE LOOP
        PERFORM calculate_user_ranking(u.id);
        user_count := user_count + 1;
    END LOOP;

    FOR l IN SELECT id FROM locations WHERE is_active = true LOOP
        PERFORM calculate_business_ranking(l.id);
        biz_count := biz_count + 1;
    END LOOP;

    RETURN jsonb_build_object('users_scored', user_count, 'businesses_scored', biz_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.recalculate_all_rankings() TO authenticated;

-- 7. Add ranking permission
INSERT INTO public.role_permissions (role, permission) VALUES
('god_admin', 'admin.ranking'),
('admin', 'admin.ranking')
ON CONFLICT (role, permission) DO NOTHING;
