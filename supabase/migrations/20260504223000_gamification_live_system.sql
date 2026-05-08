ALTER TABLE public.user_achievements
DROP CONSTRAINT IF EXISTS user_achievements_category_check;

ALTER TABLE public.user_achievements
ADD CONSTRAINT user_achievements_category_check
CHECK (category IN ('progreso', 'reputacion', 'coleccion', 'comunidad', 'growth', 'partner'));

CREATE OR REPLACE FUNCTION public.init_user_gamification(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, level, current_progress, next_level_target)
  VALUES (
    p_user_id,
    'explorador',
    '{"profile_complete":false,"album_active":false,"stickers_loaded":0}'::jsonb,
    '{"profile_complete":true,"album_active":true,"stickers_loaded":15,"first_exchange":true}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_achievements (user_id, achievement_key, category, target) VALUES
    (p_user_id, 'first_trade', 'progreso', 1),
    (p_user_id, 'exchange_confirmed', 'progreso', 1),
    (p_user_id, 'exchange_streak_3', 'progreso', 3),
    (p_user_id, 'since_day_one', 'progreso', 1),
    (p_user_id, 'clean_trades_10', 'reputacion', 10),
    (p_user_id, 'first_rating', 'reputacion', 1),
    (p_user_id, 'curator', 'reputacion', 5),
    (p_user_id, 'confirm_exchange_action', 'reputacion', 3),
    (p_user_id, 'first_album', 'coleccion', 1),
    (p_user_id, 'archivist', 'coleccion', 3),
    (p_user_id, 'page_complete', 'coleccion', 1),
    (p_user_id, 'album_complete', 'coleccion', 1),
    (p_user_id, 'share_album', 'comunidad', 1),
    (p_user_id, 'share_missing', 'comunidad', 1),
    (p_user_id, 'share_duplicates', 'comunidad', 1),
    (p_user_id, 'community_helper', 'comunidad', 5),
    (p_user_id, 'invite_friend', 'growth', 1),
    (p_user_id, 'friend_active', 'growth', 1),
    (p_user_id, 'activated_network', 'growth', 3),
    (p_user_id, 'point_suggester', 'growth', 1),
    (p_user_id, 'partner_store_used', 'partner', 1),
    (p_user_id, 'partner_verified', 'partner', 1),
    (p_user_id, 'approved_album_upload', 'partner', 1),
    (p_user_id, 'verified_album_complete', 'partner', 1)
  ON CONFLICT (user_id, achievement_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_daily_activity(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress public.user_progress%ROWTYPE;
  v_today date := current_date;
  v_new_streak integer;
  v_new_days integer;
BEGIN
  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM public.init_user_gamification(p_user_id);
    SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;
  END IF;

  IF v_progress.last_active_date = v_today THEN
    RETURN jsonb_build_object('already_recorded', true);
  END IF;

  IF v_progress.last_active_date = v_today - 1 THEN
    v_new_streak := v_progress.streak_days + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_new_days := v_progress.days_active + 1;

  UPDATE public.user_progress
  SET streak_days = v_new_streak,
      longest_streak = GREATEST(v_progress.longest_streak, v_new_streak),
      days_active = v_new_days,
      last_active_date = v_today,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('streak', v_new_streak, 'days_active', v_new_days);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_user_level(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress public.user_progress%ROWTYPE;
  v_profile record;
  v_new_level text;
  v_leveled_up boolean := false;
BEGIN
  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'no_progress');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  v_new_level := v_progress.level;

  IF v_progress.level = 'explorador' THEN
    IF v_profile.name IS NOT NULL
       AND v_profile.name <> ''
       AND v_profile.avatar_url IS NOT NULL
       AND v_progress.total_albums >= 1
       AND v_progress.total_stickers_loaded >= 15 THEN
      v_new_level := 'coleccionista';
      v_leveled_up := true;
    END IF;
  END IF;

  IF v_new_level = 'coleccionista' AND v_progress.level IN ('explorador', 'coleccionista') THEN
    IF COALESCE(v_progress.completed_exchanges, v_progress.total_trades, 0) >= 1
       AND v_progress.total_duplicates_loaded >= 20
       AND v_progress.total_chats >= 3 THEN
      v_new_level := 'intercambiador';
      v_leveled_up := true;
    END IF;
  END IF;

  IF v_new_level = 'intercambiador' AND v_progress.level IN ('explorador', 'coleccionista', 'intercambiador') THEN
    IF COALESCE(v_progress.completed_exchanges, v_progress.total_trades, 0) >= 5
       AND COALESCE(v_progress.reliability_score, 0) >= 70
       AND COALESCE(v_progress.completion_rate, 0) >= 70 THEN
      v_new_level := 'referente';
      v_leveled_up := true;
    END IF;
  END IF;

  IF v_leveled_up THEN
    UPDATE public.user_progress
    SET level = v_new_level,
        reward_points_hidden = reward_points_hidden + 25,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.user_badges (user_id, badge_key)
    VALUES (p_user_id, 'level_' || v_new_level)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('level', v_new_level, 'leveled_up', v_leveled_up);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_gamification_community_signals(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress public.user_progress%ROWTYPE;
  v_album_count integer := 0;
  v_completed_albums integer := 0;
  v_verified_albums integer := 0;
  v_share_album integer := 0;
  v_share_missing integer := 0;
  v_share_duplicates integer := 0;
  v_share_match integer := 0;
  v_share_album_complete integer := 0;
  v_share_partner_verified integer := 0;
  v_total_share_actions integer := 0;
  v_invites integer := 0;
  v_active_referrals integer := 0;
  v_location_approved integer := 0;
  v_partner_uses integer := 0;
  v_completed_exchanges integer := 0;
  v_clean_completed integer := 0;
BEGIN
  PERFORM public.init_user_gamification(p_user_id);

  SELECT * INTO v_progress
  FROM public.user_progress
  WHERE user_id = p_user_id;

  SELECT COUNT(*)::integer
  INTO v_album_count
  FROM public.user_albums
  WHERE user_id = p_user_id;

  SELECT COUNT(*)::integer
  INTO v_completed_albums
  FROM public.user_albums
  WHERE user_id = p_user_id
    AND progress_state IN ('completed', 'legend_verified');

  SELECT COUNT(*)::integer
  INTO v_verified_albums
  FROM public.user_albums
  WHERE user_id = p_user_id
    AND progress_state = 'legend_verified';

  SELECT COUNT(*) FILTER (WHERE platform = 'album')::integer,
         COUNT(*) FILTER (WHERE platform = 'missing')::integer,
         COUNT(*) FILTER (WHERE platform = 'duplicates')::integer,
         COUNT(*) FILTER (WHERE platform = 'match')::integer,
         COUNT(*) FILTER (WHERE platform = 'album_complete')::integer,
         COUNT(*) FILTER (WHERE platform = 'partner_verified')::integer
  INTO v_share_album, v_share_missing, v_share_duplicates, v_share_match, v_share_album_complete, v_share_partner_verified
  FROM public.share_events
  WHERE user_id = p_user_id;

  v_total_share_actions := COALESCE(v_share_album, 0)
    + COALESCE(v_share_missing, 0)
    + COALESCE(v_share_duplicates, 0)
    + COALESCE(v_share_match, 0)
    + COALESCE(v_share_album_complete, 0)
    + COALESCE(v_share_partner_verified, 0);

  SELECT COUNT(*)::integer,
         COUNT(*) FILTER (WHERE status IN ('activated', 'completed_trade'))::integer
  INTO v_invites, v_active_referrals
  FROM public.referral_events
  WHERE referrer_id = p_user_id;

  SELECT COUNT(*)::integer
  INTO v_location_approved
  FROM public.location_requests
  WHERE user_id = p_user_id
    AND status = 'approved';

  SELECT COUNT(*)::integer
  INTO v_partner_uses
  FROM public.legend_album_validations
  WHERE user_id = p_user_id;

  v_completed_exchanges := COALESCE(v_progress.completed_exchanges, v_progress.total_trades, 0);
  v_clean_completed := CASE
    WHEN COALESCE(v_progress.reliability_score, 0) >= 70 THEN v_completed_exchanges
    ELSE GREATEST(v_completed_exchanges - 1, 0)
  END;

  UPDATE public.user_achievements
  SET progress = LEAST(v_completed_exchanges, target),
      completed = v_completed_exchanges >= target,
      unlocked_at = CASE WHEN v_completed_exchanges >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key IN ('first_trade', 'exchange_confirmed', 'exchange_streak_3');

  UPDATE public.user_achievements
  SET progress = LEAST(v_clean_completed, target),
      completed = v_clean_completed >= target,
      unlocked_at = CASE WHEN v_clean_completed >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'clean_trades_10';

  UPDATE public.user_achievements
  SET progress = LEAST(v_album_count, target),
      completed = v_album_count >= target,
      unlocked_at = CASE WHEN v_album_count >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key IN ('first_album', 'archivist', 'approved_album_upload');

  UPDATE public.user_achievements
  SET progress = LEAST(v_completed_albums, target),
      completed = v_completed_albums >= target,
      unlocked_at = CASE WHEN v_completed_albums >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'album_complete';

  UPDATE public.user_achievements
  SET progress = LEAST(v_share_album, target),
      completed = v_share_album >= target,
      unlocked_at = CASE WHEN v_share_album >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'share_album';

  UPDATE public.user_achievements
  SET progress = LEAST(v_share_missing, target),
      completed = v_share_missing >= target,
      unlocked_at = CASE WHEN v_share_missing >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'share_missing';

  UPDATE public.user_achievements
  SET progress = LEAST(v_share_duplicates, target),
      completed = v_share_duplicates >= target,
      unlocked_at = CASE WHEN v_share_duplicates >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'share_duplicates';

  UPDATE public.user_achievements
  SET progress = LEAST(v_total_share_actions, target),
      completed = v_total_share_actions >= target,
      unlocked_at = CASE WHEN v_total_share_actions >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'community_helper';

  UPDATE public.user_achievements
  SET progress = LEAST(v_invites, target),
      completed = v_invites >= target,
      unlocked_at = CASE WHEN v_invites >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'invite_friend';

  UPDATE public.user_achievements
  SET progress = LEAST(v_active_referrals, target),
      completed = v_active_referrals >= target,
      unlocked_at = CASE WHEN v_active_referrals >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key IN ('friend_active', 'activated_network');

  UPDATE public.user_achievements
  SET progress = LEAST(v_location_approved, target),
      completed = v_location_approved >= target,
      unlocked_at = CASE WHEN v_location_approved >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'point_suggester';

  UPDATE public.user_achievements
  SET progress = LEAST(v_partner_uses, target),
      completed = v_partner_uses >= target,
      unlocked_at = CASE WHEN v_partner_uses >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key = 'partner_store_used';

  UPDATE public.user_achievements
  SET progress = LEAST(v_verified_albums, target),
      completed = v_verified_albums >= target,
      unlocked_at = CASE WHEN v_verified_albums >= target AND unlocked_at IS NULL THEN now() ELSE unlocked_at END
  WHERE user_id = p_user_id
    AND achievement_key IN ('partner_verified', 'verified_album_complete');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_gamification(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress public.user_progress%ROWTYPE;
  v_achievements jsonb;
  v_badges jsonb;
  v_rewards jsonb;
  v_ranking record;
BEGIN
  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM public.init_user_gamification(p_user_id);
    SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;
  END IF;

  PERFORM public.sync_gamification_community_signals(p_user_id);

  SELECT * INTO v_progress FROM public.user_progress WHERE user_id = p_user_id;

  SELECT * INTO v_ranking
  FROM public.user_rankings
  WHERE user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object(
    'key', achievement_key,
    'category', category,
    'progress', progress,
    'target', target,
    'completed', completed,
    'unlocked_at', unlocked_at
  ))
  INTO v_achievements
  FROM public.user_achievements
  WHERE user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object('key', badge_key, 'earned_at', earned_at))
  INTO v_badges
  FROM public.user_badges
  WHERE user_id = p_user_id;

  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'type', reward_type,
    'value', reward_value,
    'source', source,
    'granted_at', granted_at,
    'expires_at', expires_at,
    'consumed_at', consumed_at,
    'resolved_as', resolved_as
  ))
  INTO v_rewards
  FROM (
    SELECT *
    FROM public.user_rewards
    WHERE user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY granted_at DESC
    LIMIT 20
  ) reward_rows;

  RETURN jsonb_build_object(
    'progress', jsonb_build_object(
      'level', v_progress.level,
      'streak_days', v_progress.streak_days,
      'longest_streak', v_progress.longest_streak,
      'days_active', v_progress.days_active,
      'total_trades', v_progress.total_trades,
      'completed_exchanges', v_progress.completed_exchanges,
      'completion_attempts', v_progress.completion_attempts,
      'completion_rate', v_progress.completion_rate,
      'reliability_score', v_progress.reliability_score,
      'disputed_exchanges', v_progress.disputed_exchanges,
      'expired_exchanges', v_progress.expired_exchanges,
      'total_albums', v_progress.total_albums,
      'total_stickers_loaded', v_progress.total_stickers_loaded,
      'total_duplicates_loaded', v_progress.total_duplicates_loaded,
      'total_favorites', v_progress.total_favorites,
      'total_chats', v_progress.total_chats
    ),
    'achievements', COALESCE(v_achievements, '[]'::jsonb),
    'badges', COALESCE(v_badges, '[]'::jsonb),
    'rewards', COALESCE(v_rewards, '[]'::jsonb),
    'reputation', jsonb_build_object(
      'rank_score', COALESCE(v_ranking.final_user_rank, 0),
      'star_rating', public.get_user_star_rating_from_rank(COALESCE(v_ranking.final_user_rank, 0)),
      'reputation_modifier', CASE
        WHEN COALESCE(v_ranking.final_user_rank, 0) >= 85 THEN 1.2
        WHEN COALESCE(v_ranking.final_user_rank, 0) >= 70 THEN 1.1
        WHEN COALESCE(v_ranking.final_user_rank, 0) >= 55 THEN 1.0
        WHEN COALESCE(v_ranking.final_user_rank, 0) >= 35 THEN 0.8
        ELSE 0.6
      END,
      'response_score', COALESCE(v_ranking.activity_score, 0),
      'trust_score', COALESCE(v_ranking.trust_score, 0),
      'completion_rate', COALESCE(v_progress.completion_rate, 0),
      'reliability_score', COALESCE(v_progress.reliability_score, 0)
    )
  );
END;
$$;
