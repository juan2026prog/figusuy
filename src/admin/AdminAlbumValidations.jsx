import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminAlbumValidations() {
  const [validations, setValidations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchValidations()
  }, [])

  const fetchValidations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('album_completion_validations')
      .select(`
        *,
        user:profiles!user_id(name, username),
        album:albums!album_id(name, year)
      `)
      .order('requested_at', { ascending: false })
    
    if (!error && data) {
      setValidations(data)
    }
    setLoading(false)
  }

  const handleAction = async (id, status) => {
    const notes = prompt(`Notas para la validación (${status}):`)
    if (notes === null) return // Cancelado

    const { error } = await supabase.rpc('validate_album_completion', {
      p_validation_id: id,
      p_status: status,
      p_notes: notes
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      fetchValidations()
    }
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h2>Validaciones de Álbumes</h2>
          <p>Revisar usuarios que completaron su álbum.</p>
        </div>
      </header>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Álbum</th>
              <th>Estado</th>
              <th>Fecha Solicitud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {validations.map(v => (
              <tr key={v.id}>
                <td>
                  <strong>{v.user?.name || 'Usuario'}</strong>
                  <div style={{fontSize: '0.8rem', color: '#888'}}>@{v.user?.username}</div>
                </td>
                <td>{v.album?.name} ({v.album?.year})</td>
                <td>
                  <span className={`status-badge ${v.status}`}>
                    {v.status === 'pending' ? 'Pendiente' : v.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                  </span>
                </td>
                <td>{new Date(v.requested_at).toLocaleDateString()}</td>
                <td>
                  {v.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-approve" onClick={() => handleAction(v.id, 'approved')}>Aprobar</button>
                      <button className="btn-reject" onClick={() => handleAction(v.id, 'rejected')}>Rechazar</button>
                    </div>
                  )}
                  {v.status !== 'pending' && (
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                      Por {v.validator_type} <br/>
                      {v.notes && `Notas: ${v.notes}`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {validations.length === 0 && (
              <tr>
                <td colSpan="5">No hay solicitudes de validación.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <style>{`
        .admin-container { padding: 1.5rem; }
        .admin-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #333; }
        .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
        .status-badge.pending { background: #4a4a1a; color: #facc15; }
        .status-badge.approved { background: #1a4a1a; color: #4ade80; }
        .status-badge.rejected { background: #4a1a1a; color: #f87171; }
        .btn-approve { background: #1a4a1a; color: #4ade80; border: 1px solid #4ade80; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
        .btn-reject { background: #4a1a1a; color: #f87171; border: 1px solid #f87171; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  )
}
