import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  buildAttributedUserRecord,
  buildInfluencerTierSnapshot,
  DEFAULT_TIER_ENGINE_SETTINGS,
  normalizeTierEngineSettings,
  summarizeAttributedUsers,
} from '../lib/influencerTierEngine'

const DEFAULT_ADMIN_ROLES = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']

const TIER_SETTINGS_SELECT = `
  id,
  singleton_key,
  activation_weight,
  conversion_weight,
  quality_weight,
  activation_rules,
  conversion_rules,
  quality_rules,
  tier_thresholds,
  quality_minimums,
  downgrade_rules,
  upgrade_rules,
  tier_commissions,
  updated_at,
  updated_by
`

const TIER_SNAPSHOT_SELECT = `
  affiliate_id,
  affiliate_name,
  computed_tier,
  effective_tier,
  manual_override_tier,
  lock_auto_upgrade,
  lock_auto_downgrade,
  activation_count,
  conversion_count,
  quality_score,
  activation_score,
  conversion_score,
  tier_score,
  recent_activation_count,
  recent_conversion_count,
  current_user_commission,
  current_business_commission,
  next_tier,
  next_tier_progress,
  next_tier_gap,
  tier_2_progress,
  tier_3_progress,
  tier_2_gap,
  tier_3_gap,
  performance_health,
  upgrade_opportunity,
  downgrade_risk,
  inactivity_days,
  last_activity_at,
  downgrade_reason,
  metrics_payload,
  computed_at,
  updated_at
`

const mapTierSettingsRow = (row) => normalizeTierEngineSettings({
  activation_weight: row?.activation_weight,
  conversion_weight: row?.conversion_weight,
  quality_weight: row?.quality_weight,
  activation_rules: row?.activation_rules,
  conversion_rules: row?.conversion_rules,
  quality_rules: row?.quality_rules,
  tier_thresholds: row?.tier_thresholds,
  quality_minimums: row?.quality_minimums,
  downgrade_rules: row?.downgrade_rules,
  upgrade_rules: row?.upgrade_rules,
  tier_commissions: row?.tier_commissions,
})

const buildTierSettingsPayload = (settings, userId) => {
  const normalized = normalizeTierEngineSettings(settings)
  return {
    singleton_key: 'default',
    activation_weight: normalized.activation_weight,
    conversion_weight: normalized.conversion_weight,
    quality_weight: normalized.quality_weight,
    activation_rules: normalized.activation_rules,
    conversion_rules: normalized.conversion_rules,
    quality_rules: normalized.quality_rules,
    tier_thresholds: normalized.tier_thresholds,
    quality_minimums: normalized.quality_minimums,
    downgrade_rules: normalized.downgrade_rules,
    upgrade_rules: normalized.upgrade_rules,
    tier_commissions: normalized.tier_commissions,
    updated_at: new Date().toISOString(),
    updated_by: userId || null,
  }
}

const mergeTierSnapshot = (current, next) => ({
  ...(current || {}),
  ...(next || {}),
})

