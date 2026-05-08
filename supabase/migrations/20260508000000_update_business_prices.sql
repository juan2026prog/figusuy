-- Update business plan rules with the correct UYU prices
INSERT INTO public.business_plan_rules (plan_name, monthly_price, max_photos, max_active_promos, eligibility_boost, can_have_featured_badge, can_have_featured_cta, can_have_mobile_boost, can_have_advanced_metrics, can_have_context_promos)
VALUES 
('gratis', 0, 1, 0, 0, false, false, false, false, false),
('turbo', 690, 3, 1, 0.05, true, true, true, false, false),
('dominio', 1320, 5, null, 0.15, true, true, true, true, true),
('partner_store', 2990, 10, null, 0.25, true, true, true, true, true)
ON CONFLICT (plan_name) DO UPDATE SET
    monthly_price = EXCLUDED.monthly_price,
    max_photos = EXCLUDED.max_photos,
    max_active_promos = EXCLUDED.max_active_promos,
    eligibility_boost = EXCLUDED.eligibility_boost;

-- Update premium plans with the correct USD prices and link to plan_key
UPDATE public.premium_plans SET price = 16.85 WHERE plan_key = 'radar';
UPDATE public.premium_plans SET price = 32.20 WHERE plan_key = 'conversion';
UPDATE public.premium_plans SET price = 71.99 WHERE plan_key = 'partnerstore';
