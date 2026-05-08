-- =====================================================
-- FIX PAYOUT FINAL - Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Asegurar que la columna last_payout_at exista en profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paypal_email text,
ADD COLUMN IF NOT EXISTS payout_frequency_days int DEFAULT 7,
ADD COLUMN IF NOT EXISTS last_payout_at timestamptz;

-- 2. CREAR la función can_request_payout (¡ERA LA QUE FALTABA!)
-- Esta función verifica si el usuario puede pedir un retiro
-- según la frecuencia que eligió (3, 7 o 15 días)
CREATE OR REPLACE FUNCTION public.can_request_payout(u_id uuid)
RETURNS boolean AS $$
DECLARE
    freq_days int;
    last_payout timestamptz;
BEGIN
    -- Obtener frecuencia y último retiro del perfil
    SELECT 
        coalesce(payout_frequency_days, 7),
        last_payout_at
    INTO freq_days, last_payout
    FROM public.profiles
    WHERE id = u_id;

    -- Si nunca retiró, siempre puede
    IF last_payout IS NULL THEN
        RETURN true;
    END IF;

    -- Verificar si pasaron suficientes días desde el último retiro
    RETURN (now() - last_payout) >= (freq_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dar permisos a las funciones
GRANT EXECUTE ON FUNCTION public.can_request_payout(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_request_payout(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_ledger_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_ledger_balance(uuid) TO service_role;

-- 4. Permisos para influencer_tier_snapshots (mata los 403)
ALTER TABLE public.influencer_tier_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Snapshots full access" ON public.influencer_tier_snapshots;
CREATE POLICY "Snapshots full access" ON public.influencer_tier_snapshots
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Recargar saldo de prueba (USD 25.00)
INSERT INTO public.financial_ledger (user_id, amount, entry_type, reference_type, description)
SELECT id, 25.00, 'commission', 'subscription', 'Recarga de Prueba Final (SIM_FINAL)'
FROM auth.users WHERE email = 'influencer@test.com';
