const TIER_KEYS = ['community', 'growth', 'partner']

export const TIER_META = {
  community: {
    key: 'community',
    label: 'Community',
    tierLabel: 'Tier 1',
    rank: 1,
  },
  growth: {
    key: 'growth',
    label: 'Growth',
    tierLabel: 'Tier 2',
    rank: 2,
  },
  partner: {
    key: 'partner',
    label: 'Partner',
    tierLabel: 'Tier 3',
    rank: 3,
  },
}

export const DEFAULT_TIER_ENGINE_SETTINGS = {
  activation_weight: 0.4,
  conversion_weight: 0.4,
  quality_weight: 0.2,
  activation_rules: ['onboarding_completed', 'album_loaded', 'stickers_marked', 'reached_matches'],
  conversion_rules: ['paid_plus', 'paid_pro', 'business_activated', 'ecosystem_purchase'],
  quality_rules: ['retained_30d', 'active_7d', 'no_fraud', 'no_refund', 'no_fast_churn'],
  tier_thresholds: {
    tier_1_min_activations: 10,
    tier_1_min_conversions: 2,
    tier_2_min_activations: 40,
    tier_2_min_conversions: 10,
    tier_3_min_activations: 100,
    tier_3_min_conversions: 25,
  },
  quality_minimums: {
    community: 35,
    growth: 55,
    partner: 75,
  },
  downgrade_rules: {
    inactivity_days: 30,
    conversion_drop_pct: 35,
    quality_drop_pct: 25,
  },
  upgrade_rules: {
    sustained_improvement_days: 14,
    conversion_velocity_min: 3,
    retention_quality_min: 60,
  },
  tier_commissions: {
    community: { user_commission: 5, business_commission: 8 },
    growth: { user_commission: 6.5, business_commission: 10 },
    partner: { user_commission: 7.5, business_commission: 12 },
  },
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toDayDiff = (value, fallback = 999) => {
  if (!value) return fallback
  const diff = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(diff)) return fallback
  return Math.max(0, Math.floor(diff / 86400000))
}

const mergePlainObject = (base, value) => ({
  ...base,
  ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
})

export const rankTier = (tier) => TIER_META[tier]?.rank || 0

export const normalizeTierEngineSettings = (input = {}) => ({
  activation_weight: toNumber(input.activation_weight, DEFAULT_TIER_ENGINE_SETTINGS.activation_weight),
  conversion_weight: toNumber(input.conversion_weight, DEFAULT_TIER_ENGINE_SETTINGS.conversion_weight),
  quality_weight: toNumber(input.quality_weight, DEFAULT_TIER_ENGINE_SETTINGS.quality_weight),
  activation_rules: Array.isArray(input.activation_rules) && input.activation_rules.length
    ? input.activation_rules
    : DEFAULT_TIER_ENGINE_SETTINGS.activation_rules,
  conversion_rules: Array.isArray(input.conversion_rules) && input.conversion_rules.length
    ? input.conversion_rules
    : DEFAULT_TIER_ENGINE_SETTINGS.conversion_rules,
  quality_rules: Array.isArray(input.quality_rules) && input.quality_rules.length
    ? input.quality_rules
    : DEFAULT_TIER_ENGINE_SETTINGS.quality_rules,
  tier_thresholds: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.tier_thresholds, input.tier_thresholds),
  quality_minimums: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.quality_minimums, input.quality_minimums),
  downgrade_rules: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.downgrade_rules, input.downgrade_rules),
  upgrade_rules: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.upgrade_rules, input.upgrade_rules),
  tier_commissions: {
    community: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.tier_commissions.community, input.tier_commissions?.community),
    growth: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.tier_commissions.growth, input.tier_commissions?.growth),
    partner: mergePlainObject(DEFAULT_TIER_ENGINE_SETTINGS.tier_commissions.partner, input.tier_commissions?.partner),
  },
})

const isTruthy = (value) => value === true

