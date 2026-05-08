CREATE TABLE IF NOT EXISTS public.influencer_tier_engine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  activation_weight NUMERIC(5,4) NOT NULL DEFAULT 0.40,
  conversion_weight NUMERIC(5,4) NOT NULL DEFAULT 0.40,
  quality_weight NUMERIC(5,4) NOT NULL DEFAULT 0.20,
  activation_rules JSONB NOT NULL DEFAULT '["onboarding_completed","album_loaded","stickers_marked","reached_matches"]'::jsonb,
  conversion_rules JSONB NOT NULL DEFAULT '["paid_plus","paid_pro","business_activated","ecosystem_purchase"]'::jsonb,
  quality_rules JSONB NOT NULL DEFAULT '["retained_30d","active_7d","no_fraud","no_refund","no_fast_churn"]'::jsonb,
  tier_thresholds JSONB NOT NULL DEFAULT '{
    "tier_1_min_activations": 10,
    "tier_1_min_conversions": 2,
    "tier_2_min_activations": 40,
    "tier_2_min_conversions": 10,
    "tier_3_min_activations": 100,
    "tier_3_min_conversions": 25
  }'::jsonb,
  quality_minimums JSONB NOT NULL DEFAULT '{
    "community": 35,
    "growth": 55,
    "partner": 75
  }'::jsonb,
  downgrade_rules JSONB NOT NULL DEFAULT '{
    "inactivity_days": 30,
    "conversion_drop_pct": 35,
    "quality_drop_pct": 25
  }'::jsonb,
  upgrade_rules JSONB NOT NULL DEFAULT '{
    "sustained_improvement_days": 14,
    "conversion_velocity_min": 3,
    "retention_quality_min": 60
  }'::jsonb,
  tier_commissions JSONB NOT NULL DEFAULT '{
    "community": { "user_commission": 5, "business_commission": 8 },
    "growth": { "user_commission": 6.5, "business_commission": 10 },
    "partner": { "user_commission": 7.5, "business_commission": 12 }
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.influencer_tier_engine_settings (singleton_key)
VALUES ('default')
ON CONFLICT (singleton_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.influencer_tier_snapshots (
  affiliate_id UUID PRIMARY KEY REFERENCES public.affiliates(id) ON DELETE CASCADE,
  affiliate_name TEXT,
  computed_tier TEXT NOT NULL DEFAULT 'community' CHECK (computed_tier IN ('community', 'growth', 'partner')),
  effective_tier TEXT NOT NULL DEFAULT 'community' CHECK (effective_tier IN ('community', 'growth', 'partner')),
  manual_override_tier TEXT CHECK (manual_override_tier IS NULL OR manual_override_tier IN ('community', 'growth', 'partner')),
  lock_auto_upgrade BOOLEAN NOT NULL DEFAULT false,
  lock_auto_downgrade BOOLEAN NOT NULL DEFAULT false,
  activation_count INT NOT NULL DEFAULT 0,
  conversion_count INT NOT NULL DEFAULT 0,
  quality_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  activation_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  conversion_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  tier_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  recent_activation_count INT NOT NULL DEFAULT 0,
  recent_conversion_count INT NOT NULL DEFAULT 0,
  current_user_commission NUMERIC(6,2) NOT NULL DEFAULT 0,
  current_business_commission NUMERIC(6,2) NOT NULL DEFAULT 0,
  next_tier TEXT CHECK (next_tier IS NULL OR next_tier IN ('community', 'growth', 'partner')),
  next_tier_progress NUMERIC(6,2) NOT NULL DEFAULT 0,
  next_tier_gap JSONB NOT NULL DEFAULT '{}'::jsonb,
  performance_health TEXT NOT NULL DEFAULT 'watch',
  upgrade_opportunity TEXT,
  downgrade_risk TEXT,
  inactivity_days INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  downgrade_reason TEXT,
  metrics_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_tier_snapshots_effective_tier ON public.influencer_tier_snapshots(effective_tier);
CREATE INDEX IF NOT EXISTS idx_influencer_tier_snapshots_score ON public.influencer_tier_snapshots(tier_score DESC);

CREATE OR REPLACE FUNCTION public.set_influencer_tier_engine_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_influencer_tier_engine_settings_updated_at ON public.influencer_tier_engine_settings;
CREATE TRIGGER tr_influencer_tier_engine_settings_updated_at
BEFORE UPDATE ON public.influencer_tier_engine_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_influencer_tier_engine_updated_at();

DROP TRIGGER IF EXISTS tr_influencer_tier_snapshots_updated_at ON public.influencer_tier_snapshots;
CREATE TRIGGER tr_influencer_tier_snapshots_updated_at
BEFORE UPDATE ON public.influencer_tier_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.set_influencer_tier_engine_updated_at();

ALTER TABLE public.influencer_tier_engine_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_tier_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tier settings affiliate read" ON public.influencer_tier_engine_settings;
CREATE POLICY "Tier settings affiliate read"
ON public.influencer_tier_engine_settings
FOR SELECT
USING (
  public.is_affiliate_admin()
  OR EXISTS (
    SELECT 1
    FROM public.affiliates a
    WHERE a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tier settings admin full" ON public.influencer_tier_engine_settings;
CREATE POLICY "Tier settings admin full"
ON public.influencer_tier_engine_settings
FOR ALL
USING (public.is_affiliate_admin())
WITH CHECK (public.is_affiliate_admin());

DROP POLICY IF EXISTS "Tier snapshots own read" ON public.influencer_tier_snapshots;
CREATE POLICY "Tier snapshots own read"
ON public.influencer_tier_snapshots
FOR SELECT
USING (
  public.is_affiliate_admin()
  OR EXISTS (
    SELECT 1
    FROM public.affiliates a
    WHERE a.id = affiliate_id
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tier snapshots admin full" ON public.influencer_tier_snapshots;
CREATE POLICY "Tier snapshots admin full"
ON public.influencer_tier_snapshots
FOR ALL
USING (public.is_affiliate_admin())
WITH CHECK (public.is_affiliate_admin());
