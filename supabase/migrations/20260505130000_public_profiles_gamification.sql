-- ==========================================
-- UPDATE GET_PUBLIC_PROFILE RPC WITH GAMIFICATION
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text, p_visitor_id uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_profile RECORD;
  v_albums jsonb;
  v_reputation jsonb;
  v_progress jsonb;
  v_badges jsonb;
  v_has_match boolean := false;
BEGIN
  -- Get profile
  SELECT p.id, p.name, p.username, p.avatar_url, p.city, p.department, p.created_at, p.profile_visibility, p.is_public_hidden,
         (SELECT count(*) FROM trades WHERE (user_1_id = p.id OR user_2_id = p.id) AND status = 'completed') as completed_exchanges
  INTO v_profile
  FROM public.profiles p
  WHERE p.username = p_username;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_profile.is_public_hidden THEN
    RETURN jsonb_build_object('error', 'Profile is hidden');
  END IF;

  IF v_profile.profile_visibility = 'private' AND (p_visitor_id IS NULL OR p_visitor_id != v_profile.id) THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;

  -- Check if there is an active chat/match between visitor and profile owner
  IF p_visitor_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM chats 
      WHERE (user_1 = p_visitor_id AND user_2 = v_profile.id) 
         OR (user_1 = v_profile.id AND user_2 = p_visitor_id)
    ) INTO v_has_match;
  END IF;

  IF v_profile.profile_visibility = 'matches' AND NOT v_has_match AND (p_visitor_id IS NULL OR p_visitor_id != v_profile.id) THEN
    RETURN jsonb_build_object('error', 'Profile visible only to matches');
  END IF;

  -- Get albums
  SELECT jsonb_agg(
    jsonb_build_object(
      'album_id', a.id,
      'name', a.name,
      'cover_url', a.cover_url,
      'year', a.year,
      'visibility', ua.visibility,
      'show_progress', ua.show_progress,
      'show_missing', ua.show_missing,
      'show_repeated', ua.show_repeated,
      'progress', CASE WHEN ua.show_progress THEN
                     (SELECT count(*) FROM stickers_owned so WHERE so.user_id = v_profile.id AND so.album_id = a.id)
                  ELSE NULL END,
      'total_stickers', (SELECT count(*) FROM album_stickers as_ WHERE as_.album_id = a.id)
    )
  ) INTO v_albums
  FROM user_albums ua
  JOIN albums a ON a.id = ua.album_id
  WHERE ua.user_id = v_profile.id
    AND NOT ua.is_public_hidden
    AND (ua.visibility = 'public' OR 
        (ua.visibility = 'matches' AND v_has_match) OR 
        p_visitor_id = v_profile.id);

  -- Get reputation
  SELECT jsonb_build_object(
    'star_rating', r.star_rating,
    'reliability_score', r.reliability_score
  ) INTO v_reputation
  FROM public.user_reputation r WHERE r.user_id = v_profile.id;

  -- Get progress
  SELECT jsonb_build_object(
    'level', p.level,
    'total_points', p.total_points,
    'completed_exchanges', p.completed_exchanges
  ) INTO v_progress
  FROM public.user_progress p WHERE p.user_id = v_profile.id;

  -- Get badges
  SELECT jsonb_agg(
    jsonb_build_object('badge_id', b.badge_id, 'unlocked_at', b.unlocked_at)
  ) INTO v_badges
  FROM public.user_badges b WHERE b.user_id = v_profile.id;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'name', v_profile.name,
    'username', v_profile.username,
    'avatar_url', v_profile.avatar_url,
    'city', v_profile.city,
    'department', v_profile.department,
    'created_at', v_profile.created_at,
    'completed_exchanges', v_profile.completed_exchanges,
    'albums', COALESCE(v_albums, '[]'::jsonb),
    'reputation', v_reputation,
    'progress', v_progress,
    'badges', COALESCE(v_badges, '[]'::jsonb),
    'is_owner', (p_visitor_id = v_profile.id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