const evaluateActivationRule = (user, rule) => {
  const progress = user.progress || {}
  const currentProgress = progress.current_progress || {}
  const totalMatchesViewed = toNumber(progress.total_matches_viewed, toNumber(currentProgress.total_matches_viewed, 0))

  switch (rule) {
    case 'onboarding_completed':
      return isTruthy(user.onboardingCompleted)
    case 'album_loaded':
      return toNumber(progress.total_albums) >= 1
    case 'stickers_marked':
      return toNumber(progress.total_stickers_loaded) >= 5
    case 'reached_matches':
      return totalMatchesViewed >= 1 || toNumber(progress.total_chats) >= 1 || toNumber(progress.total_trades) >= 1
    default:
      return false
  }
}

const evaluateConversionRule = (user, rule) => {
  const planName = String(user.profile?.plan_name || '').toLowerCase()

  switch (rule) {
    case 'paid_plus':
      return planName === 'plus'
    case 'paid_pro':
      return planName === 'pro' || isTruthy(user.profile?.is_premium)
    case 'business_activated':
      return isTruthy(user.profile?.business_access) && user.profile?.business_status === 'approved'
    case 'ecosystem_purchase':
      return toNumber(user.totalRevenue) > 0 || user.paymentStatuses.includes('completed')
    default:
      return false
  }
}

const evaluateQualityRule = (user, rule) => {
  const ageDays = toDayDiff(user.profile?.created_at, 0)
  const inactivityDays = user.inactivityDays
  const retainedWindow = ageDays >= 30 ? 30 : Math.max(3, ageDays)

  switch (rule) {
    case 'retained_30d':
      return inactivityDays <= retainedWindow
    case 'active_7d':
      return inactivityDays <= 7
    case 'no_fraud':
      return !isTruthy(user.profile?.is_blocked)
    case 'no_refund':
      return !user.paymentStatuses.includes('refunded')
    case 'no_fast_churn':
      return ageDays < 14 ? inactivityDays <= Math.max(3, ageDays) : inactivityDays <= 14
    default:
      return false
  }
}

export const buildAttributedUserRecord = ({ profile, progress, conversions = [], payments = [] }) => {
  const sortedConversions = conversions
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const signupAt = sortedConversions[0]?.created_at || profile?.created_at || null
  const latestConversionAt = sortedConversions[sortedConversions.length - 1]?.created_at || null
  const totalRevenue = sortedConversions.reduce((sum, item) => sum + toNumber(item.conversion_value), 0)
  const onboardingCompleted = Boolean(
    toNumber(progress?.total_albums) >= 1 &&
    toNumber(progress?.total_stickers_loaded) >= 5 &&
    (
      toNumber(progress?.total_matches_viewed, toNumber(progress?.current_progress?.total_matches_viewed, 0)) >= 1 ||
      toNumber(progress?.total_chats) >= 1 ||
      toNumber(progress?.total_trades) >= 1
    )
  )

  return {
    profile: profile || {},
    progress: progress || {},
    conversions: sortedConversions,
    payments,
    paymentStatuses: payments.map((item) => String(item.status || '').toLowerCase()),
    totalRevenue,
    signupAt,
    latestConversionAt,
    lastActivityAt: profile?.last_active || latestConversionAt || signupAt || profile?.created_at || null,
    inactivityDays: toDayDiff(profile?.last_active || latestConversionAt || signupAt || profile?.created_at),
    onboardingCompleted,
  }
}

