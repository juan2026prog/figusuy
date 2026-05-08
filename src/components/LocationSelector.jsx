import React, { useEffect, useRef, useState } from 'react'
import { getAddressFromCoords, getUserLocation, watchUserLocation } from '../utils/location'
import { useAuthStore } from '../stores/authStore'
import UniversalAddressAutocomplete from './UniversalAddressAutocomplete'

const isProfilePlanConstraintError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === '23514' || message.includes('plan_name_check')
}

const getLocationErrorMessage = (error, fallback) => {
  if (typeof error === 'string') return error
  if (isProfilePlanConstraintError(error)) {
    return 'No se pudo guardar tu ubicacion porque tu plan del perfil esta desalineado. Recarga la pagina y guarda tu perfil una vez.'
  }
  return fallback
}

export default function LocationSelector({ onLocationSaved, className = '' }) {
  const { profile, updateProfile } = useAuthStore()
  const [isGPSActive, setIsGPSActive] = useState(profile?.location_source === 'gps')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [department, setDepartment] = useState(profile?.department || '')
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '')
  const [detectedArea, setDetectedArea] = useState(null)

  const lastUpdateRef = useRef(0)
  const isUpdatingRef = useRef(false)
  const lastFeedbackRef = useRef(0)

  useEffect(() => {
    if (!profile || loading) return
    setIsGPSActive(profile.location_source === 'gps')
    setDepartment(profile.department || '')
    setNeighborhood(profile.neighborhood || '')
  }, [profile, loading])

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
            setErrorMsg(getLocationErrorMessage(err, 'No se pudo actualizar tu ubicacion automaticamente.'))
          } finally {
            isUpdatingRef.current = false
          }
        },
        (err) => {
          console.error('Watch Error:', err)
          if (err.code === 3 && (detectedArea || profile?.lat)) return
          setErrorMsg('Error al rastrear ubicacion. Verifica permisos y configuracion del perfil.')
        }
      )
    } else {
      lastUpdateRef.current = 0
      isUpdatingRef.current = false
    }

    return () => {
      if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId)
    }
  }, [isGPSActive, onLocationSaved, profile?.lat, detectedArea])

  const saveLocationToDB = async (data) => {
    if (!profile?.id) return
    const payload = {
      ...data,
      location_updated_at: new Date().toISOString(),
    }
    await updateProfile(payload)
  }

  const notifyLocationSaved = (data) => {
    if (!onLocationSaved) return
    const now = Date.now()
    if (now - lastFeedbackRef.current < 1500) return
    lastFeedbackRef.current = now
    onLocationSaved(data)
  }

  const handleToggleGPS = async (e) => {
    const active = e.target.checked
    setIsGPSActive(active)
    setErrorMsg('')

    if (active) {
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
        console.error('GPS Activation Error:', err)
        setErrorMsg(getLocationErrorMessage(err, 'No se pudo obtener la ubicacion automatica. Verifica los permisos.'))
        setIsGPSActive(false)
      } finally {
        setLoading(false)
      }
      return
    }

    setDetectedArea(null)
    try {
      await saveLocationToDB({ location_source: 'manual' })
    } catch (err) {
      setErrorMsg(getLocationErrorMessage(err, 'No se pudo cambiar a ubicacion manual.'))
      setIsGPSActive(true)
    }
  }

  const handleSaveManual = async () => {
    if (!department && !neighborhood) {
      setErrorMsg('Ingresa una zona o direccion.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const updateData = {
        country: 'Uruguay',
        department,
        neighborhood,
        location_source: 'manual',
        lat: null,
        lng: null,
      }
      await saveLocationToDB(updateData)
      notifyLocationSaved(updateData)
    } catch (err) {
      console.error('Error saving manual location:', err)
      setErrorMsg(getLocationErrorMessage(err, 'Error al guardar ubicacion manual.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`location-selector-container ${className}`}>
      <style>{`
        .location-selector-container {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.1);
        }
        .loc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          gap: 1rem;
        }
        .loc-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--color-text);
          margin: 0;
        }
        .loc-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-secondary);
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--color-border);
          transition: .4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--color-text);
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--color-brand-600); }
        input:checked + .slider:before { transform: translateX(24px); }
        .loc-status-box {
          background: var(--color-surface-hover);
          border: 1px dashed var(--color-border);
          padding: 1rem;
          border-radius: var(--radius-lg);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .detected-icon {
          color: var(--color-brand-600);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .loc-error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .manual-form {
          display: grid;
          gap: 1rem;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-save {
          background: var(--color-brand-600);
          color: var(--color-text);
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-save:hover { background: var(--color-brand-700); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="loc-header">
        <h3 className="loc-title">Tu Zona</h3>
        <label className="loc-toggle">
          Ubicacion Inteligente
          <div className="switch">
            <input
              type="checkbox"
              checked={isGPSActive}
              onChange={handleToggleGPS}
              disabled={loading}
            />
            <span className="slider"></span>
          </div>
        </label>
      </div>

      {errorMsg && <div className="loc-error">{errorMsg}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-brand-600)' }}>
          <span className="material-symbols-outlined spin">sync</span>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>Actualizando...</p>
        </div>
      )}

      {!loading && isGPSActive && (
        <div className="loc-status-box">
          <span className="material-symbols-outlined detected-icon">location_on</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>
              {detectedArea?.neighborhood || profile?.neighborhood || 'Zona detectada'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {detectedArea?.city || profile?.city || 'Actualizando ubicacion...'}
            </p>
          </div>
        </div>
      )}

      {!loading && !isGPSActive && (
        <div className="manual-form">
          <div style={{ marginBottom: '1rem' }}>
            <UniversalAddressAutocomplete
              countryCode="uy"
              label="Buscar Zona o Ciudad"
              value={neighborhood || department}
              onChange={() => {}}
              onAddressSelect={(data) => {
                setDepartment(data.department || data.state || '')
                setNeighborhood(data.neighborhood || data.locality || data.city || '')
              }}
              placeholder="Ej: Pocitos, Montevideo"
            />
            {department && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                Seleccionado: {neighborhood ? `${neighborhood}, ` : ''}{department}
              </div>
            )}
          </div>
          <button className="btn-save" onClick={handleSaveManual}>
            Guardar Zona Manual
          </button>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        Tus datos se usan para encontrarte cruces cerca de vos.
      </p>
    </div>
  )
}
