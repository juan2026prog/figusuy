-- FIX: RLS POLICIES FOR ADMIN ACCESS

-- 1. Profiles: Everyone can see profiles (needed for mentions, audits, and self-profile loading)
DO $$ BEGIN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. User Roles: Admins can see everyone's roles, users can see their own
DO $$ BEGIN
    CREATE POLICY "Users can see their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Feature Flag Audit: Admins can manage/view
DO $$ BEGIN
    CREATE POLICY "Admins can view feature flag audit" ON public.feature_flag_audit FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert feature flag audit" ON public.feature_flag_audit FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Algorithm Config (re-verify)
DO $$ BEGIN
    CREATE POLICY "Anyone can read algorithm config" ON public.algorithm_config FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage algorithm config" ON public.algorithm_config FOR ALL USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Audit Log (general)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module text NOT NULL,
    action text NOT NULL,
    target_id text,
    changer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    old_value jsonb DEFAULT '{}',
    new_value jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert audit log" ON public.audit_log FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('god_admin', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
