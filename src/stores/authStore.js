import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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

        const { data: planRules } = await supabase.rpc('get_user_plan_rules', { user_id: session.user.id })

        set({ user: session.user, session, profile, planRules, loading: false })

        // Auto-update last_active
        supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', session.user.id).then(() => {})

        // Auto-request geolocation
        if (navigator.geolocation && (!profile?.lat || !profile?.lng)) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude
              const lng = pos.coords.longitude
              supabase.from('profiles').update({ lat, lng }).eq('id', session.user.id).then(({ data }) => {
                set(state => ({ profile: { ...state.profile, lat, lng } }))
              })
            },
            () => {}, // silently fail
            { enableHighAccuracy: true, timeout: 10000 }
          )
        }
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
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
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
}))
