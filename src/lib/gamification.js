/**
 * FigusUY Gamification System
 *
 * Utility-first, community-first, trust-aware.
 * It rewards actions that move the network, unlock liquidity,
 * validate trust and strengthen the ecosystem.
 */

// ============================
// LEVELS
// ============================

export const LEVELS = {
  explorador: {
    key: 'explorador',
    name: 'Explorador',
    order: 1,
    icon: 'ðŸ§­',
    iconKey: 'UserLevelExplorerIcon',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    description: 'Entraste al sistema y empezaste a mover tu album.',
    next: 'coleccionista',
  },
  coleccionista: {
    key: 'coleccionista',
    name: 'Coleccionista',
    order: 2,
    icon: 'ðŸ“š',
    iconKey: 'UserLevelCollectorIcon',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    description: 'Tu coleccion ya genera valor para otros.',
    next: 'intercambiador',
  },
  intercambiador: {
    key: 'intercambiador',
    name: 'Intercambiador',
    order: 3,
    icon: 'ðŸ¤',
    iconKey: 'UserLevelTraderIcon',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    description: 'Concretas intercambios reales y activas liquidez.',
    next: 'referente',
  },
  referente: {
    key: 'referente',
    name: 'Referente',
    order: 4,
    icon: 'â­',
    iconKey: 'UserLevelReferentIcon',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Tu actividad mejora confianza, visibilidad y comunidad.',
    next: null,
  },
}

export const LEVEL_ORDER = ['explorador', 'coleccionista', 'intercambiador', 'referente']

export const LEVEL_REQUIREMENTS = {
  coleccionista: {
    label: 'Coleccionista',
    requirements: [
      { key: 'profile_name', label: 'Perfil con nombre', check: (p) => !!(p.name && p.name.trim()) },
      { key: 'avatar', label: 'Avatar cargado', check: (p) => !!p.avatar_url },
      { key: 'album', label: '1 album activo', check: (_, g) => (g.total_albums || 0) >= 1 },
      { key: 'stickers', label: '15 figuritas cargadas', check: (_, g) => (g.total_stickers_loaded || 0) >= 15 },
    ],
  },
  intercambiador: {
    label: 'Intercambiador',
    requirements: [
      { key: 'confirmed_exchange', label: '1 intercambio confirmado', check: (_, g) => (g.completed_exchanges || g.total_trades || 0) >= 1 },
      { key: 'duplicates', label: '20 repetidas disponibles', check: (_, g) => (g.total_duplicates_loaded || 0) >= 20 },
      { key: 'chats', label: '3 chats utiles', check: (_, g) => (g.total_chats || 0) >= 3 },
    ],
  },
  referente: {
    label: 'Referente',
    requirements: [
      { key: 'confirmed_exchanges', label: '5 intercambios confirmados', check: (_, g) => (g.completed_exchanges || g.total_trades || 0) >= 5 },
      { key: 'reliability', label: 'Confiabilidad 70+', check: (_, g) => (g.reliability_score || 0) >= 70 },
      { key: 'completion_rate', label: 'Tasa de cierre 70%+', check: (_, g) => (g.completion_rate || 0) >= 70 },
    ],
  },
}

// ============================
// XP SOURCES
// ============================

