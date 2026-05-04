import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useFeatureFlagStore } from './featureFlagStore'
import { useExchangeStore } from './exchangeStore'
import { useGrowthStore } from './growthStore'

const VALID_USER_PLAN_NAMES = new Set(['gratis', 'plus', 'pro'])

const normalizeProfilePlanName = (planName, isPremium = false) => {
  const value = String(planName || '').trim().toLowerCase()

  if (VALID_USER_PLAN_NAMES.has(value)) return value
  if (value === 'free') return 'gratis'
  if (value === 'premium') return 'pro'

  return isPremium ? 'pro' : 'gratis'
}

const buildPlanNameCandidates = (planName, isPremium = false) => {
  const value = String(planName || '').trim().toLowerCase()
  const fallback = normalizeProfilePlanName(planName, isPremium)
  const candidates = [
    value,
    fallback,
    isPremium ? 'pro' : 'gratis',
    isPremium ? 'premium' : 'free',
    isPremium ? 'plus' : '',
  ].filter(Boolean)

  return [...new Set(candidates)]
}

const isRecoverableSchemaError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.status === 400 ||
    error?.code === '23514' ||
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    message.includes('check constraint') ||
    message.includes('plan_name_check')
  )
}

const isPlanConstraintError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === '23514' || message.includes('plan_name_check')
}

const clearSupabaseStorage = () => {
  if (typeof window === 'undefined') return

  const clearMatchingKeys = (storage) => {
    if (!storage) return

    const keysToRemove = []
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key && key.includes('supabase.auth.token')) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key))
  }

  clearMatchingKeys(window.localStorage)
  clearMatchingKeys(window.sessionStorage)
}

const resetDependentStores = async () => {
  useFeatureFlagStore.setState({ flags: [], lastFetch: 0, loading: false })
  useExchangeStore.getState().reset()
  useGrowthStore.getState().reset()
  try {
    const { useGamificationStore } = await import('./gamificationStore')
    useGamificationStore.getState().reset()
  } catch (error) {
    console.error('Gamification reset error:', error)
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  planRules: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
          profile.role = roleData?.role || 'user'
        }

        const { data: planRules } = await supabase.rpc('get_user_plan_rules', { user_id: session.user.id })

        set({ user: session.user, session, profile, planRules, loading: false })

        // Initialize gamification system
        import('../stores/gamificationStore').then(({ useGamificationStore }) => {
          useGamificationStore.getState().initialize(session.user.id)
        })

        // Auto-update last_active when the current database schema supports it.
        get().touchLastActive(session.user.id)

        // Auto-request geolocation removed per requirements. Requested only on-demand.
      } else {
        set({ user: null, session: null, profile: null, planRules: null, loading: false })
      }
    } catch (err) {
      console.error('Auth init error:', err)
      set({ loading: false })
    }

    // Listen to auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
          profile.role = roleData?.role || 'user'
        }

        const { data: planRules } = await supabase.rpc('get_user_plan_rules', { user_id: session.user.id })

        set({ user: session.user, session, profile, planRules })
      } else {
        set({ user: null, session: null, profile: null, planRules: null })
      }
    })
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signUpWithEmail: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      clearSupabaseStorage()
      await resetDependentStores()
      set({ user: null, session: null, profile: null, planRules: null })
    }
  },

  updateProfile: async (updates) => {
    const { user, profile } = get()
    if (!user) return
    const planNameCandidates = buildPlanNameCandidates(profile?.plan_name, profile?.is_premium)
    const payload = {
      ...updates,
      ...(planNameCandidates[0] ? { plan_name: planNameCandidates[0] } : {}),
      last_active: new Date().toISOString(),
    }

    let query = supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single()

    let { data, error } = await query
    if (error && isPlanConstraintError(error)) {
      for (const candidate of planNameCandidates.slice(1)) {
        ;({ data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            plan_name: candidate,
            last_active: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single())

        if (!error) break
      }
    }

    if (error && isRecoverableSchemaError(error)) {
      const retryPayload = {
        ...updates,
        ...(planNameCandidates[0] ? { plan_name: planNameCandidates[0] } : {}),
      }
      ;({ data, error } = await supabase
        .from('profiles')
        .update(retryPayload)
        .eq('id', user.id)
        .select()
        .single())

      if (error && isPlanConstraintError(error)) {
        for (const candidate of planNameCandidates.slice(1)) {
          ;({ data, error } = await supabase
            .from('profiles')
            .update({
              ...updates,
              plan_name: candidate,
            })
            .eq('id', user.id)
            .select()
            .single())

          if (!error) break
        }
      }
    }

    if (error) throw error
    set({ profile: data })
    return data
  },

  touchLastActive: async (userId) => {
    const { profile } = get()
    if (!userId) return
    const planNameCandidates = buildPlanNameCandidates(profile?.plan_name, profile?.is_premium)

    let { data, error } = await supabase
      .from('profiles')
      .update({
        last_active: new Date().toISOString(),
        ...(planNameCandidates[0] ? { plan_name: planNameCandidates[0] } : {}),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error && isPlanConstraintError(error)) {
      for (const candidate of planNameCandidates.slice(1)) {
        ;({ data, error } = await supabase
          .from('profiles')
          .update({
            last_active: new Date().toISOString(),
            plan_name: candidate,
          })
          .eq('id', userId)
          .select()
          .single())

        if (!error) break
      }
    }

    if (!error && data) {
      set((state) => ({
        profile: state.profile ? { ...state.profile, plan_name: data.plan_name, last_active: data.last_active } : state.profile
      }))
    }

    if (error && !isRecoverableSchemaError(error)) {
      console.error('Error updating last_active:', error)
    }
  },

  updateLocation: async (lat, lng) => {
    const { updateProfile } = get()
    return updateProfile({ lat, lng })
  },

  uploadProfileAvatar: async (file) => {
    const { user } = get()
    if (!user) throw new Error('Debes estar logueado')

    if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen')
    if (file.size > 2 * 1024 * 1024) throw new Error('La imagen no puede pesar mas de 2MB')

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/profile.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const finalUrl = `${publicUrl}?t=${Date.now()}`
    await get().updateProfile({ avatar_url: finalUrl })
    
    return finalUrl
  },

  deleteProfileAvatar: async () => {
    const { user, profile } = get()
    if (!user || !profile?.avatar_url) return

    await get().updateProfile({ avatar_url: null })
  }
}))
