/**
 * FigusUY Ranking Engine (Frontend)
 * 
 * CRITICAL RULE: relevancia > contexto > cercanía > calidad > actividad > boost
 * Premium/Sponsor boosts are TIEBREAKERS ONLY.
 * - premium_boost max: 1.20x
 * - sponsor_boost max: 1.15x
 * 
 * Scores are NEVER shown to public users — only badges.
 * Technical scores are visible only in God Admin.
 */

// ===================== USER BADGES =====================

const USER_BADGE_CONFIG = {
  nuevo:       { label: 'Nuevo',       emoji: '🆕', color: '#3b82f6', bg: '#eff6ff' },
  activo:      { label: 'Activo',      emoji: '⚡', color: '#10b981', bg: '#ecfdf5' },
  confiable:   { label: 'Confiable',   emoji: '🛡️', color: '#8b5cf6', bg: '#f5f3ff' },
  buen_cruce:  { label: 'Buen cruce',  emoji: '🤝', color: '#ea580c', bg: '#fff7ed' },
  top_cruce:   { label: 'Top cruce',   emoji: '🏆', color: '#f59e0b', bg: '#fffbeb' },
}

const BUSINESS_BADGE_CONFIG = {
  verificado:      { label: 'Verificado',       emoji: '✅', color: '#10b981', bg: '#ecfdf5' },
  recomendado:     { label: 'Recomendado',       emoji: '👍', color: '#3b82f6', bg: '#eff6ff' },
  punto_destacado: { label: 'Punto destacado',   emoji: '⭐', color: '#f59e0b', bg: '#fffbeb' },
  tienda_aliada:   { label: 'Tienda aliada',     emoji: '🤝', color: '#8b5cf6', bg: '#f5f3ff' },
  patrocinado:     { label: 'Patrocinado',        emoji: '📣', color: '#ea580c', bg: '#fff7ed' },
  zona_sugerida:   { label: 'Zona sugerida',     emoji: '📍', color: '#06b6d4', bg: '#ecfeff' },
}

/**
 * Get display-ready badge objects for a user ranking
 */
export function getUserBadges(badges = []) {
  return badges
    .map(key => USER_BADGE_CONFIG[key])
    .filter(Boolean)
}

/**
 * Get display-ready badge objects for a business ranking
 */
export function getBusinessBadges(badges = []) {
  return badges
    .map(key => BUSINESS_BADGE_CONFIG[key])
    .filter(Boolean)
}

// ===================== BOOST VALIDATION =====================

const MAX_PREMIUM_BOOST = 1.20
const MAX_SPONSOR_BOOST = 1.15

/**
 * Validate that a boost value is within safe limits
 */
export function validateBoostLimit(value, type = 'premium') {
  const max = type === 'sponsor' ? MAX_SPONSOR_BOOST : MAX_PREMIUM_BOOST
  const clamped = Math.min(Number(value) || 1.0, max)
  return {
    value: clamped,
    wasLimited: clamped < Number(value),
    max,
  }
}

/**
 * Validate algorithm config values before saving.
 * Returns { valid, value, warning } 
 */
export function validateAlgorithmConfigValue(key, value) {
  const numValue = Number(value)

  // Boost limits
  if (key === 'premium_boost' || key === 'max_premium_boost') {
    if (numValue > MAX_PREMIUM_BOOST) {
      return { valid: false, value: MAX_PREMIUM_BOOST, warning: `El boost premium no puede superar ${MAX_PREMIUM_BOOST}x` }
    }
  }
  if (key === 'sponsor_boost' || key === 'sponsor_boost_max') {
    if (numValue > MAX_SPONSOR_BOOST) {
      return { valid: false, value: MAX_SPONSOR_BOOST, warning: `El boost sponsor no puede superar ${MAX_SPONSOR_BOOST}x` }
    }
  }

  // Weight limits (0-1)
  if (key.includes('_weight')) {
    if (numValue < 0 || numValue > 1) {
      return { valid: false, value: Math.max(0, Math.min(1, numValue)), warning: 'Los pesos deben estar entre 0 y 1' }
    }
  }

  return { valid: true, value, warning: null }
}

// ===================== SCORE FORMATTING (Admin only) =====================

/**
 * Format a numeric score for admin display
 */
export function formatScore(score) {
  if (score == null) return '—'
  return Number(score).toFixed(1)
}

/**
 * Get color for a score value
 */
export function getScoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#ea580c'
  if (score >= 40) return '#f59e0b'
  if (score >= 20) return '#ef4444'
  return '#94a3b8'
}

/**
 * Build a score breakdown for admin tooltips
 */
export function buildScoreBreakdown(ranking, type = 'user') {
  if (!ranking) return []

  if (type === 'user') {
    return [
      { label: 'Relevancia Match', value: ranking.match_relevance_score, weight: 0.40 },
      { label: 'Confianza', value: ranking.trust_score, weight: 0.20 },
      { label: 'Actividad', value: ranking.activity_score, weight: 0.15 },
      { label: 'Calidad Match', value: ranking.match_quality_score, weight: 0.15 },
      { label: 'Perfil', value: ranking.profile_score, weight: 0.10 },
    ]
  }

  return [
    { label: 'Relevancia', value: ranking.relevance_score, weight: 0.35 },
    { label: 'Engagement', value: ranking.engagement_score, weight: 0.20 },
    { label: 'Confianza', value: ranking.trust_score, weight: 0.20 },
    { label: 'Calidad Perfil', value: ranking.profile_quality_score, weight: 0.15 },
    { label: 'Actividad', value: ranking.activity_score, weight: 0.05 },
  ]
}

export { USER_BADGE_CONFIG, BUSINESS_BADGE_CONFIG, MAX_PREMIUM_BOOST, MAX_SPONSOR_BOOST }
