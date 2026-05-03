import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const badge = (color, bg) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, color, background: bg, textTransform: 'uppercase' })

export default function AdminLocationRequests() {
  const { locationRequests, fetchLocationRequests, approveLocationRequest, rejectLocationRequest, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    fetchLocationRequests()
  }, [])

  const handleApprove = async (id) => {
    if (window.confirm('¿Aprobar esta solicitud? El local se creará automáticamente.')) {
      setApprovingId(id)
      const error = await approveLocationRequest(id, user.id)
      setApprovingId(null)
      if (error) {
        alert('Error al aprobar: ' + (error.message || 'Error desconocido'))
      }
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
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>how_to_reg</span>
          Solicitudes de Locales
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem' }}>
          Gestiona las postulaciones de nuevos puntos de intercambio y tiendas.
        </p>
      </div>

      {loading && locationRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: "var(--admin-muted)" }}>Cargando solicitudes...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {locationRequests.map(req => (
            <div key={req.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: "var(--admin-panel2)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>store</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: "#f5f5f5", margin: 0 }}>{req.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: "var(--admin-muted2)", margin: '0.25rem 0' }}>
                      Solicitado por: <strong>{req.applicant_name || req.profile?.name}</strong> 
                      {req.position && <span style={{ marginLeft: '0.5rem', color: "var(--admin-muted)" }}>({req.position})</span>}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", margin: 0 }}>
                      Email: <a href={`mailto:${req.applicant_email || req.profile?.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{req.applicant_email || req.profile?.email}</a>
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8125rem', color: "var(--admin-muted)" }}>
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
                  
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', background: "rgba(249, 115, 22, 0.1)", padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    Plan: {req.business_plan?.toUpperCase() || 'GRATIS'}
                  </div>
                </div>
              </div>

              {req.status === 'pending' && (
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={approvingId === req.id}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: approvingId === req.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: approvingId === req.id ? 0.7 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{approvingId === req.id ? 'sync' : 'check_circle'}</span>
                    {approvingId === req.id ? 'Aprobando...' : 'Aprobar Solicitud'}
                  </button>
                  <button
                    onClick={() => setRejectingId(req.id)}
                    style={{ background: "var(--admin-panel2)", color: '#ef4444', border: '1px solid #fee2e2', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>cancel</span>
                    Rechazar
                  </button>
                </div>
              )}

              {req.status === 'rejected' && req.rejection_reason && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: "rgba(239, 68, 68, 0.1)", borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#b91c1c' }}>
                  <strong>Razón del rechazo:</strong> {req.rejection_reason}
                </div>
              )}
            </div>
          ))}

          {locationRequests.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '4rem', color: "var(--admin-muted)" }}>
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
              style={{ width: '100%', minHeight: '8rem', padding: '0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", marginBottom: '1.5rem', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setRejectingId(null)} style={{ background: 'none', border: 'none', color: "var(--admin-muted2)", fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleReject} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Confirmar Rechazo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