export const summarizeAttributedUsers = ({ users, settings }) => {
  const activationRules = settings.activation_rules
  const conversionRules = settings.conversion_rules
  const qualityRules = settings.quality_rules
  const activationUsers = []
  const conversionUsers = []
  const qualityBreakdown = []
  let lastActivityAt = null

  users.forEach((user) => {
    const activated = activationRules.every((rule) => evaluateActivationRule(user, rule))
    const converted = conversionRules.some((rule) => evaluateConversionRule(user, rule))
    const qualityPassed = qualityRules.filter((rule) => evaluateQualityRule(user, rule)).length
    const qualityScore = qualityRules.length ? (qualityPassed / qualityRules.length) * 100 : 0

    if (activated) activationUsers.push(user)
    if (converted) conversionUsers.push(user)

    qualityBreakdown.push({
      userId: user.profile?.id || null,
      qualityScore,
      activated,
      converted,
      inactivityDays: user.inactivityDays,
    })

    const candidate = user.lastActivityAt ? new Date(user.lastActivityAt).toISOString() : null
    if (candidate && (!lastActivityAt || candidate > lastActivityAt)) lastActivityAt = candidate
  })

  const qualityScore = qualityBreakdown.length
    ? qualityBreakdown.reduce((sum, item) => sum + item.qualityScore, 0) / qualityBreakdown.length
    : 0
  const recentActivationCount = activationUsers.filter((item) => toDayDiff(item.signupAt, 999) <= 30).length
  const recentConversionCount = conversionUsers.filter((item) => toDayDiff(item.latestConversionAt || item.signupAt, 999) <= 30).length
  const inactivityDays = toDayDiff(lastActivityAt)

  return {
    userCount: users.length,
    activationCount: activationUsers.length,
    conversionCount: conversionUsers.length,
    qualityScore: Math.round(qualityScore * 10) / 10,
    recentActivationCount,
    recentConversionCount,
    inactivityDays,
    lastActivityAt,
    qualityBreakdown,
  }
}

const normalizeCountToScore = (count, maxTarget) => {
  const target = Math.max(1, toNumber(maxTarget, 1))
  return clamp((toNumber(count) / target) * 100, 0, 100)
}

const resolveBaseTier = ({ activationCount, conversionCount, qualityScore, settings }) => {
  const thresholds = settings.tier_thresholds
  const qualityMinimums = settings.quality_minimums

  if (
    activationCount >= toNumber(thresholds.tier_3_min_activations) &&
    conversionCount >= toNumber(thresholds.tier_3_min_conversions) &&
    qualityScore >= toNumber(qualityMinimums.partner)
  ) return 'partner'

  if (
    activationCount >= toNumber(thresholds.tier_2_min_activations) &&
    conversionCount >= toNumber(thresholds.tier_2_min_conversions) &&
    qualityScore >= toNumber(qualityMinimums.growth)
  ) return 'growth'

  return 'community'
}

const demoteTier = (tier) => {
  if (tier === 'partner') return 'growth'
  if (tier === 'growth') return 'community'
  return 'community'
}

const getNextTier = (tier) => {
  const rank = rankTier(tier)
  return TIER_KEYS.find((key) => rankTier(key) === rank + 1) || null
}

const computeDropPct = (previous, current) => {
  const prev = toNumber(previous)
  const next = toNumber(current)
  if (prev <= 0 || next >= prev) return 0
  return ((prev - next) / prev) * 100
}

const buildGapToTier = (tier, performance, settings) => {
  if (!tier) return null

  const activationKey = `tier_${rankTier(tier)}_min_activations`
  const conversionKey = `tier_${rankTier(tier)}_min_conversions`
  const activationTarget = toNumber(settings.tier_thresholds[activationKey])
  const conversionTarget = toNumber(settings.tier_thresholds[conversionKey])
  const qualityTarget = toNumber(settings.quality_minimums[tier])

  return {
    activations_missing: Math.max(0, activationTarget - performance.activationCount),
    conversions_missing: Math.max(0, conversionTarget - performance.conversionCount),
    quality_missing: Math.max(0, Math.round((qualityTarget - performance.qualityScore) * 10) / 10),
  }
}

