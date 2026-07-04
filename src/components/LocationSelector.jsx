import React, { useEffect, useRef, useState, useMemo } from 'react'
import { getAddressFromCoords, getUserLocation, watchUserLocation } from '../utils/location'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import UniversalAddressAutocomplete from './UniversalAddressAutocomplete'

// Leaflet dynamic imports to avoid SSR issues
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const isProfilePlanConstraintError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === '23514' || message.includes('plan_name_check')
}

const getLocationErrorMessage = (error, fallback) => {
  if (typeof error === 'string') return error
  if (isProfilePlanConstraintError(error)) {
    return 'No se pudo guardar tu ubicación. Recarga la página.'
  }
  return fallback
}

// Custom component to handle map centering
function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true })
  }, [center, map])
  return null
}

const parseAndValidateCoordinate = (val, min, max) => {
  if (val === undefined || val === null || val === '') return null
  const num = parseFloat(val)
  if (isNaN(num)) return null
  if (num < min || num > max) return null
  return num
}

export default function LocationSelector({ onLocationSaved, className = '' }) {
  const { profile, updateProfile } = useAuthStore()
  const { matches } = useAppStore()
  const [isGPSActive, setIsGPSActive] = useState(profile?.location_source === 'gps')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [department, setDepartment] = useState(profile?.department || '')
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '')
  const [detectedArea, setDetectedArea] = useState(null)
  const [nearbyHubs, setNearbyHubs] = useState([])
  const [isScanning, setIsScanning] = useState(false)

  const [manualLat, setManualLat] = useState(profile?.location_source === 'manual' ? profile?.lat : null)
  const [manualLng, setManualLng] = useState(profile?.location_source === 'manual' ? profile?.lng : null)

  const lastUpdateRef = useRef(0)
  const isUpdatingRef = useRef(false)
  const lastFeedbackRef = useRef(0)

  const activeLat = isGPSActive ? profile?.lat : (manualLat !== null ? manualLat : profile?.lat)
  const activeLng = isGPSActive ? profile?.lng : (manualLng !== null ? manualLng : profile?.lng)

  const userCoords = useMemo(() => {
    if (activeLat && activeLng) return [activeLat, activeLng]
    return [-34.9011, -56.1645] // Default Montevideo
  }, [activeLat, activeLng])

  useEffect(() => {
    if (!profile || loading) return
    setIsGPSActive(profile.location_source === 'gps')
    setDepartment(profile.department || '')
    setNeighborhood(profile.neighborhood || '')
  }, [profile, loading])

  // Fetch nearby points (Collector Hubs)
  useEffect(() => {
    const fetchNearbyPoints = async () => {
      if (!profile?.lat) return
      try {
        const { data } = await supabase
          .from('vw_point_scores')
          .select('id, name, lat, lng, business_plan')
          .not('lat', 'is', null)
          .limit(20)
        
        setNearbyHubs(data || [])
      } catch (err) {
        console.error('Error fetching nearby points:', err)
      }
    }
    fetchNearbyPoints()
  }, [profile?.lat])

  useEffect(() => {
    let watchId = null

    if (isGPSActive) {
      watchId = watchUserLocation(
        async (coords) => {
          const now = Date.now()
          if (now - lastUpdateRef.current < 30000 && lastUpdateRef.current !== 0) return
          if (isUpdatingRef.current) return

          isUpdatingRef.current = true
          try {
            const address = await getAddressFromCoords(coords.lat, coords.lng)
            const updateData = {
              lat: coords.lat,
              lng: coords.lng,
              location_source: 'gps',
              department: address?.department || '',
              city: address?.city || '',
              neighborhood: address?.neighborhood || '',
            }

            await saveLocationToDB(updateData)
            setDetectedArea(address)
            lastUpdateRef.current = now
          } catch (err) {
            console.error('Update during watch error:', err)
          } finally {
            isUpdatingRef.current = false
          }
        },
        (err) => {
          console.error('Watch Error:', err)
          if (err.code === 3 && (detectedArea || profile?.lat)) return
          setErrorMsg('Error al rastrear ubicación.')
        }
      )
    }

    return () => {
      if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId)
    }
  }, [isGPSActive, profile?.lat, detectedArea])

  const saveLocationToDB = async (data) => {
    if (!profile?.id) return
    const payload = { ...data, location_updated_at: new Date().toISOString() }
    await updateProfile(payload)
  }

  const notifyLocationSaved = (data) => {
    if (!onLocationSaved) return
    const now = Date.now()
    if (now - lastFeedbackRef.current < 1500) return
    lastFeedbackRef.current = now
    onLocationSaved(data)
  }

  const handleToggleGPS = async () => {
    const nextActive = !isGPSActive
    setIsGPSActive(nextActive)
    setErrorMsg('')
    setIsScanning(true)

    if (nextActive) {
      setLoading(true)
      try {
        const coords = await getUserLocation()
        const address = await getAddressFromCoords(coords.lat, coords.lng)
        const updateData = {
          lat: coords.lat,
          lng: coords.lng,
          location_source: 'gps',
          department: address?.department || '',
          city: address?.city || '',
          neighborhood: address?.neighborhood || '',
        }
        await saveLocationToDB(updateData)
        setDetectedArea(address)
        lastUpdateRef.current = Date.now()
        notifyLocationSaved(updateData)
      } catch (err) {
        setErrorMsg(getLocationErrorMessage(err, 'No se pudo obtener la ubicación.'))
        setIsGPSActive(false)
      } finally {
        setLoading(false)
        setTimeout(() => setIsScanning(false), 2000)
      }
      return
    }

    setDetectedArea(null)
    setIsScanning(false)
    try {
      await saveLocationToDB({ location_source: 'manual' })
    } catch (err) {
      setIsGPSActive(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveManual = async () => {
    if (!department && !neighborhood) {
      setErrorMsg('Ingresa una zona o ciudad.')
      return
    }
    setLoading(true)
    setIsScanning(true)
    try {
      const updateData = {
        country: 'Uruguay',
        department,
        neighborhood,
        location_source: 'manual',
        lat: manualLat,
        lng: manualLng,
      }
      await saveLocationToDB(updateData)
      notifyLocationSaved(updateData)
    } finally {
      setLoading(false)
      setTimeout(() => setIsScanning(false), 2000)
    }
  }

  const hubCount = nearbyHubs.filter(h => h.business_plan === 'partner_store' || h.business_plan === 'legend').length
  const activeMatches = matches?.length || 0
  const currentCity = detectedArea?.city || profile?.city || department || 'Uruguay'
  const currentZone = detectedArea?.neighborhood || profile?.neighborhood || neighborhood || 'Sin zona'

  return (
    <div className={`fy-radar-widget ${className}`}>
      <style>{`
        .fy-radar-widget {
          border: 1px solid rgba(255, 106, 0, 0.35);
          border-radius: 18px;
          padding: 24px;
          background: radial-gradient(circle at top right, rgba(255, 106, 0, 0.12), transparent 35%),
                      linear-gradient(180deg, #151515, #090909);
          box-shadow: 0 0 30px rgba(255, 106, 0, 0.08);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
        }

        .fy-radar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .fy-radar-title {
          font-size: 24px;
          font-weight: 1000;
          font-style: italic;
          text-transform: uppercase;
          margin: 0 0 4px;
        }

        .fy-radar-sub {
          color: #bbb;
          margin: 0;
          font-size: 14px;
          font-family: system-ui;
        }

        .fy-radar-switch {
          background: ${isGPSActive ? '#ff6a00' : '#222'};
          border: 1px solid ${isGPSActive ? '#ff6a00' : '#444'};
          border-radius: 999px;
          padding: 6px 14px;
          font-weight: 1000;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: ${isGPSActive ? '0 0 15px rgba(255, 106, 0, 0.45)' : 'none'};
          text-transform: uppercase;
        }

        .fy-radar-input-group {
          margin-bottom: 20px;
        }

        .fy-radar-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 16px;
          border-radius: 14px;
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          margin-bottom: 20px;
        }

        .fy-radar-stats b {
          font-size: 24px;
          display: block;
          line-height: 1.1;
          color: #fff;
        }

        .fy-radar-stats span {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .fy-map-container {
          height: 220px;
          margin: 16px 0;
          border-radius: 14px;
          border: 1px solid rgba(255, 106, 0, 0.25);
          position: relative;
          overflow: hidden;
          background: #000;
        }

        .fy-radar-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%);
        }

        .fy-radar-scan {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background: conic-gradient(from 0deg, rgba(255, 106, 0, 0.15) 0deg, transparent 60deg);
          animation: fy-scan 4s linear infinite;
          display: ${isScanning || isGPSActive ? 'block' : 'none'};
        }

        @keyframes fy-scan {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fy-radar-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255, 106, 0, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 106, 0, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
          z-index: 1001;
        }

        .fy-radar-btn {
          width: 100%;
          padding: 16px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(180deg, #ff6a00, #e44e00);
          color: #fff;
          font-size: 16px;
          font-weight: 1000;
          font-family: 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(255, 106, 0, 0.3);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .fy-radar-btn:active {
          transform: scale(0.98);
        }

        .leaflet-container {
          filter: grayscale(1) invert(1) contrast(1.2) brightness(0.8);
          background: #000 !important;
        }

        .fy-detected-text {
          font-size: 13px;
          color: #888;
          margin-top: 8px;
          font-family: system-ui;
        }
      `}</style>

      <div className="fy-radar-header">
        <div>
          <h2 className="fy-radar-title">Radar Activo</h2>
          <p className="fy-radar-sub">Actividad cerca tuyo</p>
        </div>
        <div className="fy-radar-switch" onClick={handleToggleGPS}>
          {isGPSActive ? 'GPS ON' : 'GPS OFF'}
        </div>
      </div>

      <div className="fy-radar-input-group">
        {!isGPSActive && (
          <UniversalAddressAutocomplete
            countryCode="uy"
            label="Buscar zona o ciudad"
            value={neighborhood || department}
            onChange={() => {}}
            onAddressSelect={(data) => {
              setDepartment(data.department || data.state || '')
              setNeighborhood(data.neighborhood || data.locality || data.city || '')
              const parsedLat = parseAndValidateCoordinate(data.lat, -90, 90)
              const parsedLng = parseAndValidateCoordinate(data.lng || data.lon, -180, 180)
              setManualLat(parsedLat)
              setManualLng(parsedLng)
            }}
            placeholder="Ej: Pocitos, Montevideo"
          />
        )}
        <div className="fy-detected-text">
          Zona: <b style={{ color: '#ff6a00' }}>{currentZone}</b> · {currentCity}
        </div>
      </div>

      <div className="fy-radar-stats">
        <div>
          <b>{activeMatches}</b>
          <span>Matches</span>
        </div>
        <div>
          <b style={{ fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentZone}</b>
          <span>Zona</span>
        </div>
        <div>
          <b>{hubCount}</b>
          <span>Hubs</span>
        </div>
      </div>

      <div className="fy-map-container">
        <div className="fy-radar-scan" />
        <div className="fy-radar-grid" />
        <div className="fy-radar-overlay" />
        
        <MapContainer 
          center={userCoords} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={userCoords} />
          
          {activeLat && activeLng && (
            <>
              <Circle 
                center={[activeLat, activeLng]} 
                radius={500} 
                pathOptions={{ color: '#ff6a00', fillColor: '#ff6a00', fillOpacity: 0.1 }} 
              />
              <Marker position={[activeLat, activeLng]} />
            </>
          )}

          {nearbyHubs.map(hub => (
            <Circle 
              key={hub.id}
              center={[hub.lat, hub.lng]}
              radius={100}
              pathOptions={{ 
                color: hub.business_plan === 'legend' ? '#facc15' : '#14b8a6', 
                fillColor: hub.business_plan === 'legend' ? '#facc15' : '#14b8a6',
                fillOpacity: 0.5 
              }}
            />
          ))}
        </MapContainer>
      </div>

      <button className="fy-radar-btn" onClick={isGPSActive ? handleToggleGPS : handleSaveManual} disabled={loading}>
        {loading ? 'Sincronizando...' : 'Actualizar radar'}
      </button>

      {errorMsg && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>{errorMsg}</p>}
    </div>
  )
}
