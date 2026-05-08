import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildMomentumFeed } from '../lib/liveMomentum'

const EMPTY_SUMMARY = {
  activeNow: 0,
  exchangesToday: 0,
  validationsToday: 0,
  activePromos: 0,
  completedAlbumsToday: 0,
  refreshedAt: new Date().toISOString(),
}

const MOMENTUM_REFRESH_MS = 45_000
let momentumCache = EMPTY_SUMMARY
let momentumLastFetchAt = 0
let momentumPromise = null

async function fetchMomentumSummary(force = false) {
  const nowMs = Date.now()
  if (!force && momentumPromise) return momentumPromise
  if (!force && momentumLastFetchAt && nowMs - momentumLastFetchAt < MOMENTUM_REFRESH_MS) {
    return momentumCache
  }

  momentumPromise = (async () => {
    const now = new Date()
    const activeCutoff = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const todayIso = startOfDay.toISOString()

    const [
      activeNowRes,
      exchangesTodayRes,
      validationsTodayRes,
      activePromosRes,
      completedAlbumsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_active', activeCutoff),
      supabase.from('exchange_completions').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', todayIso),
      supabase.from('legend_album_validations').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
      supabase.from('sponsored_placements').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('user_albums').select('id', { count: 'exact', head: true }).eq('progress_state', 'completed').gte('created_at', todayIso),
    ])

    momentumCache = {
      activeNow: activeNowRes.count || 0,
      exchangesToday: exchangesTodayRes.count || 0,
      validationsToday: validationsTodayRes.count || 0,
      activePromos: activePromosRes.count || 0,
      completedAlbumsToday: completedAlbumsRes.count || 0,
      refreshedAt: new Date().toISOString(),
    }
    momentumLastFetchAt = Date.now()

    return momentumCache
  })()

  try {
    return await momentumPromise
  } finally {
    momentumPromise = null
  }
}

export function useLiveMomentum({
  matches = [],
  chats = [],
  missingCount = 0,
  duplicateCount = 0,
} = {}) {
  const [summary, setSummary] = useState(momentumCache)

  useEffect(() => {
    let cancelled = false

    const syncMomentum = async (force = false) => {
      try {
        const nextSummary = await fetchMomentumSummary(force)
        if (cancelled) return
        setSummary(nextSummary)
      } catch (error) {
        if (!cancelled) {
          setSummary(prev => ({ ...prev, refreshedAt: new Date().toISOString() }))
        }
      }
    }

    void syncMomentum()
    const interval = window.setInterval(() => {
      void syncMomentum(true)
    }, MOMENTUM_REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const derived = useMemo(() => {
    const nearMatchesCount = matches.filter(match => match.distance != null && match.distance <= 10).length
    const mutualMatchesCount = matches.filter(match => match.isMutual).length
    const activeChatsCount = chats.filter(chat => chat.last_message_at || chat.last_message_preview).length

    return {
      nearMatchesCount,
      mutualMatchesCount,
      activeChatsCount,
      feed: buildMomentumFeed({
        summary,
        matchesCount: matches.length,
        nearMatchesCount,
        mutualMatchesCount,
        chatsCount: chats.length,
        missingCount,
        duplicateCount,
      })
    }
  }, [summary, matches, chats, missingCount, duplicateCount])

  return {
    summary,
    ...derived,
  }
}