export const XP_SOURCES = {
  exchange_confirmed: {
    label: 'Intercambio confirmado',
    xp: 80,
    category: 'progreso',
    impact: ['liquidez', 'trust', 'ranking'],
  },
  exchange_completed: {
    label: 'Intercambio cerrado',
    xp: 55,
    category: 'progreso',
    impact: ['liquidez', 'ranking'],
  },
  exchange_completion_streak: {
    label: 'Streak de intercambios',
    xp: 95,
    category: 'progreso',
    impact: ['liquidez', 'visibility'],
  },
  album_complete: {
    label: 'Album completo',
    xp: 120,
    category: 'coleccion',
    impact: ['trust', 'visibility'],
  },
  partner_album_validation: {
    label: 'Validacion PartnerStore',
    xp: 140,
    category: 'partner',
    impact: ['trust', 'visibility', 'ranking'],
  },
  approved_exchange_point: {
    label: 'Punto sugerido aprobado',
    xp: 90,
    category: 'growth',
    impact: ['community', 'liquidez'],
  },
  approved_album_upload: {
    label: 'Album aprobado',
    xp: 70,
    category: 'partner',
    impact: ['community', 'trust'],
  },
  share_album: {
    label: 'Compartir album',
    xp: 18,
    category: 'comunidad',
    impact: ['growth', 'visibility'],
  },
  share_missing: {
    label: 'Compartir faltantes',
    xp: 22,
    category: 'comunidad',
    impact: ['liquidez', 'growth'],
  },
  share_duplicates: {
    label: 'Compartir repetidas',
    xp: 22,
    category: 'comunidad',
    impact: ['liquidez', 'growth'],
  },
  invite_friend: {
    label: 'Invitar amigo',
    xp: 30,
    category: 'growth',
    impact: ['growth'],
  },
  friend_activated: {
    label: 'Amigo activado',
    xp: 110,
    category: 'growth',
    impact: ['growth', 'liquidez'],
  },
  use_partner_store: {
    label: 'Usar PartnerStore',
    xp: 45,
    category: 'partner',
    impact: ['trust', 'community'],
  },
  leave_rating: {
    label: 'Dejar rating',
    xp: 25,
    category: 'reputacion',
    impact: ['trust', 'community'],
  },
  confirm_exchange: {
    label: 'Confirmar intercambio',
    xp: 35,
    category: 'reputacion',
    impact: ['trust', 'liquidez'],
  },
  // V2 Expansion
  approved_metadata: {
    label: 'Metadata útil aprobada',
    xp: 18,
    category: 'curacion',
    impact: ['community', 'trust'],
  },
  shared_match_closed: {
    label: 'Match compartido que cierra',
    xp: 35,
    category: 'impacto',
    impact: ['liquidez', 'growth'],
  },
  point_activated: {
    label: 'Punto activado por sugerencia',
    xp: 60,
    category: 'impacto',
    impact: ['community', 'liquidez'],
  },
  early_bird_250: {
    label: 'Estar en las primeras 250',
    xp: 100,
    category: 'progreso',
    impact: ['trust', 'visibility'],
  },
}

// ============================
// ACHIEVEMENTS
// ============================

