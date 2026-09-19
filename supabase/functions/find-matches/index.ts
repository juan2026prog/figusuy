import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts"

// ============================================================
//  MATCH ENGINE v2.2 — FigusUY (Hardened Privacy & Finite Haversine)
//  Privacy: Strict zero coordinates leak, neighborhood centroid fuzzy areas
// ============================================================

// ── Distance Calculation ─────────────────────────────────────
export function haversineDistance(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined
): number {
  const isValid = [lat1, lng1, lat2, lng2].every(
    (v) => v !== null && v !== undefined && Number.isFinite(v)
  )
  if (!isValid) return Infinity

  const l1 = Number(lat1)
  const g1 = Number(lng1)
  const l2 = Number(lat2)
  const g2 = Number(lng2)

  const R = 6371
  const dLat = (l2 - l1) * (Math.PI / 180)
  const dLng = (g2 - g1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * (Math.PI / 180)) *
      Math.cos(l2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function distanceLabel(km: number): string {
  if (km === Infinity || !Number.isFinite(km)) return "Desconocida"
  if (km < 1) return `~${Math.round(km * 1000)} m`
  if (km < 10) return `~${km.toFixed(1)} km`
  return `~${Math.round(km)} km`
}

/**
 * Truncates coordinate to 2 decimals (~1.1 km grid) and adds area fuzzing
 * so residential exact GPS can NEVER be derived or reverse engineered.
 */
export function getApproximatePoint(
  lat: number | null | undefined,
  lng: number | null | undefined,
  userId: string
): { lat: number; lng: number } | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  // Truncate to ~1.1km grid
  const gridLat = Math.round(Number(lat) * 100) / 100
  const gridLng = Math.round(Number(lng) * 100) / 100

  // Deterministic neighborhood centroid offset
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const jitterLat = ((hash % 50) / 100 - 0.25) * 0.005
  const jitterLng = (((hash >> 3) % 50) / 100 - 0.25) * 0.005

  return {
    lat: Math.round((gridLat + jitterLat) * 1000) / 1000,
    lng: Math.round((gridLng + jitterLng) * 1000) / 1000,
  }
}

// ── Component Scorers ─────────────────────────────────────
function scoreCompatibility(
  theyCanGiveMe: number[],
  iCanGiveThem: number[],
  myMissingCount: number,
  myDupCount: number
): number {
  const totalOverlap = theyCanGiveMe.length + iCanGiveThem.length
  const myInventorySize = Math.max(myMissingCount + myDupCount, 1)
  const raw = totalOverlap / myInventorySize
  return Math.min(raw * 35, 35)
}

function scoreMutuality(theyCanGiveMe: number[], iCanGiveThem: number[]): number {
  const isMutual = theyCanGiveMe.length > 0 && iCanGiveThem.length > 0
  if (isMutual) return 25
  const strongOne = theyCanGiveMe.length >= 5 || iCanGiveThem.length >= 5
  return strongOne ? 8 : 0
}

function scoreDistance(km: number): number {
  if (km === Infinity || !Number.isFinite(km)) return 0
  if (km <= 1) return 15
  if (km <= 3) return 13
  if (km <= 5) return 10
  if (km <= 10) return 7
  if (km <= 25) return 4
  if (km <= 50) return 2
  return 0
}

function scoreRanking(rankData: any): number {
  if (!rankData) return 50
  return rankData.final_user_rank || 50
}

function getMaxDistance(isPremium: boolean, planName: string): number {
  if (!isPremium) return 30          // gratis: 30 km
  const plan = planName.toLowerCase()
  if (plan.includes("pro")) return Infinity // pro: all Uruguay
  if (plan.includes("plus")) return 150     // plus: 150 km
  return 30
}

function getMaxResults(isPremium: boolean, planName: string): number {
  if (!isPremium) return 3           // gratis: 3
  const plan = planName.toLowerCase()
  if (plan.includes("pro")) return Infinity // pro: unlimited
  if (plan.includes("plus")) return 10      // plus: 10
  return 3
}

const SCORE_FLOOR = 5
const MAX_STALE_DAYS = 45
const MIN_CANDIDATE_POOL = 500

serve(async (req: Request) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const { albumId } = await req.json()
    if (!albumId) throw new Error("albumId required")

    // 1. Authenticate requesting user via JWT
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("Unauthorized")

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser()
    if (userError || !user) throw new Error("Invalid user token")

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Validate album is active
    const { data: album } = await supabaseAdmin
      .from("albums")
      .select("id, is_active")
      .eq("id", albumId)
      .eq("is_active", true)
      .maybeSingle()

    if (!album) {
      return new Response(JSON.stringify({ matches: [], reason: "album_inactive" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    // 3. Fetch requesting user's private data, album inventory and blocks
    const [profileRes, myLocRes, myMissingRes, myDupRes, blocksRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", user.id).single(),
      supabaseAdmin.from("user_locations_private").select("latitude, longitude").eq("user_id", user.id).maybeSingle(),
      supabaseAdmin
        .from("stickers_missing")
        .select("sticker_number")
        .eq("user_id", user.id)
        .eq("album_id", albumId),
      supabaseAdmin
        .from("stickers_duplicate")
        .select("sticker_number")
        .eq("user_id", user.id)
        .eq("album_id", albumId),
      supabaseAdmin
        .from("user_blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
    ])

    const currentUserProfile = profileRes.data
    const currentUserLoc = myLocRes.data
    const myMissing = myMissingRes.data || []
    const myDuplicates = myDupRes.data || []
    const rawBlocks = blocksRes.data || []

    const blockedUserIds = new Set<string>()
    for (const b of rawBlocks) {
      if (b.blocker_id === user.id) blockedUserIds.add(b.blocked_id)
      if (b.blocked_id === user.id) blockedUserIds.add(b.blocker_id)
    }

    if (myMissing.length === 0 && myDuplicates.length === 0) {
      return new Response(JSON.stringify({ matches: [], reason: "no_stickers" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const myMissingSet = new Set(myMissing.map((s) => s.sticker_number))
    const myDupSet = new Set(myDuplicates.map((s) => s.sticker_number))

    const isPremium = currentUserProfile?.is_premium || false
    const planName = (currentUserProfile?.plan_name || "gratis").toLowerCase()
    const maxDistance = getMaxDistance(isPremium, planName)
    const maxResults = getMaxResults(isPremium, planName)

    // 4. Fetch candidate users in this album (excluding self & blocked)
    const { data: candidateAlbums } = await supabaseAdmin
      .from("user_albums")
      .select("user_id")
      .eq("album_id", albumId)
      .neq("user_id", user.id)

    if (!candidateAlbums || candidateAlbums.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    let candidateIds = candidateAlbums
      .map((ua) => ua.user_id)
      .filter((id) => !blockedUserIds.has(id))

    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const performanceCutoffDate =
      candidateIds.length > MIN_CANDIDATE_POOL
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(0).toISOString()

    // 5. Batch fetch candidate data + private locations internally (no N+1)
    const [profilesRes, locsRes, otherMissingRes, otherDupRes, rankingsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, name, username, avatar_url, is_premium, plan_name, department, city, neighborhood, last_active, location_visibility, location_precision")
        .in("id", candidateIds)
        .gte("last_active", performanceCutoffDate),
      supabaseAdmin
        .from("user_locations_private")
        .select("user_id, latitude, longitude")
        .in("user_id", candidateIds),
      supabaseAdmin
        .from("stickers_missing")
        .select("user_id, sticker_number")
        .eq("album_id", albumId)
        .in("user_id", candidateIds),
      supabaseAdmin
        .from("stickers_duplicate")
        .select("user_id, sticker_number")
        .eq("album_id", albumId)
        .in("user_id", candidateIds),
      supabaseAdmin
        .from("user_rankings")
        .select("user_id, final_user_rank, badges, premium_boost_applied")
        .in("user_id", candidateIds)
    ])

    const candidateProfiles = profilesRes.data || []
    const candidateLocs = new Map<string, { latitude: number; longitude: number }>()
    for (const l of (locsRes.data || [])) {
      candidateLocs.set(l.user_id, { latitude: l.latitude, longitude: l.longitude })
    }

    const allOtherMissing = otherMissingRes.data || []
    const allOtherDup = otherDupRes.data || []
    const candidateRankings = rankingsRes.data || []

    // 6. Score each candidate
    const results = []

    for (const p of candidateProfiles) {
      const pMissingSet = new Set(
        allOtherMissing.filter((s) => s.user_id === p.id).map((s) => s.sticker_number)
      )
      const pDupSet = new Set(
        allOtherDup.filter((s) => s.user_id === p.id).map((s) => s.sticker_number)
      )

      const theyCanGiveMe = [...pDupSet].filter((n) => myMissingSet.has(n))
      const iCanGiveThem = [...myDupSet].filter((n) => pMissingSet.has(n))

      const totalCoincidences = theyCanGiveMe.length + iCanGiveThem.length
      if (totalCoincidences === 0) continue

      const pLoc = candidateLocs.get(p.id)
      const distKm = haversineDistance(
        currentUserLoc?.latitude,
        currentUserLoc?.longitude,
        pLoc?.latitude,
        pLoc?.longitude
      )

      if (maxDistance !== Infinity && distKm > maxDistance) continue

      const daysSince = p.last_active ? (Date.now() - new Date(p.last_active).getTime()) / (1000 * 60 * 60 * 24) : 999
      if (daysSince > MAX_STALE_DAYS) continue

      const rankingData = candidateRankings.find(r => r.user_id === p.id) || null
      
      const compatScore = scoreCompatibility(
        theyCanGiveMe,
        iCanGiveThem,
        myMissing.length,
        myDuplicates.length
      )
      const mutScore = scoreMutuality(theyCanGiveMe, iCanGiveThem)
      const globalRankScore = scoreRanking(rankingData)
      const distScore = scoreDistance(distKm)
      
      const contextualScore = compatScore + mutScore
      const distanceWeighted = (distScore / 15) * 20
      const rankWeighted = (globalRankScore / 100) * 20
      
      let rawScore = contextualScore + distanceWeighted + rankWeighted
      const boostMultiplier = rankingData?.premium_boost_applied > 1.0 ? rankingData.premium_boost_applied : 1.0
      rawScore = rawScore * boostMultiplier
      
      const finalScore = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100))
      if (finalScore < SCORE_FLOOR) continue

      // Apply candidate location_visibility preferences:
      // 'full' -> department, city, neighborhood + approx_point
      // 'city' -> department, city (neighborhood hidden) + approx_point
      // 'none' -> no geographic labels + NO approx_point (distance calculated server-side only)
      const locVis = p.location_visibility || 'full'
      const safeNeighborhood = locVis === 'full' ? p.neighborhood : null
      const safeCity = locVis === 'none' ? null : p.city
      const safeDept = locVis === 'none' ? null : p.department
      const approxPoint = locVis === 'none' ? null : getApproximatePoint(pLoc?.latitude, pLoc?.longitude, p.id)

      // Strict safe profile (NEVER lat, lng, latitude, longitude, email)
      const safeProfile = {
        id: p.id,
        name: p.name,
        username: p.username,
        avatar_url: p.avatar_url,
        is_premium: p.is_premium,
        plan_name: p.plan_name,
        department: safeDept,
        city: safeCity,
        neighborhood: safeNeighborhood,
        last_active: p.last_active,
        badges: rankingData?.badges || [],
      }

      results.push({
        userId: p.id,
        profile: safeProfile,
        theyCanGiveMe,
        iCanGiveThem,
        totalCoincidences,
        isMutual,
        distance: distKm === Infinity ? null : Math.round(distKm * 10) / 10,
        distanceLabel: distanceLabel(distKm),
        approx_point: approxPoint,
        isActive: daysSince <= 7,
        daysSinceActive: daysSince,
        score: finalScore,
        isTopMatch: false,
        planBoostApplied: boostMultiplier > 1.0,
        badges: rankingData?.badges || [],
        _scoreBreakdown: {
          compatibility: Math.round(compatScore * 100) / 100,
          mutuality: mutScore,
          distance: Math.round(distanceWeighted * 100) / 100,
          globalRank: Math.round(rankWeighted * 100) / 100,
          boost: boostMultiplier,
        },
      })
    }

    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.daysSinceActive - b.daysSinceActive
    })

    if (results.length > 0) {
      results[0].isTopMatch = true
    }

    const limitedResults =
      maxResults === Infinity ? results : results.slice(0, maxResults)

    const isProd = Deno.env.get("ENVIRONMENT") === "production"
    const finalResults = isProd
      ? limitedResults.map(({ _scoreBreakdown: _, ...rest }) => rest)
      : limitedResults

    return new Response(JSON.stringify({ matches: finalResults }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Match Engine error:", message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  }
})
