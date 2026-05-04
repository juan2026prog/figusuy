/**
 * FigusUY Gamification System — Constants & Definitions
 * 
 * Levels, achievements, badges, rewards catalog.
 * NO gamer aesthetics. Identity-first, utility-driven.
 */

// ============================
// LEVELS
// ============================
export const LEVELS = {
  explorador: {
    key: 'explorador',
    name: 'Explorador',
    order: 1,
    icon: '🧭',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    description: 'Estás conociendo la plataforma',
    next: 'coleccionista',
  },
  coleccionista: {
    key: 'coleccionista',
    name: 'Coleccionista',
    order: 2,
    icon: '📚',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    description: 'Tu colección está tomando forma',
    next: 'intercambiador',
  },
  intercambiador: {
    key: 'intercambiador',
    name: 'Intercambiador',
    order: 3,
    icon: '🤝',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    description: 'Ya concretás cruces con la comunidad',
    next: 'referente',
  },
  referente: {
    key: 'referente',
    name: 'Referente',
    order: 4,
    icon: '⭐',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Sos un referente de FigusUY',
    next: null,
  },
}

export const LEVEL_ORDER = ['explorador', 'coleccionista', 'intercambiador', 'referente']

// Requirements to reach each level
export const LEVEL_REQUIREMENTS = {
  coleccionista: {
    label: 'Coleccionista',
    requirements: [
      { key: 'profile_name', label: 'Perfil con nombre', check: (p) => !!(p.name && p.name.trim()) },
      { key: 'avatar', label: 'Avatar cargado', check: (p) => !!p.avatar_url },
      { key: 'album', label: '1 álbum activo', check: (_, g) => (g.total_albums || 0) >= 1 },
      { key: 'stickers', label: '10 figuritas cargadas', check: (_, g) => (g.total_stickers_loaded || 0) >= 10 },
    ],
  },
  intercambiador: {
    label: 'Intercambiador',
    requirements: [
      { key: 'favorites', label: '3 favoritos', check: (_, g) => (g.total_favorites || 0) >= 3 },
      { key: 'chats', label: '3 chats útiles', check: (_, g) => (g.total_chats || 0) >= 3 },
      { key: 'trade', label: '1 cruce concretado', check: (_, g) => (g.total_trades || 0) >= 1 },
    ],
  },
  referente: {
    label: 'Referente',
    requirements: [
      { key: 'trades', label: '5 cruces concretados', check: (_, g) => (g.total_trades || 0) >= 5 },
      { key: 'no_reports', label: 'Sin reportes', check: (p) => !p.has_reports },
      { key: 'activity', label: '7+ días activo', check: (_, g) => (g.days_active || 0) >= 7 },
    ],
  },
}

