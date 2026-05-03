import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  NOTIFICATION_TRIGGERS, ONBOARDING_STEPS, SHARE_TYPES,
  GROWTH_ACHIEVEMENTS, REFERRAL_REWARDS, getOnboardingProgress, buildShareText
} from '../lib/growthEngine'

export const useGrowthStore = create((set, get) => ({
  // State
  notifications: [],
  onboardingProgress: null,
  shares: [],
  referrals: [],
  growthAchievements: [],
  growthMetrics: null,
  notificationCenter: { open: false, unread: 0 },
  shareModal: { open: false, type: null, data: {} },
  onboardingVisible: false,
  loading: false,
  initialized: false,

  // ============================
  // INITIALIZATION
  // ============================
  initialize: async (userId, profile, progress) => {
    if (!userId || get().initialized) return
    set({ loading: true })
    try {
      await Promise.all([
        get().fetchSmartNotifications(userId),
        get().fetchGrowthAchievements(userId),
        get().fetchShareStats(userId),
        get().fetchReferralStats(userId),
      ])
      // Calculate onboarding
      const ob = getOnboardingProgress(profile || {}, progress || {})
      set({ onboardingProgress: ob, onboardingVisible: !ob.isActivated, initialized: true })
    } catch (err) {
      console.error('Growth init error:', err)
    } finally {
      set({ loading: false })
    }
  },

  // ============================
  // SMART NOTIFICATIONS
  // ============================
  fetchSmartNotifications: async (userId) => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      const unread = (data || []).filter(n => !n.read_at).length
      set({ notifications: data || [], notificationCenter: { ...get().notificationCenter, unread } })
    } catch (err) {
      console.error('Fetch notifications error:', err)
    }
  },

  markNotificationRead: async (notifId) => {
    try {
      await supabase.from('smart_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notifId)
      set(s => ({
        notifications: s.notifications.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n),
        notificationCenter: { ...s.notificationCenter, unread: Math.max(0, s.notificationCenter.unread - 1) },
      }))
    } catch (err) { console.error(err) }
  },

  markAllRead: async (userId) => {
    try {
      await supabase.from('smart_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)
      set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
        notificationCenter: { ...s.notificationCenter, unread: 0 },
      }))
    } catch (err) { console.error(err) }
  },

  trackNotificationAction: async (notifId, action) => {
    try {
      await supabase.from('smart_notifications')
        .update({ action_taken: action, acted_at: new Date().toISOString() })
        .eq('id', notifId)
    } catch (err) { console.error(err) }
  },

  toggleNotificationCenter: () => set(s => ({
    notificationCenter: { ...s.notificationCenter, open: !s.notificationCenter.open }
  })),

  // ============================
  // ONBOARDING
  // ============================
  updateOnboarding: (profile, progress) => {
    const ob = getOnboardingProgress(profile || {}, progress || {})
    set({ onboardingProgress: ob })
    if (ob.isActivated) set({ onboardingVisible: false })
  },

  dismissOnboarding: () => set({ onboardingVisible: false }),

  trackOnboardingStep: async (userId, stepKey) => {
    if (!userId) return
    try {
      await supabase.from('onboarding_events').insert({
        user_id: userId, step: stepKey,
        completed_at: new Date().toISOString(),
      })
    } catch (err) { console.error(err) }
  },

  // ============================
  // SHARES & REFERRALS
  // ============================
  openShareModal: (type, data = {}) => set({ shareModal: { open: true, type, data } }),
  closeShareModal: () => set({ shareModal: { open: false, type: null, data: {} } }),

  trackShare: async (userId, shareType, data = {}) => {
    if (!userId) return
    try {
      await supabase.from('share_events').insert({
        user_id: userId, share_type: shareType,
        metadata: data, created_at: new Date().toISOString(),
      })
      // Trigger growth achievement
      const achievementKey = SHARE_TYPES[shareType]?.achievement_key
      if (achievementKey) {
        await get().unlockGrowthAchievement(userId, achievementKey)
      }
      await get().fetchShareStats(userId)
    } catch (err) { console.error(err) }
  },

  fetchShareStats: async (userId) => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('share_events')
        .select('share_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
      set({ shares: data || [] })
    } catch (err) { console.error(err) }
  },

  trackReferral: async (userId, referredUserId, event) => {
    if (!userId) return
    try {
      await supabase.from('referral_events').insert({
        referrer_id: userId, referred_id: referredUserId,
        event, created_at: new Date().toISOString(),
      })
      const rewardDef = REFERRAL_REWARDS[event]
      if (rewardDef?.reward_type) {
        await supabase.rpc('grant_gamification_reward', {
          p_user_id: userId,
          p_reward_type: rewardDef.reward_type,
          p_reward_value: `${rewardDef.reward_hours}h`,
          p_source: `referral:${event}`,
          p_duration_hours: rewardDef.reward_hours,
        })
      }
      await get().fetchReferralStats(userId)
    } catch (err) { console.error(err) }
  },

  fetchReferralStats: async (userId) => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('referral_events')
        .select('event, created_at, referred_id')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
      set({ referrals: data || [] })
    } catch (err) { console.error(err) }
  },

  executeShare: async (userId, shareType, data = {}) => {
    const { title, description } = buildShareText(shareType, data)
    const shareUrl = `${window.location.origin}/?ref=${userId}&type=${shareType}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: shareUrl })
        await get().trackShare(userId, shareType, data)
        return true
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
        return false
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${title}\n${description}\n${shareUrl}`)
        await get().trackShare(userId, shareType, data)
        return true
      } catch (err) { console.error(err); return false }
    }
  },

  // ============================
  // GROWTH ACHIEVEMENTS
  // ============================
  fetchGrowthAchievements: async (userId) => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .in('achievement_key', Object.keys(GROWTH_ACHIEVEMENTS))
      set({ growthAchievements: data || [] })
    } catch (err) { console.error(err) }
  },

  unlockGrowthAchievement: async (userId, achievementKey) => {
    if (!userId || !GROWTH_ACHIEVEMENTS[achievementKey]) return
    try {
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_key', achievementKey)
        .single()

      if (existing?.completed) return // Already done

      if (existing) {
        const newProgress = Math.min(existing.progress + 1, existing.target)
        const done = newProgress >= existing.target
        await supabase.from('user_achievements')
          .update({ progress: newProgress, completed: done, unlocked_at: done ? new Date().toISOString() : null })
          .eq('id', existing.id)
        if (done) await get()._grantGrowthReward(userId, achievementKey)
      } else {
        const def = GROWTH_ACHIEVEMENTS[achievementKey]
        const done = def.target <= 1
        await supabase.from('user_achievements').insert({
          user_id: userId, achievement_key: achievementKey,
          progress: 1, target: def.target, completed: done,
          unlocked_at: done ? new Date().toISOString() : null,
        })
        if (done) await get()._grantGrowthReward(userId, achievementKey)
      }
      await get().fetchGrowthAchievements(userId)
    } catch (err) { console.error(err) }
  },

  _grantGrowthReward: async (userId, achievementKey) => {
    const def = GROWTH_ACHIEVEMENTS[achievementKey]
    if (!def?.reward) return
    try {
      await supabase.rpc('grant_gamification_reward', {
        p_user_id: userId,
        p_reward_type: def.reward.type,
        p_reward_value: def.reward.value,
        p_source: `growth:${achievementKey}`,
        p_duration_hours: def.reward.hours || 24,
      })
    } catch (err) { console.error(err) }
  },

  // ============================
  // ADMIN: GROWTH METRICS
  // ============================
  fetchGrowthMetrics: async () => {
    try {
      const [notifRes, shareRes, refRes, achRes] = await Promise.all([
        supabase.from('smart_notifications').select('id, trigger_key, read_at, action_taken, created_at').limit(500),
        supabase.from('share_events').select('id, share_type, created_at').limit(500),
        supabase.from('referral_events').select('id, event, created_at').limit(500),
        supabase.from('user_achievements').select('achievement_key, completed').in('achievement_key', Object.keys(GROWTH_ACHIEVEMENTS)),
      ])
      const notifs = notifRes.data || []
      const shares = shareRes.data || []
      const refs = refRes.data || []
      const achs = achRes.data || []
      set({
        growthMetrics: {
          notifications: {
            sent: notifs.length,
            opened: notifs.filter(n => n.read_at).length,
            ctr: notifs.length ? Math.round((notifs.filter(n => n.action_taken).length / notifs.length) * 100) : 0,
            reactivated: notifs.filter(n => n.action_taken === 'returned').length,
          },
          shares: {
            total: shares.length,
            by_type: Object.fromEntries(
              Object.keys(SHARE_TYPES).map(t => [t, shares.filter(s => s.share_type === t).length])
            ),
          },
          referrals: {
            total_invites: refs.filter(r => r.event === 'invite_sent').length,
            signups: refs.filter(r => r.event === 'friend_signed_up').length,
            activated: refs.filter(r => r.event === 'friend_activated').length,
            conversions: refs.filter(r => r.event === 'friend_first_trade').length,
          },
          achievements: {
            total_unlocked: achs.filter(a => a.completed).length,
            total: achs.length,
          },
        },
      })
    } catch (err) { console.error(err) }
  },

  // Reset
  reset: () => set({
    notifications: [], onboardingProgress: null, shares: [], referrals: [],
    growthAchievements: [], growthMetrics: null,
    notificationCenter: { open: false, unread: 0 },
    shareModal: { open: false, type: null, data: {} },
    onboardingVisible: false, loading: false, initialized: false,
  }),
}))
