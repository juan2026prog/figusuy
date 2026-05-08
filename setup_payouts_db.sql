
-- 1. Tabla de solicitudes de Payout (Retiros)
CREATE TABLE IF NOT EXISTS public.influencer_payouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id uuid REFERENCES auth.users(id) NOT NULL,
    amount decimal(12,2) NOT NULL,
    currency text DEFAULT 'USD',
    status text DEFAULT 'pending', -- pending, processing, completed, failed
    payout_batch_id text, -- ID de PayPal
    payout_item_id text, -- ID del item en PayPal
    recipient_email text NOT NULL,
    error_message text,
    created_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

-- 2. Agregar configuración de retiro al perfil de influencer
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payout_frequency_days int DEFAULT 7,
ADD COLUMN IF NOT EXISTS paypal_email text,
ADD COLUMN IF NOT EXISTS last_payout_at timestamptz;

-- 3. Función para calcular cuándo es el próximo retiro disponible
CREATE OR REPLACE FUNCTION public.get_next_payout_date(user_id uuid)
RETURNS timestamptz AS $$
DECLARE
    freq int;
    last_payout timestamptz;
BEGIN
    SELECT payout_frequency_days, last_payout_at INTO freq, last_payout
    FROM public.profiles WHERE id = user_id;
    
    IF last_payout IS NULL THEN
        RETURN now();
    END IF;
    
    RETURN last_payout + (freq || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar RLS
ALTER TABLE public.influencer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers can view their own payouts" 
ON public.influencer_payouts FOR SELECT 
USING (auth.uid() = influencer_id);

CREATE POLICY "Influencers can create their own payout requests" 
ON public.influencer_payouts FOR INSERT 
WITH CHECK (auth.uid() = influencer_id);
