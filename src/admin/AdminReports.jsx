import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }
const statusColors = { pending: { bg: '#fef3c7', color: '#d97706' }, reviewing: { bg: '#dbeafe', color: '#2563eb' }, resolved: { bg: '#dcfce7', color: '#16a34a' }, dismissed: { bg: '#f1f5f9', color: '#64748b' } }

export default function AdminReports() {
  const { reports, fetchReports, resolveReport, dismissReport } = useAdminStore()
  useEffect(() => { fetchReports() }, [])

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>🚨 Reportes</h1>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>{reports.filter(r => r.status === 'pending').length} reportes pendientes</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reports.length === 0 && <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No hay reportes</div>}
        {reports.map(r => {
          const sc = statusColors[r.status] || statusColors.pending
          return (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', background: sc.bg, color: sc.color, fontSize: '0.6875rem', fontWeight: 700 }}>{r.status.toUpperCase()}</span>
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', background: '#eff6ff', color: '#3b82f6', fontSize: '0.6875rem', fontWeight: 600 }}>{r.type}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Reportado por: {r.reporter?.name || r.reporter?.email || 'Desconocido'}</p>
                  {r.reported && <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>→ Contra: {r.reported?.name || r.reported?.email}</p>}
                </div>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#475569', background: '#f8fafc', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '0.75rem' }}>
                "{r.reason}"
              </p>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => resolveReport(r.id, 'Resuelto por admin', null)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>✅ Resolver</button>
                  <button onClick={() => dismissReport(r.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#f1f5f9', color: '#64748b', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>❌ Descartar</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
