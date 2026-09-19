import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUserLocation } from '../hooks/useUserLocation'
import UniversalAddressAutocomplete from './UniversalAddressAutocomplete'
import { URUGUAY_DEPARTMENTS } from '../utils/location'

export default function LocationSelector({ onLocationSaved, className = '' }) {
  const { profile } = useAuthStore()
  const {
    locationState,
    loading,
    error,
    areaDetails,
    enableGps,
    setManualLocation,
    disableLocation
  } = useUserLocation()

  const [activeTab, setActiveTab] = useState(locationState === 'manual' ? 'manual' : 'gps')
  const [selectedDept, setSelectedDept] = useState(areaDetails.department || 'Montevideo')
  const [selectedNeigh, setSelectedNeigh] = useState(areaDetails.neighborhood || '')
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    if (areaDetails.department) setSelectedDept(areaDetails.department)
    if (areaDetails.neighborhood) setSelectedNeigh(areaDetails.neighborhood)
  }, [areaDetails])

  const handleActivateGps = async () => {
    setStatusMsg('')
    try {
      const res = await enableGps()
      setStatusMsg('Ubicación privada activada correctamente.')
      if (onLocationSaved) onLocationSaved(res)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleSaveManual = async () => {
    setStatusMsg('')
    try {
      await setManualLocation({
        department: selectedDept,
        neighborhood: selectedNeigh
      })
      setStatusMsg('Zona guardada correctamente.')
      if (onLocationSaved) onLocationSaved({ department: selectedDept, neighborhood: selectedNeigh })
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleDisable = async () => {
    setStatusMsg('')
    try {
      await disableLocation()
      setStatusMsg('Ubicación desactivada.')
      if (onLocationSaved) onLocationSaved(null)
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <div className={`location-selector-card ${className}`} style={{
      background: 'var(--color-surface, #1e293b)',
      border: '1px solid var(--color-border, #334155)',
      borderRadius: '12px',
      padding: '16px',
      color: 'var(--color-text, #f8fafc)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '22px' }}>
            {locationState === 'gps' ? 'my_location' : locationState === 'manual' ? 'location_city' : 'location_off'}
          </span>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
            {locationState === 'gps' ? 'GPS Privado Activo' : locationState === 'manual' ? 'Zona Configurada' : 'Sin Ubicación'}
          </h3>
        </div>
        {locationState !== 'none' && (
          <button
            onClick={handleDisable}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-danger, #ef4444)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Desactivar
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '14px', lineHeight: 1.4 }}>
        🔒 <b>Privacidad garantizada:</b> Tus coordenadas exactas nunca se muestran a otros coleccionistas. Solo se usan de forma privada para calcular distancias aproximadas en intercambios.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('gps')}
          className={`btn ${activeTab === 'gps' ? 'orange' : ''}`}
          style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>my_location</span>
          Usar mi GPS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`btn ${activeTab === 'manual' ? 'orange' : ''}`}
          style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit_location</span>
          Elegir zona
        </button>
      </div>

      {activeTab === 'gps' ? (
        <div>
          <button
            type="button"
            onClick={handleActivateGps}
            disabled={loading}
            className="btn orange"
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {loading ? 'sync' : 'gps_fixed'}
            </span>
            {loading ? 'Obteniendo GPS privado...' : 'Actualizar ubicación con GPS'}
          </button>
          {locationState === 'gps' && areaDetails.department && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
              Zona detectada: <b>{[areaDetails.neighborhood, areaDetails.city, areaDetails.department].filter(Boolean).join(', ')}</b>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
              Departamento
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                background: 'var(--color-surface, #1e293b)',
                borderColor: 'var(--color-border, #334155)',
                color: 'var(--color-text, #f8fafc)',
                fontSize: '0.85rem'
              }}
            >
              {URUGUAY_DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <UniversalAddressAutocomplete
              mode="area"
              label="Barrio / Ciudad / Localidad"
              value={selectedNeigh}
              placeholder="Ej. Pocitos, Cordón, Ciudad de la Costa..."
              onAddressSelect={(item) => {
                if (item.department) setSelectedDept(item.department)
                setSelectedNeigh(item.neighborhood || item.city || item.address)
              }}
              onChange={(val) => setSelectedNeigh(val)}
            />
          </div>

          <button
            type="button"
            onClick={handleSaveManual}
            disabled={loading}
            className="btn orange"
            style={{ width: '100%', padding: '10px', marginTop: '4px' }}
          >
            {loading ? 'Guardando...' : 'Guardar zona'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {statusMsg && !error && (
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#10b981' }}>
          {statusMsg}
        </div>
      )}
    </div>
  )
}
