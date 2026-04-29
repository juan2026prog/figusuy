import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminLogs() {
  const { auditLog, fetchAuditLog, loading } = useAdminStore()

  useEffect(() => {
    fetchAuditLog()
  }, [])

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>terminal</span>
          Logs de Auditoría
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Registro detallado de todas las acciones administrativas realizadas en la plataforma.
        </p>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Actividad Reciente</h2>
          <button 
            onClick={fetchAuditLog} 
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>refresh</span>
            Actualizar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {auditLog.map(log => (
            <div key={log.id} style={{ padding: '1rem', background: '#fafafa', borderRadius: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: log.action.includes('DELETE') ? '#ef4444' : log.action.includes('UPDATE') ? '#3b82f6' : '#10b981'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                  {log.action.includes('DELETE') ? 'delete' : log.action.includes('UPDATE') ? 'edit' : 'add_circle'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>{log.action}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  Admin: <strong>{log.admin?.name || 'Sistema'}</strong> • Entidad: {log.entity_type} ({log.entity_id})
                </p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#94a3b8', background: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #f1f5f9', overflowX: 'auto' }}>
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          {auditLog.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Sin actividad registrada.</div>
          )}
        </div>
      </div>
    </div>
  )
}
