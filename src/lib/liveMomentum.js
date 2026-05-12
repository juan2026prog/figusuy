export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'recién'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'recién'

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMin < 1) return 'recién'
  if (diffMin < 60) return `hace ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `hace ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'ayer'
  return `hace ${diffDays} d`
}

export function getPresenceLabel(dateInput) {
  if (!dateInput) return 'Activo recientemente'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'Activo recientemente'

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMin <= 10) return 'Activo ahora'
  if (diffMin <= 60) return `Activo hace ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Activo hace ${diffHours} h`
  if (diffHours < 48) return 'Activo ayer'
  return `Activo hace ${Math.floor(diffHours / 24)} d`
}

export function formatCompactTime(dateInput) {
  if (!dateInput) return 'ahora'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'ahora'

  return date.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function buildMomentumFeed({
  summary,
  matchesCount = 0,
  nearMatchesCount = 0,
  mutualMatchesCount = 0,
  chatsCount = 0,
  missingCount = 0,
  duplicateCount = 0,
}) {
  const feed = []

  if (summary.activeNow > 0) {
    feed.push({
      id: 'active-now',
      tone: 'orange',
      label: 'Activos ahora',
      message: `${pluralize(summary.activeNow, 'persona')} está${summary.activeNow === 1 ? '' : 'n'} moviéndose ahora en FigusUY`
    })
  }

  if (nearMatchesCount > 0) {
    feed.push({
      id: 'near-matches',
      tone: 'blue',
      label: 'Cerca tuyo',
      message: `Tenés ${pluralize(nearMatchesCount, 'oportunidad')} cerca para mover hoy`
    })
  }

  if (mutualMatchesCount > 0) {
    feed.push({
      id: 'mutual',
      tone: 'green',
      label: 'Cruces fuertes',
      message: `${pluralize(mutualMatchesCount, 'match mutuo')} puede cerrarse más rápido ahora`
    })
  }

  if (summary.exchangesToday > 0) {
    feed.push({
      id: 'exchanges',
      tone: 'green',
      label: 'Confirmados hoy',
      message: `${pluralize(summary.exchangesToday, 'intercambio')} ya se confirmó hoy`
    })
  }

  if (summary.validationsToday > 0) {
    feed.push({
      id: 'validations',
      tone: 'yellow',
      label: 'PartnerStore',
      message: `${pluralize(summary.validationsToday, 'validación reciente')} mantiene activa la red hoy`
    })
  }

  if (summary.activePromos > 0) {
    feed.push({
      id: 'promos',
      tone: 'orange',
      label: 'Promos hoy',
      message: `Hay ${pluralize(summary.activePromos, 'promo activa')} empujando movimiento hoy`
    })
  }

  if (summary.completedAlbumsToday > 0) {
    feed.push({
      id: 'albums',
      tone: 'blue',
      label: 'Álbumes cerrados',
      message: `${pluralize(summary.completedAlbumsToday, 'álbum')} se completó hoy`
    })
  }

  if (duplicateCount > 0 && missingCount > 0) {
    feed.push({
      id: 'inventory',
      tone: 'orange',
      label: 'Tu inventario',
      message: `Con ${duplicateCount} repetidas y ${missingCount} faltantes podés mover tu álbum hoy`
    })
  }

  if (matchesCount > 0 && chatsCount > 0) {
    feed.push({
      id: 'pipeline',
      tone: 'green',
      label: 'En marcha',
      message: `Tenés ${matchesCount} matches y ${chatsCount} chats activos empujando cierres ahora`
    })
  }

  return feed.slice(0, 6)
}
