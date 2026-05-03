import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { ACHIEVEMENTS, ACHIEVEMENT_REWARDS } from '../lib/gamification'
import { canUnlockMilestone, canClaimReward } from '../lib/reputation'

export const useGamificationStore = create((set, get) => ({
  // State
  progress: null,
  achievements: [],
  badges: [],
  rewards: [],
  reputation: null, // { rank_score, star_rating, reputation_modifier, response_score, ... }
  loading: false,
  initialized: false,
  lastUnlock: null, // For toast notifications

  // Initialize gamification for a user
  initialize: async (userId) => {
    if (!userId || get().initialized) return
    set({ loading: true })

    try {
      // Init gamification if not exists
      await supabase.rpc('init_user_gamification', { p_user_id: userId })

      // Record daily activity
      await supabase.rpc('record_daily_activity', { p_user_id: userId })

      // Fetch full gamification data
      await get().fetchGamification(userId)

      set({ initialized: true })
    } catch (err) {
      console.error('Gamification init error:', err)
    } finally {
      set({ loading: false })
    }
  },

  // Fetch all gamification data
  fetchGamification: async (userId) => {
    if (!userId) return
    try {
      const { data, error } = await supabase.rpc('get_user_gamification', { p_user_id: userId })
      if (error) throw error

      set({
        progress: data.progress || {},
        achievements: data.achievements || [],
        badges: data.badges || [],
        rewards: data.rewards || [],
        reputation: data.reputation || { star_rating: 1, rank_score: 50, reputation_modifier: 1.0 },
      })
    } catch (err) {
      console.error('Fetch gamification error:', err)
    }
  },

  // Recalculate level (call after meaningful actions)
  checkLevelUp: async (userId) => {
    if (!userId) return null
    try {
      const { data, error } = await supabase.rpc('recalculate_user_level', { p_user_id: userId })
      if (error) throw error

      if (data?.leveled_up) {
        set({ lastUnlock: { type: 'level', value: data.level } })
        await get().fetchGamification(userId)
      }
      return data
    } catch (err) {
      console.error('Level check error:', err)
      return null
    }
  },

  // Track a specific action and update achievements
  trackAction: async (userId, actionType, value = 1) => {
    if (!userId) return

    try {
      // Update progress counters
      const counterMap = {
        trade: 'total_trades',
        chat: 'total_chats',
        favorite: 'total_favorites',
        album: 'total_albums',
        sticker_load: 'total_stickers_loaded',
        duplicate_load: 'total_duplicates_loaded',
      }

      const column = counterMap[actionType]
      if (column) {
        await supabase.rpc('record_daily_activity', { p_user_id: userId })

        // Increment the specific counter
        const { data: currentProgress } = await supabase
          .from('user_progress')
          .select(column)
          .eq('user_id', userId)
          .single()

        if (currentProgress) {
          await supabase
            .from('user_progress')
            .update({
              [column]: (currentProgress[column] || 0) + value,
              reward_points_hidden: currentProgress.reward_points_hidden + value,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
      }

      // Check achievement progress
      await get().updateAchievements(userId, actionType, value)

      // Check level up
      await get().checkLevelUp(userId)

      // Refresh state
      await get().fetchGamification(userId)
    } catch (err) {
      console.error('Track action error:', err)
    }
  },

  // Update achievements based on action
  updateAchievements: async (userId, actionType, value) => {
    try {
      const achievementMapping = {
        trade: ['first_trade', 'trades_3', 'trades_10', 'trades_25', 'trades_50', 'clean_trades_10'],
        album: ['first_album'],
        duplicate_load: ['duplicates_50', 'duplicates_100'],
        favorite: ['first_favorite', 'favorites_5'],
        fast_response: ['fast_responses_10'],
        page_complete: ['page_complete'],
        album_complete: ['album_complete'],
      }

      const relevantKeys = achievementMapping[actionType] || []

      for (const key of relevantKeys) {
        const { data: achievement } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('achievement_key', key)
          .single()

        if (achievement && !achievement.completed) {
          const newProgress = Math.min(achievement.progress + value, achievement.target)
          const justCompleted = newProgress >= achievement.target

          // Check milestone reputation gate
          if (justCompleted) {
            const rep = get().reputation
            const { canUnlock } = canUnlockMilestone(key, rep?.star_rating || 1)
            if (!canUnlock) {
              // User doesn't have enough reputation — don't complete the milestone
              // Still update progress so they see they're close
              await supabase
                .from('user_achievements')
                .update({ progress: newProgress })
                .eq('id', achievement.id)
              continue
            }
          }

          await supabase
            .from('user_achievements')
            .update({
              progress: newProgress,
              completed: justCompleted,
              unlocked_at: justCompleted ? new Date().toISOString() : null,
            })
            .eq('id', achievement.id)

          // Grant reward if just completed
          if (justCompleted) {
            const reward = ACHIEVEMENT_REWARDS[key]
            if (reward) {
              // Check reward reputation gate
              const rep = get().reputation
              const { canClaim } = canClaimReward(reward.type, rep?.star_rating || 1)
              if (canClaim) {
                await supabase.rpc('grant_gamification_reward', {
                  p_user_id: userId,
                  p_reward_type: reward.type,
                  p_reward_value: reward.value,
                  p_source: `achievement:${key}`,
                  p_duration_hours: reward.hours || 24,
                })
              }
            }

            set({ lastUnlock: { type: 'achievement', key, name: ACHIEVEMENTS[key]?.name } })
          }
        }
      }
    } catch (err) {
      console.error('Update achievements error:', err)
    }
  },

  // Check if profile is complete (for the profile_complete achievement)
  checkProfileComplete: async (userId, profile) => {
    if (!userId || !profile) return
    const isComplete = !!(
      profile.name?.trim() &&
      profile.avatar_url &&
      (profile.city || profile.department) &&
      profile.lat && profile.lng
    )

    if (isComplete) {
      const { data } = await supabase
        .from('user_achievements')
        .select('completed')
        .eq('user_id', userId)
        .eq('achievement_key', 'profile_complete')
        .single()

      if (data && !data.completed) {
        await get().updateAchievements(userId, 'profile_complete_action', 1)
      }

      // Grant badge
      await supabase
        .from('user_badges')
        .upsert({ user_id: userId, badge_key: 'perfil_completo' }, { onConflict: 'user_id,badge_key' })
    }
  },

  // Clear notification
  clearLastUnlock: () => set({ lastUnlock: null }),

  // Update reputation pillar (called when specific events happen)
  updateReputation: async (userId, pillar, event) => {
    if (!userId) return
    try {
      if (pillar === 'response') {
        await supabase.rpc('update_response_reputation', {
          p_user_id: userId,
          p_is_fast: event === 'fast',
        })
      } else if (pillar === 'fulfillment') {
        await supabase.rpc('update_fulfillment_reputation', {
          p_user_id: userId,
          p_completed: event !== 'cancelled',
        })
      } else if (pillar === 'social') {
        await supabase.rpc('update_social_reputation', {
          p_user_id: userId,
          p_event: event,
        })
      }
      // Refresh reputation data
      await get().fetchGamification(userId)
    } catch (err) {
      console.error('Update reputation error:', err)
    }
  },

  // Get user stars (helper)
  getUserStars: () => {
    return get().reputation?.star_rating || 1
  },

  // Reset (on logout)
  reset: () => set({
    progress: null,
    achievements: [],
    badges: [],
    rewards: [],
    reputation: null,
    loading: false,
    initialized: false,
    lastUnlock: null,
  }),
}))