export const ACHIEVEMENTS = {
  first_trade: {
    name: 'Primer intercambio',
    description: 'Cerraste tu primer intercambio real.',
    category: 'progreso',
    icon: 'ðŸ¤',
    target: 1,
    xp_source: 'exchange_completed',
  },
  exchange_confirmed: {
    name: 'Intercambio confirmado',
    description: 'Ambas partes confirmaron el cruce.',
    category: 'progreso',
    icon: 'âœ…',
    target: 1,
    xp_source: 'exchange_confirmed',
  },
  exchange_streak_3: {
    name: 'Racha que mueve la red',
    description: 'Encadenaste 3 intercambios confirmados.',
    category: 'progreso',
    icon: 'ðŸ”¥',
    target: 3,
    xp_source: 'exchange_completion_streak',
  },
  since_day_one: {
    name: 'Desde el comienzo',
    description: 'Estuviste desde las primeras etapas del sistema.',
    category: 'progreso',
    icon: 'ðŸŒ…',
    iconKey: 'FoundingMemberIcon',
    target: 1,
  },

  clean_trades_10: {
    name: 'Siempre cumple',
    description: 'Mantuviste un historial limpio en 10 intercambios.',
    category: 'reputacion',
    icon: 'ðŸ›¡ï¸',
    target: 10,
  },
  first_rating: {
    name: 'Valido con respeto',
    description: 'Dejaste tu primer rating util para la comunidad.',
    category: 'reputacion',
    icon: 'â­',
    target: 1,
    xp_source: 'leave_rating',
  },
  curator: {
    name: 'Curador',
    description: 'Aportaste validaciones o ratings de alta calidad.',
    category: 'reputacion',
    icon: 'ðŸ§ ',
    target: 5,
  },
  confirm_exchange_action: {
    name: 'Confirma y ordena',
    description: 'Confirmaste cierres para mantener datos confiables.',
    category: 'reputacion',
    icon: 'ðŸ“Œ',
    target: 3,
    xp_source: 'confirm_exchange',
  },

  first_album: {
    name: 'Album cargado',
    description: 'Subiste tu primer album al sistema.',
    category: 'coleccion',
    icon: 'ðŸ“–',
    target: 1,
  },
  archivist: {
    name: 'Archivista',
    description: 'Cargaste varias colecciones y dejaste inventario util.',
    category: 'coleccion',
    icon: 'ðŸ—‚ï¸',
    target: 3,
  },
  page_complete: {
    name: 'Pagina cerrada',
    description: 'Completaste una pagina y acercaste liquidez real.',
    category: 'coleccion',
    icon: 'ðŸ“„',
    target: 1,
  },
  album_complete: {
    name: 'Album completo',
    description: 'Completaste un album entero dentro del ecosistema.',
    category: 'coleccion',
    icon: 'ðŸ†',
    target: 1,
    xp_source: 'album_complete',
  },

  share_album: {
    name: 'Album abierto',
    description: 'Compartiste tu album para activar nuevos cruces.',
    category: 'comunidad',
    icon: 'ðŸ“£',
    target: 1,
    xp_source: 'share_album',
  },
  share_missing: {
    name: 'Estoy buscando',
    description: 'Compartiste tus faltantes para atraer ayuda real.',
    category: 'comunidad',
    icon: 'ðŸ”Ž',
    target: 1,
    xp_source: 'share_missing',
  },
  share_duplicates: {
    name: 'Tengo para cambiar',
    description: 'Mostraste repetidas para sumar liquidez.',
    category: 'comunidad',
    icon: 'ðŸ“¦',
    target: 1,
    xp_source: 'share_duplicates',
  },
  community_helper: {
    name: 'Comunidad en movimiento',
    description: 'Tus acciones compartidas activaron actividad en red.',
    category: 'comunidad',
    icon: 'ðŸŒ',
    target: 5,
  },

  invite_friend: {
    name: 'Trajo a alguien',
    description: 'Invitaste a una nueva persona a FigusUY.',
    category: 'growth',
    icon: 'ðŸ¤',
    target: 1,
    xp_source: 'invite_friend',
  },
  friend_active: {
    name: 'No vine solo',
    description: 'Tu invitacion termino en una cuenta activada.',
    category: 'growth',
    icon: 'ðŸŽ‰',
    target: 1,
    xp_source: 'friend_activated',
  },
  activated_network: {
    name: 'Activo la red',
    description: 'Tus invitaciones ya empujan nuevos cruces.',
    category: 'growth',
    icon: 'ðŸ“ˆ',
    target: 3,
  },
  point_suggester: {
    name: 'Punto sugerido',
    description: 'Propusiste un punto de intercambio que fue aprobado.',
    category: 'growth',
    icon: 'ðŸ“',
    target: 1,
    xp_source: 'approved_exchange_point',
  },

  partner_store_used: {
    name: 'Circuito Partner',
    description: 'Usaste un PartnerStore como parte del sistema vivo.',
    category: 'partner',
    icon: 'ðŸª',
    target: 1,
    xp_source: 'use_partner_store',
  },
  partner_verified: {
    name: 'Verificado en PartnerStore',
    description: 'Tu album o progreso fue validado por un partner.',
    category: 'partner',
    icon: 'âœ”ï¸',
    target: 1,
    xp_source: 'partner_album_validation',
  },
  approved_album_upload: {
    name: 'Carga aprobada',
    description: 'Un album o carga relevante fue aprobada para el sistema.',
    category: 'partner',
    icon: 'ðŸ§¾',
    target: 1,
    xp_source: 'approved_album_upload',
  },
  verified_album_complete: {
    name: 'Leyenda verificada',
    description: 'Completaste y validaste un album en el circuito partner.',
    category: 'partner',
    icon: 'ðŸ‘‘',
    target: 1,
    xp_source: 'partner_album_validation',
  },

  // IMPACTO
  good_movement: {
    name: 'Buen Movimiento',
    description: 'Activaste 3 intercambios entre otros usuarios.',
    category: 'impacto',
    icon: 'ðŸŒ€',
    target: 3,
  },
  network_engine: {
    name: 'Motor de Red',
    description: 'Generaste 10 matches útiles.',
    category: 'impacto',
    icon: 'âš™ï¸',
    target: 10,
  },
  connector_achievement: {
    name: 'Conector',
    description: '3 usuarios cerraron un intercambio desde algo que compartiste.',
    category: 'impacto',
    icon: 'ðŸ”—',
    target: 3,
  },
  local_impulse: {
    name: 'Impulso Local',
    description: 'Activaste movimiento en un punto sugerido.',
    category: 'impacto',
    icon: 'ðŸ“',
    target: 1,
  },
  real_liquidity: {
    name: 'Liquidez Real',
    description: 'Tus repetidas ayudaron a cerrar 15 intercambios.',
    category: 'impacto',
    icon: 'ðŸ’§',
    target: 15,
  },

  // CURACIÓN
  curator_action: {
    name: 'Curador',
    description: 'Sugeriste un punto aprobado.',
    category: 'curacion',
    icon: 'ðŸ§ ',
    target: 1,
    xp_source: 'approved_exchange_point',
  },
  cataloger_achievement: {
    name: 'Catalogador',
    description: 'Sugeriste un álbum aceptado.',
    category: 'curacion',
    icon: 'ðŸ“',
    target: 1,
    xp_source: 'approved_album_upload',
  },
  organized_achievement: {
    name: 'Ordenado',
    description: 'Completaste metadata útil aprobada.',
    category: 'curacion',
    icon: 'ðŸ“‹',
    target: 1,
    xp_source: 'approved_metadata',
  },
  clinical_eye: {
    name: 'Ojo Clínico',
    description: 'Reportaste información incorrecta válida.',
    category: 'curacion',
    icon: 'ðŸ‘ï¸',
    target: 1,
  },
  network_editor: {
    name: 'Editor de la Red',
    description: 'Hiciste 5 aportes útiles aprobados.',
    category: 'curacion',
    icon: 'âœï¸',
    target: 5,
  },
}

