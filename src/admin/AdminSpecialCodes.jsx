import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminSpecialCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    applies_to_user: true,
    applies_to_store: false,
    max_uses: '',
    expires_at: '',
    consume_founding_slot: false,
    grants_founding_badge: false,
    grants_pro: false,
    pro_days: 30,
    grants_xp: false,
    xp_amount: 1000
  })

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('special_access_codes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setCodes(data)
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      code: formData.code.toUpperCase().trim(),
      name: formData.name,
      description: formData.description || null,
      applies_to_user: formData.applies_to_user,
      applies_to_store: formData.applies_to_store,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      consume_founding_slot: formData.consume_founding_slot,
      grants_founding_badge: formData.grants_founding_badge,
      grants_pro: formData.grants_pro,
      pro_days: formData.grants_pro ? parseInt(formData.pro_days) : null,
      grants_xp: formData.grants_xp,
      xp_amount: formData.grants_xp ? parseInt(formData.xp_amount) : null
    }

    const { error } = await supabase.from('special_access_codes').insert([payload])
    
    if (error) {
      alert('Error creando código: ' + error.message)
    } else {
      setFormOpen(false)
      fetchCodes()
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from('special_access_codes')
      .update({ active: !currentStatus })
      .eq('id', id)
      
    if (!error) {
      fetchCodes()
    }
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h2>Códigos Especiales</h2>
          <p>Gestionar códigos promocionales y de acceso.</p>
        </div>
        <button className="admin-btn-primary" onClick={() => setFormOpen(true)}>
          Crear Código
        </button>
      </header>

      {formOpen && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>Nuevo Código</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Código (ej. VERANO2026)</label>
                <input required type="text" name="code" value={formData.code} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Nombre interno</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} />
              </div>
              
              <div className="form-row">
                <label>
                  <input type="checkbox" name="applies_to_user" checked={formData.applies_to_user} onChange={handleChange} />
                  Aplica a Usuarios
                </label>
                <label>
                  <input type="checkbox" name="applies_to_store" checked={formData.applies_to_store} onChange={handleChange} />
                  Aplica a Comercios
                </label>
              </div>

              <div className="form-group">
                <label>Límite de usos (vacío = ilimitado)</label>
                <input type="number" name="max_uses" value={formData.max_uses} onChange={handleChange} />
              </div>
              
              <div className="form-group">
                <label>Fecha de expiración</label>
                <input type="datetime-local" name="expires_at" value={formData.expires_at} onChange={handleChange} />
              </div>

              <h4>Beneficios</h4>
              <div className="form-row">
                <label>
                  <input type="checkbox" name="grants_founding_badge" checked={formData.grants_founding_badge} onChange={handleChange} />
                  Otorgar Medalla "Desde el comienzo"
                </label>
              </div>
              {formData.grants_founding_badge && (
                <div className="form-row" style={{ marginLeft: '1.5rem' }}>
                  <label>
                    <input type="checkbox" name="consume_founding_slot" checked={formData.consume_founding_slot} onChange={handleChange} />
                    Consumir un cupo de los primeros 250
                  </label>
                </div>
              )}
              
              <div className="form-row">
                <label>
                  <input type="checkbox" name="grants_pro" checked={formData.grants_pro} onChange={handleChange} />
                  Otorgar PRO / Partner
                </label>
                {formData.grants_pro && (
                  <input type="number" name="pro_days" value={formData.pro_days} onChange={handleChange} style={{ width: '80px', marginLeft: '1rem' }} />
                )}
                {formData.grants_pro && <span> días</span>}
              </div>

              <div className="form-row">
                <label>
                  <input type="checkbox" name="grants_xp" checked={formData.grants_xp} onChange={handleChange} />
                  Otorgar Experiencia (XP)
                </label>
                {formData.grants_xp && (
                  <input type="number" name="xp_amount" value={formData.xp_amount} onChange={handleChange} style={{ width: '80px', marginLeft: '1rem' }} />
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
                <button type="submit" className="admin-btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Usos</th>
              <th>Límite</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.name}</td>
                <td>{c.used_count}</td>
                <td>{c.max_uses || '∞'}</td>
                <td>
                  <span className={`status-badge ${c.active ? 'active' : 'inactive'}`}>
                    {c.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleStatus(c.id, c.active)}>
                    {c.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan="6">No hay códigos.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <style>{`
        .admin-container { padding: 1.5rem; }
        .admin-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        .admin-btn-primary { background: var(--color-primary); color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius: 4px; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #333; }
        .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
        .status-badge.active { background: #1a4a1a; color: #4ade80; }
        .status-badge.inactive { background: #4a1a1a; color: #f87171; }
        .admin-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .admin-modal-content { background: #111; padding: 2rem; border-radius: 8px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .admin-form .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .admin-form .form-row { margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .admin-form input[type="text"], .admin-form input[type="number"], .admin-form input[type="datetime-local"] { padding: 0.5rem; background: #222; border: 1px solid #444; color: white; }
        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
      `}</style>
    </div>
  )
}
