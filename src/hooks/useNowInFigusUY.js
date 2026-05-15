import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_STATE = {
  hero: null,
  cards: [],
  feed: [],
  meta: {
    activeNow: 0,
    activeAlbums: 0,
    activePromos: 0,
    refreshedAt: null,
  },
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function normalizeError(result) {
  if (result.status !== 'fulfilled') return null
  return result.value?.error || null
}

function normalizeData(result, fallback) {
  if (result.status !== 'fulfilled') return fallback
  return result.value?.data ?? fallback
}

function normalizeCount(result, fallback = 0) {
  if (result.status !== 'fulfilled') return fallback
  return result.value?.count ?? fallback
}

function buildAlbumActivity(recentAlbums, albums) {
  const albumMap = new Map((albums || []).map((album) => [album.id, album]))
  const grouped = new Map()

  recentAlbums.forEach((entry) => {
    const album = entry.album || albumMap.get(entry.album_id)
    if (!album?.id) return

    const current = grouped.get(album.id) || {
      album,
      users: new Set(),
      actions: 0,
      completions: 0,
      latestAt: null,
    }

    current.users.add(entry.user_id)
    current.actions += 1
    current.completions += entry.progress_state === 'completed' || entry.progress_state === 'legend_verified' ? 1 : 0

    const candidateDate = entry.created_at
    if (!current.latestAt || new Date(candidateDate).getTime() > new Date(current.latestAt).getTime()) {
      current.latestAt = candidateDate
    }

    grouped.set(album.id, current)
  })

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      activeUsers: item.users.size,
      score: item.users.size * 4 + item.actions * 2 + item.completions * 5,
    }))
    .sort((a, b) => b.score - a.score)
}

function buildHero({ albumActivity, activeUsers, promos, meta, albums }) {
  const topAlbum = albumActivity[0]
  const topPromo = promos[0]
  const latestAlbum = [...(albums || [])].sort((a, b) => (b.year || 0) - (a.year || 0))[0]

  if (topAlbum?.album) {
    return {
      kicker: 'Ahora en FigusUY',
      title: `${topAlbum.album.name} se esta moviendo fuerte ahora`,
      description: `${pluralize(topAlbum.activeUsers, 'persona')} se activaron en esta coleccion, ${pluralize(topAlbum.actions, 'señal')} empuja movimiento y ${pluralize(topAlbum.completions, 'album completado', 'albums completados')} ya marco el ritmo reciente.`,
      coverUrl: topAlbum.album.cover_url,
      metrics: [
        { value: topAlbum.activeUsers, label: 'personas en movimiento' },
        { value: topAlbum.actions, label: 'señales recientes' },
        { value: topAlbum.completions, label: 'cierres recientes' },
      ],
      actions: [
        { label: 'Ver oportunidades', kind: 'auth' },
        { label: 'Ver matches', kind: 'auth' },
        { label: 'Explorar album', kind: 'section', target: 'album' },
      ],
    }
  }

  if (topPromo) {
    return {
      kicker: 'Ahora en FigusUY',
      title: 'La red se esta activando alrededor de nuevos puntos y promos',
      description: `${pluralize(meta.activePromos, 'promo activa')} esta empujando descubrimiento, mientras ${pluralize(activeUsers.length, 'usuario activo')} sostiene movimiento en la comunidad.`,
      coverUrl: null,
      metrics: [
        { value: meta.activePromos, label: 'promos activas' },
        { value: activeUsers.length, label: 'usuarios visibles ahora' },
        { value: meta.activeAlbums, label: 'albums con señal' },
      ],
      actions: [
        { label: 'Ver oportunidades', kind: 'auth' },
        { label: 'Explorar álbumes', kind: 'section', target: 'album' },
        { label: 'Empezar a cambiar', kind: 'auth' },
      ],
    }
  }

  return {
    kicker: 'Ahora en FigusUY',
    title: latestAlbum ? `${latestAlbum.name} y otras colecciones ya estan generando movimiento` : 'La comunidad se esta moviendo ahora',
    description: `${pluralize(meta.activeNow, 'persona')} aparece activa en la red, ${pluralize(meta.activeAlbums, 'album')} ya tiene señal real y las oportunidades estan cambiando durante el dia.`,
    coverUrl: latestAlbum?.cover_url || null,
    metrics: [
      { value: meta.activeNow, label: 'activos ahora' },
      { value: meta.activeAlbums, label: 'albums con señal' },
      { value: meta.activePromos, label: 'promos vivas' },
    ],
    actions: [
      { label: 'Explorar álbumes', kind: 'section', target: 'album' },
      { label: 'Ver oportunidades', kind: 'auth' },
      { label: 'Empezar a cambiar', kind: 'auth' },
    ],
  }
}

