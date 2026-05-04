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
  locationRequests: [],
  reportedChats: [],
  cmsContent: [],
  albumStickers: [],
  payments: [],
  subscriptions: [],
  businessSubscriptions: [],
  userBlocks: [],
  notificationCampaigns: [],
  analyticsData: null,
  dailyActivity: [],
  algorithmConfig: [],
  rolePermissions: [],
  adminNotes: [],
  loading: false,
  isAdmin: false,
  adminRole: null,
  adminPermissions: [],

  // ========== AUTH ==========
  checkAdmin: async (userId) => {
    if (!userId) return false
    
    // 1. Check user_roles table
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    let role = data?.role || 'user'
    
    const allowedRoles = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']
    const isAdmin = allowedRoles.includes(role)
    
    set({ isAdmin, adminRole: role })
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
      { count: totalLocations },
      { count: totalAffiliates },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('albums').select('*', { count: 'exact', head: true }),
      supabase.from('trades').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('locations').select('*', { count: 'exact', head: true }),
      supabase.from('affiliates').select('*', { count: 'exact', head: true }),
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

    // Pending location requests
    const { count: pendingLocationRequests } = await supabase
      .from('location_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    // Reported chats (distinct)
    const { data: reportData } = await supabase
      .from('reports').select('reported_chat_id').not('reported_chat_id', 'is', null)
    const reportedChatCount = new Set(reportData?.map(r => r.reported_chat_id)).size

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
        pendingLocationRequests: pendingLocationRequests || 0,
        reportedChatCount: reportedChatCount || 0,
        totalLocations: totalLocations || 0,
        totalAffiliates: totalAffiliates || 0,
      },
      loading: false,
    })
  },

  // ========== USERS ==========
  fetchUsers: async () => {
    set({ loading: true })
    try {
      // Fetch profiles and roles separately to avoid PostgREST JOIN issues
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (pErr) throw pErr
      
      const { data: roles, error: rErr } = await supabase
        .from('user_roles')
        .select('user_id, role')
      if (rErr) throw rErr
      
      // Merge roles into profiles
      const roleMap = {}
      ;(roles || []).forEach(r => { roleMap[r.user_id] = r.role })
      const merged = (profiles || []).map(p => ({
        ...p,
        user_roles: roleMap[p.id] ? [{ role: roleMap[p.id] }] : []
      }))
      
      set({ users: merged })
    } catch (e) {
      console.error('Error fetching users:', e)
      set({ users: [] })
    } finally {
      set({ loading: false })
    }
  },

  updateUser: async (userId, updates) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      console.error('Error updating user:', error)
      return error
    }
    await get().fetchUsers()
  },

  setUserRole: async (userId, role) => {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    if (error) {
      console.error('Error setting user role:', error)
      return error
    }
    await get().fetchUsers()
  },

  toggleUserBlock: async (userId, blocked) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: blocked }).eq('id', userId)
    if (error) console.error('Error toggling block:', error)
    await get().fetchUsers()
  },

  toggleUserPremium: async (userId, premium) => {
    const { error } = await supabase.from('profiles').update({ is_premium: premium }).eq('id', userId)
    if (error) console.error('Error toggling premium:', error)
    await get().fetchUsers()
  },

  toggleUserVerified: async (userId, verified) => {
    const { error } = await supabase.from('profiles').update({ is_verified: verified }).eq('id', userId)
    if (error) console.error('Error toggling verified:', error)
    await get().fetchUsers()
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

  // ========== ALBUM STICKERS ==========
  fetchAlbumStickers: async (albumId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('album_stickers')
      .select('*')
      .eq('album_id', albumId)
      .order('sticker_number')
    set({ albumStickers: data || [], loading: false })
  },

  upsertAlbumStickers: async (stickers) => {
    const { error } = await supabase
      .from('album_stickers')
      .upsert(stickers, { onConflict: 'album_id,sticker_number' })
    return error
  },

  deleteAlbumSticker: async (id) => {
    const { error } = await supabase
      .from('album_stickers')
      .delete()
      .eq('id', id)
    return error
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
    try {
      const { data, error } = await supabase.from('app_settings').select('*').order('category')
      if (error) { console.error('fetchSettings error:', error); }
      set({ settings: data || [] })
    } catch (e) {
      console.error('fetchSettings exception:', e)
      set({ settings: [] })
    }
  },

  updateSetting: async (key, value, userId) => {
    const payload = { value: typeof value === 'string' ? value : JSON.stringify(value), updated_by: userId, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('app_settings').update(payload).eq('key', key)
    if (error) {
      console.error('updateSetting error:', error)
      // Fallback: try upsert
      const { error: upsertErr } = await supabase.from('app_settings').upsert({ key, ...payload }, { onConflict: 'key' })
      if (upsertErr) console.error('updateSetting upsert fallback error:', upsertErr)
    }
    get().logAction(userId, 'UPDATE_SETTING', 'app_setting', key, { value })
    get().fetchSettings()
  },

  // ========== PLANS (user plans from plan_rules) ==========
  fetchPlans: async () => {
    const { data } = await supabase.from('plan_rules').select('*').order('priority_boost')
    set({ plans: data || [] })
  },

  updatePlan: async (id, updates) => {
    const { error } = await supabase.from('plan_rules').update(updates).eq('id', id)
    if (error) console.error('Error updating plan:', error)
    get().fetchPlans()
  },

  createPlan: async (plan) => {
    await supabase.from('plan_rules').insert(plan)
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

  updateLocation: async (id, updates) => {
    await supabase.from('locations').update(updates).eq('id', id)
    get().fetchLocations()
  },

  deleteLocation: async (id) => {
    await supabase.from('locations').delete().eq('id', id)
    get().fetchLocations()
  },

  // ========== LOCATION REQUESTS ==========
  fetchLocationRequests: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('location_requests')
      .select('*, profile:user_id(name, email)')
      .order('created_at', { ascending: false })
    set({ locationRequests: data || [], loading: false })
  },

  approveLocationRequest: async (requestId, adminId) => {
    try {
      const { data: request, error: fetchErr } = await supabase
        .from('location_requests')
        .select('*, profile:user_id(name, email)')
        .eq('id', requestId)
        .single()
      
      if (fetchErr || !request) throw new Error('No se encontró la solicitud')

      // 1. Create location
      const { error: locError } = await supabase.from('locations').insert({
        name: request.name,
        address: request.address,
        city: request.city,
        department: request.department,
        lat: request.lat,
        lng: request.lng,
        whatsapp: request.whatsapp,
        business_plan: request.business_plan || 'gratis',
        owner_user_id: request.user_id,
        is_active: true,
        type: 'store'
      })

      if (locError) throw locError

      // 2. Update request status
      const { error: reqErr } = await supabase
        .from('location_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
      
      if (reqErr) throw reqErr
      
      // 3. Update user profile to grant business access (only if user exists)
      if (request.user_id) {
        const { error: profErr } = await supabase.from('profiles').update({
          business_access: true,
          business_status: 'approved',
          account_type: 'business',
          plan_name: request.business_plan || 'gratis'
        }).eq('id', request.user_id)
        
        if (profErr) console.error('Error updating profile:', profErr)
      }
      
      // 4. Log action
      get().logAction(adminId, 'APPROVE_LOCATION', 'location_request', requestId, { name: request.name })
      
      // 5. Send Email (Edge Function)
      try {
        const targetEmail = request.applicant_email || request.profile?.email
        if (targetEmail) {
          await supabase.functions.invoke('send-email', {
            body: { 
              to: targetEmail,
              subject: 'Tu local fue aprobado 🎉',
              template: 'business_approved',
              data: {
                name: request.applicant_name || request.profile?.name || 'Comerciante',
                plan: request.business_plan === 'legend' ? 'Plan Legend' :
                      request.business_plan === 'dominio' ? 'Plan Dominio' : 
                      request.business_plan === 'turbo' ? 'Plan Turbo' : 'Plan Gratuito',
                link: 'https://figusuy.vercel.app/login?type=business'
              }
            }
          })
        }
      } catch (emailErr) {
        console.error('Error sending email:', emailErr)
      }

      await get().fetchLocationRequests()
      await get().fetchLocations()
      set({ loading: false })
      return null // Success
    } catch (err) {
      console.error('Approval failed:', err)
      set({ loading: false })
      return err
    }
  },

  rejectLocationRequest: async (requestId, reason, adminId) => {
    await supabase.from('location_requests').update({ 
      status: 'rejected', 
      rejection_reason: reason 
    }).eq('id', requestId)
    
    get().logAction(adminId, 'REJECT_LOCATION', 'location_request', requestId, { reason })
    get().fetchLocationRequests()
  },

  // ========== CHAT MODERATION ==========
  fetchReportedChats: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:reporter_id(name), chat:reported_chat_id(*)')
      .not('reported_chat_id', 'is', null)
      .order('created_at', { ascending: false })
    set({ reportedChats: data || [], loading: false })
  },

  closeChatReport: async (reportId, adminId) => {
    await supabase.from('reports').update({ status: 'resolved', resolved_by: adminId, resolved_at: new Date().toISOString() }).eq('id', reportId)
    get().logAction(adminId, 'CLOSE_CHAT_REPORT', 'report', reportId, {})
    get().fetchReportedChats()
  },

  escalateChatReport: async (reportId, adminId) => {
    await supabase.from('reports').update({ status: 'escalated', resolved_by: adminId }).eq('id', reportId)
    get().logAction(adminId, 'ESCALATE_CHAT_REPORT', 'report', reportId, {})
    get().fetchReportedChats()
  },

  // ========== PAYMENTS ==========
  fetchPayments: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('payments')
      .select('*, user:user_id(name, email), reviewer:reviewed_by(name)')
      .order('created_at', { ascending: false })
    set({ payments: data || [], loading: false })
  },

  updatePayment: async (id, updates, adminId) => {
    await supabase.from('payments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    get().logAction(adminId, 'UPDATE_PAYMENT', 'payment', id, updates)
    get().fetchPayments()
  },

  reviewPayment: async (id, notes, adminId) => {
    await supabase.from('payments').update({ admin_notes: notes, reviewed_by: adminId, reviewed_at: new Date().toISOString() }).eq('id', id)
    get().logAction(adminId, 'REVIEW_PAYMENT', 'payment', id, { notes })
    get().fetchPayments()
  },

  // ========== SUBSCRIPTIONS ==========
  fetchSubscriptions: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('subscriptions')
      .select('*, user:user_id(name, email), payment:payment_id(amount, status, currency)')
      .order('created_at', { ascending: false })
    set({ subscriptions: data || [], loading: false })
  },

  updateSubscription: async (id, updates, adminId) => {
    await supabase.from('subscriptions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    get().logAction(adminId, 'UPDATE_SUBSCRIPTION', 'subscription', id, updates)
    get().fetchSubscriptions()
  },

  // ========== BUSINESS SUBSCRIPTIONS ==========
  fetchBusinessSubscriptions: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('business_subscriptions')
      .select('*, location:location_id(name), owner:owner_id(name, email)')
      .order('created_at', { ascending: false })
    set({ businessSubscriptions: data || [], loading: false })
  },

  // ========== USER BLOCKS ==========
  fetchUserBlocks: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('user_blocks')
      .select('*, user:user_id(name, email), blocker:blocked_by(name), unblocker:unblocked_by(name)')
      .order('created_at', { ascending: false })
    set({ userBlocks: data || [], loading: false })
  },

  blockUser: async (userId, reason, blockType, adminId, expiresAt) => {
    await supabase.from('user_blocks').insert({ user_id: userId, blocked_by: adminId, reason, block_type: blockType, expires_at: expiresAt || null })
    await supabase.from('profiles').update({ is_blocked: true }).eq('id', userId)
    get().logAction(adminId, 'BLOCK_USER', 'user', userId, { reason, blockType })
    get().fetchUserBlocks()
  },

  unblockUser: async (blockId, userId, reason, adminId) => {
    await supabase.from('user_blocks').update({ is_active: false, unblocked_at: new Date().toISOString(), unblocked_by: adminId, unblock_reason: reason }).eq('id', blockId)
    await supabase.from('profiles').update({ is_blocked: false }).eq('id', userId)
    get().logAction(adminId, 'UNBLOCK_USER', 'user', userId, { reason })
    get().fetchUserBlocks()
  },

  // ========== ANALYTICS ==========
  fetchAnalytics: async () => {
    set({ loading: true })
    const { data: summary } = await supabase.rpc('get_analytics_summary')
    const { data: daily } = await supabase.rpc('get_daily_activity', { days_back: 14 })
    set({ analyticsData: summary || {}, dailyActivity: daily || [], loading: false })
  },

  // ========== ALGORITHM CONFIG ==========
  fetchAlgorithmConfig: async () => {
    try {
      const { data, error } = await supabase.from('algorithm_config').select('*').order('category')
      if (error) throw error
      set({ algorithmConfig: data || [] })
    } catch (e) {
      console.error('fetchAlgorithmConfig standard query failed, trying RPC:', e)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_get_algorithm_config')
      if (rpcErr) {
        console.error('RPC also failed:', rpcErr)
        set({ algorithmConfig: [] })
      } else {
        set({ algorithmConfig: rpcData || [] })
      }
    }
  },

  updateAlgorithmConfig: async (key, value, adminId) => {
    try {
      const updates = { config_value: typeof value === 'string' ? value : JSON.stringify(value), updated_by: adminId, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('algorithm_config').update(updates).eq('config_key', key)
      if (error) {
        console.error('updateAlgorithmConfig error:', error)
        // Try upsert fallback
        const { error: upsertErr } = await supabase.from('algorithm_config').upsert({ config_key: key, ...updates }, { onConflict: 'config_key' })
        if (upsertErr) console.error('updateAlgorithmConfig upsert fallback error:', upsertErr)
      }
    } catch (e) {
      console.error('updateAlgorithmConfig exception:', e)
    }
    get().logAction(adminId, 'UPDATE_ALGORITHM', 'algorithm_config', key, { value })
    get().fetchAlgorithmConfig()
  },

  // ========== NOTIFICATION CAMPAIGNS ==========
  fetchNotificationCampaigns: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('notification_campaigns')
      .select('*, sender:sent_by(name)')
      .order('created_at', { ascending: false })
    set({ notificationCampaigns: data || [], loading: false })
  },

  createNotificationCampaign: async (campaign, adminId) => {
    const { error } = await supabase.from('notification_campaigns').insert({ ...campaign, sent_by: adminId, status: 'sent', sent_at: new Date().toISOString() })
    if (!error) {
      // Also insert into notifications for in-app delivery
      await supabase.from('notifications').insert({ title: campaign.title, body: campaign.body, type: campaign.type, is_global: campaign.segment === 'all', metadata: { segment: campaign.segment, campaign: true } })
      get().logAction(adminId, 'SEND_CAMPAIGN', 'notification_campaign', null, { title: campaign.title, segment: campaign.segment })
    }
    get().fetchNotificationCampaigns()
    return error
  },

  // ========== ADMIN NOTES ==========
  fetchAdminNotes: async (entityType, entityId) => {
    const { data } = await supabase
      .from('admin_notes')
      .select('*, author:author_id(name)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    set({ adminNotes: data || [] })
  },

  addAdminNote: async (entityType, entityId, note, adminId) => {
    await supabase.from('admin_notes').insert({ entity_type: entityType, entity_id: entityId, note, author_id: adminId })
    get().fetchAdminNotes(entityType, entityId)
  },

  // ========== ROLE PERMISSIONS ==========
  fetchRolePermissions: async (role) => {
    const { data } = await supabase.from('role_permissions').select('permission').eq('role', role)
    const perms = (data || []).map(d => d.permission)
    set({ adminPermissions: perms })
    return perms
  },

  hasPermission: (permission) => {
    const { adminRole, adminPermissions } = get()
    if (adminRole === 'god_admin') return true
    return adminPermissions.includes(permission)
  },

  // ========== RANKING ==========
  userRankings: [],
  businessRankings: [],

  fetchUserRankings: async () => {
    const { data } = await supabase
      .from('user_rankings')
      .select('*, user:user_id(name, email, avatar_url, is_premium, plan_name)')
      .order('final_user_rank', { ascending: false })
    set({ userRankings: data || [] })
  },

  fetchBusinessRankings: async () => {
    const { data } = await supabase
      .from('business_rankings')
      .select('*, location:location_id(name, business_plan, type, is_active)')
      .order('final_business_rank', { ascending: false })
    set({ businessRankings: data || [] })
  },

  getUserRanking: async (userId) => {
    const { data } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return data
  },

  getBusinessRanking: async (locationId) => {
    const { data } = await supabase
      .from('business_rankings')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle()
    return data
  },

  calculateUserRanking: async (userId, adminId) => {
    const { data, error } = await supabase.rpc('calculate_user_ranking', { target_user_id: userId })
    if (error) { console.error('calculateUserRanking error:', error); return null }
    if (adminId) get().logAction(adminId, 'RECALCULATE_USER_RANK', 'user', userId, data)
    return data
  },

  calculateBusinessRanking: async (locationId, adminId) => {
    const { data, error } = await supabase.rpc('calculate_business_ranking', { target_location_id: locationId })
    if (error) { console.error('calculateBusinessRanking error:', error); return null }
    if (adminId) get().logAction(adminId, 'RECALCULATE_BUSINESS_RANK', 'location', locationId, data)
    return data
  },

  recalculateAllRankings: async (adminId) => {
    set({ loading: true })
    const { data, error } = await supabase.rpc('recalculate_all_rankings')
    set({ loading: false })
    if (error) { console.error('recalculateAllRankings error:', error); return null }
    if (adminId) get().logAction(adminId, 'RECALCULATE_ALL_RANKINGS', 'system', null, data)
    await get().fetchUserRankings()
    await get().fetchBusinessRankings()
    return data
  },

  // ========== SPONSORED (promos) ==========
  fetchSponsoredPlacements: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('sponsored_placements')
      .select('*, images:sponsored_images(*), location:location_id(name)')
      .order('created_at', { ascending: false })
    set({ events: data || [], loading: false })
  },

  fetchSponsoredMetrics: async (placementId) => {
    const { data } = await supabase
      .from('sponsored_events')
      .select('event_type')
      .eq('sponsored_placement_id', placementId)
    const impressions = (data || []).filter(e => e.event_type === 'impression').length
    const clicks = (data || []).filter(e => e.event_type === 'click').length
    const whatsapp = (data || []).filter(e => e.event_type === 'whatsapp_click').length
    const map = (data || []).filter(e => e.event_type === 'map_click').length
    return { impressions, clicks, whatsapp, map, ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0' }
  },
}))