export const useInfluencerStore = create((set, get) => ({
  // State
  affiliates: [],
  campaigns: [],
  benefits: [],
  commissions: [],
  conversions: [],
  payments: [],
  payoutAccount: null,
  balance: 0,
  tierEngineSettings: DEFAULT_TIER_ENGINE_SETTINGS,
  tierSnapshots: [],
  loading: false,
  error: null,

  // =====================
  // AFFILIATES CRUD
  // =====================
  fetchInfluencers: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })
    set({ affiliates: data || [], loading: false, error: error?.message })
  },

  createInfluencer: async (affiliate) => {
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data, error } = await supabase
      .from('affiliates')
      .insert({ ...affiliate, invitation_code: inviteCode })
      .select()
      .single()
    if (!error && data) {
      set(s => ({ affiliates: [data, ...s.affiliates] }))
    }
    return { data, error }
  },

  updateInfluencer: async (id, updates) => {
    const { data, error } = await supabase
      .from('affiliates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ affiliates: s.affiliates.map(a => a.id === id ? data : a) }))
    }
    return { data, error }
  },

  deleteInfluencer: async (id) => {
    const { error } = await supabase.from('affiliates').delete().eq('id', id)
    if (!error) set(s => ({ affiliates: s.affiliates.filter(a => a.id !== id) }))
    return { error }
  },

  // =====================
  // CAMPAIGNS CRUD
  // =====================
  fetchCampaigns: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliate_campaigns')
      .select('*, affiliates(name, handle, category, avatar_url)')
      .order('created_at', { ascending: false })
    set({ campaigns: data || [], loading: false, error: error?.message })
  },

  createCampaign: async (campaign) => {
    const { data, error } = await supabase
      .from('affiliate_campaigns')
      .insert(campaign)
      .select('*, affiliates(name, handle, category, avatar_url)')
      .single()
    if (!error && data) {
      set(s => ({ campaigns: [data, ...s.campaigns] }))
    }
    return { data, error }
  },

  updateCampaign: async (id, updates) => {
    const { data, error } = await supabase
      .from('affiliate_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, affiliates(name, handle, category, avatar_url)')
      .single()
    if (!error && data) {
      set(s => ({ campaigns: s.campaigns.map(c => c.id === id ? data : c) }))
    }
    return { data, error }
  },

  duplicateCampaign: async (campaignId) => {
    const original = get().campaigns.find(c => c.id === campaignId)
    if (!original) return { error: { message: 'Campaign not found' } }
    
    const newCode = original.code + '_COPY'
    const newSlug = original.slug + '-copy'
    const { affiliates, id, created_at, updated_at, total_clicks, total_conversions, total_revenue, ...rest } = original
    
    return get().createCampaign({
      ...rest,
      code: newCode,
      slug: newSlug,
      total_clicks: 0,
      total_conversions: 0,
      total_revenue: 0,
      status: 'pausado'
    })
  },

  // =====================
  // BENEFITS CRUD
  // =====================
  fetchBenefits: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliate_benefits')
      .select('*, affiliate_campaigns(code, affiliate_id, affiliates(name, handle))')
      .order('created_at', { ascending: false })
    set({ benefits: data || [], loading: false, error: error?.message })
  },

  createBenefit: async (benefit) => {
    const { data, error } = await supabase
      .from('affiliate_benefits')
      .insert(benefit)
      .select('*, affiliate_campaigns(code, affiliate_id, affiliates(name, handle))')
      .single()
    if (!error && data) {
      set(s => ({ benefits: [data, ...s.benefits] }))
    }
    return { data, error }
  },

  updateBenefit: async (id, updates) => {
    const { data, error } = await supabase
      .from('affiliate_benefits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, affiliate_campaigns(code, affiliate_id, affiliates(name, handle))')
      .single()
    if (!error && data) {
      set(s => ({ benefits: s.benefits.map(b => b.id === id ? data : b) }))
    }
    return { data, error }
  },

  // =====================
  // COMMISSIONS CRUD
  // =====================
  fetchCommissions: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select('*, affiliate_campaigns(code, affiliate_id, affiliates(name, handle), total_conversions, total_revenue)')
      .order('created_at', { ascending: false })
    set({ commissions: data || [], loading: false, error: error?.message })
  },

  createCommission: async (commission) => {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .insert(commission)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ commissions: [data, ...s.commissions] }))
    }
    return { data, error }
  },

  updateCommission: async (id, updates) => {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set(s => ({ commissions: s.commissions.map(c => c.id === id ? data : c) }))
    }
    return { data, error }
  },

  // =====================
  // CONVERSIONS
  // =====================
  fetchConversions: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliate_conversions')
      .select('*, affiliates(name, handle), affiliate_campaigns(code)')
      .order('created_at', { ascending: false })
    set({ conversions: data || [], loading: false, error: error?.message })
  },

  recordConversion: async (userId, planName, value = 0) => {
    const campaignId = localStorage.getItem('figus_ref_campaign')
    const affiliateId = localStorage.getItem('figus_ref_affiliate')
    const code = localStorage.getItem('figus_ref_code')

    if (!campaignId || !affiliateId) return { error: 'No referral data found' }

    // Validar que el valor no sea negativo
    const safeValue = Math.max(0, Number(value) || 0)

    // Check if already recorded for this user/campaign
    const { data: existing } = await supabase
      .from('affiliate_conversions')
      .select('id')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .single()

    if (existing) return { error: 'Conversion already recorded' }

    // Get commission rules
    const { data: commRule } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .single()

    let commissionAmount = 0
    if (commRule && safeValue > 0) {
      // Basic calculation for now (percent)
      const rate = Math.min(Math.max(Number(commRule.commission_value || 5), 0), 100) / 100
      commissionAmount = Math.max(0, safeValue * rate)
    }

    const { data, error } = await supabase
      .from('affiliate_conversions')
      .insert({
        campaign_id: campaignId,
        affiliate_id: affiliateId,
        user_id: userId,
        conversion_value: safeValue,
        commission_amount: commissionAmount,
        plan_purchased: planName,
        status: 'completado'
      })
      .select()
      .single()

    if (!error) {
      // Clean up attribution after successful conversion
      localStorage.removeItem('figus_ref_campaign')
      localStorage.removeItem('figus_ref_affiliate')
      localStorage.removeItem('figus_ref_code')
      localStorage.removeItem('figus_ref_ts')
    }

    return { data, error }
  },

  checkAndProcessReferral: async (userId) => {
    const code = localStorage.getItem('figus_ref_code')
    const campaignId = localStorage.getItem('figus_ref_campaign')
    if (!campaignId || !userId) return

    // Limpiar localStorage PRIMERO para evitar re-ejecución en reloads
    localStorage.removeItem('figus_ref_campaign')
    localStorage.removeItem('figus_ref_affiliate')
    localStorage.removeItem('figus_ref_code')
    localStorage.removeItem('figus_ref_ts')

    // 1. Record conversion (acquisition)
    const { data: conv, error: convErr } = await get().recordConversion(userId, 'signup', 0)
    if (convErr) {
      console.warn('Conversion recording skipped (probably already exists):', convErr)
      // Si la conversión ya existía, NO aplicar beneficio de nuevo
      return
    }
    
    // 2. Apply benefit SOLO si la conversión fue nueva
    try {
      const { data: campaign } = await get().resolveCode(code)
      const benefit = (campaign?.affiliate_benefits || []).find(b => b.is_active)
      
      if (benefit && benefit.benefit_type === 'premium_time') {
        const days = Number(benefit.benefit_value) || 30
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + days)
        
        await supabase.from('profiles').update({
          is_premium: true,
          plan_name: 'pro',
          premium_until: expiresAt.toISOString()
        }).eq('id', userId)
        
        console.log(`Benefit applied: ${days} days of PRO for user ${userId}`)
      }
    } catch (err) {
      console.error('Error applying referral benefit:', err)
    }
  },

  // =====================
  // PAYMENTS CRUD
  // =====================
  fetchPayments: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliate_payments')
      .select('*, affiliates(name, handle)')
      .order('created_at', { ascending: false })
    set({ payments: data || [], loading: false, error: error?.message })
  },

  createPayment: async (payment) => {
    const { data, error } = await supabase
      .from('affiliate_payments')
      .insert(payment)
      .select('*, affiliates(name, handle)')
      .single()
    if (!error && data) {
      set(s => ({ payments: [data, ...s.payments] }))
    }
    return { data, error }
  },

  updatePayment: async (id, updates) => {
    const { data, error } = await supabase
      .from('affiliate_payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, affiliates(name, handle)')
      .single()
    if (!error && data) {
      set(s => ({ payments: s.payments.map(p => p.id === id ? data : p) }))
    }
    return { data, error }
  },

  // =====================
  // CLICKS / TRACKING
  // =====================
  fetchClicks: async (campaignId) => {
    const query = supabase
      .from('affiliate_clicks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (campaignId) query.eq('campaign_id', campaignId)
    const { data, error } = await query
    set({ clicks: data || [], error: error?.message })
  },

  trackClick: async (campaignId, affiliateId, source = 'link') => {
    await supabase.from('affiliate_clicks').insert({
      campaign_id: campaignId,
      affiliate_id: affiliateId,
      source,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null
    })
    // Try to increment clicks (atomic)
    const { error: rpcError } = await supabase.rpc('increment_campaign_clicks', { cid: campaignId })
    if (rpcError) {
      console.warn('RPC increment_campaign_clicks failed. Click recorded but total not updated.')
    }
  },

  // =====================
  // RESOLVE REFERRAL CODE/LINK
  // =====================
  resolveCode: async (code) => {
    const { data, error } = await supabase
      .from('affiliate_campaigns')
      .select('*, affiliates(name, handle, avatar_url), affiliate_benefits(*)')
      .or(`code.eq.${code.toUpperCase()},slug.eq.${code.toLowerCase()}`)
      .eq('status', 'activo')
      .single()
    return { data, error }
  },

  // =====================
  // TIER ENGINE
  // =====================
  fetchTierEngineSettings: async () => {
    const { data, error } = await supabase
      .from('influencer_tier_engine_settings')
      .select(TIER_SETTINGS_SELECT)
      .eq('singleton_key', 'default')
      .maybeSingle()

    const settings = mapTierSettingsRow(data || DEFAULT_TIER_ENGINE_SETTINGS)
    set({ tierEngineSettings: settings, error: error?.message || null })
    return { data: settings, error }
  },

  saveTierEngineSettings: async (settings, userId) => {
    const payload = buildTierSettingsPayload(settings, userId)
    const { data, error } = await supabase
      .from('influencer_tier_engine_settings')
      .upsert(payload, { onConflict: 'singleton_key' })
      .select(TIER_SETTINGS_SELECT)
      .single()

    if (!error && data) {
      const normalized = mapTierSettingsRow(data)
      set({ tierEngineSettings: normalized })
      return { data: normalized, error: null }
    }

    return { data: null, error }
  },

  fetchTierSnapshots: async (affiliateIds) => {
    let query = supabase
      .from('influencer_tier_snapshots')
      .select(TIER_SNAPSHOT_SELECT)
      .order('tier_score', { ascending: false })

    if (affiliateIds?.length) query = query.in('affiliate_id', affiliateIds)
    const { data, error } = await query

    if (!error && data) {
      const currentMap = Object.fromEntries(get().tierSnapshots.map(item => [item.affiliate_id, item]))
      data.forEach((item) => {
        currentMap[item.affiliate_id] = mergeTierSnapshot(currentMap[item.affiliate_id], item)
      })
      set({ tierSnapshots: Object.values(currentMap) })
    }

    return { data: data || [], error }
  },

  updateTierSnapshotControls: async (affiliateId, updates) => {
    const current = get().tierSnapshots.find(item => item.affiliate_id === affiliateId) || { affiliate_id: affiliateId }
    const payload = {
      ...current,
      ...updates,
      affiliate_id: affiliateId,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('influencer_tier_snapshots')
      .upsert(payload, { onConflict: 'affiliate_id' })
      .select(TIER_SNAPSHOT_SELECT)
      .single()

    if (!error && data) {
      const snapshotMap = Object.fromEntries(get().tierSnapshots.map(item => [item.affiliate_id, item]))
      snapshotMap[data.affiliate_id] = mergeTierSnapshot(snapshotMap[data.affiliate_id], data)
      set({ tierSnapshots: Object.values(snapshotMap) })
      return get().recalculateTierSnapshots([affiliateId])
    }

    return { data: null, error }
  },

  restoreAutoTier: async (affiliateId) => (
    get().updateTierSnapshotControls(affiliateId, {
      manual_override_tier: null,
      lock_auto_upgrade: false,
      lock_auto_downgrade: false,
    })
  ),

  recalculateTierSnapshots: async (affiliateIds = null) => {
    const scopedIds = Array.isArray(affiliateIds) && affiliateIds.length ? affiliateIds : null

    let affiliateQuery = supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })

    if (scopedIds) affiliateQuery = affiliateQuery.in('id', scopedIds)

    const [
      { data: affiliates, error: affiliatesError },
      settingsResult,
      snapshotsResult,
    ] = await Promise.all([
      affiliateQuery,
      get().fetchTierEngineSettings(),
      get().fetchTierSnapshots(scopedIds),
    ])

    if (affiliatesError) return { data: [], error: affiliatesError }

    const settings = settingsResult.data || get().tierEngineSettings || DEFAULT_TIER_ENGINE_SETTINGS
    const previousSnapshots = snapshotsResult.data || []
    const snapshotMap = Object.fromEntries(previousSnapshots.map(item => [item.affiliate_id, item]))
    const affiliateList = affiliates || []
    const affiliateIdList = affiliateList.map(item => item.id).filter(Boolean)

    if (!affiliateIdList.length) {
      set({ tierSnapshots: [], tierEngineSettings: settings })
      return { data: [], error: null }
    }

    const { data: conversions, error: conversionsError } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .in('affiliate_id', affiliateIdList)
      .order('created_at', { ascending: false })

    if (conversionsError) return { data: [], error: conversionsError }

    const userIds = [...new Set((conversions || []).map(item => item.user_id).filter(Boolean))]
    const [
      { data: profiles, error: profilesError },
      { data: progress, error: progressError },
      paymentsResult,
    ] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('*').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase.from('user_progress').select('*').in('user_id', userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase.from('payments').select('user_id, status, created_at').in('user_id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (profilesError || progressError) {
      return { data: [], error: profilesError || progressError }
    }

    const paymentRows = paymentsResult.error ? [] : (paymentsResult.data || [])
    const profilesMap = Object.fromEntries((profiles || []).map(item => [item.id, item]))
    const progressMap = Object.fromEntries((progress || []).map(item => [item.user_id, item]))
    const paymentsByUser = {}
    paymentRows.forEach((item) => {
      paymentsByUser[item.user_id] = paymentsByUser[item.user_id] || []
      paymentsByUser[item.user_id].push(item)
    })

    const conversionsByInfluencer = {}
    ;(conversions || []).forEach((item) => {
      if (!item.affiliate_id || !item.user_id) return
      conversionsByInfluencer[item.affiliate_id] = conversionsByInfluencer[item.affiliate_id] || {}
      conversionsByInfluencer[item.affiliate_id][item.user_id] = conversionsByInfluencer[item.affiliate_id][item.user_id] || []
      conversionsByInfluencer[item.affiliate_id][item.user_id].push(item)
    })

    const snapshots = affiliateList.map((affiliate) => {
      const affiliateUsers = conversionsByInfluencer[affiliate.id] || {}
      const attributedUsers = Object.keys(affiliateUsers).map((userId) => buildAttributedUserRecord({
        profile: profilesMap[userId],
        progress: progressMap[userId],
        conversions: affiliateUsers[userId],
        payments: paymentsByUser[userId] || [],
      }))
      const performance = summarizeAttributedUsers({ users: attributedUsers, settings })
      const previousSnapshot = snapshotMap[affiliate.id] || get().tierSnapshots.find(item => item.affiliate_id === affiliate.id) || null

      return buildInfluencerTierSnapshot({
        affiliateId: affiliate.id,
        affiliate,
        performance,
        settings,
        previousSnapshot,
        manualOverrideTier: previousSnapshot?.manual_override_tier || null,
        lockAutoUpgrade: previousSnapshot?.lock_auto_upgrade || false,
        lockAutoDowngrade: previousSnapshot?.lock_auto_downgrade || false,
      })
    })

    const { error: upsertError } = await supabase
      .from('influencer_tier_snapshots')
      .upsert(
        snapshots.map(item => ({ ...item, updated_at: new Date().toISOString() })),
        { onConflict: 'affiliate_id' }
      )

    const mergedMap = Object.fromEntries(get().tierSnapshots.map(item => [item.affiliate_id, item]))
    snapshots.forEach((item) => {
      mergedMap[item.affiliate_id] = mergeTierSnapshot(mergedMap[item.affiliate_id], item)
    })

    set({
      tierEngineSettings: settings,
      tierSnapshots: Object.values(mergedMap).sort((a, b) => (b.tier_score || 0) - (a.tier_score || 0)),
      error: upsertError?.message || null,
    })

    return { data: snapshots, error: upsertError || null }
  },

  // =====================
  // AGGREGATE STATS (for dashboard cards)
  // =====================
  getInfluencerStats: async (affiliateId) => {
    const { data: conversions } = await supabase
      .from('affiliate_conversions')
      .select('conversion_value, commission_amount, plan_purchased, created_at')
      .eq('affiliate_id', affiliateId)
    
    const { data: clicks } = await supabase
      .from('affiliate_clicks')
      .select('id, created_at')
      .eq('affiliate_id', affiliateId)

    const totalRevenue = (conversions || []).reduce((s, c) => s + Number(c.conversion_value), 0)
    const totalCommission = (conversions || []).reduce((s, c) => s + Number(c.commission_amount), 0)
    const totalClicks = (clicks || []).length
    const totalConversions = (conversions || []).length
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'

    // Top plan
    const planCounts = {}
    ;(conversions || []).forEach(c => {
      planCounts[c.plan_purchased] = (planCounts[c.plan_purchased] || 0) + 1
    })
    const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'â€”'

    return { totalRevenue, totalCommission, totalClicks, totalConversions, conversionRate, topPlan }
  },

  getInfluencerDashboardData: async ({ userId, affiliateId, isAdmin = false }) => {
    if (!userId) return { error: { message: 'Missing user' } }

    let affiliateQuery = supabase
      .from('affiliates')
      .select('*')
      .limit(1)

    if (affiliateId && isAdmin) {
      affiliateQuery = affiliateQuery.eq('id', affiliateId)
    } else {
      affiliateQuery = affiliateQuery.eq('user_id', userId)
    }

    const { data: affiliate, error: affiliateError } = await affiliateQuery.maybeSingle()
    if (affiliateError) return { error: affiliateError }

    if (!affiliate) {
      // If no affiliate record exists, check for a pending or rejected application
      const { data: application } = await supabase
      .from('influencer_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      const [{ data: payoutAccount }, { data: balance }] = await Promise.all([
        supabase.from('payout_accounts').select('*').eq('user_id', userId).maybeSingle(),
        supabase.rpc('get_user_ledger_balance', { u_id: userId })
      ])

      return {
        data: {
          affiliate: null,
          application: application || null,
          payoutAccount,
          balance: balance || 0
        },
        error: null
      }
    }

    const { data: campaigns, error: campaignsError } = await supabase
      .from('affiliate_campaigns')
      .select('*, affiliates(name, handle, category, avatar_url)')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    if (campaignsError) return { error: campaignsError }

    const campaignIds = (campaigns || []).map(c => c.id).filter(Boolean)

    const [
      { data: benefits, error: benefitsError },
      { data: commissions, error: commissionsError },
      { data: conversions, error: conversionsError },
      { data: clicks, error: clicksError },
      { data: payments, error: paymentsError },
      { data: payoutAccount },
      { data: balance },
    ] = await Promise.all([
      campaignIds.length
        ? supabase.from('affiliate_benefits').select('*').in('campaign_id', campaignIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      campaignIds.length
        ? supabase.from('affiliate_commissions').select('*').in('campaign_id', campaignIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase.from('affiliate_conversions').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_clicks').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(1000),
      supabase.from('affiliate_payments').select('*, affiliates(name, handle)').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }),
      supabase.from('payout_accounts').select('*').eq('user_id', userId).maybeSingle(),
      supabase.rpc('get_user_ledger_balance', { u_id: userId })
    ])

    const firstError = benefitsError || commissionsError || conversionsError || clicksError || paymentsError
    if (firstError) return { error: firstError }

    const activeCampaign = (campaigns || []).find(c => c.status === 'activo') || campaigns?.[0] || null
      const activeBenefit = (benefits || []).find(b => b.is_active && b.campaign_id === activeCampaign?.id)
        || (benefits || []).find(b => b.is_active)
        || benefits?.[0]
        || null
      const activeCommission = (commissions || []).find(c => c.is_active && c.campaign_id === activeCampaign?.id)
        || (commissions || []).find(c => c.is_active)
        || commissions?.[0]
        || null

      const tierResult = await get().recalculateTierSnapshots([affiliate.id])
      const tierState = tierResult.data?.[0]
        || get().tierSnapshots.find(item => item.affiliate_id === affiliate.id)
        || null

      const totalRevenue = (conversions || []).reduce((sum, item) => sum + Number(item.conversion_value || 0), 0)
      const totalCommission = (conversions || []).reduce((sum, item) => sum + Number(item.commission_amount || 0), 0)
      const totalConversions = (conversions || []).length
      const totalAttributedUsers = new Set((conversions || []).map(item => item.user_id).filter(Boolean)).size

    const clicksByCampaign = {}
    ;(clicks || []).forEach((item) => {
      clicksByCampaign[item.campaign_id] = (clicksByCampaign[item.campaign_id] || 0) + 1
    })

    const conversionsByCampaign = {}
    const revenueByCampaign = {}
    ;(conversions || []).forEach((item) => {
      conversionsByCampaign[item.campaign_id] = (conversionsByCampaign[item.campaign_id] || 0) + 1
      revenueByCampaign[item.campaign_id] = (revenueByCampaign[item.campaign_id] || 0) + Number(item.conversion_value || 0)
    })

      const campaignPerformance = (campaigns || []).map((campaign) => ({
        id: campaign.id,
        code: campaign.code,
        slug: campaign.slug,
        status: campaign.status,
        conversions: conversionsByCampaign[campaign.id] || Number(campaign.total_conversions || 0),
        revenue: revenueByCampaign[campaign.id] || Number(campaign.total_revenue || 0),
      }))

      const topCampaign = campaignPerformance
        .slice()
        .sort((a, b) => (b.revenue - a.revenue) || (b.conversions - a.conversions))[0] || null

      const topPlanMap = {}
      ;(conversions || []).forEach((item) => {
        const key = item.plan_purchased || 'Sin plan'
        topPlanMap[key] = (topPlanMap[key] || 0) + 1
      })
      const topPlan = Object.entries(topPlanMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null

      const dayMap = {}
      ;(conversions || []).forEach((item) => {
        const key = new Date(item.created_at).toISOString().slice(0, 10)
        dayMap[key] = dayMap[key] || { date: key, activations: 0, conversions: 0, revenue: 0 }
        dayMap[key].activations += Number(item.plan_purchased === 'signup')
        dayMap[key].conversions += 1
        dayMap[key].revenue += Number(item.conversion_value || 0)
      })

      const performanceSeries = Array.from({ length: 14 }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (13 - index))
        const key = date.toISOString().slice(0, 10)
        return dayMap[key] || { date: key, activations: 0, conversions: 0, revenue: 0 }
      })

      const bestDay = Object.values(dayMap)
        .sort((a, b) => (b.conversions - a.conversions) || (b.activations - a.activations) || (b.revenue - a.revenue))[0] || null

      const payoutsByStatus = {
        pendiente: 0,
        aprobado: 0,
        pagado: 0,
        retenido: 0,
      }

      ;(payments || []).forEach((payment) => {
        const key = payment.status || 'pendiente'
        payoutsByStatus[key] = (payoutsByStatus[key] || 0) + Number(payment.commission_total || 0)
      })

      const nextPayout = (payments || [])
        .filter(payment => payment.status === 'pendiente' || payment.status === 'aprobado')
        .sort((a, b) => new Date(a.period_end || a.created_at) - new Date(b.period_end || b.created_at))[0] || null

      return {
        data: {
          affiliate,
          campaigns: campaigns || [],
          activeCampaign,
          benefits: benefits || [],
          activeBenefit,
          commissions: commissions || [],
          activeCommission,
          conversions: conversions || [],
          clicks: clicks || [],
          payments: payments || [],
          tierState,
          payoutAccount,
          balance: balance || 0,
          stats: {
            activationCount: tierState?.activation_count || 0,
            conversionCount: tierState?.conversion_count || 0,
            qualityScore: tierState?.quality_score || 0,
            tierScore: tierState?.tier_score || 0,
            currentTier: tierState?.effective_tier || 'community',
            nextTier: tierState?.next_tier || null,
            nextTierProgress: tierState?.next_tier_progress || 0,
            performanceHealth: tierState?.performance_health || 'watch',
            userCommission: tierState?.current_user_commission || 0,
            businessCommission: tierState?.current_business_commission || 0,
            attributedUsers: totalAttributedUsers,
            totalRevenue,
            totalCommission,
            totalConversions,
            topPlan,
            topCampaign,
            bestDay,
          },
          performanceSeries,
          campaignPerformance,
          payoutsByStatus,
          nextPayout,
        },
        error: null,
      }
    },

    updatePayoutAccount: async (userId, email) => {
      // Escribir a AMBAS tablas para mantener consistencia
      // (payout_accounts es la tabla canónica, profiles.paypal_email lo lee el edge function)
      const [payoutResult, profileResult] = await Promise.all([
        supabase
          .from('payout_accounts')
          .upsert({ user_id: userId, payout_email: email, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          .select()
          .single(),
        supabase
          .from('profiles')
          .update({ paypal_email: email })
          .eq('id', userId)
      ])
      
      const { data, error } = payoutResult
      if (!error && data) {
        set({ payoutAccount: data })
      }
      if (profileResult.error) {
        console.warn('[updatePayoutAccount] profiles sync failed:', profileResult.error.message)
      }
      return { data, error }
    },

  checkInfluencerAccess: async ({ userId, affiliateId, role }) => {
    if (!userId) return { data: { allowed: false, isAdmin: false, affiliate: null } }

    const isAdmin = DEFAULT_ADMIN_ROLES.includes(role)
    let query = supabase.from('affiliates').select('*').limit(1)

    if (affiliateId && isAdmin) {
      query = query.eq('id', affiliateId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data: affiliate, error } = await query.maybeSingle()
    if (error) return { error }

    const allowed = Boolean(isAdmin || (affiliate && affiliate.status === 'activo'))
    return { data: { allowed, isAdmin, affiliate: affiliate || null }, error: null }
  },

  // =====================
  // INVITATIONS
  // =====================
  claimInfluencer: async (code, userId) => {
    // 1. Find affiliate by code
    const { data: affiliate, error: findErr } = await supabase
      .from('affiliates')
      .select('*')
      .eq('invitation_code', code.toUpperCase())
      .single()

    if (findErr || !affiliate) return { error: 'Código de invitación no válido' }
    if (affiliate.user_id) return { error: 'Esta invitación ya ha sido utilizada' }

    // 2. Link user
    const { data, error } = await supabase
      .from('affiliates')
      .update({ user_id: userId, status: 'activo' })
      .eq('id', affiliate.id)
      .select()
      .single()

    if (!error && data) {
      set(s => ({ affiliates: s.affiliates.map(a => a.id === data.id ? data : a) }))
    }
    return { data, error }
  }
}))
