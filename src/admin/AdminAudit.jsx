import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }

export default function AdminAudit() {
  const { auditLog, fetchAuditLog } = useAdminStore()
  useEffect(() => { fetchAuditLog() }, [])

  const actionColors = {
    create: '#10b981', update: '#f59e0b', delete: '#ef4444',
    block: '#dc2626', unblock: '#16a34a', login: '#3b82f6',
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>📋 Auditoría</h1>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Registro de todas las acciones administrativas</p>

      <div style={card}>
        {auditLog.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay registros aún</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {auditLog.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                <div style={{
                  width: '0.5rem', height: '0.5rem', borderRadius: '50%', marginTop: '0.375rem', flexShrink: 0,
                  background: actionColors[log.action] || '#94a3b8',
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8125rem' }}>
                    <strong>{log.user?.name || 'Sistema'}</strong>
                    <span style={{ color: '#64748b' }}> — {log.action}</span>
                    <span style={{ color: '#3b82f6' }}> {log.entity_type}</span>
                    {log.entity_id && <code style={{ fontSize: '0.625rem', background: '#f1f5f9', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', marginLeft: '0.25rem' }}>{log.entity_id.slice(0, 8)}</code>}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace' }}>{JSON.stringify(log.details)}</p>
                  )}
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', flexShrink: 0 }}>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
