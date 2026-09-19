import { describe, it, expect, beforeEach, vi } from 'vitest'
import { normalizeDepartment, normalizeLocationParts, geocode, clearGeocodeCache } from '../src/lib/geocoding'
import { calculateDistance, formatDistance } from '../src/utils/location'

describe('Location & Privacy Hardening', () => {
  beforeEach(() => {
    clearGeocodeCache()
    vi.restoreAllMocks()
  })

  describe('Geocoding Normalization & Caching', () => {
    it('normalizes department strings correctly', () => {
      expect(normalizeDepartment('Departamento de Montevideo')).toBe('Montevideo')
      expect(normalizeDepartment('Department of Canelones')).toBe('Canelones')
      expect(normalizeDepartment('Maldonado Department')).toBe('Maldonado')
    })

    it('normalizes location parts structure', () => {
      const sample = {
        neighbourhood: 'Pocitos',
        city: 'Montevideo',
        state: 'Departamento de Montevideo'
      }
      const res = normalizeLocationParts(sample)
      expect(res.neighborhood).toBe('Pocitos')
      expect(res.city).toBe('Montevideo')
      expect(res.department).toBe('Montevideo')
      expect(res.display_name).toContain('Pocitos')
    })

    it('caches geocode results and avoids duplicate fetch calls', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            lat: '-34.9011',
            lon: '-56.1645',
            name: 'Montevideo',
            display_name: 'Montevideo, Uruguay',
            type: 'city',
            category: 'boundary',
            address: { city: 'Montevideo', state: 'Montevideo' }
          }
        ]
      })
      global.fetch = mockFetch

      const res1 = await geocode('Montevideo', { mode: 'area' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(res1.length).toBe(1)
      expect(res1[0].city).toBe('Montevideo')

      // Second call should come from cache
      const res2 = await geocode('Montevideo', { mode: 'area' })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(res2).toEqual(res1)
    })
  })

  describe('Haversine Distance & Format Calculation', () => {
    it('calculates accurate distances between known points', () => {
      // Montevideo (-34.9011, -56.1645) to Punta del Este (-34.9632, -54.9439) is ~115-120km
      const dist = calculateDistance(-34.9011, -56.1645, -34.9632, -54.9439)
      expect(dist).toBeGreaterThan(110)
      expect(dist).toBeLessThan(130)
    })

    it('formats distances cleanly for UI presentation', () => {
      expect(formatDistance(0.45)).toBe('~450 m')
      expect(formatDistance(3.72)).toBe('~3.7 km')
      expect(formatDistance(45.8)).toBe('~46 km')
      expect(formatDistance(Infinity)).toBe('Distancia no disponible')
      expect(formatDistance(null)).toBe('Distancia no disponible')
    })
  })

  describe('Candidate Privacy & Leak Prevention', () => {
    it('ensures candidate match payload does not contain raw sensitive lat/lng', () => {
      const simulatedMatchResponse = {
        userId: 'user-123',
        profile: {
          id: 'user-123',
          name: 'Coleccionista Test',
          city: 'Montevideo',
          department: 'Montevideo',
          neighborhood: 'Pocitos'
        },
        distance: 2.5,
        distanceLabel: '~2.5 km',
        approx_point: {
          lat: -34.9100,
          lng: -56.1500
        }
      }

      // Assert that raw coordinates are not present on root or profile
      expect(simulatedMatchResponse.profile).not.toHaveProperty('latitude')
      expect(simulatedMatchResponse.profile).not.toHaveProperty('longitude')
      expect(simulatedMatchResponse.profile).not.toHaveProperty('lat')
      expect(simulatedMatchResponse.profile).not.toHaveProperty('lng')
      expect(simulatedMatchResponse).not.toHaveProperty('latitude')
      expect(simulatedMatchResponse).not.toHaveProperty('longitude')
      
      // Approx point is present for map rendering with neighborhood fuzzing
      expect(simulatedMatchResponse.approx_point).toHaveProperty('lat')
      expect(simulatedMatchResponse.approx_point).toHaveProperty('lng')
    })
  })
})
