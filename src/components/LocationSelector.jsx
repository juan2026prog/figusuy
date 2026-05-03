import React, { useState, useEffect, useCallback } from 'react';
import { getUserLocation, watchUserLocation, getAddressFromCoords, URUGUAY_DEPARTMENTS } from '../utils/location';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import UniversalAddressAutocomplete from './UniversalAddressAutocomplete';

export default function LocationSelector({ onLocationSaved, className = '' }) {
  const { profile, updateProfile } = useAuthStore();
  const [isGPSActive, setIsGPSActive] = useState(profile?.location_source === 'gps');
  const [mode, setMode] = useState(profile?.location_source === 'gps' ? 'gps_active' : 'manual'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [department, setDepartment] = useState(profile?.department || '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '');
  const [detectedArea, setDetectedArea] = useState(null);

  // Load profile state on mount
  useEffect(() => {
    if (profile) {
      setIsGPSActive(profile.location_source === 'gps');
      setDepartment(profile.department || '');
      setNeighborhood(profile.neighborhood || '');
    }
  }, [profile]);

  // Real-time tracking when GPS is active
  useEffect(() => {
    let watchId = null;

    if (isGPSActive) {
      watchId = watchUserLocation(
        async (coords) => {
          // Check if we should update (e.g. throttle or check distance)
          // For now, let's update whenever it changes slightly to satisfy "que se vaya actualizando"
          const address = await getAddressFromCoords(coords.lat, coords.lng);
          const updateData = {
            lat: coords.lat,
            lng: coords.lng,
            location_source: 'gps',
            department: address?.department || '',
            city: address?.city || '',
            neighborhood: address?.neighborhood || ''
          };
          
          await saveLocationToDB(updateData);
          setDetectedArea(address);
          if (onLocationSaved) onLocationSaved(updateData);
        },
        (err) => {
          console.error('Watch Error:', err);
          setErrorMsg('Error al rastrear ubicación en tiempo real.');
        }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isGPSActive]);

  const saveLocationToDB = async (data) => {
    if (!profile?.id) return;
    try {
      const payload = {
        ...data,
        location_updated_at: new Date().toISOString()
      };
      await supabase.from('profiles').update(payload).eq('id', profile.id);
      await updateProfile(payload);
    } catch (err) {
      console.error('Error saving location:', err);
      throw err;
    }
  };

  const handleToggleGPS = async (e) => {
    const active = e.target.checked;
    setIsGPSActive(active);
    setErrorMsg('');

    if (active) {
      setLoading(true);
      try {
        const coords = await getUserLocation();
        const address = await getAddressFromCoords(coords.lat, coords.lng);
        
        const updateData = {
          lat: coords.lat,
          lng: coords.lng,
          location_source: 'gps',
          department: address?.department || '',
          city: address?.city || '',
          neighborhood: address?.neighborhood || ''
        };

        await saveLocationToDB(updateData);
        setDetectedArea(address);
        setMode('gps_active');
        if (onLocationSaved) onLocationSaved(updateData);
      } catch (err) {
        console.error('GPS Activation Error:', err);
        setErrorMsg(err.message || 'No se pudo obtener la ubicación automática.');
        setIsGPSActive(false);
      } finally {
        setLoading(false);
      }
    } else {
      setMode('manual');
      setDetectedArea(null);
      // We don't clear manual data immediately, just change source
      await saveLocationToDB({ location_source: 'manual' });
    }
  };

  const handleSaveManual = async () => {
    if (!department && !neighborhood) {
      setErrorMsg('Ingresa una zona o dirección.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const updateData = {
        country: 'Uruguay',
        department,
        neighborhood,
        location_source: 'manual',
        lat: null,
        lng: null
      };
      await saveLocationToDB(updateData);
      if (onLocationSaved) onLocationSaved(updateData);
    } catch (err) {
      setErrorMsg('Error al guardar ubicación manual.');
    } finally {
      setLoading(false);
    }
  };

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
        
        /* Switch styling */
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
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--color-border);
          transition: .4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px; width: 18px;
          left: 3px; bottom: 3px;
          background-color: var(--color-text); transition: .4s;
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .form-group label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin-bottom: 0.375rem;
        }
        .form-group select, .form-group input {
          width: 100%;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-group select:focus, .form-group input:focus {
          border-color: var(--color-brand-600);
          outline: none;
        }

        .btn-save {
          background: var(--color-brand-600);
          color: var(--color-text); padding: 0.75rem;
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
          Ubicación Inteligente
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
              {detectedArea?.neighborhood || profile?.neighborhood || 'Zona Detectada'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {detectedArea?.city || profile?.city || 'Actualizando ubicación...'}
            </p>
          </div>
        </div>
      )}

      {!loading && !isGPSActive && (
        <div className="manual-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <UniversalAddressAutocomplete
              countryCode="uy"
              label="Buscar Zona o Ciudad"
              value={neighborhood || department}
              onChange={(val) => {
                // We keep the typed text just in case, or wait for select
              }}
              onAddressSelect={(data) => {
                setDepartment(data.department || data.state || '');
                setNeighborhood(data.neighborhood || data.locality || data.city || '');
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
  );
}
