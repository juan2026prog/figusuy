-- ====================================================
-- PAYPAL MONETIZATION UTILITIES — Database Migration
-- FigusUY — 2026-05-06
-- ====================================================

-- Function to get user ledger balance
CREATE OR REPLACE FUNCTION public.get_user_ledger_balance(u_id uuid)
RETURNS numeric AS $$
BEGIN
    RETURN (
        SELECT coalesce(sum(amount), 0)
        FROM public.financial_ledger
        WHERE user_id = u_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user commissions summary
CREATE OR REPLACE FUNCTION public.get_affiliate_stats_summary(a_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_earned', (SELECT coalesce(sum(amount), 0) FROM commissions WHERE affiliate_id = a_id AND status IN ('payable', 'paid')),
        'pending_payable', (SELECT coalesce(sum(amount), 0) FROM commissions WHERE affiliate_id = a_id AND status = 'payable'),
        'total_paid', (SELECT coalesce(sum(amount), 0) FROM payout_items WHERE user_id = a_id AND status = 'completed'),
        'current_balance', get_user_ledger_balance(a_id)
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for subscription audit trail
CREATE OR REPLACE VIEW public.vw_subscription_audit AS
SELECT 
    s.id,
    s.user_id,
    p.email as user_email,
    s.plan_key,
    s.plan_family,
    s.status,
    s.provider_subscription_id,
    s.current_period_end,
    s.created_at,
    (SELECT count(*) FROM subscription_events e WHERE e.provider_subscription_id = s.provider_subscription_id) as event_count
FROM public.user_subscriptions s
JOIN public.profiles p ON s.user_id = p.id;

-- RLS for views
ALTER VIEW public.vw_subscription_audit OWNER TO postgres;
GRANT SELECT ON public.vw_subscription_audit TO authenticated;
