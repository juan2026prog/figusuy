/**
 * FigusUY Growth Engine — Constants & Definitions
 * Smart Notifications, Onboarding, Referrals, Growth Achievements
 */

// ============================
// SMART NOTIFICATION TRIGGERS
// ============================
export const NOTIFICATION_TRIGGERS = {
  better_matches: {
    key: 'better_matches', type: 'opportunity', icon: 'swap_horiz',
    title: 'Mejores matches hoy',
    template: 'Tenés {count} matches mejores que ayer',
    priority: 'high', cooldown_hours: 24, active: true, category: 'matches',
  },
  nearby_collector: {
    key: 'nearby_collector', type: 'opportunity', icon: 'near_me',
    title: 'Coleccionista cerca',
    template: 'Hay alguien cerca con {count} figuritas tuyas',
    priority: 'high', cooldown_hours: 12, active: true, category: 'proximity',
  },
  best_match_replied: {
    key: 'best_match_replied', type: 'action', icon: 'chat_bubble',
    title: 'Tu mejor match respondió',
    template: '{name} respondió tu mensaje',
    priority: 'critical', cooldown_hours: 0, active: true, category: 'chat',
  },
  zone_demand: {
    key: 'zone_demand', type: 'opportunity', icon: 'location_on',
    title: 'Demanda en tu zona',
    template: '{count} personas en tu zona buscan tus repetidas',
    priority: 'medium', cooldown_hours: 48, active: true, category: 'proximity',
  },
  partner_store_nearby: {
    key: 'partner_store_nearby', type: 'opportunity', icon: 'storefront',
    title: 'PartnerStore cerca',
    template: 'Hay una Tienda PartnerStore validando cerca tuyo',
    priority: 'medium', cooldown_hours: 72, active: true, category: 'partner',
  },
  closing_chance: {
    key: 'closing_chance', type: 'opportunity', icon: 'trending_up',
    title: 'Buena chance de cerrar',
    template: 'Hoy tenés más chances de cerrar un cruce',
    priority: 'medium', cooldown_hours: 48, active: true, category: 'matches',
  },
  new_collector_needs: {
    key: 'new_collector_needs', type: 'opportunity', icon: 'person_add',
    title: 'Alguien nuevo te busca',
    template: 'Alguien nuevo tiene {count} que te faltan',
    priority: 'high', cooldown_hours: 24, active: true, category: 'matches',
  },
  stale_chat_opportunity: {
    key: 'stale_chat_opportunity', type: 'reactivation', icon: 'mark_chat_unread',
    title: 'Chat pendiente valioso',
    template: 'Tenés un chat con {name} que vale la pena retomar',
    priority: 'low', cooldown_hours: 72, active: true, category: 'chat',
  },
}

export const NOTIFICATION_CATEGORIES = [
  { key: 'matches', label: 'Matches', icon: 'swap_horiz', color: '#8b5cf6' },
  { key: 'proximity', label: 'Cercanía', icon: 'near_me', color: '#22c55e' },
  { key: 'chat', label: 'Chat', icon: 'chat', color: '#3b82f6' },
  { key: 'partner', label: 'PartnerStore', icon: 'storefront', color: '#f59e0b' },
]

export const NOTIFICATION_PRIORITIES = {
  critical: { label: 'Crítica', color: '#ef4444', weight: 4 },
  high: { label: 'Alta', color: '#f59e0b', weight: 3 },
  medium: { label: 'Media', color: '#3b82f6', weight: 2 },
  low: { label: 'Baja', color: '#64748b', weight: 1 },
}

// ============================
// ONBOARDING STEPS
// ============================
export const ONBOARDING_STEPS = [
  {
    key: 'choose_album', order: 1, title: 'Elegí tu álbum',
    description: 'Seleccioná el álbum que estás completando',
    icon: 'menu_book', route: '/album', action: 'Ir al álbum',
    check: (p, g) => (g?.total_albums || 0) >= 1,
    nudge: 'Sin álbum no podés encontrar matches. ¡Elegí uno!',
  },
  {
    key: 'load_stickers', order: 2, title: 'Cargá tus figuritas',
    description: 'Marcá tus faltantes y repetidas',
    icon: 'edit_note', route: '/album', action: 'Cargar figuritas',
    check: (p, g) => (g?.total_stickers_loaded || 0) >= 5,
    nudge: 'Cuantas más cargues, mejores matches vas a tener.',
  },
  {
    key: 'first_match', order: 3, title: 'Mirá tu primer match',
    description: 'Encontrá a alguien con quien intercambiar',
    icon: 'swap_horiz', route: '/matches', action: 'Ver matches',
    check: (p, g) => (g?.total_matches_viewed || 0) >= 1,
    nudge: 'Ya tenés figuritas cargadas. ¡Mirá quién te conviene!',
  },
  {
    key: 'first_chat', order: 4, title: 'Abrí tu primer chat',
    description: 'Contactá a un match y coordiná un cruce',
    icon: 'chat', route: '/chats', action: 'Ir a chats',
    check: (p, g) => (g?.total_chats || 0) >= 1,
    nudge: 'Encontraste un match. ¡Escribile para coordinar!',
  },
]

export const ACTIVATION_DEFINITION = {
  label: 'Usuario Activado',
  description: 'Completó el flujo: álbum → figuritas → match → chat',
  steps_required: 4,
}