const computeNextTierProgress = (tier, performance, settings) => {
  if (!tier) return 100

  const activationKey = `tier_${rankTier(tier)}_min_activations`
  const conversionKey = `tier_${rankTier(tier)}_min_conversions`
  const activationTarget = Math.max(1, toNumber(settings.tier_thresholds[activationKey]))
  const conversionTarget = Math.max(1, toNumber(settings.tier_thresholds[conversionKey]))
  const qualityTarget = Math.max(1, toNumber(settings.quality_minimums[tier]))

  const activationProgress = clamp((performance.activationCount / activationTarget) * 100, 0, 100)
  const conversionProgress = clamp((performance.conversionCount / conversionTarget) * 100, 0, 100)
  const qualityProgress = clamp((performance.qualityScore / qualityTarget) * 100, 0, 100)

  return Math.round((((activationProgress + conversionProgress + qualityProgress) / 3) * 10)) / 10
}

const describeHealth = ({ qualityScore, inactivityDays, conversionCount }) => {
  if (qualityScore >= 75 && inactivityDays <= 7 && conversionCount >= 10) return 'strong'
  if (qualityScore >= 55 && inactivityDays <= 14 && conversionCount >= 2) return 'stable'
  if (qualityScore >= 35 && inactivityDays <= 30) return 'watch'
  return 'critical'
}

const describeOpportunity = ({ currentTier, nextTier, performance, settings }) => {
  if (!nextTier) return 'Sostener calidad para proteger el tier actual.'
  const sustainedWindow = toNumber(settings.upgrade_rules.sustained_improvement_days)
  const velocityMin = toNumber(settings.upgrade_rules.conversion_velocity_min)
  const retentionMin = toNumber(settings.upgrade_rules.retention_quality_min)

  if (
    performance.recentConversionCount >= velocityMin &&
    performance.qualityScore >= retentionMin &&
    performance.inactivityDays <= sustainedWindow
  ) return `Hay ventana real para subir a ${TIER_META[nextTier].label}.`

  return `Activa mas usuarios y mejora conversion/calidad para subir a ${TIER_META[nextTier].label}.`
}

const describeRisk = ({ performance, previousSnapshot, settings, qualityDropPct, conversionDropPct }) => {
  if (performance.inactivityDays >= toNumber(settings.downgrade_rules.inactivity_days)) {
    return 'Riesgo alto por inactividad sostenida.'
  }
  if (qualityDropPct >= toNumber(settings.downgrade_rules.quality_drop_pct)) {
    return 'Riesgo alto por caida de calidad.'
  }
  if (conversionDropPct >= toNumber(settings.downgrade_rules.conversion_drop_pct)) {
    return 'Riesgo alto por caida de conversion.'
  }
  if (previousSnapshot && performance.inactivityDays >= Math.max(7, toNumber(settings.downgrade_rules.inactivity_days) - 7)) {
    return 'Atencion: la actividad esta cayendo.'
  }
  return 'Sin riesgo relevante.'
}

