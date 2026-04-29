CREATE TABLE IF NOT EXISTS public.business_plan_rules (
    id uuid primary key default gen_random_uuid(),
    plan_name text unique not null,
    monthly_price integer not null,
    max_photos int,
    max_active_promos int,
    eligibility_boost numeric default 0,
    can_have_featured_badge boolean default false,
    can_have_featured_cta boolean default false,
    can_have_mobile_boost boolean default false,
    can_have_advanced_metrics boolean default false,
    can_have_context_promos boolean default false,
    created_at timestamptz default now()
);

-- Insertar planes iniciales
INSERT INTO public.business_plan_rules (plan_name, monthly_price, max_photos, max_active_promos, eligibility_boost, can_have_featured_badge, can_have_featured_cta, can_have_mobile_boost, can_have_advanced_metrics, can_have_context_promos)
VALUES 
('gratis', 0, 1, 0, 0, false, false, false, false, false),
('turbo', 690, 3, 1, 0.05, true, true, true, false, false),
('dominio', 1490, 3, null, 0.10, true, true, true, true, true)
ON CONFLICT (plan_name) DO UPDATE SET
    monthly_price = EXCLUDED.monthly_price,
    max_photos = EXCLUDED.max_photos,
    max_active_promos = EXCLUDED.max_active_promos,
    eligibility_boost = EXCLUDED.eligibility_boost,
    can_have_featured_badge = EXCLUDED.can_have_featured_badge,
    can_have_featured_cta = EXCLUDED.can_have_featured_cta,
    can_have_mobile_boost = EXCLUDED.can_have_mobile_boost,
    can_have_advanced_metrics = EXCLUDED.can_have_advanced_metrics,
    can_have_context_promos = EXCLUDED.can_have_context_promos;

-- Alter partner_locations para agregar los campos necesarios
ALTER TABLE public.partner_locations
ADD COLUMN IF NOT EXISTS business_plan text default 'gratis',
ADD COLUMN IF NOT EXISTS eligibility_score numeric default 0,
ADD COLUMN IF NOT EXISTS response_score numeric default 0,
ADD COLUMN IF NOT EXISTS profile_quality_score numeric default 0,
ADD COLUMN IF NOT EXISTS activity_score numeric default 0,
ADD COLUMN IF NOT EXISTS allows_exchange boolean default false,
ADD COLUMN IF NOT EXISTS sells_stickers boolean default false,
ADD COLUMN IF NOT EXISTS is_featured boolean default false,
ADD COLUMN IF NOT EXISTS sponsor_priority numeric default 0;

-- Crear funcion helper
CREATE OR REPLACE FUNCTION public.get_business_plan_rules(location_id uuid)
RETURNS jsonb AS $$
DECLARE
    loc_plan text;
    rules_record public.business_plan_rules%rowtype;
    result jsonb;
BEGIN
    SELECT business_plan INTO loc_plan
    FROM public.partner_locations
    WHERE id = location_id;

    IF loc_plan IS NULL THEN
        loc_plan := 'gratis';
    END IF;

    SELECT * INTO rules_record
    FROM public.business_plan_rules
    WHERE plan_name = lower(loc_plan);

    IF NOT FOUND THEN
        SELECT * INTO rules_record
        FROM public.business_plan_rules
        WHERE plan_name = 'gratis';
    END IF;

    result := row_to_json(rules_record)::jsonb;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos
ALTER TABLE public.business_plan_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver business plans"
    ON public.business_plan_rules FOR SELECT
    USING (true);

GRANT EXECUTE ON FUNCTION public.get_business_plan_rules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_plan_rules(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_business_plan_rules(uuid) TO anon;
