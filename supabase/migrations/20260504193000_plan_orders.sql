CREATE TABLE IF NOT EXISTS public.plan_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.premium_plans(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UYU',
  status text NOT NULL DEFAULT 'pending',
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_orders_status_check'
  ) THEN
    ALTER TABLE public.plan_orders
    ADD CONSTRAINT plan_orders_status_check
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plan_orders_user ON public.plan_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_orders_plan ON public.plan_orders(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_orders_status ON public.plan_orders(status);

ALTER TABLE public.plan_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plan orders" ON public.plan_orders;
CREATE POLICY "Users can view own plan orders"
  ON public.plan_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_plan_orders_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plan_orders_updated_at ON public.plan_orders;
CREATE TRIGGER update_plan_orders_updated_at
BEFORE UPDATE ON public.plan_orders
FOR EACH ROW
EXECUTE FUNCTION public.touch_plan_orders_updated_at();