// ============================
// SHARE / REFERRAL TYPES
// ============================
export const SHARE_TYPES = {
  album: {
    key: 'album', label: 'Mi Álbum', icon: 'menu_book', color: '#3b82f6',
    title_tpl: '¡Estoy completando {album_name} en FigusUY!',
    desc_tpl: 'Llevo {percent}% completado. ¿Vos también lo juntás?',
    achievement_key: 'share_album',
  },
  missing: {
    key: 'missing', label: 'Mis Faltantes', icon: 'search', color: '#f59e0b',
    title_tpl: 'Busco estas figuritas',
    desc_tpl: 'Me faltan {count} figuritas. ¿Tenés alguna?',
    achievement_key: 'share_missing',
  },
  duplicates: {
    key: 'duplicates', label: 'Mis Repetidas', icon: 'inventory_2', color: '#8b5cf6',
    title_tpl: 'Tengo figuritas para cambiar',
    desc_tpl: 'Tengo {count} repetidas. ¿Necesitás alguna?',
    achievement_key: 'share_duplicates',
  },
  match: {
    key: 'match', label: 'Un Match', icon: 'handshake', color: '#ea580c',
    title_tpl: '¡Encontré un match en FigusUY!',
    desc_tpl: 'Nos cruzamos {count} figuritas. ¡La app funciona!',
    achievement_key: 'share_match',
  },
  album_complete: {
    key: 'album_complete', label: 'Álbum Completo', icon: 'emoji_events', color: '#f59e0b',
    title_tpl: '¡Completé {album_name}! 🏆',
    desc_tpl: 'Lo logré con FigusUY.',
    achievement_key: 'share_album_complete',
  },
  partner_verified: {
    key: 'partner_verified', label: 'PartnerStore Verified', icon: 'verified', color: '#22c55e',
    title_tpl: 'Validé mi álbum en una Tienda PartnerStore',
    desc_tpl: 'PartnerStore Verified en {store_name}.',
    achievement_key: 'share_partner_verified',
  },
}

export const REFERRAL_REWARDS = {
  invite_sent: { xp: 5, label: 'Invitación enviada' },
  friend_signed_up: { xp: 25, reward_type: 'boost_visibility', reward_hours: 24, label: 'Amigo registrado' },
  friend_activated: { xp: 100, reward_type: 'plus_days', reward_hours: 72, label: 'Amigo activado' },
  friend_first_trade: { xp: 200, reward_type: 'pro_days', reward_hours: 24, label: 'Amigo hizo primer cruce' },
}

// ============================
// GROWTH ACHIEVEMENTS
// ============================
export const GROWTH_ACHIEVEMENTS = {
  share_album: { name: 'Coleccionista Público', description: 'Compartiste tu álbum', category: 'comunidad', icon: '📢', target: 1 },
  share_missing: { name: 'Lo Estoy Buscando', description: 'Compartiste tus faltantes', category: 'comunidad', icon: '🔍', target: 1, reward: { type: 'boost_visibility', value: '24h', hours: 24 } },
  share_duplicates: { name: 'Tengo Para Cambiar', description: 'Compartiste tus repetidas', category: 'comunidad', icon: '📦', target: 1, reward: { type: 'boost_visibility', value: '24h', hours: 24 } },
  invite_friend: { name: 'Traje Refuerzos', description: 'Invitaste a un amigo', category: 'comunidad', icon: '🤙', target: 1, reward: { type: 'plus_days', value: '1 día', hours: 24 } },
  friend_active: { name: 'No Vine Solo', description: 'Tu amigo se activó', category: 'comunidad', icon: '🎉', target: 1, reward: { type: 'pro_days', value: '1 día', hours: 24 } },
  share_match: { name: 'Buen Ojo', description: 'Compartiste un match', category: 'comunidad', icon: '👁️', target: 1 },
  share_album_complete: { name: 'Álbum Terminado', description: 'Compartiste álbum completado', category: 'comunidad', icon: '🏆', target: 1, reward: { type: 'boost_visibility', value: '48h', hours: 48 } },
  share_partner_verified: { name: 'PartnerStore Verified', description: 'Compartiste una Validación PartnerStore', category: 'comunidad', icon: 'OK', target: 1 },
}

export const GROWTH_ACHIEVEMENT_CATEGORY = { key: 'comunidad', label: 'Comunidad', icon: '🌐', color: '#ea580c' }

// ============================
// HELPERS
// ============================
export function buildShareText(type, data = {}) {
  const def = SHARE_TYPES[type]
  if (!def) return { title: 'FigusUY', description: 'Completá tu álbum con FigusUY' }
  let title = def.title_tpl, desc = def.desc_tpl
  Object.entries(data).forEach(([k, v]) => { title = title.replace(`{${k}}`, v); desc = desc.replace(`{${k}}`, v) })
  return { title, description: desc }
}

export function getOnboardingProgress(profile, progress) {
  const completed = ONBOARDING_STEPS.filter(s => s.check(profile, progress))
  const currentStep = ONBOARDING_STEPS.find(s => !s.check(profile, progress))
  const percent = Math.round((completed.length / ONBOARDING_STEPS.length) * 100)
  return {
    completed: completed.length, total: ONBOARDING_STEPS.length, percent,
    currentStep, isActivated: completed.length >= ACTIVATION_DEFINITION.steps_required,
    steps: ONBOARDING_STEPS.map(s => ({ ...s, done: s.check(profile, progress) })),
  }
}
