import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleOptions } from "../_shared/cors.ts"

// ============================================================
//  MATCH ENGINE v2 — FigusUY
//  Agent: Match Engine Agent
//  Version: 2.0
//  Scoring: 6-component normalized (0-100)
// ============================================================

// ── Distance ──────────────────────────────────────────────
function haversineDistance(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function distanceLabel(km: number): string {
  if (km === Infinity) return "Desconocida"
  if (km < 1) return `~${Math.round(km * 1000)} m`
  if (km < 10) return `~${km.toFixed(1)} km`
  return `~${Math.round(km)} km`
}

// ── Component Scorers ─────────────────────────────────────

/** 35 pts max — normalized overlap against user's own inventory size */
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

/** 25 pts max — mutual = both directions satisfied */
function scoreMutuality(theyCanGiveMe: number[], iCanGiveThem: number[]): number {
  const isMutual = theyCanGiveMe.length > 0 && iCanGiveThem.length > 0
  if (isMutual) return 25
  // Partial credit: strong one-directional (5+ stickers)
  const strongOne = theyCanGiveMe.length >= 5 || iCanGiveThem.length >= 5
  return strongOne ? 8 : 0
}

/** Global ranking integration (tiebreaker) */
function scoreRanking(rankData: any): number {
  if (!rankData) return 50
  return rankData.final_user_rank || 50
}

// ── Plan-gated Limits ─────────────────────────────────────

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

// ── Quality Thresholds ────────────────────────────────────
const SCORE_FLOOR = 5           // QT-5: below this → dropped
const MAX_STALE_DAYS = 45       // QT-2: older than this → dropped
const MIN_CANDIDATE_POOL = 500  // performance: pre-filter if >500 candidates

// ── Main Handler ──────────────────────────────────────────
serve(async (req: Request) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const { albumId } = await req.json()
    if (!albumId) throw new Error("albumId required")

    // 1. Authenticate requesting user
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

    // Admin client for cross-user data access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Validate album is active (QT-6)
    const { data: album } = await supabaseAdmin
      .from("albums")
      .select("id, is_active")
      .eq("id", albumId)
      .eq("is_active", true)
      .maybeSingle()

    if (!album) {
      return new Response(JSON.stringify({ matches: [], reason: "album_inactive" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 3. Fetch requesting user's data
    const [profileRes, myMissingRes, myDupRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", user.id).single(),
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
    ])

    const currentUserProfile = profileRes.data
    const myMissing = myMissingRes.data || []
    const myDuplicates = myDupRes.data || []

    // Pre-flight gate: no stickers = no matches (ME-09)
    if (myMissing.length === 0 && myDuplicates.length === 0) {
      return new Response(JSON.stringify({ matches: [], reason: "no_stickers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const myMissingSet = new Set(myMissing.map((s) => s.sticker_number))
    const myDupSet = new Set(myDuplicates.map((s) => s.sticker_number))

    const isPremium = currentUserProfile?.is_premium || false
    const planName = (currentUserProfile?.plan_name || "gratis").toLowerCase()
    const maxDistance = getMaxDistance(isPremium, planName)
    const maxResults = getMaxResults(isPremium, planName)

    // 4. Fetch candidate users in this album (excluding self — S-6 / QT-3)
    let candidateQuery = supabaseAdmin
      .from("user_albums")
      .select("user_id")
      .eq("album_id", albumId)
      .neq("user_id", user.id)

    const { data: candidateAlbums } = await candidateQuery

    if (!candidateAlbums || candidateAlbums.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let candidateIds = candidateAlbums.map((ua) => ua.user_id)

    // Performance pre-filter: if pool >500, only users active in last 30 days
    // This is done via profiles query below with cutoff date
    const performanceCutoffDate =
      candidateIds.length > MIN_CANDIDATE_POOL
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(0).toISOString()

    // 5. Batch fetch all candidate data in parallel queries (no N+1)
    const [profilesRes, otherMissingRes, otherDupRes, rankingsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", candidateIds)
        .gte("last_active", performanceCutoffDate),
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
    const allOtherMissing = otherMissingRes.data || []
    const allOtherDup = otherDupRes.data || []
    const candidateRankings = rankingsRes.data || []

    // 6. Score each candidate
    const results = []

    for (const p of candidateProfiles) {
      // Build per-candidate sets
      const pMissingSet = new Set(
        allOtherMissing.filter((s) => s.user_id === p.id).map((s) => s.sticker_number)
      )
      const pDupSet = new Set(
        allOtherDup.filter((s) => s.user_id === p.id).map((s) => s.sticker_number)
      )

      // Sticker intersections (core matching logic)
      const theyCanGiveMe = [...pDupSet].filter((n) => myMissingSet.has(n))
      const iCanGiveThem = [...myDupSet].filter((n) => pMissingSet.has(n))

      // QT-1: zero overlap → skip
      const totalCoincidences = theyCanGiveMe.length + iCanGiveThem.length
      if (totalCoincidences === 0) continue

      // Distance (used for both score and distance gate)
      const distKm = haversineDistance(
        currentUserProfile?.lat,
        currentUserProfile?.lng,
        p.lat,
        p.lng
      )

      // QT-4: distance gate (plan-based)
      if (maxDistance !== Infinity && distKm > maxDistance) continue

      // Activity check for UI 
      const daysSince = p.last_active ? (Date.now() - new Date(p.last_active).getTime()) / (1000 * 60 * 60 * 24) : 999
      if (daysSince > MAX_STALE_DAYS) continue

      const rankingData = candidateRankings.find(r => r.user_id === p.id) || null
      
      // Core Match Relevance (Contextual overlap)
      const compatScore = scoreCompatibility(
        theyCanGiveMe,
        iCanGiveThem,
        myMissing.length,
        myDuplicates.length
      )
      const mutScore = scoreMutuality(theyCanGiveMe, iCanGiveThem)
      
      // Tiebreakers: global rank & distance
      const globalRankScore = scoreRanking(rankingData)
      const distScore = scoreDistance(distKm)
      
      // FORMULA: Contextual Relevance (60%) + Distance (20%) + Global User Rank (20%)
      const contextualScore = compatScore + mutScore // max 60 (35 + 25)
      const distanceWeighted = (distScore / 15) * 20 // max 20
      const rankWeighted = (globalRankScore / 100) * 20 // max 20
      
      let rawScore = contextualScore + distanceWeighted + rankWeighted

      // Apply Boost Multiplier (up to 1.20x max, never replacing relevance)
      const boostMultiplier = rankingData?.premium_boost_applied > 1.0 ? rankingData.premium_boost_applied : 1.0
      rawScore = rawScore * boostMultiplier
      
      const finalScore = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100))

      // QT-5: minimum score floor
      if (finalScore < SCORE_FLOOR) continue

      const isMutual = theyCanGiveMe.length > 0 && iCanGiveThem.length > 0

      // Build safe profile — NEVER include lat, lng, email (S-3, S-4)
      const safeProfile = {
        id: p.id,
        name: p.name,
        avatar_url: p.avatar_url,
        is_premium: p.is_premium,
        plan_name: p.plan_name,
        department: p.department,
        city: p.city,
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
        isActive: daysSince <= 7,
        daysSinceActive: daysSince,
        score: finalScore,
        isTopMatch: false, // set after sort
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

    // 7. Rank by score descending
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // Tiebreaker: more recent activity wins
      return a.daysSinceActive - b.daysSinceActive
    })

    // 8. Apply Top Match badge to rank #1
    if (results.length > 0) {
      results[0].isTopMatch = true
    }

    // 9. Apply plan-based result limit (server-side enforcement — ME rule)
    const limitedResults =
      maxResults === Infinity ? results : results.slice(0, maxResults)

    // Strip _scoreBreakdown in production (keep for admin debugging if needed)
    const isProd = Deno.env.get("ENVIRONMENT") === "production"
    const finalResults = isProd
      ? limitedResults.map(({ _scoreBreakdown: _, ...rest }) => rest)
      : limitedResults

    return new Response(JSON.stringify({ matches: finalResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Match Engine error:", message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
