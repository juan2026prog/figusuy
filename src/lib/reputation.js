/**
 * FigusUY Reputation System
 *
 * Reputation != Gamification.
 * Gamification = cuanto haces.
 * Reputation = que tan bien lo haces.
 *
 * Visible: estrellas (1-5)
 * Interno: rank_score (0-100)
 */

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
    description: 'Participando, construyendo reputacion',
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
    description: 'Activo, sano y util para la comunidad',
    color: '#f59e0b',
    minScore: 70,
  },
  5: {
    stars: 5,
    label: 'Elite',
    description: 'Top en reputacion, consistente y confiable',
    color: '#ff5a00',
    minScore: 85,
  },
}

export const REPUTATION_MODIFIERS = {
  5: 1.2,
  4: 1.1,
  3: 1.0,
  2: 0.8,
  1: 0.6,
}

export const MILESTONE_MIN_REP = {
  exchange_streak_3: 2,
  clean_trades_10: 3,
  curator: 3,
  verified_album_complete: 4,
}

export const REWARD_MIN_REP = {
  plus_days: 2,
  pro_days: 3,
  extend_plus: 2,
  extend_pro: 3,
  upgrade_pro_temp: 4,
  priority_trades: 3,
  boost_visibility: 2,
  advanced_suggestions: 3,
  early_access: 4,
}

export function getStarLevel(stars) {
  return STAR_LEVELS[Math.max(1, Math.min(5, stars || 1))]
}

export function renderStars(stars) {
  const n = Math.max(1, Math.min(5, stars || 1))
  return 'â˜…'.repeat(n) + 'â˜†'.repeat(5 - n)
}

export function getReputationModifier(stars) {
  return REPUTATION_MODIFIERS[Math.max(1, Math.min(5, stars || 1))] || 1.0
}

export function canUnlockMilestone(achievementKey, userStars) {
  const minRep = MILESTONE_MIN_REP[achievementKey]
  if (!minRep) return { canUnlock: true, required: 0 }
  return {
    canUnlock: (userStars || 1) >= minRep,
    required: minRep,
    missing: Math.max(0, minRep - (userStars || 1)),
  }
}

export function canClaimReward(rewardType, userStars) {
  const minRep = REWARD_MIN_REP[rewardType]
  if (!minRep) return { canClaim: true, required: 0 }
  return {
    canClaim: (userStars || 1) >= minRep,
    required: minRep,
    missing: Math.max(0, minRep - (userStars || 1)),
  }
}

export function calculateWeightedXP(baseXP, stars) {
  const modifier = getReputationModifier(stars)
  return Math.round(baseXP * modifier)
}

export function getReputationBlockMessage(requiredStars) {
  const level = STAR_LEVELS[requiredStars]
  return `Necesitas ${renderStars(requiredStars)} (${level?.label || ''}) para desbloquear esto. Segui intercambiando y respondiendo para mejorar tu reputacion.`
}

export function getRequiredRepLabel(requiredStars) {
  return `Min. ${renderStars(requiredStars)}`
}
