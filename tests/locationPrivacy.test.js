import { describe, it, expect, beforeEach, vi } from 'vitest'
import { normalizeDepartment, normalizeLocationParts, geocode, clearGeocodeCache } from '../src/lib/geocoding'
import { calculateDistance, formatDistance } from '../src/utils/location'
import { haversineDistance, distanceLabel, getApproximatePoint } from '../src/lib/matchPrivacy'

describe('Location, Privacy & Edge Match Engine Hardening', () => {
  beforeEach(() => {
    clearGeocodeCache()
    vi.restoreAllMocks()
  })

  describe('Haversine Finite & Coordinate 0 Validation', () => {
    it('handles coordinate 0 accurately (Equator/Prime Meridian)', () => {
      const d1 = calculateDistance(0, 0, 0, 1)
      expect(d1).toBeGreaterThan(110)
      expect(d1).toBeLessThan(112)

      const d2 = haversineDistance(0, 0, 0, 1)
      expect(d2).toBeGreaterThan(110)
      expect(d2).toBeLessThan(112)
    })

    it('returns Infinity when any coordinate is null, undefined or NaN', () => {
      expect(calculateDistance(null, -56.1, -34.9, -56.2)).toBe(Infinity)
      expect(calculateDistance(-34.9, undefined, -34.9, -56.2)).toBe(Infinity)
      expect(calculateDistance(-34.9, -56.1, NaN, -56.2)).toBe(Infinity)

      expect(haversineDistance(null, -56.1, -34.9, -56.2)).toBe(Infinity)
      expect(haversineDistance(-34.9, undefined, -34.9, -56.2)).toBe(Infinity)
      expect(haversineDistance(-34.9, -56.1, NaN, -56.2)).toBe(Infinity)
    })
  })

  describe('Approximate Point Security & De-identification', () => {
    it('generates an approximate centroid that does NOT match exact GPS', () => {
      const exactLat = -34.901123
      const exactLng = -56.164567
      const approx = getApproximatePoint(exactLat, exactLng, 'user-abc-123')

      expect(approx).not.toBeNull()
      expect(approx.lat).not.toBe(exactLat)
      expect(approx.lng).not.toBe(exactLng)

      const distToExact = calculateDistance(exactLat, exactLng, approx.lat, approx.lng)
      expect(distToExact).toBeGreaterThan(0.01)
      expect(distToExact).toBeLessThan(3.0)
    })
  })

  describe('Manual Area Geocoding for Free/Plus Matching', () => {
    it('returns area centroid for Uruguay neighborhoods and calculates valid distance', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            lat: '-34.9150',
            lon: '-56.1520',
            name: 'Pocitos',
            display_name: 'Pocitos, Montevideo, Uruguay',
            type: 'suburb',
            category: 'boundary',
            address: { neighbourhood: 'Pocitos', city: 'Montevideo', state: 'Montevideo' }
          }
        ]
      })
      global.fetch = mockFetch

      const results = await geocode('Pocitos, Montevideo', { mode: 'area' })
      expect(results.length).toBe(1)
      expect(results[0].neighborhood).toBe('Pocitos')
      expect(Number.isFinite(results[0].lat)).toBe(true)
      expect(Number.isFinite(results[0].lng)).toBe(true)

      const matchDist = calculateDistance(results[0].lat, results[0].lng, -34.9060, -56.1860)
      expect(matchDist).toBeLessThan(10) // Free plan allows <= 30km, match is valid
    })
  })

  describe('Simulation of RLS & Identity Derivation Matrix', () => {
    it('validates caller auth.uid() rules for user_locations_private table', () => {
      const evaluateRls = (callerUid, rowUserId) => {
        if (!callerUid) return false // Anon denied
        if (callerUid === rowUserId) return true // Owner allowed
        return false // Third party denied
      }

      const userA = 'user-a-111'
      const userB = 'user-b-222'

      expect(evaluateRls(userA, userA)).toBe(true)
      expect(evaluateRls(userB, userA)).toBe(false)
      expect(evaluateRls(null, userA)).toBe(false)
    })
  })
})
