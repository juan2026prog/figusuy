import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const ALBUM_FALLBACK_DROP_ORDER = [
  'has_sticker_codes',
  'has_sticker_names',
  'has_sticker_images',
  'numbering_type',
  'has_detailed_stickers',
  'special_codes',
  'images',
  'cover_url',
  'editorial',
  'country',
  'category',
  'status',
]

const isAlbumSchemaError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  const details = String(error?.details || '').toLowerCase()
  const hint = String(error?.hint || '').toLowerCase()
  const raw = `${message} ${details} ${hint}`

  return (
    error?.status === 400 ||
    raw.includes('column') ||
    raw.includes('schema cache') ||
    raw.includes('could not find') ||
    raw.includes('does not exist')
  )
}

const extractMissingColumn = (error) => {
  const raw = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  const patterns = [
    /column ['"]?([a-zA-Z0-9_]+)['"]?/i,
    /Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i,
  ]

  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

const stripUndefined = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))

const buildAlbumPayload = (album) => {
  const payload = {
    ...album,
    year: parseInt(album.year) || null,
    total_stickers: parseInt(album.total_stickers) || 0,
    cover_url: album.cover_url || album.images?.[0] || null,
    images: Array.isArray(album.images) ? album.images : (album.cover_url ? [album.cover_url] : [])
  }
  return stripUndefined(payload)
}

