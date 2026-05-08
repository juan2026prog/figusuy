CREATE OR REPLACE FUNCTION public.is_affiliate_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = uid
      AND role IN ('god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista')
  );
$$;

DO $$
BEGIN
  IF to_regclass('public.affiliates') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate own read" ON public.affiliates';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate admin full" ON public.affiliates';
    EXECUTE 'CREATE POLICY "Affiliate own read" ON public.affiliates FOR SELECT USING (user_id = auth.uid() OR public.is_affiliate_admin())';
    EXECUTE 'CREATE POLICY "Affiliate admin full" ON public.affiliates FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;

  IF to_regclass('public.affiliate_campaigns') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate campaign own read" ON public.affiliate_campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate campaign admin full" ON public.affiliate_campaigns';
    EXECUTE '' ||
      'CREATE POLICY "Affiliate campaign own read" ON public.affiliate_campaigns FOR SELECT USING (' ||
      'public.is_affiliate_admin() OR EXISTS (' ||
      'SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()' ||
      ')' ||
      ')';
    EXECUTE 'CREATE POLICY "Affiliate campaign admin full" ON public.affiliate_campaigns FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;

  IF to_regclass('public.affiliate_benefits') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliate_benefits ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate benefit own read" ON public.affiliate_benefits';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate benefit admin full" ON public.affiliate_benefits';
    EXECUTE '' ||
      'CREATE POLICY "Affiliate benefit own read" ON public.affiliate_benefits FOR SELECT USING (' ||
      'public.is_affiliate_admin() OR EXISTS (' ||
      'SELECT 1 FROM public.affiliate_campaigns c ' ||
      'JOIN public.affiliates a ON a.id = c.affiliate_id ' ||
      'WHERE c.id = campaign_id AND a.user_id = auth.uid()' ||
      ')' ||
      ')';
    EXECUTE 'CREATE POLICY "Affiliate benefit admin full" ON public.affiliate_benefits FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;

  IF to_regclass('public.affiliate_commissions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate commission own read" ON public.affiliate_commissions';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate commission admin full" ON public.affiliate_commissions';
    EXECUTE '' ||
      'CREATE POLICY "Affiliate commission own read" ON public.affiliate_commissions FOR SELECT USING (' ||
      'public.is_affiliate_admin() OR EXISTS (' ||
      'SELECT 1 FROM public.affiliate_campaigns c ' ||
      'JOIN public.affiliates a ON a.id = c.affiliate_id ' ||
      'WHERE c.id = campaign_id AND a.user_id = auth.uid()' ||
      ')' ||
      ')';
    EXECUTE 'CREATE POLICY "Affiliate commission admin full" ON public.affiliate_commissions FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;

  IF to_regclass('public.affiliate_clicks') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate click own read" ON public.affiliate_clicks';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate click admin full" ON public.affiliate_clicks';
    EXECUTE '' ||
      'CREATE POLICY "Affiliate click own read" ON public.affiliate_clicks FOR SELECT USING (' ||
      'public.is_affiliate_admin() OR EXISTS (' ||
      'SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()' ||
      ')' ||
      ')';
    EXECUTE 'CREATE POLICY "Affiliate click admin full" ON public.affiliate_clicks FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;

  IF to_regclass('public.affiliate_conversions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate conversion own read" ON public.affiliate_conversions';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate conversion admin full" ON public.affiliate_conversions';
    EXECUTE '' ||
      'CREATE POLICY "Affiliate conversion own read" ON public.affiliate_conversions FOR SELECT USING (' ||
      'public.is_affiliate_admin() OR EXISTS (' ||
      'SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()' ||
      ')' ||
      ')';
    EXECUTE 'CREATE POLICY "Affiliate conversion admin full" ON public.affiliate_conversions FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;

  IF to_regclass('public.affiliate_payments') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.affiliate_payments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate payment own read" ON public.affiliate_payments';
    EXECUTE 'DROP POLICY IF EXISTS "Affiliate payment admin full" ON public.affiliate_payments';
    EXECUTE '' ||
      'CREATE POLICY "Affiliate payment own read" ON public.affiliate_payments FOR SELECT USING (' ||
      'public.is_affiliate_admin() OR EXISTS (' ||
      'SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()' ||
      ')' ||
      ')';
    EXECUTE 'CREATE POLICY "Affiliate payment admin full" ON public.affiliate_payments FOR ALL USING (public.is_affiliate_admin()) WITH CHECK (public.is_affiliate_admin())';
  END IF;
END $$;
