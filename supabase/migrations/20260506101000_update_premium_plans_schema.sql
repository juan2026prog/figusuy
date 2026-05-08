-- Ensure premium_plans matches the new architecture
DO $$
BEGIN
    -- Add plan_key if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='premium_plans' AND column_name='plan_key') THEN
        ALTER TABLE public.premium_plans ADD COLUMN plan_key text;
    END IF;

    -- Add plan_family if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='premium_plans' AND column_name='plan_family') THEN
        ALTER TABLE public.premium_plans ADD COLUMN plan_family text DEFAULT 'user';
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='premium_plans' AND column_name='is_active') THEN
        ALTER TABLE public.premium_plans ADD COLUMN is_active boolean DEFAULT true;
    END IF;

    -- Add sort_order if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='premium_plans' AND column_name='sort_order') THEN
        ALTER TABLE public.premium_plans ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
END $$;

-- Update existing plans if they exist
UPDATE public.premium_plans SET plan_key = 'plus', plan_family = 'user' WHERE lower(name) LIKE '%plus%';
UPDATE public.premium_plans SET plan_key = 'pro', plan_family = 'user' WHERE lower(name) LIKE '%pro%';
UPDATE public.premium_plans SET plan_key = 'radar', plan_family = 'addon' WHERE lower(name) LIKE '%radar%';
UPDATE public.premium_plans SET plan_key = 'conversion', plan_family = 'business' WHERE lower(name) LIKE '%conversion%';
