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
  if (value === 'premium' || value === 'premium pro') return 'pro'
  if (value === 'premium plus') return 'plus'

  return isPremium ? 'pro' : 'gratis'
}

const buildPlanNameCandidates = (planName, isPremium = false) => {
  const value = String(planName || '').trim().toLowerCase()
  const fallback = normalizeProfilePlanName(planName, isPremium)
  const candidates = [
    value,
    fallback,
    isPremium ? 'pro' : 'gratis',
    isPremium ? 'plus' : 'gratis',
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

const EMPTY_AUTH_STATE = {
  user: null,
  profile: null,
  planRules: null,
  session: null,
}

let authInitializePromise = null
let authListenerBound = false
let authHydrationVersion = 0
const lastActiveTouchByUser = new Map()

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
  useFeatureFlagStore.setState({
    flags: [],
    flagsStatus: {},
    lastFetch: 0,
    lastStatusUserKey: null,
    loading: false,
  })
  useExchangeStore.getState().reset()
  useGrowthStore.getState().reset()
  try {
    const { useGamificationStore } = await import('./gamificationStore')
    useGamificationStore.getState().reset()
  } catch (error) {
    console.error('Gamification reset error:', error)
  }
}

const shouldTouchLastActive = (userId) => {
  if (!userId) return false

  const now = Date.now()
  const lastTouch = lastActiveTouchByUser.get(userId) || 0
  if (now - lastTouch < 60_000) return false

  lastActiveTouchByUser.set(userId, now)
  return true
}

const buildAuthSnapshot = async (session) => {
  if (!session?.user) {
    return EMPTY_AUTH_STATE
  }

  const [{ data: profile }, { data: roleData }, { data: planRules }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle(),
    supabase.rpc('get_user_plan_rules', { user_id: session.user.id }),
  ])

  return {
    user: session.user,
    session,
    profile: profile ? { ...profile, role: roleData?.role || profile.role || 'user' } : null,
    planRules: planRules || null,
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  planRules: null,
  session: null,
  loading: true,
  initialized: false,

  syncSession: async (session, options = {}) => {
    const { touchLastActive = true } = options
    const hydrationVersion = ++authHydrationVersion

    // PROTECCIÓN CRÃTICA: Si la sesión es null pero ya teníamos un usuario,
    // NO limpiar el estado. Esto ocurre durante el refresh del token.
    // Solo el evento SIGNED_OUT explícito debe limpiar el estado.
    if (!session?.user) {
      const currentUser = get().user
      if (currentUser) {
        console.warn('[AuthStore] syncSession received null session but user exists â€” preserving state (token refresh race)')
        set({ loading: false, initialized: true })
        return { user: currentUser, session: get().session, profile: get().profile, planRules: get().planRules }
      }
      // Genuinamente no hay usuario
      set({ ...EMPTY_AUTH_STATE, loading: false, initialized: true })
      return EMPTY_AUTH_STATE
    }

    try {
      // Timeout de seguridad: si la DB tarda más de 10s, entrar con perfil mínimo degradado
      const snapshot = await Promise.race([
        buildAuthSnapshot(session),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 10000))
      ]).catch(err => {
        console.error('[AuthStore] Auth hydration timeout. Loading with degraded profile.', err.message)
        // Si ya tenemos perfil, usarlo en vez de degradar
        const existingProfile = get().profile
        if (existingProfile && existingProfile.id === session.user.id) {
          return { user: session.user, session, profile: existingProfile, planRules: get().planRules }
        }
        // Perfil mínimo marcado como degradado â€” NO otorga permisos elevados
        return {
          user: session.user,
          session,
          profile: { id: session.user.id, plan_name: 'gratis', is_premium: false, role: 'user', _degraded: true },
          planRules: null
        }
      })

      if (hydrationVersion !== authHydrationVersion) return snapshot

      set({ ...snapshot, loading: false, initialized: true })

      if (snapshot.user) {
        import('../stores/gamificationStore').then(({ useGamificationStore }) => {
          useGamificationStore.getState().initialize(snapshot.user.id)
        })

        if (touchLastActive && shouldTouchLastActive(snapshot.user.id)) {
          void get().touchLastActive(snapshot.user.id)
        }
      }

      return snapshot
    } catch (error) {
      if (hydrationVersion === authHydrationVersion) {
        console.error('Auth hydration error:', error)
        // Si ya tenemos usuario, preservar el estado en vez de romper la sesión
        if (get().user) {
          set({ loading: false, initialized: true })
          return { user: get().user, session: get().session, profile: get().profile, planRules: get().planRules }
        }
      }
      set({ loading: false, initialized: true })
      return EMPTY_AUTH_STATE
    }
  },

  initialize: async () => {
    if (get().initialized && authListenerBound) return
    if (authInitializePromise) return authInitializePromise

    set({ loading: true })

    authInitializePromise = (async () => {
      try {
        // PASO 1: Configurar el listener PRIMERO para no perder eventos
        if (!authListenerBound) {
          supabase.auth.onAuthStateChange((event, nextSession) => {
            if (event === 'SIGNED_OUT') {
              authHydrationVersion += 1
              void resetDependentStores()
              set({ ...EMPTY_AUTH_STATE, loading: false, initialized: true })
              return
            }

            // INITIAL_SESSION es manejado abajo en getSession, ignorar duplicado
            if (event === 'INITIAL_SESSION') return

            // TOKEN_REFRESHED: actualizar session silenciosamente sin mostrar loading
            if (event === 'TOKEN_REFRESHED') {
              if (nextSession?.user && get().user) {
                set({ session: nextSession })
              }
              return
            }

            // Solo mostrar pantalla de carga si no tenemos datos previos
            if (!get().user) {
              set({ loading: true })
            }
            void get()
              .syncSession(nextSession, {
                touchLastActive: event === 'SIGNED_IN' || event === 'USER_UPDATED',
              })
              .catch((error) => {
                console.error('Auth state change error:', error)
                set({ loading: false, initialized: true })
              })
          })
          authListenerBound = true
        }

        // PASO 2: Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession()
        await get().syncSession(session)

      } catch (error) {
        console.error('Auth init error:', error)
        set({ loading: false, initialized: true })
      } finally {
        authInitializePromise = null
      }
    })()

    return authInitializePromise
  },

  signInWithGoogle: async (redirectTo = window.location.origin) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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
    if (data?.session) {
      set({ loading: true })
      await get().syncSession(data.session)
    }
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
    if (data?.session) {
      set({ loading: true })
      await get().syncSession(data.session)
    }
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
      authHydrationVersion += 1
      set({ ...EMPTY_AUTH_STATE, loading: false, initialized: true })
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
    set((state) => ({ profile: state.profile ? { ...state.profile, ...data } : data }))
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
