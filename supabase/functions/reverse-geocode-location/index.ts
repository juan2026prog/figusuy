import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts"

const serverReverseCache = new Map<string, any>()
const UPSTREAM_TIMEOUT_MS = 6000

async function getClientRateKey(req: Request, supabaseAdmin: any): Promise<string> {
  // 1. If authenticated JWT header exists, verify and extract user ID server-side
  const authHeader = req.headers.get("Authorization")
  if (authHeader && supabaseAdmin) {
    try {
      const token = authHeader.replace(/Bearer /i, "")
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (!error && user?.id) {
        return `revgeo:user:${user.id}`
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

  return `revgeo:ip:${clientIp}`
}

async function verifyRateLimit(rateKey: string, supabaseAdmin: any): Promise<{ allowed: boolean; status?: number; error?: string }> {
  if (!supabaseAdmin) {
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
    return new Response(JSON.stringify({ error: rateResult.error || "Rate limit error", data: null }), {
      status: rateResult.status || 429,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  }

  try {
    const { lat, lng } = await req.json()

    const numLat = Number(lat)
    const numLng = Number(lng)

    if (!Number.isFinite(numLat) || !Number.isFinite(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return new Response(JSON.stringify({ error: "Invalid coordinates", data: null }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const cacheKey = `${numLat.toFixed(4)},${numLng.toFixed(4)}`
    if (serverReverseCache.has(cacheKey)) {
      return new Response(JSON.stringify({ data: serverReverseCache.get(cacheKey), cached: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`
    
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
      throw new Error(`Upstream reverse geocoding failed: ${res.statusText}`)
    }

    const data = await res.json()
    const addr = data.address || {}

    const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || addr.village || addr.quarter || ""
    const city = addr.city || addr.town || addr.municipality || addr.county || ""
    const state = addr.state || addr.province || ""

    const result = {
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      department: state.replace(/Departamento de /i, "").replace(/ Department/i, "").trim(),
      display_name: data.display_name || [neighborhood, city, state].filter(Boolean).join(", ")
    }

    serverReverseCache.set(cacheKey, result)

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reverse geocoding error"
    return new Response(JSON.stringify({ error: message, data: null }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  }
})
