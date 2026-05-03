import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAffiliateStore = create((set, get) => ({
  // State
  affiliates: [],
  campaigns: [],
  benefits: [],
  commissions: [],
  conversions: [],
  payments: [],
  clicks: [],
  loading: false,
  error: null,

  // =====================
  // AFFILIATES CRUD
  // =====================
  fetchAffiliates: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })
    set({ affiliates: data || [], loading: false, error: error?.message })
  },

  createAffiliate: async (affiliate) => {
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

  updateAffiliate: async (id, updates) => {
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

  deleteAffiliate: async (id) => {
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
    if (commRule) {
      // Basic calculation for now (percent)
      const rate = Number(commRule.commission_value || 5) / 100
      commissionAmount = value * rate
    }

    const { data, error } = await supabase
      .from('affiliate_conversions')
      .insert({
        campaign_id: campaignId,
        affiliate_id: affiliateId,
        user_id: userId,
        conversion_value: value,
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

    // 1. Record conversion (acquisition)
    const { data: conv, error: convErr } = await get().recordConversion(userId, 'signup', 0)
    if (convErr) {
      console.warn('Conversion recording skipped (probably already exists):', convErr)
    }
    
    // 2. Apply benefit if exists
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
  // AGGREGATE STATS (for dashboard cards)
  // =====================
  getAffiliateStats: async (affiliateId) => {
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
    const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

    return { totalRevenue, totalCommission, totalClicks, totalConversions, conversionRate, topPlan }
  },

  // =====================
  // INVITATIONS
  // =====================
  claimAffiliate: async (code, userId) => {
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