export const ACHIEVEMENT_CATEGORIES = [
  { key: 'progreso', label: 'Progreso', icon: 'ðŸ“ˆ', color: '#22c55e' },
  { key: 'reputacion', label: 'Reputacion', icon: 'ðŸ›¡ï¸', color: '#3b82f6' },
  { key: 'coleccion', label: 'Coleccion', icon: 'ðŸ“š', color: '#8b5cf6' },
  { key: 'comunidad', label: 'Comunidad', icon: 'ðŸŒ', color: '#f59e0b' },
  { key: 'growth', label: 'Growth', icon: 'ðŸš€', color: '#ea580c' },
  { key: 'impacto', label: 'Impacto', icon: 'ðŸ’¥', color: '#ec4899' },
  { key: 'curacion', label: 'Curación', icon: 'ðŸ§¹', color: '#06b6d4' },
  { key: 'partner', label: 'Partner / Validacion', icon: 'âœ”ï¸', color: '#14b8a6' },
]

// ============================
// BADGES
// ============================

export const BADGES = {
  activo: { name: 'Activo', icon: 'âš¡', iconKey: 'BadgeActiveIcon', color: '#22c55e', description: 'Sostiene actividad util.' },
  confiable: { name: 'Confiable', icon: 'ðŸ›¡ï¸', iconKey: 'BadgeTrustedIcon', color: '#3b82f6', description: 'Cierra bien y sostiene confianza.' },
  buen_cruce: { name: 'Buen cruce', icon: 'ðŸ¤', iconKey: 'BadgeActiveIcon', color: '#8b5cf6', description: 'Genera intercambios reales.' },
  top_cruce: { name: 'Top cruce', icon: 'ðŸ†', iconKey: 'BadgeTopTradeIcon', color: '#f59e0b', description: 'Impacta fuerte en ranking y liquidez.' },
  motor_de_red: { name: 'Motor de red', icon: 'ðŸ“ˆ', iconKey: 'BadgeImpactHighIcon', color: '#ea580c', description: 'Activa comunidad y crecimiento.' },
  curador: { name: 'Curador', icon: 'ðŸ§ ', iconKey: 'BadgeTrustedIcon', color: '#14b8a6', description: 'Aporta validacion util al sistema.' },
  partner_verificado: { name: 'Partner verificado', icon: 'âœ”ï¸', iconKey: 'BadgePartnerVerifiedIcon', color: '#14b8a6', description: 'Validado en circuito PartnerStore.' },
  desde_el_comienzo: { name: 'Desde el comienzo', icon: 'ðŸŒ…', iconKey: 'FoundingMemberIcon', color: '#64748b', description: 'Presente en las primeras etapas.', rarity: 'histórico' },
  curador_v2: { name: 'Curador', icon: 'ðŸ§ ', iconKey: 'BadgeTrustedIcon', color: '#14b8a6', description: 'Mejora la calidad del sistema.' },
  catalogador: { name: 'Catalogador', icon: 'ðŸ“', iconKey: 'BadgeTrustedIcon', color: '#06b6d4', description: 'Aporta estructura al catálogo.' },
  motor_de_red_v2: { name: 'Motor de Red', icon: 'âš™ï¸', iconKey: 'BadgeImpactHighIcon', color: '#ec4899', description: 'Genera movimiento en la red.' },
  conector: { name: 'Conector', icon: 'ðŸ”—', iconKey: 'BadgeActiveIcon', color: '#8b5cf6', description: 'Une a la comunidad.' },
  impacto_alto: { name: 'Impacto Alto', icon: 'ðŸ’¥', iconKey: 'BadgeImpactHighIcon', color: '#ef4444', description: 'Genera valor masivo en la red.' },
  partner_friendly: { name: 'Partner Friendly', icon: 'ðŸª', iconKey: 'BadgeCollectorHubFriendlyIcon', color: '#10b981', description: 'Usuario activo en circuito Partner.' },
  level_coleccionista: { name: 'Coleccionista', icon: 'ðŸ“š', iconKey: 'UserLevelCollectorIcon', color: '#3b82f6', description: 'Alcanzo nivel Coleccionista.' },
  level_intercambiador: { name: 'Intercambiador', icon: 'ðŸ¤', iconKey: 'UserLevelTraderIcon', color: '#8b5cf6', description: 'Alcanzo nivel Intercambiador.' },
  level_referente: { name: 'Referente', icon: 'â­', iconKey: 'UserLevelReferentIcon', color: '#f59e0b', description: 'Alcanzo nivel Referente.' },
}

