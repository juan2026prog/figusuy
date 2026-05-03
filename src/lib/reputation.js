/**
 * FigusUY Reputation System — Constants & Helpers
 * 
 * Reputation ≠ Gamificación.
 * Gamificación = cuánto hacés (volumen).
 * Reputación = qué tan bien lo hacés (calidad).
 * 
 * Visible al usuario: ★ estrellas (1-5)
 * Interno: rank_score (0-100)
 * 
 * NO leaderboard. NO ranking público. NO score numérico visible.
 */

// ============================
// STAR DEFINITIONS
// ============================

export const STAR_LEVELS = {
  1: {
    stars: 1,
    label: 'Inicial',
    description: 'Usuario nuevo o con poca data',
    color: '#94a3b8',
    minScore: 0,
  },
  2: {
    stars: 2,
    label: 'Activo',
    description: 'Participando, construyendo reputación',
    color: '#60a5fa',
    minScore: 35,
  },
  3: {
    stars: 3,
    label: 'Confiable',
    description: 'Consistente, responde y concreta',
    color: '#22c55e',
    minScore: 55,
  },
  4: {
    stars: 4,
    label: 'Muy confiable',
    description: 'Activo, sano y útil para la comunidad',
    color: '#f59e0b',
    minScore: 70,
  },
  5: {
    stars: 5,
    label: 'Elite',
    description: 'Top en reputación, consistente y confiable',
    color: '#ff5a00',
    minScore: 85,
  },
}

// ============================
// REPUTATION MODIFIER (XP weighting)
// ============================

export const REPUTATION_MODIFIERS = {
  5: 1.200,  // Elite: 20% XP bonus
  4: 1.100,  // Muy confiable: 10% bonus
  3: 1.000,  // Confiable: neutral
  2: 0.800,  // Activo: 20% penalty
  1: 0.600,  // Inicial: 40% penalty
}

// ============================
// MILESTONE MINIMUM REPUTATION
// ============================

/**
 * Hitos que requieren reputación mínima.
 * key: achievement_key
 * value: minimum star_rating required
 */
export const MILESTONE_MIN_REP = {
  trades_10: 3,    // 10 cruces → mínimo ★★★
  trades_25: 3,    // 25 cruces → mínimo ★★★
  trades_50: 4,    // 50 cruces → mínimo ★★★★
  clean_trades_10: 3, // Cruces impecables → mínimo ★★★
}

// ============================
// REWARD MINIMUM REPUTATION
// ============================

/**
 * Rewards que requieren reputación mínima para desbloquearse.
 * key: reward_type
 * value: minimum star_rating required
 */
export const REWARD_MIN_REP = {
  plus_days: 2,          // Días Plus → mínimo ★★
  pro_days: 3,           // Días Pro → mínimo ★★★
  extend_plus: 2,        // Extender Plus → mínimo ★★
  extend_pro: 3,         // Extender Pro → mínimo ★★★
  upgrade_pro_temp: 4,   // Upgrade a Pro → mínimo ★★★★
  priority_trades: 3,    // Prioridad en cruces → mínimo ★★★
  boost_visibility: 2,   // Boost visibilidad → mínimo ★★
  advanced_suggestions: 3, // Sugerencias avanzadas → mínimo ★★★
  early_access: 4,       // Acceso anticipado → mínimo ★★★★
}

// ============================
// HELPERS
// ============================

/**
 * Get the star level definition for a given star rating
 */
export function getStarLevel(stars) {
  return STAR_LEVELS[Math.max(1, Math.min(5, stars || 1))]
}

/**
 * Render a star string ★★★☆☆
 */
export function renderStars(stars) {
  const n = Math.max(1, Math.min(5, stars || 1))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

/**
 * Get the XP modifier based on star rating
 */
export function getReputationModifier(stars) {
  return REPUTATION_MODIFIERS[Math.max(1, Math.min(5, stars || 1))] || 1.0
}

/**
 * Check if a milestone can be unlocked given the user's star rating
 */
export function canUnlockMilestone(achievementKey, userStars) {
  const minRep = MILESTONE_MIN_REP[achievementKey]
  if (!minRep) return { canUnlock: true, required: 0 }
  return {
    canUnlock: (userStars || 1) >= minRep,
    required: minRep,
    missing: Math.max(0, minRep - (userStars || 1)),
  }
}

/**
 * Check if a reward can be claimed given the user's star rating
 */
export function canClaimReward(rewardType, userStars) {
  const minRep = REWARD_MIN_REP[rewardType]
  if (!minRep) return { canClaim: true, required: 0 }
  return {
    canClaim: (userStars || 1) >= minRep,
    required: minRep,
    missing: Math.max(0, minRep - (userStars || 1)),
  }
}

/**
 * Calculate weighted XP
 * xp_real = base_xp * reputation_modifier
 */
export function calculateWeightedXP(baseXP, stars) {
  const modifier = getReputationModifier(stars)
  return Math.round(baseXP * modifier)
}

/**
 * Get a friendly message for reputation-blocked items
 * No castigo. No tono agresivo. Tono claro.
 */
export function getReputationBlockMessage(requiredStars) {
  const level = STAR_LEVELS[requiredStars]
  return `Necesitás ${renderStars(requiredStars)} (${level?.label || ''}) para desbloquear esto. Seguí intercambiando y respondiendo para mejorar tu reputación.`
}

/**
 * Get a short label for the required reputation
 */
export function getRequiredRepLabel(requiredStars) {
  return `Mín. ${renderStars(requiredStars)}`
}
