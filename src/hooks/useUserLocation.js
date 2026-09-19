import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { getUserLocation } from '../utils/location'
import { reverseGeocode, geocode } from '../lib/geocoding'

/**
 * Custom hook for managing private user location securely.
 * States:
 * - 'none': No location configured
 * - 'manual': Manual department/neighborhood selected + centroid geocoded internally
 * - 'gps': Private GPS coordinates enabled in user_locations_private
 */
export function useUserLocation() {
  const { profile, updateProfile } = useAuthStore()
  const [locationState, setLocationState] = useState('none') // 'none' | 'manual' | 'gps'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [areaDetails, setAreaDetails] = useState({
    department: profile?.department || '',
    city: profile?.city || '',
    neighborhood: profile?.neighborhood || ''
  })

  // Sync state from profile on load
  useEffect(() => {
    if (profile) {
      if (profile.location_source === 'gps') {
        setLocationState('gps')
      } else if (profile.department || profile.neighborhood) {
        setLocationState('manual')
      } else {
        setLocationState('none')
      }
      setAreaDetails({
        department: profile.department || '',
        city: profile.city || '',
        neighborhood: profile.neighborhood || ''
      })
    }
  }, [profile?.location_source, profile?.department, profile?.neighborhood])

  /**
   * Request GPS position on explicit user action and save to private coordinates table
   */
  const enableGps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const coords = await getUserLocation(10000)
      const rev = await reverseGeocode(coords.lat, coords.lng)

      // 1. Save to private coordinates table via RPC
      const { error: rpcError } = await supabase.rpc('update_my_location', {
        p_latitude: coords.lat,
        p_longitude: coords.lng,
        p_accuracy_m: coords.accuracy || null,
        p_source: 'gps',
        p_precision_level: 'precise'
      })

      if (rpcError) {
        console.warn('RPC update_my_location fallback to direct table update:', rpcError)
        await supabase
          .from('user_locations_private')
          .upsert({
            user_id: profile.id,
            latitude: coords.lat,
            longitude: coords.lng,
            accuracy_m: coords.accuracy || null,
            source: 'gps',
            precision_level: 'precise',
            updated_at: new Date().toISOString()
          })
      }

      // 2. Save public approximate metadata to profiles (NEVER exact lat/lng)
      const profilePayload = {
        location_source: 'gps',
        department: rev?.department || profile?.department || '',
        city: rev?.city || profile?.city || '',
        neighborhood: rev?.neighborhood || profile?.neighborhood || '',
        location_visibility: 'full',
        location_precision: 'neighborhood',
        location_updated_at: new Date().toISOString()
      }

      await updateProfile(profilePayload)
      setLocationState('gps')
      setAreaDetails({
        department: profilePayload.department,
        city: profilePayload.city,
        neighborhood: profilePayload.neighborhood
      })

      return { success: true, coords, area: rev }
    } catch (err) {
      const msg = typeof err === 'string' ? err : err.message || 'Error al obtener ubicación'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.department, profile?.city, profile?.neighborhood, updateProfile])

  /**
   * Set manual location (department/neighborhood) AND geocode internal area centroid
   * for distance matching in Free/Plus plans.
   */
  const setManualLocation = useCallback(async ({ department, city = '', neighborhood = '' }) => {
    setLoading(true)
    setError(null)
    try {
      const queryArea = [neighborhood, city, department, 'Uruguay'].filter(Boolean).join(', ')
      const geocodedAreas = await geocode(queryArea, { mode: 'area', countryCode: 'uy', limit: 1 })
      const areaCentroid = geocodedAreas?.[0] || null

      if (areaCentroid && Number.isFinite(areaCentroid.lat) && Number.isFinite(areaCentroid.lng)) {
        // Save area centroid as manual_approx in user_locations_private
        try {
          await supabase.rpc('update_my_location', {
            p_latitude: areaCentroid.lat,
            p_longitude: areaCentroid.lng,
            p_accuracy_m: 1000,
            p_source: 'manual_approx',
            p_precision_level: neighborhood ? 'neighborhood' : 'city'
          })
        } catch (rpcErr) {
          if (profile?.id) {
            await supabase.from('user_locations_private').upsert({
              user_id: profile.id,
              latitude: areaCentroid.lat,
              longitude: areaCentroid.lng,
              accuracy_m: 1000,
              source: 'manual_approx',
              precision_level: neighborhood ? 'neighborhood' : 'city',
              updated_at: new Date().toISOString()
            })
          }
        }
      } else {
        // Fallback: clear private coords if geocode fails
        try {
          await supabase.rpc('delete_my_location')
        } catch (delErr) {
          if (profile?.id) {
            await supabase.from('user_locations_private').delete().eq('user_id', profile.id)
          }
        }
      }

      // Save public approximate metadata
      const profilePayload = {
        location_source: 'manual',
        department: department || '',
        city: city || '',
        neighborhood: neighborhood || '',
        location_visibility: 'full',
        location_precision: neighborhood ? 'neighborhood' : 'city',
        location_updated_at: new Date().toISOString()
      }

      await updateProfile(profilePayload)
      setLocationState('manual')
      setAreaDetails({ department, city, neighborhood })

      return { success: true, centroid: areaCentroid }
    } catch (err) {
      const msg = typeof err === 'string' ? err : err.message || 'Error al guardar zona'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [profile?.id, updateProfile])

  /**
   * Turn off location completely (privacy erase)
   */
  const disableLocation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      try {
        await supabase.rpc('delete_my_location')
      } catch (rpcErr) {
        if (profile?.id) {
          await supabase.from('user_locations_private').delete().eq('user_id', profile.id)
        }
      }

      const profilePayload = {
        location_source: 'none',
        department: '',
        city: '',
        neighborhood: '',
        location_visibility: 'none',
        location_updated_at: new Date().toISOString()
      }

      await updateProfile(profilePayload)
      setLocationState('none')
      setAreaDetails({ department: '', city: '', neighborhood: '' })

      return { success: true }
    } catch (err) {
      setError(err.message || 'Error al desactivar ubicación')
      throw err
    } finally {
      setLoading(false)
    }
  }, [profile?.id, updateProfile])

  return {
    locationState,
    loading,
    error,
    areaDetails,
    enableGps,
    setManualLocation,
    disableLocation
  }
}