// ============================
// REWARDS
// ============================

export const REWARD_TYPES = {
  plus_days: { name: 'Dias Plus', icon: 'ðŸ’Ž', description: 'Acceso temporal a Plus.' },
  pro_days: { name: 'Dias Pro', icon: 'ðŸ‘‘', description: 'Acceso temporal a Pro.' },
  extend_plus: { name: 'Extender Plus', icon: 'ðŸ’Ž+', description: 'Mas tiempo en Plus.' },
  extend_pro: { name: 'Extender Pro', icon: 'ðŸ‘‘+', description: 'Mas tiempo en Pro.' },
  upgrade_pro_temp: { name: 'Upgrade temporal', icon: 'â¬†ï¸', description: 'Sube temporalmente a Pro.' },
  extra_favorites: { name: 'Favoritos extra', icon: 'â¤ï¸', description: 'Mayor capacidad util temporal.' },
  boost_visibility: { name: 'Ventana de visibilidad', icon: 'ðŸš€', description: 'Mejor exposicion temporal en resultados.' },
  priority_trades: { name: 'Prioridad contextual', icon: 'ðŸŽ¯', description: 'Prioridad en contextos relevantes de cruce.' },
  premium_alerts: { name: 'Alertas premium', icon: 'ðŸ””', description: 'Alertas de alta oportunidad.' },
  advanced_suggestions: { name: 'Sugerencias avanzadas', icon: 'ðŸ§­', description: 'Mejores sugerencias para cerrar cruces.' },
  special_badge: { name: 'Distintivo util', icon: 'ðŸ…', description: 'Insignia con efecto de confianza o visibilidad.' },
  early_access: { name: 'Acceso anticipado', icon: 'ðŸ•', description: 'Acceso temprano a funciones nuevas.' },
  // V2 Rewards
  community_boost: { name: 'Boost comunitario', icon: 'ðŸŒ', description: 'Mejor visibilidad en la comunidad.' },
  profile_visibility_plus: { name: 'Visibilidad perfil+', icon: 'ðŸ‘¤+', description: 'Tu perfil resalta en listados.' },
  featured_badge_reward: { name: 'Badge destacado', icon: 'âœ¨', description: 'Badge con brillo especial.' },
  editorial_priority: { name: 'Prioridad editorial', icon: 'âœï¸', description: 'Tus sugerencias se revisan antes.' },
  now_exposure: { name: 'Exposición en "Ahora"', icon: 'ðŸ“º', description: 'Apareces en el feed de actividad real.' },
  temporal_highlight: { name: 'Highlight temporal', icon: 'ðŸ”¦', description: 'Resaltado visual en el mapa y listas.' },
  suggested_favorite: { name: 'Favorito sugerido', icon: 'â­+', description: 'Apareces como sugerencia de seguimiento.' },
  curator_mark: { name: 'Marca de curador', icon: 'ðŸŽ¨', description: 'Sello de calidad en tus aportes.' },
}

