import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts"

// Server-side cache and sliding-window rate limiter
const serverCache = new Map<string, any>()
const ipRateLimits = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 30 // max requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function isRateLimited(clientIp: string): boolean {
  const now = Date.now()
  const record = ipRateLimits.get(clientIp)
  if (!record || now > record.resetAt) {
    ipRateLimits.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }
  record.count++
  return false
}

serve(async (req: Request) => {
  const options = handleOptions(req)
  if (options) return options

  const clientIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "anonymous"
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", results: [] }), {
      status: 429,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    })
  }

  try {
    const { query, mode = "area", countryCode = "uy", limit = 5 } = await req.json()

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const cleanQuery = query.trim().toLowerCase()
    const cacheKey = `${mode}:${countryCode}:${cleanQuery}`

    if (serverCache.has(cacheKey)) {
      return new Response(JSON.stringify({ results: serverCache.get(cacheKey), cached: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      })
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&countrycodes=${countryCode}&q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "es",
        "User-Agent": "FigusUY-App/2.0 (contact@figusuy.app)"
      }
    })

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
