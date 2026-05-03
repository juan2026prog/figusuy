-- ============================================
-- GAMIFICATION SYSTEM — FigusUY
-- Tables: user_progress, user_achievements, user_rewards
-- Functions: calculate/apply progress, rewards, achievements
-- ============================================

-- 1. USER PROGRESS
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'explorador' CHECK (level IN ('explorador','coleccionista','intercambiador','referente')),
  current_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_level_target JSONB NOT NULL DEFAULT '{}'::jsonb,
  streak_days INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  reward_points_hidden INT NOT NULL DEFAULT 0,
  total_trades INT NOT NULL DEFAULT 0,
  total_chats INT NOT NULL DEFAULT 0,
  total_favorites INT NOT NULL DEFAULT 0,
  total_albums INT NOT NULL DEFAULT 0,
  total_stickers_loaded INT NOT NULL DEFAULT 0,
  total_duplicates_loaded INT NOT NULL DEFAULT 0,
  days_active INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  last_progress_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(streak_days DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_points ON user_progress(reward_points_hidden DESC);

-- 2. USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('actividad','intercambio','coleccion','reputacion')),
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_key ON user_achievements(achievement_key);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);

-- 3. USER REWARDS
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'achievement',
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  resolved_as TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_type ON user_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_user_rewards_active ON user_rewards(user_id, consumed_at, expires_at);

-- 4. USER BADGES (visible in profile)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users read own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own rewards" ON user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
-- Public badge reading for profile display
CREATE POLICY "Public badge reading" ON user_badges FOR SELECT USING (true);

-- Service role / admin full access via RPC (no direct insert/update by users)
CREATE POLICY "Service insert progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service update progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service insert achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service update achievements" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service insert rewards" ON user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service insert badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admin full progress" ON user_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin','admin'))
);
CREATE POLICY "Admin full achievements" ON user_achievements FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin','admin'))
);
CREATE POLICY "Admin full rewards" ON user_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin','admin'))
);
CREATE POLICY "Admin full badges" ON user_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin','admin'))
);

