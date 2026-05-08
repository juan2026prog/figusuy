
-- 1. Añadir frecuencia de pago al perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payout_frequency_days int DEFAULT 7 CHECK (payout_frequency_days IN (3, 7, 15)),
ADD COLUMN IF NOT EXISTS last_payout_at timestamptz;

-- 2. Función para obtener el balance retirable de un usuario
CREATE OR REPLACE FUNCTION public.get_user_withdrawable_balance(u_id uuid)
RETURNS numeric AS $$
    SELECT COALESCE(SUM(amount), 0)
    FROM public.financial_ledger
    WHERE user_id = u_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Función para validar si un influencer puede pedir retiro hoy
CREATE OR REPLACE FUNCTION public.can_request_payout(u_id uuid)
RETURNS boolean AS $$
DECLARE
    freq int;
    last_p text;
    last_p_date timestamptz;
BEGIN
    SELECT payout_frequency_days, last_payout_at INTO freq, last_p_date
    FROM public.profiles WHERE id = u_id;
    
    -- Si nunca retiró, puede retirar ya
    IF last_p_date IS NULL THEN
        RETURN true;
    END IF;
    
    -- Verificar si pasaron los días de frecuencia
    RETURN (now() >= last_p_date + (freq || ' days')::interval);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