export const ACHIEVEMENT_REWARDS = {
  first_trade: { type: 'boost_visibility', value: '24h', hours: 24 },
  exchange_confirmed: { type: 'priority_trades', value: '24h', hours: 24 },
  exchange_streak_3: { type: 'plus_days', value: '1 dia', hours: 24 },
  since_day_one: { type: 'special_badge', value: 'desde_el_comienzo', hours: null },

  clean_trades_10: { type: 'boost_visibility', value: '48h', hours: 48 },
  first_rating: null,
  curator: { type: 'advanced_suggestions', value: '48h', hours: 48 },
  confirm_exchange_action: { type: 'premium_alerts', value: '24h', hours: 24 },

  first_album: null,
  archivist: { type: 'extra_favorites', value: '48h', hours: 48 },
  page_complete: { type: 'boost_visibility', value: '24h', hours: 24 },
  album_complete: { type: 'pro_days', value: '3 dias', hours: 72 },

  share_album: null,
  share_missing: { type: 'boost_visibility', value: '24h', hours: 24 },
  share_duplicates: { type: 'boost_visibility', value: '24h', hours: 24 },
  community_helper: { type: 'priority_trades', value: '24h', hours: 24 },

  invite_friend: { type: 'plus_days', value: '1 dia', hours: 24 },
  friend_active: { type: 'pro_days', value: '1 dia', hours: 24 },
  activated_network: { type: 'boost_visibility', value: '48h', hours: 48 },
  point_suggester: { type: 'special_badge', value: 'motor_de_red', hours: null },

  // IMPACTO REWARDS
  good_movement: { type: 'now_exposure', value: '48h', hours: 48 },
  network_engine: { type: 'profile_visibility_plus', value: '72h', hours: 72 },
  connector_achievement: { type: 'community_boost', value: '48h', hours: 48 },
  local_impulse: { type: 'temporal_highlight', value: '24h', hours: 24 },
  real_liquidity: { type: 'suggested_favorite', value: '72h', hours: 72 },

  // CURACIÓN REWARDS
  curator_action: { type: 'curator_mark', value: 'permanente', hours: null },
  cataloger_achievement: { type: 'editorial_priority', value: 'permanente', hours: null },
  organized_achievement: { type: 'advanced_suggestions', value: '48h', hours: 48 },
  clinical_eye: { type: 'premium_alerts', value: '24h', hours: 24 },
  network_editor: { type: 'curator_mark', value: 'permanente', hours: null },

  partner_store_used: null,
  partner_verified: { type: 'special_badge', value: 'partner_verificado', hours: null },
  approved_album_upload: { type: 'premium_alerts', value: '24h', hours: 24 },
  verified_album_complete: { type: 'pro_days', value: '3 dias', hours: 72 },
}