-- ============================================
-- RPC: Initialize user gamification on signup
-- ============================================
CREATE OR REPLACE FUNCTION init_user_gamification(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_progress (user_id, level, current_progress, next_level_target)
  VALUES (
    p_user_id,
    'explorador',
    '{"profile_complete":false,"avatar_uploaded":false,"album_active":false,"stickers_loaded":0}'::jsonb,
    '{"profile_complete":true,"avatar_uploaded":true,"album_active":true,"stickers_loaded":10}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Seed all 20 achievements
  INSERT INTO user_achievements (user_id, achievement_key, category, target) VALUES
    (p_user_id, 'first_day_active', 'actividad', 1),
    (p_user_id, 'streak_3', 'actividad', 3),
    (p_user_id, 'streak_7', 'actividad', 7),
    (p_user_id, 'days_active_14', 'actividad', 14),
    (p_user_id, 'days_active_30', 'actividad', 30),
    (p_user_id, 'first_trade', 'intercambio', 1),
    (p_user_id, 'trades_3', 'intercambio', 3),
    (p_user_id, 'trades_10', 'intercambio', 10),
    (p_user_id, 'trades_25', 'intercambio', 25),
    (p_user_id, 'trades_50', 'intercambio', 50),
    (p_user_id, 'first_album', 'coleccion', 1),
    (p_user_id, 'duplicates_50', 'coleccion', 50),
    (p_user_id, 'duplicates_100', 'coleccion', 100),
    (p_user_id, 'page_complete', 'coleccion', 1),
    (p_user_id, 'album_complete', 'coleccion', 1),
    (p_user_id, 'first_favorite', 'reputacion', 1),
    (p_user_id, 'favorites_5', 'reputacion', 5),
    (p_user_id, 'profile_complete', 'reputacion', 1),
    (p_user_id, 'fast_responses_10', 'reputacion', 10),
    (p_user_id, 'clean_trades_10', 'reputacion', 10)
  ON CONFLICT (user_id, achievement_key) DO NOTHING;
END;
$$;

-- ============================================
-- RPC: Record daily activity & streak
-- ============================================
CREATE OR REPLACE FUNCTION record_daily_activity(p_user_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_progress user_progress%ROWTYPE;
  v_today DATE := CURRENT_DATE;
  v_new_streak INT;
  v_new_days INT;
  v_result jsonb := '{}'::jsonb;
BEGIN
  SELECT * INTO v_progress FROM user_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM init_user_gamification(p_user_id);
    SELECT * INTO v_progress FROM user_progress WHERE user_id = p_user_id;
  END IF;

  IF v_progress.last_active_date = v_today THEN
    RETURN jsonb_build_object('already_recorded', true);
  END IF;

  -- Calculate streak
  IF v_progress.last_active_date = v_today - 1 THEN
    v_new_streak := v_progress.streak_days + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  v_new_days := v_progress.days_active + 1;

  UPDATE user_progress SET
    streak_days = v_new_streak,
    longest_streak = GREATEST(v_progress.longest_streak, v_new_streak),
    days_active = v_new_days,
    last_active_date = v_today,
    reward_points_hidden = v_progress.reward_points_hidden + 1,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Update activity achievements
  UPDATE user_achievements SET progress = 1, completed = true, unlocked_at = now()
  WHERE user_id = p_user_id AND achievement_key = 'first_day_active' AND NOT completed;

  UPDATE user_achievements SET progress = LEAST(v_new_streak, target)
  WHERE user_id = p_user_id AND achievement_key IN ('streak_3','streak_7') AND NOT completed;
  UPDATE user_achievements SET completed = true, unlocked_at = now()
  WHERE user_id = p_user_id AND achievement_key IN ('streak_3','streak_7') AND progress >= target AND NOT completed;

  UPDATE user_achievements SET progress = LEAST(v_new_days, target)
  WHERE user_id = p_user_id AND achievement_key IN ('days_active_14','days_active_30') AND NOT completed;
  UPDATE user_achievements SET completed = true, unlocked_at = now()
  WHERE user_id = p_user_id AND achievement_key IN ('days_active_14','days_active_30') AND progress >= target AND NOT completed;

  RETURN jsonb_build_object('streak', v_new_streak, 'days_active', v_new_days);
END;
$$;

-- ============================================
-- RPC: Recalculate user level
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_user_level(p_user_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_progress user_progress%ROWTYPE;
  v_profile RECORD;
  v_new_level TEXT;
  v_leveled_up BOOLEAN := false;
  v_has_reports BOOLEAN;
BEGIN
  SELECT * INTO v_progress FROM user_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','no_progress'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Check reports
  SELECT EXISTS(SELECT 1 FROM reports WHERE reported_id = p_user_id AND status = 'confirmed') INTO v_has_reports;

  v_new_level := v_progress.level;

  -- Explorador -> Coleccionista
  IF v_progress.level = 'explorador' THEN
    IF v_profile.name IS NOT NULL AND v_profile.name != ''
       AND v_profile.avatar_url IS NOT NULL
       AND v_progress.total_albums >= 1
       AND v_progress.total_stickers_loaded >= 10
    THEN
      v_new_level := 'coleccionista';
      v_leveled_up := true;
    END IF;
  END IF;

  -- Coleccionista -> Intercambiador
  IF v_new_level = 'coleccionista' AND v_progress.level IN ('explorador','coleccionista') THEN
    IF v_progress.total_favorites >= 3
       AND v_progress.total_chats >= 3
       AND v_progress.total_trades >= 1
    THEN
      v_new_level := 'intercambiador';
      v_leveled_up := true;
    END IF;
  END IF;

  -- Intercambiador -> Referente
  IF v_new_level = 'intercambiador' AND v_progress.level IN ('explorador','coleccionista','intercambiador') THEN
    IF v_progress.total_trades >= 5
       AND NOT v_has_reports
       AND v_progress.days_active >= 7
    THEN
      v_new_level := 'referente';
      v_leveled_up := true;
    END IF;
  END IF;

  IF v_leveled_up THEN
    UPDATE user_progress SET
      level = v_new_level,
      reward_points_hidden = reward_points_hidden + 25,
      updated_at = now()
    WHERE user_id = p_user_id;

    -- Grant level-up badge
    INSERT INTO user_badges (user_id, badge_key)
    VALUES (p_user_id, 'level_' || v_new_level)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('level', v_new_level, 'leveled_up', v_leveled_up);
END;
$$;

-- ============================================
-- RPC: Grant reward with plan-aware resolution
-- ============================================
CREATE OR REPLACE FUNCTION grant_gamification_reward(
  p_user_id UUID,
  p_reward_type TEXT,
  p_reward_value TEXT,
  p_source TEXT DEFAULT 'achievement',
  p_duration_hours INT DEFAULT 24
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile RECORD;
  v_current_plan TEXT;
  v_resolved_type TEXT;
  v_resolved_value TEXT;
  v_monthly_plus INT;
  v_monthly_pro INT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  v_current_plan := COALESCE(v_profile.plan_name, 'gratis');

  -- Monthly limits check
  SELECT COUNT(*) INTO v_monthly_plus FROM user_rewards
  WHERE user_id = p_user_id AND reward_type = 'plus_days'
    AND granted_at >= date_trunc('month', now());
  SELECT COUNT(*) INTO v_monthly_pro FROM user_rewards
  WHERE user_id = p_user_id AND reward_type = 'pro_days'
    AND granted_at >= date_trunc('month', now());

  v_resolved_type := p_reward_type;
  v_resolved_value := p_reward_value;
  v_expires := now() + (p_duration_hours || ' hours')::interval;

  -- Resolve based on current plan
  IF p_reward_type IN ('plus_days','pro_days') THEN
    IF v_current_plan = 'gratis' THEN
      v_resolved_type := p_reward_type;
    ELSIF v_current_plan = 'plus' THEN
      IF p_reward_type = 'plus_days' THEN
        v_resolved_type := 'extend_plus';
      ELSE
        v_resolved_type := 'upgrade_pro_temp';
      END IF;
    ELSIF v_current_plan = 'pro' THEN
      IF p_reward_type = 'plus_days' THEN
        -- Convert to perk
        v_resolved_type := 'boost_visibility';
        v_resolved_value := '24h';
      ELSE
        v_resolved_type := 'extend_pro';
      END IF;
    END IF;
  END IF;

  -- Check monthly limits
  IF p_reward_type = 'plus_days' AND v_monthly_plus >= 10 THEN
    v_resolved_type := 'extra_favorites';
    v_resolved_value := '24h';
  END IF;
  IF p_reward_type = 'pro_days' AND v_monthly_pro >= 5 THEN
    v_resolved_type := 'boost_visibility';
    v_resolved_value := '24h';
  END IF;

  INSERT INTO user_rewards (user_id, reward_type, reward_value, source, expires_at, resolved_as)
  VALUES (p_user_id, v_resolved_type, v_resolved_value, p_source, v_expires,
    CASE WHEN v_resolved_type != p_reward_type THEN v_resolved_type ELSE NULL END);

  RETURN jsonb_build_object(
    'reward_type', v_resolved_type,
    'reward_value', v_resolved_value,
    'original_type', p_reward_type,
    'resolved', v_resolved_type != p_reward_type
  );
END;
$$;

-- ============================================
-- RPC: Get user gamification profile
-- ============================================
CREATE OR REPLACE FUNCTION get_user_gamification(p_user_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_progress user_progress%ROWTYPE;
  v_achievements jsonb;
  v_badges jsonb;
  v_rewards jsonb;
  v_level_progress jsonb;
BEGIN
  SELECT * INTO v_progress FROM user_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM init_user_gamification(p_user_id);
    SELECT * INTO v_progress FROM user_progress WHERE user_id = p_user_id;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'key', achievement_key, 'category', category,
    'progress', progress, 'target', target,
    'completed', completed, 'unlocked_at', unlocked_at
  )) INTO v_achievements FROM user_achievements WHERE user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object('key', badge_key, 'earned_at', earned_at))
  INTO v_badges FROM user_badges WHERE user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'type', reward_type, 'value', reward_value,
    'source', source, 'granted_at', granted_at,
    'expires_at', expires_at, 'consumed_at', consumed_at, 'resolved_as', resolved_as
  )) INTO v_rewards FROM user_rewards
  WHERE user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())
  ORDER BY granted_at DESC LIMIT 20;

  -- Calculate level progress percentage
  v_level_progress := jsonb_build_object(
    'level', v_progress.level,
    'streak_days', v_progress.streak_days,
    'longest_streak', v_progress.longest_streak,
    'days_active', v_progress.days_active,
    'total_trades', v_progress.total_trades,
    'total_albums', v_progress.total_albums,
    'total_stickers_loaded', v_progress.total_stickers_loaded,
    'total_duplicates_loaded', v_progress.total_duplicates_loaded,
    'total_favorites', v_progress.total_favorites,
    'total_chats', v_progress.total_chats
  );

  RETURN jsonb_build_object(
    'progress', v_level_progress,
    'achievements', COALESCE(v_achievements, '[]'::jsonb),
    'badges', COALESCE(v_badges, '[]'::jsonb),
    'rewards', COALESCE(v_rewards, '[]'::jsonb)
  );
