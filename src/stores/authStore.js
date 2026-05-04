import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useFeatureFlagStore } from './featureFlagStore'

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

        // Initialize feature flags for this user
        useFeatureFlagStore.getState().initializeFlags(session.user.id)

        // Initialize gamification system
        import('../stores/gamificationStore').then(({ useGamificationStore }) => {
          useGamificationStore.getState().initialize(session.user.id)
        })

        // Auto-update last_active
        supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', session.user.id).then(() => {})

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
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      set({ user: null, session: null, profile: null, planRules: null })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, last_active: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    set({ profile: data })
    return data
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
