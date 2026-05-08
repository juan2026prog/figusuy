ALTER TABLE public.exchange_completions
ADD COLUMN IF NOT EXISTS user_1_responded_at timestamptz,
ADD COLUMN IF NOT EXISTS user_2_responded_at timestamptz,
ADD COLUMN IF NOT EXISTS prompt_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS prompt_reason text,
ADD COLUMN IF NOT EXISTS trigger_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS trigger_snapshot jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS outcome_recorded_at timestamptz,
ADD COLUMN IF NOT EXISTS is_suspicious boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspicion_reasons text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS admin_review_status text DEFAULT 'open';

ALTER TABLE public.exchange_completions
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN trigger_snapshot SET DEFAULT '{}'::jsonb,
ALTER COLUMN is_suspicious SET DEFAULT false,
ALTER COLUMN suspicion_reasons SET DEFAULT '{}'::text[],
ALTER COLUMN admin_review_status SET DEFAULT 'open';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exchange_completions_admin_review_status_check'
  ) THEN
    ALTER TABLE public.exchange_completions
    ADD CONSTRAINT exchange_completions_admin_review_status_check
    CHECK (admin_review_status IN ('open', 'reviewing', 'resolved', 'dismissed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exchange_completions_expires_at ON public.exchange_completions(expires_at);
CREATE INDEX IF NOT EXISTS idx_exchange_completions_suspicious ON public.exchange_completions(is_suspicious, status);
CREATE INDEX IF NOT EXISTS idx_exchange_completions_review_status ON public.exchange_completions(admin_review_status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exchange_completions'
      AND policyname = 'Admin full access to exchange completions'
  ) THEN
    DROP POLICY "Admin full access to exchange completions" ON public.exchange_completions;
  END IF;
END $$;

CREATE POLICY "Admin full access to exchange completions"
ON public.exchange_completions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('god_admin', 'admin', 'moderator', 'support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('god_admin', 'admin', 'moderator', 'support')
  )
);

ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS completed_exchanges integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_attempts integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_yes_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_no_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS disputed_exchanges integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS expired_exchanges integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reliability_score numeric NOT NULL DEFAULT 50;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS completed_exchanges integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmed_exchanges integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reliability_score numeric NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS disputed_exchanges integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_user_star_rating_from_rank(p_rank numeric)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF COALESCE(p_rank, 0) >= 85 THEN
    RETURN 5;
  ELSIF COALESCE(p_rank, 0) >= 70 THEN
    RETURN 4;
  ELSIF COALESCE(p_rank, 0) >= 55 THEN
    RETURN 3;
  ELSIF COALESCE(p_rank, 0) >= 35 THEN
    RETURN 2;
  END IF;

  RETURN 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(
    (
      6371 * acos(
        LEAST(
          1,
          GREATEST(
            -1,
            cos(radians(lat1::double precision)) * cos(radians(lat2::double precision)) * cos(radians(lng2::double precision) - radians(lng1::double precision))
            + sin(radians(lat1::double precision)) * sin(radians(lat2::double precision))
          )
        )
      )
    )::numeric,
    2
  );
$$;

CREATE OR REPLACE FUNCTION public.get_exchange_trigger_signals(p_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat record;
  v_total_messages integer := 0;
  v_unique_senders integer := 0;
  v_first_message_at timestamptz;
  v_last_message_at timestamptz;
  v_age_hours numeric := 0;
  v_distance_km numeric := NULL;
  v_intent_hits integer := 0;
  v_score numeric := 0;
  v_should_prompt boolean := false;
  v_reason text := 'insufficient_signals';
  v_keywords text[] := ARRAY[
    'canje', 'cambio', 'intercambio', 'nos vemos', 'veamonos',
    'coord', 'horario', 'hora', 'punto', 'encuentro', 'paso', 'voy', 'dale'
  ];
BEGIN
  SELECT c.*, p1.city AS user_1_city, p1.department AS user_1_department, p1.lat AS user_1_lat, p1.lng AS user_1_lng,
         p2.city AS user_2_city, p2.department AS user_2_department, p2.lat AS user_2_lat, p2.lng AS user_2_lng
  INTO v_chat
  FROM public.chats c
  LEFT JOIN public.profiles p1 ON p1.id = c.user_1
  LEFT JOIN public.profiles p2 ON p2.id = c.user_2
  WHERE c.id = p_chat_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('should_prompt', false, 'score', 0, 'reason', 'chat_not_found');
  END IF;

  SELECT
    COUNT(*)::integer,
    COUNT(DISTINCT sender_id)::integer,
    MIN(created_at),
    MAX(created_at)
  INTO
    v_total_messages,
    v_unique_senders,
    v_first_message_at,
    v_last_message_at
  FROM public.messages
  WHERE chat_id = p_chat_id;

  IF v_first_message_at IS NOT NULL THEN
    v_age_hours := EXTRACT(EPOCH FROM (now() - v_first_message_at)) / 3600.0;
  END IF;

  IF v_chat.user_1_lat IS NOT NULL
     AND v_chat.user_1_lng IS NOT NULL
     AND v_chat.user_2_lat IS NOT NULL
     AND v_chat.user_2_lng IS NOT NULL THEN
    v_distance_km := public.calculate_distance(v_chat.user_1_lat, v_chat.user_1_lng, v_chat.user_2_lat, v_chat.user_2_lng);
  END IF;

  SELECT COUNT(*)::integer
  INTO v_intent_hits
  FROM public.messages
  WHERE chat_id = p_chat_id
    AND EXISTS (
      SELECT 1
      FROM unnest(v_keywords) AS keyword
      WHERE lower(text) LIKE '%' || keyword || '%'
    );

  IF v_total_messages >= 4 THEN
    v_score := v_score + 25;
  ELSIF v_total_messages >= 2 THEN
    v_score := v_score + 12;
  END IF;

  IF v_unique_senders >= 2 THEN
    v_score := v_score + 20;
  END IF;

  IF v_age_hours >= 2 THEN
    v_score := v_score + 15;
  END IF;

  IF v_last_message_at IS NOT NULL AND v_last_message_at >= now() - interval '7 days' THEN
    v_score := v_score + 10;
  END IF;

  IF v_intent_hits > 0 THEN
    v_score := v_score + LEAST(v_intent_hits * 10, 20);
  END IF;

  IF v_distance_km IS NOT NULL AND v_distance_km <= 25 THEN
    v_score := v_score + 10;
  ELSIF v_chat.user_1_city IS NOT NULL AND v_chat.user_1_city = v_chat.user_2_city THEN
    v_score := v_score + 8;
  ELSIF v_chat.user_1_department IS NOT NULL AND v_chat.user_1_department = v_chat.user_2_department THEN
    v_score := v_score + 5;
  END IF;

  v_should_prompt := v_score >= 55 AND v_unique_senders >= 2 AND v_total_messages >= 2;

  IF v_should_prompt THEN
    IF v_intent_hits > 0 THEN
      v_reason := 'coordination_detected';
    ELSIF v_distance_km IS NOT NULL AND v_distance_km <= 25 THEN
      v_reason := 'close_and_active_chat';
    ELSE
      v_reason := 'active_chat_window';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'should_prompt', v_should_prompt,
    'score', v_score,
    'reason', v_reason,
    'message_count', v_total_messages,
    'unique_senders', v_unique_senders,
    'intent_hits', v_intent_hits,
    'first_message_at', v_first_message_at,
    'last_message_at', v_last_message_at,
    'distance_km', v_distance_km
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_user_exchange_metrics(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed integer := 0;
  v_not_completed integer := 0;
  v_disputed integer := 0;
  v_expired integer := 0;
  v_attempts integer := 0;
  v_completion_rate numeric := 0;
  v_reliability numeric := 50;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed')::integer,
    COUNT(*) FILTER (WHERE status = 'not_completed')::integer,
    COUNT(*) FILTER (WHERE status = 'disputed')::integer,
    COUNT(*) FILTER (WHERE status = 'expired')::integer,
    COUNT(*) FILTER (WHERE status IN ('completed', 'not_completed', 'disputed', 'expired'))::integer
  INTO
    v_completed,
    v_not_completed,
    v_disputed,
    v_expired,
    v_attempts
  FROM public.exchange_completions
  WHERE user_1_id = p_user_id OR user_2_id = p_user_id;

  IF v_attempts > 0 THEN
    v_completion_rate := ROUND((v_completed::numeric / v_attempts::numeric) * 100, 2);
  END IF;

  v_reliability := LEAST(
    100,
    GREATEST(
      0,
      ROUND(
        (v_completion_rate * 0.75)
        + (LEAST(v_completed, 20) * 1.25)
        - (v_disputed * 8)
        - (v_not_completed * 4)
        - (v_expired * 3),
        2
      )
    )
  );

  INSERT INTO public.user_progress (
    user_id,
    completed_exchanges,
    total_trades,
    completion_attempts,
    completion_yes_count,
    completion_no_count,
    disputed_exchanges,
    expired_exchanges,
    completion_rate,
    reliability_score
  )
  VALUES (
    p_user_id,
    v_completed,
    v_completed,
    v_attempts,
    v_completed,
    v_not_completed,
    v_disputed,
    v_expired,
    v_completion_rate,
    v_reliability
  )
  ON CONFLICT (user_id) DO UPDATE SET
    completed_exchanges = EXCLUDED.completed_exchanges,
    total_trades = EXCLUDED.total_trades,
    completion_attempts = EXCLUDED.completion_attempts,
    completion_yes_count = EXCLUDED.completion_yes_count,
    completion_no_count = EXCLUDED.completion_no_count,
    disputed_exchanges = EXCLUDED.disputed_exchanges,
    expired_exchanges = EXCLUDED.expired_exchanges,
    completion_rate = EXCLUDED.completion_rate,
    reliability_score = EXCLUDED.reliability_score,
    updated_at = now();

  UPDATE public.profiles
  SET
    completed_exchanges = v_completed,
    confirmed_exchanges = v_completed,
    disputed_exchanges = v_disputed,
    completion_rate = v_completion_rate,
    reliability_score = v_reliability
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_exchange_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed integer := 0;
  v_clean_completed integer := 0;
  v_reliability numeric := 0;
BEGIN
  PERFORM public.init_user_gamification(p_user_id);

  SELECT completed_exchanges, reliability_score
  INTO v_completed, v_reliability
  FROM public.user_progress
  WHERE user_id = p_user_id;

  v_clean_completed := CASE
    WHEN COALESCE(v_reliability, 0) >= 70 THEN COALESCE(v_completed, 0)
    ELSE GREATEST(COALESCE(v_completed, 0) - 1, 0)
  END;

  UPDATE public.user_achievements
  SET
    progress = LEAST(v_completed, target),
    completed = v_completed >= target,
    unlocked_at = CASE
      WHEN v_completed >= target AND unlocked_at IS NULL THEN now()
      ELSE unlocked_at
    END
  WHERE user_id = p_user_id
    AND achievement_key IN ('first_trade', 'trades_3', 'trades_10', 'trades_25', 'trades_50');

  UPDATE public.user_achievements
  SET
    progress = LEAST(v_clean_completed, target),
    completed = v_clean_completed >= target,
    unlocked_at = CASE
      WHEN v_clean_completed >= target AND unlocked_at IS NULL THEN now()
      ELSE unlocked_at
    END
  WHERE user_id = p_user_id
    AND achievement_key = 'clean_trades_10';

  IF COALESCE(v_completed, 0) > 0 THEN
    INSERT INTO public.user_badges (user_id, badge_key)
    VALUES (p_user_id, 'buen_cruce')
    ON CONFLICT (user_id, badge_key) DO NOTHING;
  END IF;

  IF COALESCE(v_reliability, 0) >= 75 THEN
    INSERT INTO public.user_badges (user_id, badge_key)
    VALUES (p_user_id, 'confiable')
    ON CONFLICT (user_id, badge_key) DO NOTHING;
  END IF;

  PERFORM public.recalculate_user_level(p_user_id);
  PERFORM public.calculate_user_ranking(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_exchange_completion_outcome(p_exchange_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange public.exchange_completions%ROWTYPE;
  v_reward_points integer := 0;
BEGIN
  SELECT * INTO v_exchange
  FROM public.exchange_completions
  WHERE id = p_exchange_id;

  IF NOT FOUND OR v_exchange.outcome_recorded_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_exchange.status = 'completed' THEN
    v_reward_points := 20;
  ELSIF v_exchange.status = 'pending_confirmation' THEN
    RETURN;
  ELSE
    v_reward_points := 4;
  END IF;

  UPDATE public.exchange_completions
  SET outcome_recorded_at = now()
  WHERE id = p_exchange_id
    AND outcome_recorded_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM public.init_user_gamification(v_exchange.user_1_id);
  PERFORM public.init_user_gamification(v_exchange.user_2_id);

  UPDATE public.user_progress
  SET reward_points_hidden = reward_points_hidden + v_reward_points,
      updated_at = now()
  WHERE user_id IN (v_exchange.user_1_id, v_exchange.user_2_id);

  PERFORM public.recompute_user_exchange_metrics(v_exchange.user_1_id);
  PERFORM public.recompute_user_exchange_metrics(v_exchange.user_2_id);
  PERFORM public.sync_exchange_achievements(v_exchange.user_1_id);
  PERFORM public.sync_exchange_achievements(v_exchange.user_2_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_exchange_response(
  p_chat_id uuid,
  p_user_id uuid,
  p_response exchange_response
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange public.exchange_completions%ROWTYPE;
  v_chat record;
  v_trigger jsonb;
  v_other_response exchange_response;
  v_new_status exchange_status := 'pending';
  v_suspicion_reasons text[] := '{}'::text[];
  v_message_count integer := 0;
  v_distance_km numeric := NULL;
BEGIN
  SELECT * INTO v_chat
  FROM public.chats
  WHERE id = p_chat_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'chat_not_found';
  END IF;

  IF p_user_id NOT IN (v_chat.user_1, v_chat.user_2) THEN
    RAISE EXCEPTION 'user_not_in_chat';
  END IF;

  v_trigger := public.get_exchange_trigger_signals(p_chat_id);

  SELECT * INTO v_exchange
  FROM public.exchange_completions
  WHERE chat_id = p_chat_id;

  IF v_exchange IS NULL THEN
    INSERT INTO public.exchange_completions (
      chat_id,
      user_1_id,
      user_2_id,
      album_id,
      status,
      prompt_sent_at,
      expires_at,
      prompt_reason,
      trigger_score,
      trigger_snapshot
    )
    VALUES (
      p_chat_id,
      v_chat.user_1,
      v_chat.user_2,
      v_chat.album_id,
      CASE WHEN COALESCE((v_trigger->>'should_prompt')::boolean, false) THEN 'pending_confirmation' ELSE 'pending' END,
      now(),
      now() + interval '72 hours',
      COALESCE(v_trigger->>'reason', 'manual'),
      COALESCE((v_trigger->>'score')::numeric, 0),
      COALESCE(v_trigger, '{}'::jsonb)
    )
    RETURNING * INTO v_exchange;
  END IF;

  IF v_exchange.status IN ('completed', 'not_completed', 'disputed', 'expired')
     AND v_exchange.outcome_recorded_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_exchange.user_1_id = p_user_id THEN
    UPDATE public.exchange_completions
    SET
      user_1_response = p_response,
      user_1_responded_at = now(),
      updated_at = now(),
      prompt_sent_at = COALESCE(prompt_sent_at, now()),
      expires_at = COALESCE(expires_at, now() + interval '72 hours'),
      prompt_reason = COALESCE(prompt_reason, v_trigger->>'reason'),
      trigger_score = GREATEST(COALESCE(trigger_score, 0), COALESCE((v_trigger->>'score')::numeric, 0)),
      trigger_snapshot = COALESCE(v_trigger, trigger_snapshot)
    WHERE id = v_exchange.id;
    v_other_response := v_exchange.user_2_response;
  ELSE
    UPDATE public.exchange_completions
    SET
      user_2_response = p_response,
      user_2_responded_at = now(),
      updated_at = now(),
      prompt_sent_at = COALESCE(prompt_sent_at, now()),
      expires_at = COALESCE(expires_at, now() + interval '72 hours'),
      prompt_reason = COALESCE(prompt_reason, v_trigger->>'reason'),
      trigger_score = GREATEST(COALESCE(trigger_score, 0), COALESCE((v_trigger->>'score')::numeric, 0)),
      trigger_snapshot = COALESCE(v_trigger, trigger_snapshot)
    WHERE id = v_exchange.id;
    v_other_response := v_exchange.user_1_response;
  END IF;

  IF p_response = 'not_yet' THEN
    v_new_status := 'pending';
  ELSIF p_response = 'yes' AND v_other_response = 'yes' THEN
    v_new_status := 'completed';
  ELSIF p_response = 'no' AND v_other_response = 'no' THEN
    v_new_status := 'not_completed';
  ELSIF p_response = 'yes' AND v_other_response = 'no' THEN
    v_new_status := 'disputed';
  ELSIF p_response = 'no' AND v_other_response = 'yes' THEN
    v_new_status := 'disputed';
  ELSIF p_response IN ('yes', 'no') AND v_other_response IS NULL THEN
    v_new_status := 'pending_confirmation';
  ELSE
    v_new_status := 'pending';
  END IF;

  v_message_count := COALESCE((v_trigger->>'message_count')::integer, 0);
  v_distance_km := NULLIF(v_trigger->>'distance_km', '')::numeric;

  IF v_new_status = 'completed' THEN
    IF v_message_count < 2 THEN
      v_suspicion_reasons := array_append(v_suspicion_reasons, 'low_message_volume');
    END IF;
    IF v_distance_km IS NOT NULL AND v_distance_km > 80 THEN
      v_suspicion_reasons := array_append(v_suspicion_reasons, 'long_distance_confirmation');
    END IF;
  END IF;

  UPDATE public.exchange_completions
  SET
    status = v_new_status,
    completion_time = CASE WHEN v_new_status IN ('completed', 'not_completed', 'disputed', 'expired') THEN now() ELSE NULL END,
    is_suspicious = COALESCE(array_length(v_suspicion_reasons, 1), 0) > 0,
    suspicion_reasons = CASE
      WHEN COALESCE(array_length(v_suspicion_reasons, 1), 0) > 0 THEN v_suspicion_reasons
      ELSE suspicion_reasons
    END,
    updated_at = now()
  WHERE id = v_exchange.id;

  IF v_new_status IN ('completed', 'not_completed', 'disputed', 'expired') THEN
    PERFORM public.apply_exchange_completion_outcome(v_exchange.id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_pending_exchange_confirmations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT id
    FROM public.exchange_completions
    WHERE status IN ('pending', 'pending_confirmation')
      AND expires_at IS NOT NULL
      AND expires_at < now()
  LOOP
    UPDATE public.exchange_completions
    SET status = 'expired',
        completion_time = now(),
        updated_at = now()
    WHERE id = v_row.id;

    PERFORM public.apply_exchange_completion_outcome(v_row.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_exchange_completion_state(p_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange public.exchange_completions%ROWTYPE;
  v_trigger jsonb;
BEGIN
  PERFORM public.expire_pending_exchange_confirmations();

  SELECT * INTO v_exchange
  FROM public.exchange_completions
  WHERE chat_id = p_chat_id;

  v_trigger := public.get_exchange_trigger_signals(p_chat_id);

  IF v_exchange IS NULL THEN
    RETURN jsonb_build_object(
      'completion', NULL,
      'trigger', v_trigger
    );
  END IF;

  RETURN jsonb_build_object(
    'completion', row_to_json(v_exchange),
    'trigger', v_trigger
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_stars(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rank numeric := 0;
BEGIN
  SELECT final_user_rank INTO v_rank
  FROM public.user_rankings
  WHERE user_id = p_user_id;

  RETURN public.get_user_star_rating_from_rank(v_rank);
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

CREATE OR REPLACE FUNCTION public.calculate_user_ranking(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p record;
  cfg jsonb;
  w_relevance numeric;
  w_trust numeric;
  w_activity numeric;
  w_quality numeric;
  w_profile numeric;
  s_relevance numeric := 0;
  s_trust numeric := 0;
  s_activity numeric := 0;
  s_quality numeric := 0;
  s_profile numeric := 0;
  boost numeric := 1.0;
  final_rank numeric := 0;
  pens jsonb := '{}'::jsonb;
  reasons jsonb := '{}'::jsonb;
  user_badges text[] := '{}'::text[];
  report_count integer := 0;
  block_count integer := 0;
  days_inactive integer := 0;
  album_count integer := 0;
  chat_count integer := 0;
  completed_count integer := 0;
  disputed_count integer := 0;
  max_boost numeric := 1.20;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RETURN '{"error":"user_not_found"}'::jsonb;
  END IF;

  PERFORM public.recompute_user_exchange_metrics(target_user_id);

  SELECT jsonb_object_agg(config_key, config_value)
  INTO cfg
  FROM public.algorithm_config
  WHERE category IN ('ranking', 'penalties', 'limits');

  w_relevance := COALESCE((cfg->>'user_match_relevance_weight')::numeric, 0.40);
  w_trust := COALESCE((cfg->>'user_trust_weight')::numeric, 0.20);
  w_activity := COALESCE((cfg->>'user_activity_weight')::numeric, 0.15);
  w_quality := COALESCE((cfg->>'user_match_quality_weight')::numeric, 0.15);
  w_profile := COALESCE((cfg->>'user_profile_weight')::numeric, 0.10);
  max_boost := LEAST(COALESCE((cfg->>'max_premium_boost')::numeric, 1.20), 1.20);

  SELECT COUNT(DISTINCT album_id)::integer
  INTO album_count
  FROM public.user_albums
  WHERE user_id = target_user_id;

  SELECT COUNT(*)::integer
  INTO chat_count
  FROM public.chats
  WHERE user_1 = target_user_id OR user_2 = target_user_id;

  SELECT
    COUNT(*) FILTER (WHERE status = 'completed')::integer,
    COUNT(*) FILTER (WHERE status = 'disputed')::integer
  INTO completed_count, disputed_count
  FROM public.exchange_completions
  WHERE user_1_id = target_user_id OR user_2_id = target_user_id;

  s_relevance := LEAST((album_count * 15) + (completed_count * 12) + (chat_count * 3), 100);

  SELECT COUNT(*)::integer
  INTO report_count
  FROM public.reports
  WHERE reported_user_id = target_user_id
    AND status IN ('resolved', 'confirmed');

  SELECT COUNT(*)::integer
  INTO block_count
  FROM public.user_blocks
  WHERE user_id = target_user_id
    AND COALESCE(is_active, true) = true;

  s_trust := LEAST(
    100,
    GREATEST(
      0,
      COALESCE(p.reliability_score, 50)
      - (report_count * 12)
      - (block_count * 20)
      - (disputed_count * 4)
      + CASE WHEN p.is_verified THEN 8 ELSE 0 END
    )
  );

  days_inactive := FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(p.last_active, p.created_at))) / 86400.0);
  IF days_inactive <= 1 THEN
    s_activity := 100;
  ELSIF days_inactive <= 3 THEN
    s_activity := 85;
  ELSIF days_inactive <= 7 THEN
    s_activity := 65;
  ELSIF days_inactive <= 14 THEN
    s_activity := 40;
  ELSIF days_inactive <= 30 THEN
    s_activity := 20;
  ELSE
    s_activity := 5;
  END IF;

  s_quality := LEAST(
    100,
    ROUND(
      (COALESCE(p.completion_rate, 0) * 0.65)
      + (LEAST(completed_count, 12) * 3)
      + (LEAST(chat_count, 20) * 1.2)
      - (disputed_count * 5),
      2
    )
  );

  s_profile := 0;
  IF p.name IS NOT NULL AND length(p.name) > 1 THEN s_profile := s_profile + 25; END IF;
  IF p.avatar_url IS NOT NULL THEN s_profile := s_profile + 25; END IF;
  IF p.city IS NOT NULL OR p.department IS NOT NULL THEN s_profile := s_profile + 20; END IF;
  IF p.lat IS NOT NULL AND p.lng IS NOT NULL THEN s_profile := s_profile + 20; END IF;
  IF album_count > 0 THEN s_profile := s_profile + 10; END IF;

  IF report_count > 0 THEN
    pens := pens || jsonb_build_object('reports', report_count);
  END IF;
  IF days_inactive > 14 THEN
    pens := pens || jsonb_build_object('inactivity_days', days_inactive);
  END IF;
  IF disputed_count > 0 THEN
    pens := pens || jsonb_build_object('disputed_exchanges', disputed_count);
  END IF;

  IF p.is_premium THEN
    boost := LEAST(COALESCE((cfg->>'premium_boost')::numeric, 1.10), max_boost);
  END IF;

  final_rank := (
    (s_relevance * w_relevance) +
    (s_trust * w_trust) +
    (s_activity * w_activity) +
    (s_quality * w_quality) +
    (s_profile * w_profile)
  );

  IF boost > 1.0 THEN
    final_rank := final_rank * boost;
  END IF;
  final_rank := LEAST(final_rank, 100);

  IF s_activity >= 80 THEN user_badges := array_append(user_badges, 'activo'); END IF;
  IF s_trust >= 78 THEN user_badges := array_append(user_badges, 'confiable'); END IF;
  IF s_quality >= 65 THEN user_badges := array_append(user_badges, 'buen_cruce'); END IF;
  IF final_rank >= 85 THEN user_badges := array_append(user_badges, 'top_cruce'); END IF;
  IF days_inactive <= 7 AND p.created_at > now() - interval '30 days' THEN
    user_badges := array_append(user_badges, 'nuevo');
  END IF;

  reasons := jsonb_build_object(
    'formula', 'relevance*w + trust*w + activity*w + quality*w + profile*w',
    'completion_rate', COALESCE(p.completion_rate, 0),
    'reliability_score', COALESCE(p.reliability_score, 50),
    'completed_exchanges', completed_count,
    'boost_value', boost
  );

  INSERT INTO public.user_rankings (
    user_id,
    final_user_rank,
    match_relevance_score,
    trust_score,
    activity_score,
    match_quality_score,
    profile_score,
    premium_boost_applied,
    penalties,
    rank_reason,
    badges,
    last_scored_at
  )
  VALUES (
    target_user_id,
    final_rank,
    s_relevance,
    s_trust,
    s_activity,
    s_quality,
    s_profile,
    CASE WHEN boost > 1.0 THEN boost ELSE 0 END,
    pens,
    reasons,
    user_badges,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    final_user_rank = EXCLUDED.final_user_rank,
    match_relevance_score = EXCLUDED.match_relevance_score,
    trust_score = EXCLUDED.trust_score,
    activity_score = EXCLUDED.activity_score,
    match_quality_score = EXCLUDED.match_quality_score,
    profile_score = EXCLUDED.profile_score,
    premium_boost_applied = EXCLUDED.premium_boost_applied,
    penalties = EXCLUDED.penalties,
    rank_reason = EXCLUDED.rank_reason,
    badges = EXCLUDED.badges,
    last_scored_at = now();

  RETURN jsonb_build_object(
    'user_id', target_user_id,
    'final_rank', final_rank,
    'subscores', jsonb_build_object(
      'relevance', s_relevance,
      'trust', s_trust,
      'activity', s_activity,
      'quality', s_quality,
      'profile', s_profile
    ),
    'boost', boost,
    'penalties', pens,
    'badges', to_jsonb(user_badges)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.expire_pending_exchange_confirmations();

  SELECT jsonb_build_object(
    'dau', (SELECT count(*) FROM public.profiles WHERE last_active >= now() - interval '1 day'),
    'wau', (SELECT count(*) FROM public.profiles WHERE last_active >= now() - interval '7 days'),
    'mau', (SELECT count(*) FROM public.profiles WHERE last_active >= now() - interval '30 days'),
    'total_users', (SELECT count(*) FROM public.profiles),
    'premium_users', (SELECT count(*) FROM public.profiles WHERE is_premium = true),
    'registrations_7d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'),
    'registrations_30d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    'active_albums', (SELECT count(DISTINCT album_id) FROM public.user_albums),
    'total_trades', (SELECT count(*) FROM public.exchange_completions WHERE status = 'completed'),
    'trades_7d', (SELECT count(*) FROM public.exchange_completions WHERE status = 'completed' AND completion_time >= now() - interval '7 days'),
    'total_chats', (SELECT count(*) FROM public.chats),
    'chats_7d', (SELECT count(*) FROM public.chats WHERE created_at >= now() - interval '7 days'),
    'expired_chats', (SELECT count(*) FROM public.chats WHERE is_expired = true),
    'active_locations', (SELECT count(*) FROM public.locations WHERE is_active = true),
    'total_favorites', (SELECT count(*) FROM public.user_favorites),
    'pending_reports', (SELECT count(*) FROM public.reports WHERE status = 'pending'),
    'total_payments', (SELECT COALESCE(sum(amount), 0) FROM public.payments WHERE status = 'completed'),
    'payments_30d', (SELECT COALESCE(sum(amount), 0) FROM public.payments WHERE status = 'completed' AND created_at >= now() - interval '30 days'),
    'active_promos', (SELECT count(*) FROM public.sponsored_placements WHERE is_active = true AND (ends_at IS NULL OR ends_at > now())),
    'promo_impressions_7d', (SELECT count(*) FROM public.sponsored_events WHERE event_type = 'impression' AND created_at >= now() - interval '7 days'),
    'promo_clicks_7d', (SELECT count(*) FROM public.sponsored_events WHERE event_type = 'click' AND created_at >= now() - interval '7 days'),
    'active_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status = 'active'),
    'active_business_subs', (SELECT count(*) FROM public.business_subscriptions WHERE status = 'active'),
    'exchanges_completed', (SELECT count(*) FROM public.exchange_completions WHERE status = 'completed'),
    'pending_confirmations', (SELECT count(*) FROM public.exchange_completions WHERE status = 'pending_confirmation'),
    'disputed_exchanges', (SELECT count(*) FROM public.exchange_completions WHERE status = 'disputed'),
    'not_completed_exchanges', (SELECT count(*) FROM public.exchange_completions WHERE status = 'not_completed'),
    'expired_exchanges', (SELECT count(*) FROM public.exchange_completions WHERE status = 'expired'),
    'match_to_exchange_rate', (
      SELECT ROUND(
        CASE WHEN count(*) = 0 THEN 0
        ELSE (
          (SELECT count(*)::numeric FROM public.exchange_completions WHERE status = 'completed')
          / count(*)::numeric
        ) * 100 END,
        2
      )
      FROM public.chats
    ),
    'chat_to_exchange_rate', (
      SELECT ROUND(
        CASE WHEN count(*) = 0 THEN 0
        ELSE (
          (SELECT count(*)::numeric FROM public.exchange_completions WHERE status = 'completed')
          / count(*)::numeric
        ) * 100 END,
        2
      )
      FROM public.chats
    ),
    'real_liquidity', (
      SELECT count(DISTINCT chat_id)
      FROM public.exchange_completions
      WHERE status = 'completed'
        AND completion_time >= now() - interval '30 days'
    ),
    'avg_user_reliability', (
      SELECT ROUND(AVG(reliability_score), 2)
      FROM public.profiles
      WHERE completed_exchanges > 0 OR disputed_exchanges > 0
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_activity(days_back integer DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(day_data ORDER BY day_data->>'date')
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'date', d::date,
      'active_users', (SELECT count(*) FROM public.profiles WHERE last_active::date = d::date),
      'new_users', (SELECT count(*) FROM public.profiles WHERE created_at::date = d::date),
      'trades', (SELECT count(*) FROM public.exchange_completions WHERE status = 'completed' AND completion_time::date = d::date),
      'chats', (SELECT count(*) FROM public.chats WHERE created_at::date = d::date),
      'payments', (SELECT COALESCE(sum(amount), 0) FROM public.payments WHERE status = 'completed' AND created_at::date = d::date),
      'completed_exchanges', (SELECT count(*) FROM public.exchange_completions WHERE status = 'completed' AND completion_time::date = d::date),
      'disputed_exchanges', (SELECT count(*) FROM public.exchange_completions WHERE status = 'disputed' AND completion_time::date = d::date)
    ) AS day_data
    FROM generate_series(current_date - (days_back - 1), current_date, interval '1 day') d
  ) daily_rows;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE VIEW public.exchange_completion_admin_v AS
SELECT
  ec.id,
  ec.chat_id,
  ec.album_id,
  a.name AS album_name,
  ec.status,
  ec.user_1_id,
  p1.name AS user_1_name,
  p1.email AS user_1_email,
  ec.user_2_id,
  p2.name AS user_2_name,
  p2.email AS user_2_email,
  ec.user_1_response,
  ec.user_2_response,
  ec.trigger_score,
  ec.prompt_reason,
  ec.prompt_sent_at,
  ec.expires_at,
  ec.completion_time,
  ec.is_suspicious,
  ec.suspicion_reasons,
  ec.admin_review_status,
  ec.outcome_recorded_at,
  COALESCE((ec.trigger_snapshot->>'message_count')::integer, 0) AS message_count,
  NULLIF(ec.trigger_snapshot->>'distance_km', '')::numeric AS distance_km,
  ec.created_at,
  ec.updated_at
FROM public.exchange_completions ec
LEFT JOIN public.profiles p1 ON p1.id = ec.user_1_id
LEFT JOIN public.profiles p2 ON p2.id = ec.user_2_id
LEFT JOIN public.albums a ON a.id = ec.album_id;

CREATE OR REPLACE FUNCTION public.admin_get_exchange_completion_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('god_admin', 'admin', 'moderator', 'support', 'analista')
  ) THEN
    RETURN jsonb_build_object('error', 'access_denied');
  END IF;

  PERFORM public.expire_pending_exchange_confirmations();

  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.exchange_completions),
    'completed', (SELECT count(*) FROM public.exchange_completions WHERE status = 'completed'),
    'pending_confirmation', (SELECT count(*) FROM public.exchange_completions WHERE status = 'pending_confirmation'),
    'not_completed', (SELECT count(*) FROM public.exchange_completions WHERE status = 'not_completed'),
    'disputed', (SELECT count(*) FROM public.exchange_completions WHERE status = 'disputed'),
    'expired', (SELECT count(*) FROM public.exchange_completions WHERE status = 'expired'),
    'suspicious', (SELECT count(*) FROM public.exchange_completions WHERE is_suspicious = true),
    'completion_rate', (
      SELECT ROUND(
        CASE WHEN count(*) FILTER (WHERE status IN ('completed', 'not_completed', 'disputed', 'expired')) = 0 THEN 0
        ELSE (
          (count(*) FILTER (WHERE status = 'completed'))::numeric
          / (count(*) FILTER (WHERE status IN ('completed', 'not_completed', 'disputed', 'expired')))::numeric
        ) * 100 END,
        2
      )
      FROM public.exchange_completions
    ),
    'chat_to_exchange_rate', (
      SELECT ROUND(
        CASE WHEN (SELECT count(*) FROM public.chats) = 0 THEN 0
        ELSE (
          (SELECT count(*)::numeric FROM public.exchange_completions WHERE status = 'completed')
          / (SELECT count(*)::numeric FROM public.chats)
        ) * 100 END,
        2
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;

INSERT INTO public.role_permissions (role, permission) VALUES
('god_admin', 'admin.exchange_completion'),
('admin', 'admin.exchange_completion'),
('moderator', 'admin.exchange_completion'),
('support', 'admin.exchange_completion'),
('analista', 'admin.exchange_completion')
ON CONFLICT (role, permission) DO NOTHING;
