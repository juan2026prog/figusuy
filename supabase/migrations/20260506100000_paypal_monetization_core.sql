-- ====================================================
-- PAYPAL MONETIZATION CORE — Database Migration
-- FigusUY — 2026-05-06
-- ====================================================

-- 1. SUBSCRIPTION EVENTS (Audit & Idempotency)
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id uuid primary key default gen_random_uuid(),
    provider text not null default 'paypal',
    provider_event_id text unique not null,
    provider_subscription_id text,
    event_type text not null,
    resource_type text,
    payload jsonb not null,
    processed_at timestamptz,
    status text not null default 'pending' check (status in ('pending', 'processed', 'failed', 'ignored')),
    error_log text,
    created_at timestamptz default now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view subscription events" ON public.subscription_events
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'analista')));

-- 2. PAYOUT ACCOUNTS
CREATE TABLE IF NOT EXISTS public.payout_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade unique not null,
    payout_method text not null default 'paypal',
    payout_email text not null,
    is_verified boolean default false,
    metadata jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own payout accounts" ON public.payout_accounts
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view payout accounts" ON public.payout_accounts
    FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 3. FINANCIAL LEDGER (Double-entry source of truth)
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    amount numeric not null, -- Positive for credit, negative for debit
    currency text not null default 'USD',
    entry_type text not null check (entry_type in ('commission', 'payout', 'refund', 'adjustment', 'bonus', 'reversal')),
    reference_type text not null, -- e.g., 'subscription', 'payout_item', 'manual'
    reference_id uuid,
    description text,
    metadata jsonb default '{}',
    created_at timestamptz default now()
);

ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger" ON public.financial_ledger
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage ledger" ON public.financial_ledger
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'analista')));

-- 4. COMMISSIONS (Detailed tracking)
CREATE TABLE IF NOT EXISTS public.commissions (
    id uuid primary key default gen_random_uuid(),
    affiliate_id uuid references profiles(id) on delete set null,
    source_user_id uuid references profiles(id) on delete set null,
    subscription_id text, -- PayPal subscription ID
    amount numeric not null,
    currency text not null default 'USD',
    status text not null default 'pending' check (status in ('pending', 'payable', 'paid', 'cancelled', 'reversed')),
    plan_key text, -- 'plus', 'pro', 'radar', 'conversion'
    metadata jsonb default '{}',
    ledger_entry_id uuid references financial_ledger(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates can view own commissions" ON public.commissions
    FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Admins can manage commissions" ON public.commissions
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 5. PAYOUT BATCHES
CREATE TABLE IF NOT EXISTS public.payout_batches (
    id uuid primary key default gen_random_uuid(),
    provider text not null default 'paypal',
    provider_batch_id text unique,
    status text not null default 'draft' check (status in ('draft', 'pending', 'processing', 'completed', 'failed', 'cancelled')),
    total_amount numeric not null default 0,
    currency text not null default 'USD',
    item_count integer not null default 0,
    error_message text,
    metadata jsonb default '{}',
    executed_at timestamptz,
    executed_by uuid references profiles(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payout batches" ON public.payout_batches
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 6. PAYOUT ITEMS
CREATE TABLE IF NOT EXISTS public.payout_items (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid references payout_batches(id) on delete cascade,
    user_id uuid references profiles(id) on delete set null,
    payout_account_id uuid references payout_accounts(id) on delete set null,
    amount numeric not null,
    currency text not null default 'USD',
    status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled', 'denied', 'returned')),
    provider_item_id text unique,
    error_message text,
    ledger_entry_id uuid references financial_ledger(id),
    metadata jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payout items" ON public.payout_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage payout items" ON public.payout_items
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 7. USER SUBSCRIPTIONS (Unified & Hardened)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade not null,
    plan_key text not null, -- 'plus', 'pro', 'radar', 'conversion'
    plan_family text not null check (plan_family in ('user', 'addon', 'business')),
    status text not null check (status in ('active', 'paused', 'cancelled', 'expired', 'trialing', 'past_due')),
    provider text not null default 'paypal',
    provider_subscription_id text unique,
    current_period_start timestamptz,
    current_period_end timestamptz,
    trial_ends_at timestamptz,
    cancel_at_period_end boolean default false,
    metadata jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    -- Rule: One active subscription per family per user
    UNIQUE (user_id, plan_family) WHERE (status in ('active', 'trialing'))
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin', 'comercial')));

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sub_events_provider_id ON public.subscription_events(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.financial_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON public.financial_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON public.commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_batch ON public.payout_items(batch_id);

-- 9. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_payout_accounts_updated_at BEFORE UPDATE ON public.payout_accounts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_payout_batches_updated_at BEFORE UPDATE ON public.payout_batches FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_payout_items_updated_at BEFORE UPDATE ON public.payout_items FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