function buildCards({ albumActivity, activeUsers, recentAlbums, promos, locations, albums }) {
  const cards = []
  const latestAlbum = [...(albums || [])].sort((a, b) => (b.year || 0) - (a.year || 0))[0]

  albumActivity.slice(0, 2).forEach((item) => {
    cards.push({
      id: `album-${item.album.id}`,
      type: 'album',
      tone: 'orange',
      eyebrow: 'Album vivo',
      title: item.album.name,
      detail: `${pluralize(item.activeUsers, 'persona')} buscando ahora`,
      body: `${pluralize(item.actions, 'señal')} de actividad y ${pluralize(item.completions, 'cierre reciente')} mantienen este album arriba.`,
      cta: 'Explorar',
      action: { kind: 'section', target: 'album' },
      media: item.album.cover_url,
    })
  })

  activeUsers.slice(0, 2).forEach((user) => {
    cards.push({
      id: `user-${user.id}`,
      type: 'user',
      tone: 'blue',
      eyebrow: 'Usuario activo',
      title: user.name || 'Coleccionista activo',
      detail: user.city || user.department || 'Uruguay',
      body: 'Aparece activo en la red ahora y puede abrir nuevas oportunidades cerca.',
      cta: 'Sumarte',
      action: { kind: 'auth' },
      media: user.avatar_url || (user.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'),
    })
  })

  recentAlbums
    .filter((item) => item.progress_state === 'completed' || item.progress_state === 'legend_verified')
    .slice(0, 2)
    .forEach((item) => {
      cards.push({
        id: `achievement-${item.id}`,
        type: 'achievement',
        tone: 'green',
        eyebrow: 'Logro',
        title: `${item.profile?.name || 'Un coleccionista'} completo ${item.album?.name || 'un album'}`,
        detail: item.created_at,
        body: 'La red tambien se mueve con cierres reales y progreso visible.',
        cta: 'Empezar',
        action: { kind: 'auth' },
        media: item.profile?.avatar_url || (item.profile?.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'),
      })
    })

  if (albumActivity[0]) {
    cards.push({
      id: `opportunity-${albumActivity[0].album.id}`,
      type: 'opportunity',
      tone: 'orange',
      eyebrow: 'Oportunidad',
      title: `${albumActivity[0].album.name} esta dando oportunidades ahora`,
      detail: `${pluralize(albumActivity[0].activeUsers, 'usuario')} activo`,
      body: 'Es un buen momento para entrar antes de que el movimiento se enfrie.',
      cta: 'Ver oportunidades',
      action: { kind: 'auth' },
      emphasis: true,
    })
  }

  if (locations[0] || promos[0]) {
    const target = locations[0]
    cards.push({
      id: `partner-${target?.id || promos[0]?.id || 'active'}`,
      type: 'partner',
      tone: 'yellow',
      eyebrow: 'PartnerStore',
      title: target?.name || 'Lugares aliados activos',
      detail: target?.department || target?.neighborhood || 'Uruguay',
      body: promos.length > 0
        ? `${pluralize(promos.length, 'promo activa')} esta validando movimiento y discovery en la red.`
        : 'Los puntos aliados estan sosteniendo actividad util alrededor de la comunidad.',
      cta: 'Ver lugares',
      action: { kind: 'route', target: '/partners' },
    })
  }

  if (latestAlbum) {
    cards.push({
      id: `trend-${latestAlbum.id}`,
      type: 'trend',
      tone: 'pink',
      eyebrow: 'Tendencia',
      title: `${latestAlbum.name} sigue empujando descubrimiento`,
      detail: latestAlbum.year ? `${latestAlbum.year}` : 'Coleccion activa',
      body: 'Las colecciones nuevas y relevantes elevan el pulso editorial del sistema.',
      cta: 'Ver demo',
      action: { kind: 'section', target: 'album' },
      media: latestAlbum.cover_url,
    })
  }

  return cards.slice(0, 8)
}

function buildFeed({ recentAlbums, activeUsers, promos, locations, meta }) {
  const feed = []

  recentAlbums.slice(0, 3).forEach((item) => {
    if (!item.album?.name) return

    if (item.progress_state === 'completed' || item.progress_state === 'legend_verified') {
      feed.push({
        id: `feed-complete-${item.id}`,
        tone: 'green',
        title: `${item.profile?.name || 'Un coleccionista'} completo ${item.album.name}`,
        time: item.created_at,
      })
      return
    }

    feed.push({
      id: `feed-join-${item.id}`,
      tone: 'orange',
      title: `${item.profile?.name || 'Un coleccionista'} activo ${item.album.name}`,
      time: item.created_at,
    })
  })

  activeUsers.slice(0, 2).forEach((user) => {
    feed.push({
      id: `feed-user-${user.id}`,
      tone: 'blue',
      title: `${user.name || 'Usuario activo'} aparecio en ${user.city || user.department || 'la red'}`,
      time: user.last_active,
    })
  })

  if (promos[0]) {
    feed.push({
      id: `feed-promo-${promos[0].id}`,
      tone: 'yellow',
      title: 'Una promo activa esta empujando movimiento ahora',
      time: promos[0].starts_at || promos[0].created_at,
    })
  }

  if (locations[0]) {
    feed.push({
      id: `feed-location-${locations[0].id}`,
      tone: 'pink',
      title: `${locations[0].name} aparece como punto relevante ahora`,
      time: locations[0].updated_at || new Date().toISOString(),
    })
  }

  if (meta.activeNow > 0) {
    feed.push({
      id: 'feed-network',
      tone: 'orange',
      title: `${pluralize(meta.activeNow, 'persona')} estan moviendo la red en este momento`,
      time: new Date().toISOString(),
    })
  }

  return feed.slice(0, 7)
}

export function useNowInFigusUY({ albums = [] } = {}) {
  const [state, setState] = useState(EMPTY_STATE)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const now = new Date()
      const activeCutoff = new Date(now.getTime() - 20 * 60 * 1000).toISOString()
      const recentCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

      const results = await Promise.allSettled([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_active', activeCutoff),
        supabase.from('profiles').select('id, name, city, department, last_active, account_type, avatar_url').gte('last_active', recentCutoff).order('last_active', { ascending: false }).limit(8),
        supabase.from('sponsored_placements').select('id, title, album_id, location_id, placement_type, priority, starts_at, created_at').eq('is_active', true).order('priority', { ascending: false }).limit(6),
        supabase.from('locations').select('id, name, department, neighborhood, business_plan, activity_score, updated_at').eq('is_active', true).order('activity_score', { ascending: false }).limit(6),
        supabase.from('user_albums').select('id, user_id, album_id, created_at, progress_state, album:albums(id, name, cover_url, year), profile:profiles(id, name, city, department, last_active, account_type, avatar_url)').order('created_at', { ascending: false }).limit(24),
      ])

      if (cancelled) return

      const activeNow = normalizeCount(results[0], 0)
      const activeUsers = normalizeData(results[1], []).filter(Boolean)
      const promos = normalizeData(results[2], []).filter(Boolean)
      const locations = normalizeError(results[3]) ? [] : normalizeData(results[3], []).filter(Boolean)
      const recentAlbums = normalizeError(results[4]) ? [] : normalizeData(results[4], []).filter(Boolean)
      const albumActivity = buildAlbumActivity(recentAlbums, albums)
      const meta = {
        activeNow,
        activeAlbums: albumActivity.length || albums.length,
        activePromos: promos.length,
        refreshedAt: new Date().toISOString(),
      }

      setState({
        hero: buildHero({ albumActivity, activeUsers, promos, meta, albums }),
        cards: buildCards({ albumActivity, activeUsers, recentAlbums, promos, locations, albums }),
        feed: buildFeed({ recentAlbums, activeUsers, promos, locations, meta }),
        meta,
      })
    }

    load()
    const timer = window.setInterval(load, 60000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [albums])

  return useMemo(() => state, [state])
}
