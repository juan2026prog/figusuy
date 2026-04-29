import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

const statusColors = { 
  pending: { bg: '#fffbeb', color: '#d97706', icon: 'pending_actions', label: 'Pendiente' }, 
  reviewing: { bg: '#fff7ed', color: '#ea580c', icon: 'preview', label: 'En Revisión' }, 
  resolved: { bg: '#ecfdf5', color: '#10b981', icon: 'check_circle', label: 'Resuelto' }, 
  dismissed: { bg: '#f1f5f9', color: '#64748b', icon: 'cancel', label: 'Descartado' } 
}

export default function AdminReports() {
  const { reports, fetchReports, resolveReport, dismissReport } = useAdminStore()
  const [filter, setFilter] = useState('pending')
  const [resolvingId, setResolvingId] = useState(null)
  const [resolutionNote, setResolutionNote] = useState('')

  useEffect(() => { fetchReports() }, [])

  const filteredReports = reports.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'pending').length

  const handleResolve = (id) => {
    resolveReport(id, resolutionNote || 'Resuelto por moderador', null)
    setResolvingId(null)
    setResolutionNote('')
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>gavel</span>
            Centro de Moderación
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            <span style={{ color: pendingCount > 0 ? '#ea580c' : '#10b981', fontWeight: 700 }}>{pendingCount}</span> reportes pendientes de revisión.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn('#f1f5f9', '#475569')} onClick={fetchReports}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { key: 'pending', label: 'Pendientes', icon: 'error' },
          { key: 'resolved', label: 'Resueltos', icon: 'check_circle' },
          { key: 'dismissed', label: 'Descartados', icon: 'cancel' },
          { key: 'all', label: 'Todos los Reportes', icon: 'list' }
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap',
            background: filter === f.key ? '#ea580c' : '#ffffff', 
            color: filter === f.key ? 'white' : '#64748b', 
            border: filter === f.key ? '1px solid #ea580c' : '1px solid #e2e8f0',
            boxShadow: filter === f.key ? '0 2px 4px rgba(234,88,12,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(24rem, 1fr))', gap: '1rem' }}>
        {filteredReports.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: filter === 'pending' ? '#10b981' : '#94a3b8' }}>
              {filter === 'pending' ? 'task_alt' : 'inbox'}
            </span>
            <p style={{ fontWeight: 600, fontSize: '1.125rem', color: filter === 'pending' ? '#0f172a' : '#64748b' }}>
              {filter === 'pending' ? '¡Todo limpio! No hay reportes pendientes.' : 'No hay reportes en esta categoría.'}
            </p>
          </div>
        )}

        {filteredReports.map(r => {
          const sc = statusColors[r.status] || statusColors.pending
          const isPending = r.status === 'pending'
          
          return (
            <div key={r.id} style={{ ...card, display: 'flex', flexDirection: 'column', borderTop: isPending ? '4px solid #ea580c' : '1px solid #e7e5e4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: '1rem', background: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 800 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{sc.icon}</span>
                    {sc.label}
                  </span>
                  <span style={{ padding: '0.25rem 0.625rem', borderRadius: '1rem', background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {r.type}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              
              <div style={{ marginBottom: '1rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '1.125rem' }}>person</span>
                  <p style={{ fontSize: '0.8125rem', color: '#475569' }}>De: <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.reporter?.name || r.reporter?.email || 'Desconocido'}</span></p>
                </div>
                
                {r.reported && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '1.125rem' }}>warning</span>
                    <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>Contra: <span style={{ fontWeight: 700 }}>{r.reported?.name || r.reported?.email}</span></p>
                  </div>
                )}
                
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.875rem', borderRadius: '0.5rem', position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', top: '-0.5rem', left: '0.75rem', color: '#cbd5e1', fontSize: '1.25rem', background: '#f8fafc' }}>format_quote</span>
                  <p style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.5 }}>
                    {r.reason}
                  </p>
                </div>
                
                {r.resolution_notes && !isPending && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem', borderLeft: '3px solid #10b981', background: '#ecfdf5' }}>
                    <p style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700 }}>Nota de resolución:</p>
                    <p style={{ fontSize: '0.75rem', color: '#047857' }}>{r.resolution_notes}</p>
                  </div>
                )}
              </div>
              
              {isPending && (
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  {resolvingId === r.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }} 
                        placeholder="Nota de resolución (opcional)..." 
                        value={resolutionNote} 
                        onChange={e => setResolutionNote(e.target.value)} 
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleResolve(r.id)} style={{ ...btn('#10b981', 'white'), flex: 1, justifyContent: 'center' }}>Confirmar</button>
                        <button onClick={() => setResolvingId(null)} style={{ ...btn('#f1f5f9', '#475569'), flex: 1, justifyContent: 'center' }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setResolvingId(r.id)} style={{ ...btn('#ecfdf5', '#10b981'), flex: 1, justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>check</span> Resolver
                      </button>
                      <button onClick={() => dismissReport(r.id)} style={{ ...btn('#fef2f2', '#ef4444'), flex: 1, justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>close</span> Descartar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
