-- ============================================
-- GROWTH ENGINE TABLES — FigusUY
-- Tables: smart_notifications, share_events, referral_events
-- ============================================

CREATE TABLE IF NOT EXISTS public.smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_key TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_actioned BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  link_id TEXT,
  status TEXT DEFAULT 'clicked',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  reward_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.smart_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.smart_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.smart_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own share_events" ON public.share_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own share_events" ON public.share_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own referral_events" ON public.referral_events FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can insert own referral_events" ON public.referral_events FOR INSERT WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);
