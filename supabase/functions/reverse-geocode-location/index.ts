import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts"

const serverReverseCache = new Map<string, any>()
const ipRateLimits = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 60 * 1000
const UPSTREAM_TIMEOUT_MS = 6000

async function verifyRateLimit(clientIp: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
        p_key: `revgeo:${clientIp}`,
        p_max_req: RATE_LIMIT_MAX,
        p_window_seconds: 60
      })
      if (!error && typeof allowed === "boolean") {
        return allowed
      }
    } catch {
      // fallback to memory
    }
  }

  const now = Date.now()
  const record = ipRateLimits.get(clientIp)
  if (!record || now > record.resetAt) {
    ipRateLimits.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }
  record.count++
  return true
}

serve(async (req: Request) => {
  const options = handleOptions(req)
  if (options) return options

  const clientIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "anonymous"
  const isAllowed = await verifyRateLimit(clientIp)
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", data: null }), {
      status: 429,
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