const writeAlbumWithFallback = async (mode, payload, id) => {
  let currentPayload = buildAlbumPayload(payload)
  let dropIndex = 0

  for (let attempt = 0; attempt < ALBUM_FALLBACK_DROP_ORDER.length + 2; attempt += 1) {
    const query = mode === 'insert'
      ? supabase.from('albums').insert(currentPayload)
      : supabase.from('albums').update(currentPayload).eq('id', id)

    const { error } = await query
    if (!error) return null
    if (!isAlbumSchemaError(error)) return error

    const missingColumn = extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(currentPayload, missingColumn)) {
      const { [missingColumn]: _removed, ...rest } = currentPayload
      currentPayload = rest
      continue
    }

    const nextKey = ALBUM_FALLBACK_DROP_ORDER.slice(dropIndex).find((key) =>
      Object.prototype.hasOwnProperty.call(currentPayload, key)
    )

    if (!nextKey) return error

    dropIndex = ALBUM_FALLBACK_DROP_ORDER.indexOf(nextKey) + 1
    const { [nextKey]: _removed, ...rest } = currentPayload
    currentPayload = rest
  }

  return new Error('No se pudo guardar el album con el schema actual.')
}

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
  exchangeCompletions: [],
  exchangeCompletionMetrics: null,
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
  influencerApplications: [],
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
      .maybeSingle()
    
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
      { count: totalInfluencers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('albums').select('*', { count: 'exact', head: true }),
      supabase.from('exchange_completions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
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

    const { count: pendingInfluencerApps } = await supabase
      .from('influencer_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')

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
        totalInfluencers: totalInfluencers || 0,
        pendingInfluencerApps: pendingInfluencerApps || 0,
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

  setUserRole: async (userId, role, userProfile, adminId = null) => {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    if (error) {
      console.error('Error setting user role:', error)
      return error
    }

    if (adminId) {
      await get().logAction(adminId, 'ROLE_CHANGE', 'user', userId, {
        new_role: role,
        user_name: userProfile?.name
      })
    }
    
    if (role === 'influencer' && userId) {
      const { data: existing } = await supabase.from('affiliates').select('id, invitation_code').eq('user_id', userId).single()
      let affiliateId = existing?.id
      let inviteCode = existing?.invitation_code

      if (!existing) {
        inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        const handle = userProfile?.name ? userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') : `user${inviteCode}`
        
        const { data: newAff, error: affErr } = await supabase.from('affiliates').insert({
          user_id: userId,
          name: userProfile?.name || 'Nuevo Influencer',
          handle: handle,
          category: 'other',
          status: 'activo',
          avatar_url: userProfile?.avatar_url,
          contact_email: userProfile?.email,
          invitation_code: inviteCode
        }).select().single()
        
        if (!affErr && newAff) {
          affiliateId = newAff.id
        }
      }

      // Automatically create a default campaign if none exists
      if (affiliateId) {
        const { data: campaigns } = await supabase.from('affiliate_campaigns').select('id').eq('affiliate_id', affiliateId)
        if (!campaigns?.length) {
          const { data: campaign, error: campErr } = await supabase.from('affiliate_campaigns').insert({
            affiliate_id: affiliateId,
            code: inviteCode,
            slug: inviteCode.toLowerCase(),
            status: 'activo'
          }).select().single()

          if (!campErr && campaign) {
            // Also create a default commission rule (e.g., 5% or fixed amount)
            await supabase.from('affiliate_commissions').insert({
              campaign_id: campaign.id,
              commission_type: 'percent',
              commission_value: 5,
              is_active: true
            })
          }
        }
      }
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

  addAlbumToUser: async (userId, albumId) => {
    const { error } = await supabase.from('user_albums').upsert({ user_id: userId, album_id: albumId }, { onConflict: 'user_id,album_id' })
    if (error) console.error('Error adding album to user:', error)
    return error
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
    const error = await writeAlbumWithFallback('insert', album)
    if (!error) get().fetchAllAlbums()
    return error
  },

  updateAlbum: async (id, updates) => {
    const error = await writeAlbumWithFallback('update', updates, id)
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
      const requestType = request.metadata?.request_type || 'store'
      const isSuggestedPoint = requestType === 'suggested'
      const { error: locError } = await supabase.from('locations').insert(
        isSuggestedPoint
          ? {
              name: request.name,
              address: request.address,
              city: request.city,
              department: request.department,
              neighborhood: request.neighborhood,
              lat: request.lat,
              lng: request.lng,
              business_plan: 'gratis',
              owner_user_id: null,
              is_active: true,
              type: 'meetup',
              description: request.metadata?.notes || request.notes || 'Punto sugerido por la comunidad.',
              metadata: {
                request_type: 'suggested',
                display_type: 'Punto de intercambio',
                allows_exchange: true,
                suggested_by_user_id: request.user_id || null
              }
            }
          : {
              name: request.name,
              address: request.address,
              city: request.city,
              department: request.department,
              neighborhood: request.neighborhood,
              lat: request.lat,
              lng: request.lng,
              whatsapp: request.whatsapp,
              business_plan: request.business_plan || 'gratis',
              owner_user_id: request.user_id,
              is_active: true,
              type: 'store'
            }
      )

      if (locError) throw locError

      // 2. Update request status
      const { error: reqErr } = await supabase
        .from('location_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
      
      if (reqErr) throw reqErr
      
      // 3. Update user profile to grant business access (only if user exists)
      if (!isSuggestedPoint && request.user_id) {
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
        if (targetEmail && !isSuggestedPoint) {
          await supabase.functions.invoke('send-email', {
            body: { 
              to: targetEmail,
              subject: 'Tu local fue aprobado ðŸŽ‰',
              template: 'business_approved',
              data: {
                name: request.applicant_name || request.profile?.name || 'Comerciante',
                plan: (request.business_plan === 'legend' || request.business_plan === 'partner_store') ? 'Collector Hub' :
                      request.business_plan === 'dominio' ? 'Plan Conversion' : 
                      request.business_plan === 'turbo' ? 'Plan Radar' : 'Plan Gratuito',
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

  // ========== EXCHANGE COMPLETION ==========
  fetchExchangeCompletions: async () => {
    set({ loading: true })
    const [listRes, metricsRes] = await Promise.all([
      supabase
        .from('exchange_completion_admin_v')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(250),
      supabase.rpc('admin_get_exchange_completion_metrics'),
    ])

    set({
      exchangeCompletions: listRes.data || [],
      exchangeCompletionMetrics: metricsRes.data?.error ? null : (metricsRes.data || null),
      loading: false,
    })
  },

  updateExchangeReviewStatus: async (exchangeId, adminReviewStatus, adminId) => {
    const { error } = await supabase
      .from('exchange_completions')
      .update({ admin_review_status: adminReviewStatus, updated_at: new Date().toISOString() })
      .eq('id', exchangeId)

    if (error) {
      console.error('Error updating exchange review status:', error)
      return error
    }

    if (adminId) {
      get().logAction(adminId, 'UPDATE_EXCHANGE_REVIEW', 'exchange_completion', exchangeId, { adminReviewStatus })
    }
    await get().fetchExchangeCompletions()
    return null
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

  // ========== INFLUENCER APPLICATIONS ==========
  fetchInfluencerApplications: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('influencer_applications')
      .select('*, profile:user_id(name, email, avatar_url)')
      .order('created_at', { ascending: false })
    if (!error) set({ influencerApplications: data || [] })
    set({ loading: false })
  },

  updateInfluencerApplication: async (id, status, notes = '', adminId = null) => {
    const { data: app, error: fetchErr } = await supabase
      .from('influencer_applications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchErr || !app) return { error: 'Application not found' }

    const { error } = await supabase
      .from('influencer_applications')
      .update({ status, admin_notes: notes })
      .eq('id', id)

    if (error) return { error }

    if (status === 'approved' && app.user_id) {
      const roleResult = await get().setUserRole(app.user_id, 'influencer', {
        name: app.full_name,
        email: app.email
      }, adminId)
      
      if (roleResult && roleResult.message) return { error: roleResult.message }
      
      // Update the influencer handle/category if provided in application
      const { data: affiliate } = await supabase.from('affiliates').select('*').eq('user_id', app.user_id).single()
      if (affiliate) {
        // Extract a handle from social urls if available
        const rawHandle = app.instagram_url || app.tiktok_url || app.youtube_url || affiliate.handle
        const cleanHandle = rawHandle.split('/').pop().replace('@', '').toLowerCase() || affiliate.handle

        await supabase.from('affiliates').update({
          handle: cleanHandle,
          category: app.content_type || 'creator',
          notes: `Aprobado desde solicitud. Propuesta: ${app.message || 'Sin mensaje'}. ${notes}`,
          social_links: {
            instagram: app.instagram_url,
            tiktok: app.tiktok_url,
            youtube: app.youtube_url,
            other: app.other_social_url
          }
        }).eq('id', affiliate.id)
      }

      // Send Smart Notification
      await supabase.from('smart_notifications').insert({
        user_id: app.user_id,
        trigger_key: 'influencer_approved',
        type: 'system',
        title: '¡Solicitud de Influencer Aprobada!',
        message: 'Bienvenido al equipo FigusUY. Ya podes empezar a usar tu código.',
        action_url: '/influencer',
        metadata: { application_id: id }
      })
    } else if (status === 'rejected' && app.user_id) {
      // Send Smart Notification for rejection
      await supabase.from('smart_notifications').insert({
        user_id: app.user_id,
        trigger_key: 'influencer_rejected',
        type: 'system',
        title: 'Actualización de Solicitud',
        message: 'Hemos revisado tu solicitud de influencer. Podes contactarnos para mas info.',
        metadata: { application_id: id, reason: notes }
      })
    }

    if (adminId) {
      get().logAction(adminId, `INFLUENCER_APP_${status.toUpperCase()}`, 'influencer_application', id, { notes })
    }

    await get().fetchInfluencerApplications()
    return { error: null }
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