export const buildInfluencerTierSnapshot = ({
  affiliateId,
  affiliate,
  performance,
  settings,
  previousSnapshot,
  manualOverrideTier = null,
  lockAutoUpgrade = false,
  lockAutoDowngrade = false,
}) => {
  const activationScore = normalizeCountToScore(
    performance.activationCount,
    settings.tier_thresholds.tier_3_min_activations
  )
  const conversionScore = normalizeCountToScore(
    performance.conversionCount,
    settings.tier_thresholds.tier_3_min_conversions
  )
  const qualityScore = clamp(toNumber(performance.qualityScore), 0, 100)
  const tierScore =
    activationScore * toNumber(settings.activation_weight) +
    conversionScore * toNumber(settings.conversion_weight) +
    qualityScore * toNumber(settings.quality_weight)

  const previousTier = previousSnapshot?.effective_tier || previousSnapshot?.computed_tier || 'community'
  const baseTier = resolveBaseTier({
    activationCount: performance.activationCount,
    conversionCount: performance.conversionCount,
    qualityScore,
    settings,
  })

  const qualityDropPct = computeDropPct(previousSnapshot?.quality_score, qualityScore)
  const conversionDropPct = computeDropPct(previousSnapshot?.conversion_count, performance.conversionCount)

  let computedTier = baseTier
  let downgradeReason = null

  if (performance.inactivityDays >= toNumber(settings.downgrade_rules.inactivity_days)) {
    computedTier = demoteTier(computedTier)
    downgradeReason = 'inactivity'
  }
  if (qualityDropPct >= toNumber(settings.downgrade_rules.quality_drop_pct)) {
    computedTier = demoteTier(computedTier)
    downgradeReason = downgradeReason || 'quality_drop'
  }
  if (conversionDropPct >= toNumber(settings.downgrade_rules.conversion_drop_pct)) {
    computedTier = demoteTier(computedTier)
    downgradeReason = downgradeReason || 'conversion_drop'
  }

  let effectiveTier = computedTier

  if (manualOverrideTier && TIER_META[manualOverrideTier]) {
    effectiveTier = manualOverrideTier
  } else if (lockAutoUpgrade && rankTier(computedTier) > rankTier(previousTier)) {
    effectiveTier = previousTier
  } else if (lockAutoDowngrade && rankTier(computedTier) < rankTier(previousTier)) {
    effectiveTier = previousTier
  }

  const nextTier = getNextTier(effectiveTier)
  const nextTierGap = buildGapToTier(nextTier, performance, settings)
  const nextTierProgress = computeNextTierProgress(nextTier, performance, settings)
  const commissions = settings.tier_commissions[effectiveTier] || settings.tier_commissions.community
  const performanceHealth = describeHealth({
    qualityScore,
    inactivityDays: performance.inactivityDays,
    conversionCount: performance.conversionCount,
  })
  const upgradeOpportunity = describeOpportunity({
    currentTier: effectiveTier,
    nextTier,
    performance,
    settings,
  })
  const downgradeRisk = describeRisk({
    performance,
    previousSnapshot,
    settings,
    qualityDropPct,
    conversionDropPct,
  })

  return {
    affiliate_id: affiliateId,
    affiliate_name: affiliate?.name || null,
    computed_tier: computedTier,
    effective_tier: effectiveTier,
    manual_override_tier: manualOverrideTier,
    lock_auto_upgrade: Boolean(lockAutoUpgrade),
    lock_auto_downgrade: Boolean(lockAutoDowngrade),
    activation_count: performance.activationCount,
    conversion_count: performance.conversionCount,
    quality_score: Math.round(qualityScore * 10) / 10,
    activation_score: Math.round(activationScore * 10) / 10,
    conversion_score: Math.round(conversionScore * 10) / 10,
    tier_score: Math.round(tierScore * 10) / 10,
    recent_activation_count: performance.recentActivationCount,
    recent_conversion_count: performance.recentConversionCount,
    current_user_commission: toNumber(commissions.user_commission),
    current_business_commission: toNumber(commissions.business_commission),
    next_tier: nextTier,
    next_tier_progress: nextTierProgress,
    next_tier_gap: nextTierGap || {},
    performance_health: performanceHealth,
    upgrade_opportunity: upgradeOpportunity,
    downgrade_risk: downgradeRisk,
    inactivity_days: performance.inactivityDays,
    last_activity_at: performance.lastActivityAt,
    downgrade_reason: downgradeReason,
    metrics_payload: {
      user_count: performance.userCount,
      quality_breakdown: performance.qualityBreakdown,
      quality_drop_pct: Math.round(qualityDropPct * 10) / 10,
      conversion_drop_pct: Math.round(conversionDropPct * 10) / 10,
    },
    computed_at: new Date().toISOString(),
    tier_2_progress: computeNextTierProgress('growth', performance, settings),
    tier_3_progress: computeNextTierProgress('partner', performance, settings),
    tier_2_gap: buildGapToTier('growth', performance, settings),
    tier_3_gap: buildGapToTier('partner', performance, settings),
  }
}
