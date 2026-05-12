/**
 * FigusUY Growth Engine
 * Smart Notifications, Onboarding, Referrals, Growth Achievements
 */

export const NOTIFICATION_TRIGGERS = {
  better_matches: {
    key: 'better_matches', type: 'opportunity', icon: 'swap_horiz',
    title: 'Mejores matches hoy',
    template: 'Tenes {count} matches mejores que ayer',
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
    title: 'Tu mejor match respondio',
    template: '{name} respondio tu mensaje',
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
    template: 'Hoy tenes mas chances de cerrar un cruce',
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
    template: 'Tenes un chat con {name} que vale la pena retomar',
    priority: 'low', cooldown_hours: 72, active: true, category: 'chat',
  },
  influencer_approved: {
    key: 'influencer_approved', type: 'system', icon: 'verified',
    title: '¡Solicitud Aprobada!',
    template: 'Bienvenido al equipo. Ya podes acceder a tu dashboard de influencer.',
    priority: 'critical', cooldown_hours: 0, active: true, category: 'system',
    route: '/influencer'
  },
  influencer_rejected: {
    key: 'influencer_rejected', type: 'system', icon: 'cancel',
    title: 'Actualización de Solicitud',
    template: 'Revisamos tu postulación al programa de influencers. Mira los detalles.',
    priority: 'medium', cooldown_hours: 0, active: true, category: 'system'
  },
}

export const NOTIFICATION_CATEGORIES = [
  { key: 'matches', label: 'Matches', icon: 'swap_horiz', color: '#8b5cf6' },
  { key: 'proximity', label: 'Cercania', icon: 'near_me', color: '#22c55e' },
  { key: 'chat', label: 'Chat', icon: 'chat', color: '#3b82f6' },
  { key: 'partner', label: 'PartnerStore', icon: 'storefront', color: '#f59e0b' },
  { key: 'system', label: 'Sistema', icon: 'settings', color: '#64748b' },
]

export const NOTIFICATION_PRIORITIES = {
  critical: { label: 'Critica', color: '#ef4444', weight: 4 },
  high: { label: 'Alta', color: '#f59e0b', weight: 3 },
  medium: { label: 'Media', color: '#3b82f6', weight: 2 },
  low: { label: 'Baja', color: '#64748b', weight: 1 },
}

export const ONBOARDING_STEPS = [
  {
    key: 'choose_album', order: 1, title: 'Elegi tu album',
    description: 'Selecciona el album que estas completando',
    icon: 'menu_book', route: '/album', action: 'Ir al album',
    check: (p, g) => (g?.total_albums || 0) >= 1,
    nudge: 'Sin album no podes encontrar matches. Elegi uno.',
  },
  {
    key: 'load_stickers', order: 2, title: 'Carga tus figuritas',
    description: 'Marca tus faltantes y repetidas',
    icon: 'edit_note', route: '/album', action: 'Cargar figuritas',
    check: (p, g) => (g?.total_stickers_loaded || 0) >= 5,
    nudge: 'Cuantas mas cargues, mejores matches vas a tener.',
  },
  {
    key: 'first_match', order: 3, title: 'Mira tu primer match',
    description: 'Encuentra a alguien con quien intercambiar',
    icon: 'swap_horiz', route: '/matches', action: 'Ver matches',
    check: (p, g) => (g?.total_matches_viewed || 0) >= 1,
    nudge: 'Ya tienes figuritas cargadas. Mira quien te conviene.',
  },
  {
    key: 'first_chat', order: 4, title: 'Abre tu primer chat',
    description: 'Contacta a un match y coordina un cruce',
    icon: 'chat', route: '/chats', action: 'Ir a chats',
    check: (p, g) => (g?.total_chats || 0) >= 1,
    nudge: 'Encontraste un match. Escribele para coordinar.',
  },
]

export const BUSINESS_ONBOARDING_STEPS = [
  {
    key: 'biz_profile', order: 1, title: 'Completa tu perfil',
    description: 'Configura el nombre, tipo y contacto de tu local',
    icon: 'storefront', route: '/business/profile', action: 'Editar perfil',
    check: (p, g) => !!p.business_name && !!p.business_type,
    nudge: 'Un perfil completo genera mas confianza en los coleccionistas.',
  },
  {
    key: 'biz_photos', order: 2, title: 'Sube tus fotos',
    description: 'Muestra tu local para que sea facil de identificar',
    icon: 'add_a_photo', route: '/business/photos', action: 'Subir fotos',
    check: (p, g) => (g?.total_business_photos || 0) >= 1,
    nudge: 'Los locales con fotos reciben 3x mas visitas en el mapa.',
  },
  {
    key: 'biz_promo', order: 3, title: 'Activa una promo',
    description: 'Destaca un beneficio para atraer trafico hoy',
    icon: 'campaign', route: '/business/promo', action: 'Crear promo',
    check: (p, g) => (g?.total_business_promos || 0) >= 1,
    nudge: 'Las promociones son el motor de conversion de tu negocio.',
  },
]

export const ACTIVATION_DEFINITION = {
  label: 'Usuario Activado',
  description: 'Completo el flujo: album -> figuritas -> match -> chat',
  steps_required: 4,
}

