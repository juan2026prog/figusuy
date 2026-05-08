-- ====================================================
-- HARDENED PLAN RULES ENGINE — Database Migration
-- FigusUY — 2026-05-06
-- ====================================================

-- Updated RPC to handle family-based subscriptions and addons
CREATE OR REPLACE FUNCTION public.get_user_plan_rules(user_id uuid)
RETURNS jsonb AS $$
DECLARE
    u_plan_name text;
    user_rules jsonb;
    addon_rules jsonb;
    final_rules jsonb;
BEGIN
    -- 1. Get the Primary (User Family) Plan
    -- Check new table first
    SELECT plan_key INTO u_plan_name
    FROM public.user_subscriptions
    WHERE public.user_subscriptions.user_id = get_user_plan_rules.user_id
      AND plan_family = 'user'
      AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Fallback to profile plan_name (legacy/manual)
    IF u_plan_name IS NULL THEN
        SELECT plan_name INTO u_plan_name
        FROM public.profiles
        WHERE id = get_user_plan_rules.user_id;
    END IF;

    -- Fallback to gratis
    IF u_plan_name IS NULL THEN
        u_plan_name := 'gratis';
    END IF;

    -- Get Primary Rules
    SELECT row_to_json(r)::jsonb INTO user_rules
    FROM public.plan_rules r
    WHERE plan_name = lower(u_plan_name);

    -- If primary rules not found, fallback to gratis
    IF user_rules IS NULL THEN
        SELECT row_to_json(r)::jsonb INTO user_rules
        FROM public.plan_rules r
        WHERE plan_name = 'gratis';
    END IF;

    -- 2. Check for Addons (e.g., Radar)
    SELECT row_to_json(r)::jsonb INTO addon_rules
    FROM public.user_subscriptions s
    JOIN public.plan_rules r ON r.plan_name = s.plan_key
    WHERE s.user_id = get_user_plan_rules.user_id
      AND s.plan_family = 'addon'
      AND s.status IN ('active', 'trialing')
    LIMIT 1;

    -- 3. Merge Rules
    -- Primary rules are the base
    final_rules := user_rules;

    -- Addon rules override or extend (if any)
    IF addon_rules IS NOT NULL THEN
        -- Example: if Radar is active, enable certain flags even if primary is gratis
        final_rules := final_rules || jsonb_build_object(
            'has_radar_addon', true,
            'can_receive_match_alerts', coalesce((addon_rules->>'can_receive_match_alerts')::boolean, (final_rules->>'can_receive_match_alerts')::boolean),
            'can_receive_realtime_alerts', coalesce((addon_rules->>'can_receive_realtime_alerts')::boolean, (final_rules->>'can_receive_realtime_alerts')::boolean)
        );
    END IF;

    -- 4. Audit context
    final_rules := final_rules || jsonb_build_object(
        '_subscription_source', CASE WHEN u_plan_name IS NOT NULL THEN 'active_subscription' ELSE 'profile_fallback' END,
        '_plan_key', u_plan_name
    );

    RETURN final_rules;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
