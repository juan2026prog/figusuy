import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAdminStore = create((set, get) => ({
  // State
  stats: null,
  users: [],
  allAlbums: [],
  reports: [],
  settings: [],
  plans: [],
  auditLog: [],
  events: [],
  locations: [],
  cmsContent: [],
  loading: false,
  isAdmin: false,

  // ========== AUTH ==========
  checkAdmin: async (userId) => {
    if (!userId) return false
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    const isAdmin = data?.role === 'god_admin' || data?.role === 'admin'
    set({ isAdmin, adminRole: data?.role || null })
    return isAdmin
  },

  // ========== DASHBOARD STATS ==========
  fetchStats: async () => {
    set({ loading: true })
    const [
      { count: totalUsers },
      { count: premiumUsers },
      { count: totalAlbums },
      { count: totalTrades },
      { count: pendingReports },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('albums').select('*', { count: 'exact', head: true }),
      supabase.from('trades').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    // Active users (last 24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const { count: activeToday } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true })
      .gte('last_active', yesterday)

    // Total matches (messages sent, proxy)
    const { count: totalMessages } = await supabase
      .from('messages').select('*', { count: 'exact', head: true })

    // User albums count
    const { count: totalUserAlbums } = await supabase
      .from('user_albums').select('*', { count: 'exact', head: true })

    set({
      stats: {
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        premiumUsers: premiumUsers || 0,
        totalAlbums: totalAlbums || 0,
        totalTrades: totalTrades || 0,
        totalMessages: totalMessages || 0,
        totalUserAlbums: totalUserAlbums || 0,
        pendingReports: pendingReports || 0,
      },
      loading: false,
    })
  },

  // ========== USERS ==========
  fetchUsers: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false })
    set({ users: data || [], loading: false })
  },

  updateUser: async (userId, updates) => {
    await supabase.from('profiles').update(updates).eq('id', userId)
    get().fetchUsers()
  },

  setUserRole: async (userId, role) => {
    await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    get().fetchUsers()
  },

  toggleUserBlock: async (userId, blocked) => {
    await supabase.from('profiles').update({ is_blocked: blocked }).eq('id', userId)
    get().fetchUsers()
  },

  toggleUserPremium: async (userId, premium) => {
    await supabase.from('profiles').update({ is_premium: premium }).eq('id', userId)
    get().fetchUsers()
  },

  toggleUserVerified: async (userId, verified) => {
    await supabase.from('profiles').update({ is_verified: verified }).eq('id', userId)
    get().fetchUsers()
  },

  // ========== ALBUMS ==========
  fetchAllAlbums: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('albums')
      .select('*')
      .order('year', { ascending: false })
    // Get user counts per album
    const { data: userCounts } = await supabase
      .from('user_albums')
      .select('album_id')
    const counts = {}
    ;(userCounts || []).forEach(ua => { counts[ua.album_id] = (counts[ua.album_id] || 0) + 1 })
    const albumsWithCounts = (data || []).map(a => ({ ...a, user_count: counts[a.id] || 0 }))
    set({ allAlbums: albumsWithCounts, loading: false })
  },

  createAlbum: async (album) => {
    const { error } = await supabase.from('albums').insert(album)
    if (!error) get().fetchAllAlbums()
    return error
  },

  updateAlbum: async (id, updates) => {
    const { error } = await supabase.from('albums').update(updates).eq('id', id)
    if (!error) get().fetchAllAlbums()
    return error
  },

  deleteAlbum: async (id) => {
    await supabase.from('albums').delete().eq('id', id)
    get().fetchAllAlbums()
  },

  // ========== REPORTS ==========
  fetchReports: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:reporter_id(name, email), reported:reported_user_id(name, email)')
      .order('created_at', { ascending: false })
    set({ reports: data || [], loading: false })
  },

  resolveReport: async (reportId, notes, resolvedBy) => {
    await supabase.from('reports').update({
      status: 'resolved', resolution_notes: notes,
      resolved_by: resolvedBy, resolved_at: new Date().toISOString()
    }).eq('id', reportId)
    get().fetchReports()
  },

  dismissReport: async (reportId) => {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    get().fetchReports()
  },

  // ========== SETTINGS ==========
  fetchSettings: async () => {
    const { data } = await supabase.from('app_settings').select('*').order('category')
    set({ settings: data || [] })
  },

  updateSetting: async (key, value, userId) => {
    await supabase.from('app_settings').update({ value: JSON.stringify(value), updated_by: userId, updated_at: new Date().toISOString() }).eq('key', key)
    get().fetchSettings()
  },

  // ========== PLANS ==========
  fetchPlans: async () => {
    const { data } = await supabase.from('premium_plans').select('*').order('sort_order')
    set({ plans: data || [] })
  },

  updatePlan: async (id, updates) => {
    await supabase.from('premium_plans').update(updates).eq('id', id)
    get().fetchPlans()
  },

  createPlan: async (plan) => {
    await supabase.from('premium_plans').insert(plan)
    get().fetchPlans()
  },

  // ========== AUDIT ==========
  fetchAuditLog: async () => {
    const { data } = await supabase
      .from('audit_log')
      .select('*, user:user_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    set({ auditLog: data || [] })
  },

  logAction: async (userId, action, entityType, entityId, details) => {
    await supabase.from('audit_log').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details })
  },

  // ========== EVENTS ==========
  fetchEvents: async () => {
    const { data } = await supabase.from('events').select('*').order('date_start', { ascending: false })
    set({ events: data || [] })
  },

  createEvent: async (event) => {
    await supabase.from('events').insert(event)
    get().fetchEvents()
  },

  // ========== CMS ==========
  fetchCMS: async () => {
    const { data } = await supabase.from('cms_content').select('*').order('created_at', { ascending: false })
    set({ cmsContent: data || [] })
  },

  createCMSContent: async (content) => {
    await supabase.from('cms_content').insert(content)
    get().fetchCMS()
  },

  updateCMSContent: async (id, updates) => {
    await supabase.from('cms_content').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    get().fetchCMS()
  },

  // ========== LOCATIONS ==========
  fetchLocations: async () => {
    const { data } = await supabase.from('locations').select('*').order('name')
    set({ locations: data || [] })
  },

  createLocation: async (loc) => {
    await supabase.from('locations').insert(loc)
    get().fetchLocations()
  },
}))