export const SHARE_TYPES = {
  album: {
    key: 'album', label: 'Mi Album', icon: 'menu_book', color: '#3b82f6',
    title_tpl: 'Estoy completando {album_name} en FigusUY',
    desc_tpl: 'Llevo {percent}% completado. Vos tambien lo juntas?',
    achievement_key: 'share_album',
  },
  missing: {
    key: 'missing', label: 'Mis Faltantes', icon: 'search', color: '#f59e0b',
    title_tpl: 'Busco estas figuritas',
    desc_tpl: 'Me faltan {count} figuritas. Tienes alguna?',
    achievement_key: 'share_missing',
  },
  duplicates: {
    key: 'duplicates', label: 'Mis Repetidas', icon: 'inventory_2', color: '#8b5cf6',
    title_tpl: 'Tengo figuritas para cambiar',
    desc_tpl: 'Tengo {count} repetidas. Necesitas alguna?',
    achievement_key: 'share_duplicates',
  },
  match: {
    key: 'match', label: 'Un Match', icon: 'handshake', color: '#ea580c',
    title_tpl: 'Encontre un match en FigusUY',
    desc_tpl: 'Nos cruzamos {count} figuritas. La app funciona.',
    achievement_key: 'share_match',
  },
  album_complete: {
    key: 'album_complete', label: 'Album Completo', icon: 'emoji_events', color: '#f59e0b',
    title_tpl: 'Complete {album_name}',
    desc_tpl: 'Lo logre con FigusUY.',
    achievement_key: 'share_album_complete',
  },
  partner_verified: {
    key: 'partner_verified', label: 'PartnerStore Verified', icon: 'verified', color: '#22c55e',
    title_tpl: 'Valide mi album en una Tienda PartnerStore',
    desc_tpl: 'PartnerStore Verified en {store_name}.',
    achievement_key: 'share_partner_verified',
  },
  invite: {
    key: 'invite', label: 'Invitar Amigos', icon: 'person_add', color: '#10b981',
    title_tpl: 'Unite a FigusUY',
    desc_tpl: 'Usá mi link y ganemos 3 días de Plus gratis cada uno. Coleccionemos juntos.',
    achievement_key: 'invite_friend',
  },
}

export const REFERRAL_REWARDS = {
  invite_sent: { xp: 5, label: 'Invitacion enviada' },
  friend_signed_up: { xp: 25, label: 'Amigo registrado' },
  friend_first_trade: { xp: 200, reward_type: 'plus_days', reward_hours: 72, label: 'Amigo hizo primer cruce (3 días Plus)' },
}

export const GROWTH_ACHIEVEMENTS = {
  share_album: { name: 'Album abierto', description: 'Compartiste tu album para activar la red', category: 'comunidad', icon: '📢', target: 1 },
  share_missing: { name: 'Estoy buscando', description: 'Compartiste tus faltantes para generar liquidez', category: 'comunidad', icon: '🔍', target: 1, reward: { type: 'boost_visibility', value: '24h', hours: 24 } },
  share_duplicates: { name: 'Tengo para cambiar', description: 'Compartiste repetidas para mover cruces', category: 'comunidad', icon: '📦', target: 1, reward: { type: 'boost_visibility', value: '24h', hours: 24 } },
  invite_friend: { name: 'Trajo a alguien', description: 'Invitaste a una persona a FigusUY', category: 'growth', icon: '🤙', target: 1 },
  friend_active: { name: 'Intercambio Referido', description: 'Tu referido completo un intercambio', category: 'growth', icon: '🎉', target: 1, reward: { type: 'plus_days', value: '3 dias', hours: 72 } },
  share_match: { name: 'Buen ojo', description: 'Compartiste un match con valor real', category: 'comunidad', icon: '👁️', target: 1 },
  share_album_complete: { name: 'Album terminado', description: 'Compartiste un album ya completado', category: 'partner', icon: '🏆', target: 1, reward: { type: 'boost_visibility', value: '48h', hours: 48 } },
  share_partner_verified: { name: 'Verificado en PartnerStore', description: 'Compartiste una validacion de PartnerStore', category: 'partner', icon: 'OK', target: 1 },
}

export const GROWTH_ACHIEVEMENT_CATEGORY = { key: 'growth', label: 'Growth', icon: '🚀', color: '#ea580c' }

export function buildShareText(type, data = {}) {
  const def = SHARE_TYPES[type]
  if (!def) return { title: 'FigusUY', description: 'Completa tu album con FigusUY' }
  let title = def.title_tpl
  let desc = def.desc_tpl
  Object.entries(data).forEach(([k, v]) => {
    title = title.replace(`{${k}}`, v)
    desc = desc.replace(`{${k}}`, v)
  })
  return { title, description: desc }
}

export function getOnboardingProgress(profile, progress, isBusiness = false) {
  const stepsSource = isBusiness ? BUSINESS_ONBOARDING_STEPS : ONBOARDING_STEPS
  const completed = stepsSource.filter((s) => s.check(profile, progress))
  const currentStep = stepsSource.find((s) => !s.check(profile, progress))
  const percent = Math.round((completed.length / stepsSource.length) * 100)
  const reqSteps = isBusiness ? stepsSource.length : ACTIVATION_DEFINITION.steps_required
  
  return {
    completed: completed.length,
    total: stepsSource.length,
    percent,
    currentStep,
    isActivated: completed.length >= reqSteps,
    steps: stepsSource.map((s) => ({ ...s, done: s.check(profile, progress) })),
  }
}
