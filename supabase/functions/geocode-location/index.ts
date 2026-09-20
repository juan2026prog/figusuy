import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts"

// Server-side cache for geocoded queries
const serverCache = new Map<string, any>()
const UPSTREAM_TIMEOUT_MS = 6000 // 6 second timeout on external geocoding

async function getClientRateKey(req: Request, supabaseAdmin: any): Promise<string> {
  // 1. If authenticated JWT header exists, verify and extract user ID server-side
  const authHeader = req.headers.get("Authorization")
  if (authHeader && supabaseAdmin) {
    try {
      const token = authHeader.replace(/Bearer /i, "")
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (!error && user?.id) {
        return `geo:user:${user.id}`
      }
    } catch {
      // Fallback to IP
    }
  }

  // 2. Derive trusted IP from proxy/load balancer headers
  const cfIp = req.headers.get("cf-connecting-ip")
  const xRealIp = req.headers.get("x-real-ip")
  const forwardedFor = req.headers.get("x-forwarded-for")
  const clientIp = (cfIp || xRealIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : null) || "anonymous").slice(0, 45)

  return `geo:ip:${clientIp}`
}

async function verifyRateLimit(rateKey: string, supabaseAdmin: any): Promise<{ allowed: boolean; status?: number; error?: string }> {
  if (!supabaseAdmin) {
    // Fail-safe protection: if backend service is unreachable, reject upstream call
    return { allowed: false, status: 503, error: "RATE_LIMIT_SERVICE_UNAVAILABLE" }
  }

  try {
    const { data: allowed, error } = await supabaseAdmin.rpc("check_geocode_rate_limit", {
      p_key: rateKey
    })

    if (error) {
      console.error("Rate limiter RPC error:", error)
      return { allowed: false, status: 503, error: "RATE_LIMIT_SERVICE_UNAVAILABLE" }
    }

    if (allowed === false) {
      return { allowed: false, status: 429, error: "Rate limit exceeded" }
    }

    return { allowed: true }
  } catch (err) {
    console.error("Rate limiter network error:", err)
    return { allowed: false, status: 503, error: "RATE_LIMIT_SERVICE_UNAVAILABLE" }
  }
}

serve(async (req: Request) => {
  const options = handleOptions(req)
  if (options) return options

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null

  const rateKey = await getClientRateKey(req, supabaseAdmin)
  const rateResult = await verifyRateLimit(rateKey, supabaseAdmin)

  if (!rateResult.allowed) {
    return new Response(JSON.stringify({ error: rateResult.error || "Rate limit error", results: [] }), {
      status: rateResult.status || 429,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  }

  try {
    const { query, mode = "area", countryCode = "uy", limit = 5 } = await req.json()

    if (!query || typeof query !== "string" || query.trim().length < 2 || query.length > 120) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10)
    const cleanQuery = query.trim().toLowerCase().slice(0, 100)
    const cacheKey = `${mode}:${countryCode}:${cleanQuery}`

    if (serverCache.has(cacheKey)) {
      return new Response(JSON.stringify({ results: serverCache.get(cacheKey), cached: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${safeLimit}&countrycodes=${countryCode}&q=${encodeURIComponent(cleanQuery)}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "es",
        "User-Agent": "FigusUY-App/2.0 (contact@figusuy.app)"
      }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Upstream geocoding failed: ${res.statusText}`)
    }

    const data = await res.json()

    const results = (data || []).map((item: any) => {
      const addr = item.address || {}
      const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || addr.village || addr.quarter || ""
      const city = addr.city || addr.town || addr.municipality || addr.county || ""
      const state = addr.state || addr.province || ""

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.name || neighborhood || city || item.display_name,
        display_name: item.display_name,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        department: state.replace(/Departamento de /i, "").replace(/ Department/i, "").trim(),
        type: item.type,
        category: item.category,
        isArea: ["administrative", "city", "suburb", "neighbourhood", "residential"].includes(item.type) || item.category === "boundary"
      }
    })

    serverCache.set(cacheKey, results)

    return new Response(JSON.stringify({ results }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Geocoding error"
    return new Response(JSON.stringify({ error: message, results: [] }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  }
})
