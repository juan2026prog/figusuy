
-- Aseguramos que los planes tengan la configuración correcta
UPDATE public.premium_plans SET currency = 'USD' WHERE currency != 'USD';

-- Verificamos/Insertamos los 4 planes con sus IDs reales de PayPal
INSERT INTO public.premium_plans (name, plan_key, paypal_plan_id, price, currency, plan_family)
VALUES 
    ('Premium Plus', 'plus', 'P-44886650HT834713HNH5UXNA', 4.85, 'USD', 'user'),
    ('Premium Pro', 'pro', 'P-70P913822W044745LNH5UXNI', 7.95, 'USD', 'user'),
    ('Radar Collector', 'radar', 'P-6SF64394C1565503HNH5UXNQ', 2.95, 'USD', 'user'),
    ('Conversion Plus', 'conversion', 'P-7SW08718R9159893HNH5UXNY', 12.95, 'USD', 'business')
ON CONFLICT (plan_key) DO UPDATE SET 
    paypal_plan_id = EXCLUDED.paypal_plan_id,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    plan_family = EXCLUDED.plan_family;
