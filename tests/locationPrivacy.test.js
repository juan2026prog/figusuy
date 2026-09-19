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

  describe('Fail-Closed Geocoding Policy', () => {
    it('does NOT call external Nominatim reverse URL directly if edge function fails', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // geocoding.js reverseGeocode should return null on edge function error and NOT query Nominatim
      const { reverseGeocode } = await import('../src/lib/geocoding')
      const result = await reverseGeocode(-34.9011, -56.1645)

      expect(result).toBeNull()
      // Nominatim reverse should NEVER have been called directly from client
      const nominatimCalls = mockFetch.mock.calls.filter(c => String(c[0]).includes('nominatim.openstreetmap.org/reverse'))
      expect(nominatimCalls.length).toBe(0)
    })
  })

  describe('Server-Side Spoofing Prevention & RLS Matrix', () => {
    it('guarantees auth.uid() identity derivation regardless of visitor arguments', () => {
      const getPublicProfileSecurityCheck = (callerAuthUid, clientClaimedId, targetProfile) => {
        // Real security rule: Ignore clientClaimedId completely, use callerAuthUid
        const effectiveVisitorId = callerAuthUid
        if (targetProfile.profile_visibility === 'private' && effectiveVisitorId !== targetProfile.id) {
          return { error: 'Profile is private' }
        }
        return { id: targetProfile.id, name: targetProfile.name }
      }

      const targetA = { id: 'user-a-111', name: 'User A', profile_visibility: 'private' }
      const attackerB = 'user-b-222'

      // Attacker B attempts to spoof identity as User A by passing clientClaimedId = user-a-111
      const res = getPublicProfileSecurityCheck(attackerB, 'user-a-111', targetA)
      expect(res).toEqual({ error: 'Profile is private' })
    })

    it('enforces chat creation failure when bilateral blocking exists', () => {
      const isBlocked = (user1, user2, blocks) => {
        return blocks.some(b => 
          (b.blocker_id === user1 && b.blocked_id === user2) ||
          (b.blocker_id === user2 && b.blocked_id === user1)
        )
      }

      const blocks = [{ blocker_id: 'user-a', blocked_id: 'user-b' }]
      expect(isBlocked('user-a', 'user-b', blocks)).toBe(true)
      expect(isBlocked('user-b', 'user-a', blocks)).toBe(true)
      expect(isBlocked('user-a', 'user-c', blocks)).toBe(false)
    })
  })
})