END;
$$;

-- ============================================
-- RPC: Admin view gamification stats
-- ============================================
CREATE OR REPLACE FUNCTION admin_get_gamification_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin','admin')) THEN
    RETURN jsonb_build_object('error', 'access_denied');
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM user_progress),
    'by_level', (SELECT jsonb_object_agg(level, cnt) FROM (SELECT level, count(*) cnt FROM user_progress GROUP BY level) t),
    'total_achievements_completed', (SELECT count(*) FROM user_achievements WHERE completed = true),
    'total_rewards_granted', (SELECT count(*) FROM user_rewards),
    'active_rewards', (SELECT count(*) FROM user_rewards WHERE consumed_at IS NULL AND (expires_at IS NULL OR expires_at > now())),
    'avg_streak', (SELECT ROUND(AVG(streak_days),1) FROM user_progress),
    'top_streaks', (
      SELECT jsonb_agg(jsonb_build_object('user_id', up.user_id, 'name', p.name, 'streak', up.streak_days))
      FROM (SELECT user_id, streak_days FROM user_progress ORDER BY streak_days DESC LIMIT 10) up
      JOIN profiles p ON p.id = up.user_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================
-- RPC: Admin list user gamification details
-- ============================================
CREATE OR REPLACE FUNCTION admin_list_gamification_users(
  p_level TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('god_admin','admin')) THEN
    RETURN jsonb_build_object('error', 'access_denied');
  END IF;

  RETURN (
    SELECT jsonb_agg(row_to_json(t)) FROM (
      SELECT up.*, p.name, p.email, p.avatar_url, p.plan_name,
        (SELECT count(*) FROM user_achievements WHERE user_id = up.user_id AND completed) as achievements_done,
        (SELECT count(*) FROM user_rewards WHERE user_id = up.user_id) as rewards_total
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      WHERE (p_level IS NULL OR up.level = p_level)
      ORDER BY up.reward_points_hidden DESC
      LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$;
