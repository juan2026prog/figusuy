import React, { useState } from 'react';
import { getUserLocation, URUGUAY_DEPARTMENTS } from '../utils/location';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function LocationSelector({ onLocationSaved, className = '' }) {
  const { profile, updateProfile } = useAuthStore();
  const [mode, setMode] = useState('initial'); // 'initial', 'manual', 'loading'
  const [errorMsg, setErrorMsg] = useState('');
  
  const [department, setDepartment] = useState(profile?.department || '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '');

  const handleUseGPS = async () => {
    setMode('loading');
    setErrorMsg('');
    try {
      const coords = await getUserLocation();
      if (profile?.id) {
        await supabase.from('profiles').update({
          lat: coords.lat,
          lng: coords.lng,
          location_source: 'gps',
          location_updated_at: new Date().toISOString()
        }).eq('id', profile.id);
        
        // Optimistic update
        await updateProfile({ lat: coords.lat, lng: coords.lng, location_source: 'gps' });
      }
      setMode('initial');
      if (onLocationSaved) onLocationSaved(coords);
    } catch (err) {
      console.error('Location GPS Error:', err);
      const msg = err.message || (typeof err === 'string' ? err : 'Error desconocido al obtener ubicación.');
      setErrorMsg(msg);
      setMode('manual');
    }
  };

  const handleSaveManual = async () => {
    if (!department) {
      setErrorMsg('Por favor selecciona un departamento.');
      return;
    }
    setMode('loading');
    setErrorMsg('');
    try {
      if (profile?.id) {
        await supabase.from('profiles').update({
          country: 'Uruguay',
          department,
          neighborhood,
          location_source: 'manual',
          location_updated_at: new Date().toISOString(),
          // Clear precise GPS when using manual fallback to prevent confusion
          lat: null,
          lng: null
        }).eq('id', profile.id);
        
        await updateProfile({
          country: 'Uruguay',
          department,
          neighborhood,
          location_source: 'manual',
          lat: null,
          lng: null
        });
      }
      setMode('initial');
      if (onLocationSaved) onLocationSaved({ department, neighborhood });
    } catch (err) {
      console.error('Location Manual Error:', err);
      const msg = err.message || 'Error al guardar la ubicación manual.';
      setErrorMsg(msg);
      setMode('manual');
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
        }
        .loc-title {
          font-size: 1.125rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: var(--color-text);
        }
        .loc-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }
        .loc-error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
          font-weight: 500;
        }
        .loc-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .loc-buttons { flex-direction: row; }
        }
        .btn-gps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--color-brand-600);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          border: none;
          cursor: pointer;
          flex: 1;
        }
        .btn-gps:hover { background: var(--color-brand-700); }
        .btn-manual {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface-hover);
          color: var(--color-text);
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          border: 1px solid var(--color-border);
          cursor: pointer;
          flex: 1;
        }
        .btn-manual:hover { background: var(--color-border); }

        .manual-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
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
        }
      `}</style>

      <h3 className="loc-title">Ubicación y Zona</h3>
      <p className="loc-subtitle">Usamos tu zona para mostrarte cruces y puntos de intercambio cercanos. No compartimos tu ubicación exacta.</p>

      {errorMsg && <div className="loc-error">{errorMsg}</div>}

      {mode === 'loading' ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>
          Actualizando ubicación...
        </div>
      ) : mode === 'manual' ? (
        <div className="manual-form">
          <div className="form-group">
            <label>País</label>
            <input type="text" value="Uruguay" disabled />
          </div>
          <div className="form-group">
            <label>Departamento</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">Seleccioná tu departamento</option>
              {URUGUAY_DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Barrio / Zona (Opcional)</label>
            <input 
              type="text" 
              placeholder="Ej: Pocitos, Centro, Cordón" 
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
            />
          </div>
          <div className="loc-buttons" style={{ marginTop: '0.5rem' }}>
            <button className="btn-gps" onClick={handleSaveManual}>Guardar Zona</button>
            <button className="btn-manual" onClick={() => setMode('initial')}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="loc-buttons">
          <button className="btn-gps" onClick={handleUseGPS}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>my_location</span>
            Usar mi ubicación GPS
          </button>
          <button className="btn-manual" onClick={() => setMode('manual')}>
            Elegir zona manualmente
          </button>
        </div>
      )}
    </div>
  );
}