// ============================
// ACHIEVEMENTS (28 total — 20 core + 8 growth)
// ============================
export const ACHIEVEMENTS = {
  // Actividad (5)
  first_day_active: { name: 'Primer día activo', description: 'Iniciaste tu camino en FigusUY', category: 'actividad', icon: '🟢', target: 1 },
  streak_3: { name: '3 días seguidos', description: 'Constancia que se nota', category: 'actividad', icon: '🔥', target: 3 },
  streak_7: { name: '7 días seguidos', description: 'Una semana sin parar', category: 'actividad', icon: '⚡', target: 7 },
  days_active_14: { name: '14 días activos', description: 'Dos semanas en la comunidad', category: 'actividad', icon: '📅', target: 14 },
  days_active_30: { name: '30 días activos', description: 'Un mes de colección', category: 'actividad', icon: '🏆', target: 30 },

  // Intercambio (5)
  first_trade: { name: 'Primer cruce', description: 'Tu primer intercambio exitoso', category: 'intercambio', icon: '🤝', target: 1 },
  trades_3: { name: '3 cruces', description: 'Intercambiador activo', category: 'intercambio', icon: '🔄', target: 3 },
  trades_10: { name: '10 cruces', description: 'Cruzador experimentado', category: 'intercambio', icon: '💫', target: 10 },
  trades_25: { name: '25 cruces', description: 'Referencia del barrio', category: 'intercambio', icon: '🌟', target: 25 },
  trades_50: { name: '50 cruces', description: 'Leyenda del intercambio', category: 'intercambio', icon: '👑', target: 50 },

  // Colección (5)
  first_album: { name: 'Primer álbum', description: 'Cargaste tu primer álbum', category: 'coleccion', icon: '📖', target: 1 },
  duplicates_50: { name: '50 repetidas', description: '50 figuritas para intercambiar', category: 'coleccion', icon: '📦', target: 50 },
  duplicates_100: { name: '100 repetidas', description: 'Inventario impresionante', category: 'coleccion', icon: '🗃️', target: 100 },
  page_complete: { name: 'Página completa', description: 'Completaste una página entera', category: 'coleccion', icon: '📄', target: 1 },
  album_complete: { name: 'Álbum completo', description: '¡Completaste un álbum entero!', category: 'coleccion', icon: '🎖️', target: 1 },

  // Reputación (5)
  first_favorite: { name: 'Primer favorito', description: 'Alguien te marcó como favorito', category: 'reputacion', icon: '❤️', target: 1 },
  favorites_5: { name: '5 favoritos', description: 'Sos popular en la comunidad', category: 'reputacion', icon: '💖', target: 5 },
  profile_complete: { name: 'Perfil completo', description: 'Nombre, avatar, ubicación y álbum', category: 'reputacion', icon: '✅', target: 1 },
  fast_responses_10: { name: 'Responde rápido', description: '10 respuestas en menos de 1 hora', category: 'reputacion', icon: '⚡', target: 10 },
  clean_trades_10: { name: 'Cruces impecables', description: '10 cruces sin ningún reporte', category: 'reputacion', icon: '🛡️', target: 10 },

  // Comunidad / Growth (8)
  share_album: { name: 'Coleccionista Público', description: 'Compartiste tu álbum', category: 'comunidad', icon: '📢', target: 1 },
  share_missing: { name: 'Lo Estoy Buscando', description: 'Compartiste tus faltantes', category: 'comunidad', icon: '🔍', target: 1 },
  share_duplicates: { name: 'Tengo Para Cambiar', description: 'Compartiste tus repetidas', category: 'comunidad', icon: '📦', target: 1 },
  invite_friend: { name: 'Traje Refuerzos', description: 'Invitaste a un amigo', category: 'comunidad', icon: '🤙', target: 1 },
  friend_active: { name: 'No Vine Solo', description: 'Tu amigo se activó', category: 'comunidad', icon: '🎉', target: 1 },
  share_match: { name: 'Buen Ojo', description: 'Compartiste un match', category: 'comunidad', icon: '👁️', target: 1 },
  share_album_complete: { name: 'Álbum Terminado', description: 'Compartiste tu álbum completado', category: 'comunidad', icon: '🏆', target: 1 },
  share_partner_verified: { name: 'PartnerStore Verified', description: 'Compartiste una Validaci\u00f3n PartnerStore', category: 'comunidad', icon: 'OK', target: 1 },
}

export const ACHIEVEMENT_CATEGORIES = [
  { key: 'actividad', label: 'Actividad', icon: '📊', color: '#22c55e' },
  { key: 'intercambio', label: 'Intercambio', icon: '🤝', color: '#8b5cf6' },
  { key: 'coleccion', label: 'Colección', icon: '📚', color: '#3b82f6' },
  { key: 'reputacion', label: 'Reputación', icon: '⭐', color: '#f59e0b' },
  { key: 'comunidad', label: 'Comunidad', icon: '🌐', color: '#ea580c' },
]

// ============================
// BADGES
// ============================
export const BADGES = {
  activo: { name: 'Activo', icon: '🟢', color: '#22c55e', description: 'Entra regularmente' },
  confiable: { name: 'Confiable', icon: '🛡️', color: '#3b82f6', description: 'Sin reportes, buen historial' },
  buen_cruce: { name: 'Buen cruce', icon: '🤝', color: '#8b5cf6', description: 'Cruces exitosos y bien valorados' },
  top_match: { name: 'Top Match', icon: '💎', color: '#f59e0b', description: 'Alto nivel de coincidencia' },
  referente: { name: 'Referente', icon: '⭐', color: '#f59e0b', description: 'Nivel máximo alcanzado' },
  perfil_completo: { name: 'Perfil completo', icon: '✅', color: '#22c55e', description: 'Toda la información cargada' },
  responde_rapido: { name: 'Responde rápido', icon: '⚡', color: '#ea580c', description: 'Tiempo de respuesta bajo' },
  sin_reportes: { name: 'Sin reportes', icon: '✨', color: '#64748b', description: 'Historial limpio' },
  level_coleccionista: { name: 'Coleccionista', icon: '📚', color: '#3b82f6', description: 'Alcanzó nivel Coleccionista' },
  level_intercambiador: { name: 'Intercambiador', icon: '🤝', color: '#8b5cf6', description: 'Alcanzó nivel Intercambiador' },
  level_referente: { name: 'Referente', icon: '⭐', color: '#f59e0b', description: 'Alcanzó nivel Referente' },
}

