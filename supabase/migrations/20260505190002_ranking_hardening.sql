-- ==========================================
-- SYSTEM LOGIC HARDENING — Audit v1.1
-- FigusUY — 2026-05-05
-- ==========================================

-- 1. Add cache columns to locations if missing
-- This ensures the ranking engine has fast access to engagement metrics.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='views_count') THEN
        ALTER TABLE public.locations ADD COLUMN views_count int DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='favorites_count') THEN
        ALTER TABLE public.locations ADD COLUMN favorites_count int DEFAULT 0;
    END IF;
END $$;

-- 2. Synchronize cache counts from event tables
UPDATE public.locations l
SET 
    views_count = (SELECT count(*) FROM business_events be WHERE be.location_id = l.id AND be.event_type = 'view'),
    favorites_count = (SELECT count(*) FROM user_favorites uf WHERE uf.location_id = l.id);

-- 3. Optimized BUSINESS RANKING Logic
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
    report_count int; days_inactive int; completion_count int;
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

    -- A. Utility / Relevance (Store type & location data)
    s_relevance := 50;
    IF loc.type IN ('store', 'safe_point', 'cafe', 'kiosk') THEN s_relevance := s_relevance + 20; END IF;
    IF loc.lat IS NOT NULL AND loc.lng IS NOT NULL THEN s_relevance := s_relevance + 15; END IF;
    IF loc.city IS NOT NULL THEN s_relevance := s_relevance + 15; END IF;

    -- B. Engagement (REDUCED VIEWS WEIGHT, ADDED COMPLETIONS)
    SELECT count(*) INTO completion_count FROM exchange_completions 
        WHERE location_id = target_location_id AND status = 'completed';
    
    s_engagement := LEAST(
        (coalesce(loc.views_count, 0) * 0.5) + 
        (coalesce(loc.favorites_count, 0) * 10) + 
        (completion_count * 50), 
        100
    );

    -- C. Trust
    SELECT count(*) INTO report_count FROM reports
        WHERE entity_type = 'location' AND entity_id = target_location_id::text AND status = 'resolved';
    s_trust := 100 - (report_count * 25); -- Increased penalty for store reports
    IF loc.is_active THEN s_trust := s_trust + 0; ELSE s_trust := s_trust - 30; END IF;
    IF loc.is_safe_point THEN s_trust := s_trust + 10; END IF;
    IF loc.is_verified THEN s_trust := s_trust + 15; END IF;
    s_trust := LEAST(GREATEST(s_trust, 0), 100);

    -- D. Profile Quality (Information completeness)
    s_profile := 0;
    IF loc.name IS NOT NULL AND length(loc.name) > 2 THEN s_profile := s_profile + 20; END IF;
    IF loc.address IS NOT NULL THEN s_profile := s_profile + 15; END IF;
    IF loc.whatsapp IS NOT NULL THEN s_profile := s_profile + 20; END IF;
    IF loc.lat IS NOT NULL THEN s_profile := s_profile + 15; END IF;
    IF loc.metadata IS NOT NULL AND loc.metadata ? 'hours' THEN s_profile := s_profile + 15; END IF;
    IF loc.metadata IS NOT NULL AND (loc.metadata ? 'description' OR loc.description IS NOT NULL) THEN s_profile := s_profile + 15; END IF;

    -- E. Activity (BASED ON REAL EXCHANGE LIQUIDITY)
    SELECT count(*) INTO completion_count FROM exchange_completions 
        WHERE location_id = target_location_id 
        AND status = 'completed'
        AND created_at > now() - interval '30 days';
    
    IF completion_count > 0 THEN
        s_activity := 100;
    ELSE
        days_inactive := EXTRACT(EPOCH FROM (now() - coalesce(loc.updated_at, loc.created_at))) / 86400;
        IF days_inactive <= 7 THEN s_activity := 75;
        ELSIF days_inactive <= 14 THEN s_activity := 40;
        ELSE s_activity := 10; END IF;
    END IF;

    -- Plan boost (tiebreaker only)
    IF loc.business_plan = 'dominio' THEN
        plan_boost := 1.10;
        sponsor_boost := LEAST(coalesce((cfg->>'sponsor_boost')::numeric, 1.10), max_sponsor);
    ELSIF loc.business_plan = 'turbo' THEN
        plan_boost := 1.05;
    ELSE
        plan_boost := 1.0;
    END IF;

    final_rank := (
        (s_relevance * w_relevance) +
        (s_engagement * w_engagement) +
        (s_trust * w_trust) +
        (s_profile * w_profile) +
        (s_activity * w_activity)
    );

    IF plan_boost > 1.0 THEN final_rank := final_rank * plan_boost; END IF;
    final_rank := LEAST(final_rank, 100);

    -- Dynamic Badges
    IF s_trust >= 85 THEN biz_badges := array_append(biz_badges, 'verificado'); END IF;
    IF final_rank >= 80 THEN biz_badges := array_append(biz_badges, 'punto_destacado'); END IF;
    IF completion_count >= 5 THEN biz_badges := array_append(biz_badges, 'punto_activo'); END IF;
    IF loc.is_safe_point THEN biz_badges := array_append(biz_badges, 'zona_segura'); END IF;

    reasons := jsonb_build_object(
        'formula', 'relevance*w + engagement*w + trust*w + profile*w + activity*w',
        'completions_30d', completion_count,
        'trust_level', CASE WHEN s_trust > 80 THEN 'high' WHEN s_trust > 50 THEN 'medium' ELSE 'low' END
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

    RETURN jsonb_build_object('location_id', target_location_id, 'final_rank', final_rank);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Optimized USER RANKING Logic (Proactive Trust)
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
    album_count int; trade_count int; chat_count int; confirmed_trades int;
    max_boost numeric;
BEGIN
    SELECT * INTO p FROM profiles WHERE id = target_user_id;
    IF NOT FOUND THEN RETURN '{"error":"user_not_found"}'::jsonb; END IF;

    SELECT jsonb_object_agg(config_key, config_value) INTO cfg
    FROM algorithm_config WHERE category IN ('ranking', 'penalties', 'limits');

    w_relevance := coalesce((cfg->>'user_match_relevance_weight')::numeric, 0.40);
    w_trust     := coalesce((cfg->>'user_trust_weight')::numeric, 0.20);
    w_activity  := coalesce((cfg->>'user_activity_weight')::numeric, 0.15);
    w_quality   := coalesce((cfg->>'user_match_quality_weight')::numeric, 0.15);
    w_profile   := coalesce((cfg->>'user_profile_weight')::numeric, 0.10);
    max_boost   := LEAST(coalesce((cfg->>'max_premium_boost')::numeric, 1.20), 1.20);

    -- A. Match Relevance Score (Inventory Value)
    SELECT count(DISTINCT album_id) INTO album_count FROM user_albums WHERE user_id = target_user_id;
    SELECT count(*) INTO trade_count FROM exchange_completions 
        WHERE (user_1_id = target_user_id OR user_2_id = target_user_id);
    s_relevance := LEAST((album_count * 20) + (trade_count * 5), 100);

    -- B. Trust Score (PROACTIVE MODEL: BASELINE 40)
    SELECT count(*) INTO report_count FROM reports
        WHERE reported_user_id = target_user_id AND status = 'resolved';
    SELECT count(*) INTO block_count FROM user_blocks
        WHERE blocked_id = target_user_id;
    SELECT count(*) INTO confirmed_trades FROM exchange_completions
        WHERE (user_1_id = target_user_id OR user_2_id = target_user_id) AND status = 'completed';

    s_trust := 40; -- Baseline for new users
    s_trust := s_trust + (confirmed_trades * 12); -- Trust is earned
    s_trust := s_trust - (report_count * 30); -- Heavy penalty
    s_trust := s_trust - (block_count * 20);
    IF p.is_verified THEN s_trust := s_trust + 25; END IF;
    IF p.rating IS NOT NULL THEN s_trust := s_trust + (p.rating * 3); END IF;
    s_trust := LEAST(GREATEST(s_trust, 0), 100);

    -- C. Activity Score (Recency)
    days_inactive := EXTRACT(EPOCH FROM (now() - coalesce(p.last_active, p.created_at))) / 86400;
    IF days_inactive <= 1 THEN s_activity := 100;
    ELSIF days_inactive <= 3 THEN s_activity := 80;
    ELSIF days_inactive <= 7 THEN s_activity := 50;
    ELSE s_activity := 10; END IF;

    -- D. Match Quality Score (Reliability)
    IF trade_count > 0 THEN
        s_quality := (confirmed_trades::numeric / trade_count::numeric) * 100;
    ELSE
        SELECT count(*) INTO chat_count FROM chats WHERE (user_1 = target_user_id OR user_2 = target_user_id);
        s_quality := LEAST(chat_count * 8, 40);
    END IF;

    -- E. Profile Score (Network Integrity)
    s_profile := 0;
    IF p.name IS NOT NULL AND length(p.name) > 1 THEN s_profile := s_profile + 25; END IF;
    IF p.avatar_url IS NOT NULL THEN s_profile := s_profile + 25; END IF;
    IF p.city IS NOT NULL THEN s_profile := s_profile + 25; END IF;
    IF p.lat IS NOT NULL AND p.lng IS NOT NULL THEN s_profile := s_profile + 25; END IF;

    IF p.is_premium THEN
        boost := coalesce((cfg->>'premium_boost')::numeric, 1.15);
    ELSE
        boost := 1.0;
    END IF;

    final_rank := (
        (s_relevance * w_relevance) +
        (s_trust * w_trust) +
        (s_activity * w_activity) +
        (s_quality * w_quality) +
        (s_profile * w_profile)
    ) * boost;
    
    final_rank := LEAST(final_rank, 100);

    IF s_trust >= 80 THEN user_badges := array_append(user_badges, 'confiable'); END IF;
    IF confirmed_trades >= 5 THEN user_badges := array_append(user_badges, 'activo'); END IF;
    IF final_rank >= 85 THEN user_badges := array_append(user_badges, 'top_user'); END IF;

    INSERT INTO user_rankings (user_id, final_user_rank, match_relevance_score, trust_score,
        activity_score, match_quality_score, profile_score, premium_boost_applied,
        penalties, rank_reason, badges, last_scored_at)
    VALUES (target_user_id, final_rank, s_relevance, s_trust, s_activity, s_quality,
        s_profile, CASE WHEN boost > 1.0 THEN boost ELSE 0 END, pens, '{}'::jsonb, user_badges, now())
    ON CONFLICT (user_id) DO UPDATE SET
        final_user_rank = EXCLUDED.final_user_rank,
        match_relevance_score = EXCLUDED.match_relevance_score,
        trust_score = EXCLUDED.trust_score,
        activity_score = EXCLUDED.activity_score,
        match_quality_score = EXCLUDED.match_quality_score,
        profile_score = EXCLUDED.profile_score,
        premium_boost_applied = EXCLUDED.premium_boost_applied,
        last_scored_at = now();

    RETURN jsonb_build_object('user_id', target_user_id, 'final_rank', final_rank);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