// ============================
// IMPACT MODEL
// ============================

export const IMPACT_AREAS = {
  ranking: { label: 'Ranking', description: 'Mejora posicion en contextos relevantes.' },
  trust: { label: 'Trust', description: 'Fortalece senales de confianza.' },
  visibility: { label: 'Visibilidad', description: 'Aumenta exposicion temporal o contextual.' },
  growth: { label: 'Growth', description: 'Suma nuevos usuarios o reactivaciones.' },
  liquidez: { label: 'Liquidez', description: 'Aumenta chance de cerrar intercambios.' },
  community: { label: 'Comunidad', description: 'Hace mas util y vivo el ecosistema.' },
}

export const GAMIFICATION_IMPACT_RULES = {
  ranking: ['exchange_confirmed', 'partner_album_validation', 'approved_exchange_point'],
  trust: ['exchange_confirmed', 'partner_album_validation', 'leave_rating', 'confirm_exchange'],
  visibility: ['share_album', 'share_missing', 'share_duplicates', 'exchange_completion_streak'],
  growth: ['invite_friend', 'friend_activated'],
  liquidez: ['exchange_confirmed', 'share_missing', 'share_duplicates', 'approved_exchange_point', 'shared_match_closed'],
  community: ['leave_rating', 'use_partner_store', 'approved_album_upload', 'approved_metadata', 'point_activated'],
}

export function getLevelProgress(currentLevel, progress, profile) {
  const nextLevelKey = LEVELS[currentLevel]?.next
  if (!nextLevelKey) return { percent: 100, requirements: [], allMet: true }

  const reqs = LEVEL_REQUIREMENTS[nextLevelKey]
  if (!reqs) return { percent: 100, requirements: [], allMet: true }

  const evaluated = reqs.requirements.map((r) => ({
    ...r,
    met: r.check(profile, progress),
  }))

  const met = evaluated.filter((r) => r.met).length
  const percent = Math.round((met / evaluated.length) * 100)

  return { percent, requirements: evaluated, allMet: met === evaluated.length }
}

export function getNextLevelMessage(currentLevel, progress, profile) {
  const nextLevelKey = LEVELS[currentLevel]?.next
  if (!nextLevelKey) return 'Desbloqueaste el Circuito Referente'

  const { requirements } = getLevelProgress(currentLevel, progress, profile)
  const pending = requirements.filter((r) => !r.met)
  if (pending.length === 0) return 'Estas listo para subir de nivel'

  return `Te falta: ${pending[0].label}`
}

export function getXPSource(actionKey) {
  return XP_SOURCES[actionKey] || null
}

export function getXPForAction(actionKey, multiplier = 1) {
  const source = getXPSource(actionKey)
  if (!source) return 0
  return Math.round(source.xp * Math.max(1, Number(multiplier) || 1))
}

export function listAchievementKeysByCategory(categoryKey) {
  return Object.keys(ACHIEVEMENTS).filter((key) => ACHIEVEMENTS[key].category === categoryKey)
}

export function buildGamificationImpactSummary(progress = {}, achievements = [], rewards = []) {
  const completedKeys = achievements.filter((a) => a.completed).map((a) => a.key || a.achievement_key)
  const activeRewardTypes = rewards
    .filter((r) => !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > new Date()))
    .map((r) => r.type || r.resolved_as)

  return {
    ranking: completedKeys.some((key) => ['exchange_confirmed', 'partner_verified', 'verified_album_complete'].includes(key)),
    trust: (progress.reliability_score || 0) >= 70 || completedKeys.includes('clean_trades_10'),
    visibility: activeRewardTypes.includes('boost_visibility') || activeRewardTypes.includes('priority_trades'),
    growth: completedKeys.some((key) => ['invite_friend', 'friend_active', 'activated_network'].includes(key)),
    liquidez: (progress.completed_exchanges || progress.total_trades || 0) >= 1 || completedKeys.includes('share_duplicates'),
    community: completedKeys.some((key) => ['share_album', 'share_missing', 'community_helper', 'curator'].includes(key)),
  }
}