// ============================
// REWARDS CATALOG
// ============================
export const REWARD_TYPES = {
  plus_days: { name: 'Días Plus', icon: '💎', description: 'Acceso temporal a Plus' },
  pro_days: { name: 'Días Pro', icon: '👑', description: 'Acceso temporal a Pro' },
  extend_plus: { name: 'Extender Plus', icon: '💎+', description: 'Más días de Plus' },
  extend_pro: { name: 'Extender Pro', icon: '👑+', description: 'Más días de Pro' },
  upgrade_pro_temp: { name: 'Upgrade a Pro', icon: '⬆️', description: 'Upgrade temporal a Pro' },
  extra_favorites: { name: 'Favoritos extra', icon: '❤️', description: 'Favoritos adicionales temporales' },
  boost_visibility: { name: 'Boost visibilidad', icon: '🚀', description: 'Mayor visibilidad en cruces' },
  priority_trades: { name: 'Prioridad en cruces', icon: '⚡', description: 'Aparecés primero en resultados' },
  premium_alerts: { name: 'Alertas premium', icon: '🔔', description: 'Notificaciones avanzadas' },
  advanced_suggestions: { name: 'Sugerencias avanzadas', icon: '🎯', description: 'Mejores recomendaciones' },
  special_badge: { name: 'Insignia especial', icon: '🏅', description: 'Badge exclusivo temporal' },
  early_access: { name: 'Acceso anticipado', icon: '🔓', description: 'Probá funciones antes que nadie' },
}

// Achievement -> Reward mapping
export const ACHIEVEMENT_REWARDS = {
  first_day_active: null,
  streak_3: { type: 'extra_favorites', value: '24h', hours: 24 },
  streak_7: { type: 'plus_days', value: '1 día', hours: 24 },
  days_active_14: { type: 'plus_days', value: '3 días', hours: 72 },
  days_active_30: { type: 'pro_days', value: '1 día', hours: 24 },
  first_trade: { type: 'boost_visibility', value: '24h', hours: 24 },
  trades_3: { type: 'plus_days', value: '1 día', hours: 24 },
  trades_10: { type: 'pro_days', value: '1 día', hours: 24 },
  trades_25: { type: 'pro_days', value: '3 días', hours: 72 },
  trades_50: { type: 'special_badge', value: 'leyenda', hours: null },
  first_album: null,
  duplicates_50: { type: 'extra_favorites', value: '48h', hours: 48 },
  duplicates_100: { type: 'plus_days', value: '3 días', hours: 72 },
  page_complete: { type: 'boost_visibility', value: '24h', hours: 24 },
  album_complete: { type: 'pro_days', value: '3 días', hours: 72 },
  first_favorite: null,
  favorites_5: { type: 'premium_alerts', value: '24h', hours: 24 },
  profile_complete: { type: 'boost_visibility', value: '24h', hours: 24 },
  fast_responses_10: { type: 'priority_trades', value: '24h', hours: 24 },
  clean_trades_10: { type: 'plus_days', value: '1 día', hours: 24 },

  // Comunidad / Growth rewards
  share_album: null,
  share_missing: { type: 'boost_visibility', value: '24h', hours: 24 },
  share_duplicates: { type: 'boost_visibility', value: '24h', hours: 24 },
  invite_friend: { type: 'plus_days', value: '1 día', hours: 24 },
  friend_active: { type: 'pro_days', value: '1 día', hours: 24 },
  share_match: null,
  share_album_complete: { type: 'boost_visibility', value: '48h', hours: 48 },
  share_partner_verified: null,
}

// ============================
// HELPERS
// ============================
export function getLevelProgress(currentLevel, progress, profile) {
  const nextLevelKey = LEVELS[currentLevel]?.next
  if (!nextLevelKey) return { percent: 100, requirements: [], allMet: true }

  const reqs = LEVEL_REQUIREMENTS[nextLevelKey]
  if (!reqs) return { percent: 100, requirements: [], allMet: true }

  const evaluated = reqs.requirements.map(r => ({
    ...r,
    met: r.check(profile, progress),
  }))

  const met = evaluated.filter(r => r.met).length
  const percent = Math.round((met / evaluated.length) * 100)

  return { percent, requirements: evaluated, allMet: met === evaluated.length }
}

export function getNextLevelMessage(currentLevel, progress, profile) {
  const nextLevelKey = LEVELS[currentLevel]?.next
  if (!nextLevelKey) return 'Desbloqueaste el Circuito Referente'

  const { requirements } = getLevelProgress(currentLevel, progress, profile)
  const pending = requirements.filter(r => !r.met)
  if (pending.length === 0) return '¡Estás listo para subir de nivel!'

  const first = pending[0]
  return `Te falta: ${first.label}`
}
