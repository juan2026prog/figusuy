import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }
const badge = (color, bg) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, color, background: bg, textTransform: 'uppercase' })

export default function AdminLocationRequests() {
  const { locationRequests, fetchLocationRequests, approveLocationRequest, rejectLocationRequest, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchLocationRequests()
  }, [])

  const handleApprove = (id) => {
    if (window.confirm('¿Aprobar esta solicitud? El local se creará automáticamente.')) {
      approveLocationRequest(id, user.id)
    }
  }

  const handleReject = () => {
    if (rejectionReason.trim()) {
      rejectLocationRequest(rejectingId, rejectionReason, user.id)
      setRejectingId(null)
      setRejectionReason('')
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>how_to_reg</span>
          Solicitudes de Locales
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Gestiona las postulaciones de nuevos puntos de intercambio y tiendas.
        </p>
      </div>

      {loading && locationRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando solicitudes...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {locationRequests.map(req => (
            <div key={req.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>store</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{req.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0' }}>
                      Solicitado por: <strong>{req.profile?.name}</strong> ({req.profile?.email})
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8125rem', color: '#475569' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span>
                        {req.address}, {req.city}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>calendar_today</span>
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                  {req.status === 'pending' && (
                    <span style={badge('#f59e0b', '#fffbeb')}>Pendiente</span>
                  )}
                  {req.status === 'approved' && (
                    <span style={badge('#10b981', '#ecfdf5')}>Aprobado</span>
                  )}
                  {req.status === 'rejected' && (
                    <span style={badge('#ef4444', '#fef2f2')}>Rechazado</span>
                  )}
                  
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    Plan: {req.business_plan?.toUpperCase() || 'GRATIS'}
                  </div>
                </div>
              </div>

              {req.status === 'pending' && (
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <button
                    onClick={() => handleApprove(req.id)}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>check_circle</span>
                    Aprobar Solicitud
                  </button>
                  <button
                    onClick={() => setRejectingId(req.id)}
                    style={{ background: '#f8fafc', color: '#ef4444', border: '1px solid #fee2e2', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>cancel</span>
                    Rechazar
                  </button>
                </div>
              )}

              {req.status === 'rejected' && req.rejection_reason && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#b91c1c' }}>
                  <strong>Razón del rechazo:</strong> {req.rejection_reason}
                </div>
              )}
            </div>
          ))}

          {locationRequests.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem' }}>sentiment_satisfied</span>
              <p>No hay solicitudes pendientes de revisión.</p>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal (Simple) */}
      {rejectingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '28rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>Rechazar Solicitud</h3>
            <textarea
              placeholder="Explica el motivo del rechazo (será visible para el usuario)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: '100%', minHeight: '8rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setRejectingId(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleReject} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Confirmar Rechazo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
