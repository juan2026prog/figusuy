import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BusinessProfile() {
  const { location, setLocation, fetchLocation } = useOutletContext()
  const [saving, setSaving] = useState(false)
  
  if (!location) return null

  // Ensure metadata exists
  const meta = location.metadata || {}
  const [formData, setFormData] = useState({
    name: location.name || '',
    address: location.address || '',
    whatsapp: location.whatsapp || meta.whatsapp || '',
    description: meta.description || '',
    hours: meta.hours || '',
    display_type: meta.display_type || location.type || 'store',
    country: meta.country || 'Uruguay',
    department: meta.department || '',
    city: meta.city || '',
    zone: meta.zone || meta.neighborhood || '',
    allows_exchange: location.allows_exchange || false,
    sells_stickers: location.sells_stickers || false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    // Construct new metadata
    const newMetadata = {
      ...meta,
      description: formData.description,
      whatsapp: formData.whatsapp,
      hours: formData.hours,
      display_type: formData.display_type,
      country: formData.country,
      department: formData.department,
      city: formData.city,
      zone: formData.zone,
      neighborhood: formData.zone, // Keep backward compatible
      allows_exchange: formData.allows_exchange
    }

    const updates = {
      name: formData.name,
      address: formData.address,
      whatsapp: formData.whatsapp,
      allows_exchange: formData.allows_exchange,
      sells_stickers: formData.sells_stickers,
      metadata: newMetadata,
      type: formData.display_type === 'Punto de intercambio' ? 'safe_point' : 'store' // simplify mapping
    }

    const { error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id)
    
    if (error) {
      alert('Error guardando perfil: ' + error.message)
    } else {
      alert('Perfil guardado exitosamente')
      fetchLocation()
    }
    setSaving(false)
  }

  // Preview logic
  const isExchange = formData.allows_exchange
  const badge = isExchange 
    ? { text: '🔄 Punto de intercambio', className: 'badge-exchange' } 
    : { text: '🛍 Tienda aliada', className: 'badge-store' }

  const locParts = [formData.zone, formData.department].filter(Boolean)
  const locationStr = locParts.length > 0 ? locParts.join(' · ') : formData.address

  return (
    <div className="biz-profile-page">
      <style>{`
        .biz-profile-page {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .biz-profile-page {
            grid-template-columns: 1.5fr 1fr;
          }
        }
        .biz-form-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 1rem;
          padding: 2rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          color: #cbd5e1;
          margin-bottom: 0.5rem;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          color: white;
          font-family: inherit;
          font-size: 0.9375rem;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          outline: none;
          border-color: #f97316;
        }
        .form-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          color: #cbd5e1;
          padding: 1rem;
          background: #1e293b;
          border-radius: 0.5rem;
          border: 1px solid #334155;
        }
        .biz-btn-save {
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }
        .biz-btn-save:hover {
          background: #ea580c;
        }
        .biz-btn-save:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        
        /* Preview Card - matching Stores.jsx */
        .preview-container {
          position: sticky;
          top: 2rem;
        }
        .preview-header {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: white;
        }
        .punto-card {
          background: #020617;
          border: 1px solid #1e293b;
          border-radius: 1.5rem;
          padding: 1.25rem;
          position: relative;
        }
        .badge-exchange {
          display: inline-block;
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.6875rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .badge-store {
          display: inline-block;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.6875rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .punto-name {
          font-size: 1.125rem;
          font-weight: 900;
          margin-bottom: 0.125rem;
          color: white;
        }
        .punto-loc {
          font-size: 0.8125rem;
          color: #94a3b8;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .punto-desc {
          font-size: 0.875rem;
          color: #cbd5e1;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        .punto-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .meta-pill {
          background: #1e293b;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #cbd5e1;
        }
        .action-btn {
          flex: 1;
          text-align: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 700;
        }
        .action-btn-primary {
          background: #f97316;
          color: white;
          border: none;
        }
        .action-btn-secondary {
          background: #1e293b;
          color: white;
          border: 1px solid #334155;
        }
      `}</style>

      <div className="biz-form-card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>Datos Públicos</h2>
        
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nombre del Local</label>
            <input name="name" value={formData.name} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Corta</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows="3" maxLength="150" placeholder="Ej: Vení a intercambiar figuritas y tomarte un café..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Lugar</label>
              <select name="display_type" value={formData.display_type} onChange={handleChange} className="form-select">
                <option value="store">Tienda</option>
                <option value="cafe">Cafetería</option>
                <option value="kiosk">Kiosco</option>
                <option value="safe_point">Punto de Intercambio</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp (ej: 59899123456)</label>
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dirección exacta</label>
            <input name="address" value={formData.address} onChange={handleChange} className="form-input" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input name="department" value={formData.department} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Barrio / Zona</label>
              <input name="zone" value={formData.zone} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Horarios (ej: Lun a Vie 09 a 18hs)</label>
            <input name="hours" value={formData.hours} onChange={handleChange} className="form-input" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2rem 0 1rem' }}>Configuración de Servicios</h3>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" name="allows_exchange" checked={formData.allows_exchange} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem' }} />
              Permite intercambio de figuritas gratis (Punto seguro)
            </label>
            
            <label className="form-checkbox-label">
              <input type="checkbox" name="sells_stickers" checked={formData.sells_stickers} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem' }} />
              Vende figuritas / sobres oficiales
            </label>
          </div>

          <button type="submit" className="biz-btn-save" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      <div className="preview-container">
        <h3 className="preview-header">Así te ven en FigusUY</h3>
        <article className="punto-card">
          <span className={badge.className}>{badge.text}</span>
          <h3 className="punto-name">{formData.name || 'Nombre del local'}</h3>
          <p className="punto-loc">
            {formData.display_type} · {locationStr || 'Dirección no definida'}
          </p>
          <p className="punto-desc">
            {formData.description || 'Descripción de tu local...'}
          </p>
          
          <div className="punto-meta">
            {formData.hours && <span className="meta-pill">🕒 {formData.hours}</span>}
            {formData.whatsapp && <span className="meta-pill">📱 {formData.whatsapp}</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {formData.whatsapp && (
              <button className="action-btn action-btn-primary">WhatsApp</button>
            )}
            <button className="action-btn action-btn-secondary">Cómo llegar</button>
            <button className="action-btn action-btn-secondary">Ver detalle</button>
          </div>
        </article>
      </div>
    </div>
  )
}
