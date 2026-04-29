CREATE TABLE IF NOT EXISTS public.plan_rules (
    id uuid primary key default gen_random_uuid(),
    plan_name text unique not null,
    max_active_albums int,
    favorite_limit int,
    chat_expiration_hours int,
    match_depth text not null,
    match_refresh_level text not null,
    priority_boost numeric default 0,
    can_use_optimized_ranking boolean default false,
    can_use_advanced_ranking boolean default false,
    can_receive_match_alerts boolean default false,
    can_receive_realtime_alerts boolean default false,
    can_use_smart_suggestions boolean default false,
    can_use_early_features boolean default false,
    created_at timestamptz default now()
);

-- Inserción de planes (si no existen o actualizar)
INSERT INTO public.plan_rules (plan_name, max_active_albums, favorite_limit, chat_expiration_hours, match_depth, match_refresh_level, priority_boost, can_use_optimized_ranking, can_use_advanced_ranking, can_receive_match_alerts, can_receive_realtime_alerts, can_use_smart_suggestions, can_use_early_features)
VALUES 
('gratis', 1, 10, 72, 'basic', 'low', 0, false, false, false, false, false, false),
('plus', 3, 50, null, 'optimized', 'medium', 0.05, true, false, true, false, false, false),
('pro', null, null, null, 'advanced', 'high', 0.10, true, true, true, true, true, true)
ON CONFLICT (plan_name) DO UPDATE SET
    max_active_albums = EXCLUDED.max_active_albums,
    favorite_limit = EXCLUDED.favorite_limit,
    chat_expiration_hours = EXCLUDED.chat_expiration_hours,
    match_depth = EXCLUDED.match_depth,
    match_refresh_level = EXCLUDED.match_refresh_level,
    priority_boost = EXCLUDED.priority_boost,
    can_use_optimized_ranking = EXCLUDED.can_use_optimized_ranking,
    can_use_advanced_ranking = EXCLUDED.can_use_advanced_ranking,
    can_receive_match_alerts = EXCLUDED.can_receive_match_alerts,
    can_receive_realtime_alerts = EXCLUDED.can_receive_realtime_alerts,
    can_use_smart_suggestions = EXCLUDED.can_use_smart_suggestions,
    can_use_early_features = EXCLUDED.can_use_early_features;


CREATE OR REPLACE FUNCTION public.get_user_plan_rules(user_id uuid)
RETURNS jsonb AS $$
DECLARE
    u_plan text;
    rules_record public.plan_rules%rowtype;
    result jsonb;
BEGIN
    -- Determinar el plan del usuario desde profiles
    SELECT plan_name INTO u_plan
    FROM public.profiles
    WHERE id = user_id;

    -- Fallback a gratis si es nulo
    IF u_plan IS NULL THEN
        u_plan := 'gratis';
    END IF;

    -- Obtener reglas
    SELECT * INTO rules_record
    FROM public.plan_rules
    WHERE plan_name = lower(u_plan);

    -- Si por alguna razón no existe, devolver las del plan gratis
    IF NOT FOUND THEN
        SELECT * INTO rules_record
        FROM public.plan_rules
        WHERE plan_name = 'gratis';
    END IF;

    -- Convertir a JSON
    result := row_to_json(rules_record)::jsonb;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Establecer RLS para plan_rules
ALTER TABLE public.plan_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver las reglas de planes"
    ON public.plan_rules FOR SELECT
    USING (true);

-- Otorgar acceso a las funciones
GRANT EXECUTE ON FUNCTION public.get_user_plan_rules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan_rules(uuid) TO service_role;
