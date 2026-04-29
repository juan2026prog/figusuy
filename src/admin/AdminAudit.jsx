import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

const actionDetails = {
  create: { icon: 'add_circle', color: '#10b981', label: 'Creación' },
  update: { icon: 'edit', color: '#f59e0b', label: 'Actualización' },
  delete: { icon: 'delete', color: '#ef4444', label: 'Eliminación' },
  block: { icon: 'block', color: '#dc2626', label: 'Bloqueo' },
  unblock: { icon: 'how_to_reg', color: '#16a34a', label: 'Desbloqueo' },
  login: { icon: 'login', color: '#3b82f6', label: 'Inicio de sesión' },
  resolve: { icon: 'check_circle', color: '#10b981', label: 'Resolución' },
  BLOCK_USER: { icon: 'block', color: '#dc2626', label: 'Bloqueo' },
  UNBLOCK_USER: { icon: 'how_to_reg', color: '#16a34a', label: 'Desbloqueo' },
  UPDATE_PAYMENT: { icon: 'payments', color: '#f59e0b', label: 'Pago Editado' },
  REVIEW_PAYMENT: { icon: 'verified', color: '#10b981', label: 'Pago Revisado' },
  UPDATE_SUBSCRIPTION: { icon: 'card_membership', color: '#3b82f6', label: 'Suscripción' },
  UPDATE_ALGORITHM: { icon: 'psychology', color: '#8b5cf6', label: 'Algoritmo' },
  SEND_CAMPAIGN: { icon: 'campaign', color: '#ea580c', label: 'Campaña' },
  VIEW_REPORTED_CHAT: { icon: 'visibility', color: '#64748b', label: 'Chat Visto' },
  CLOSE_CHAT_REPORT: { icon: 'check_circle', color: '#10b981', label: 'Chat Cerrado' },
  ESCALATE_CHAT_REPORT: { icon: 'priority_high', color: '#ef4444', label: 'Chat Escalado' },
}

export default function AdminAudit() {
  const { auditLog, fetchAuditLog } = useAdminStore()
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntity, setFilterEntity] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchAuditLog() }, [])

  const filteredLogs = auditLog.filter(l => {
    if (filterAction !== 'all' && l.action !== filterAction) return false
    if (filterEntity && !l.entity_type?.toLowerCase().includes(filterEntity.toLowerCase())) return false
    if (searchTerm && !(l.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || l.action?.toLowerCase().includes(searchTerm.toLowerCase()))) return false
    if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(l.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const uniqueActions = [...new Set(auditLog.map(l => l.action))]

  const exportCSV = () => {
    const headers = ['Fecha', 'Actor', 'Acción', 'Entidad', 'ID Entidad', 'Detalles']
    const rows = filteredLogs.map(l => [
      new Date(l.created_at).toISOString(),
      l.user?.name || l.user?.email || 'Sistema',
      l.action,
      l.entity_type,
      l.entity_id || '',
      JSON.stringify(l.details || {})
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>assignment</span>
            Centro de Auditoría
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Trazabilidad completa — {filteredLogs.length} de {auditLog.length} registros.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportCSV} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span> CSV
          </button>
          <button onClick={fetchAuditLog} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span> Recargar
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div style={{ ...card, marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Buscar Actor</label>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nombre o email..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
        </div>
        <div style={{ minWidth: '8rem' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Acción</label>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
            <option value="all">Todas</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '8rem' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Entidad</label>
          <input type="text" value={filterEntity} onChange={e => setFilterEntity(e.target.value)} placeholder="user, report..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
        </div>
        <div style={{ minWidth: '8rem' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
        </div>
        <div style={{ minWidth: '8rem' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
        </div>
      </div>

      {/* Log List */}
      <div style={card}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>history_toggle_off</span>
            <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>No hay registros con estos filtros.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLogs.map((log, index) => {
              const actionMeta = actionDetails[log.action] || { icon: 'info', color: '#64748b', label: log.action }
              const isExpanded = expandedId === log.id

              return (
                <div key={log.id} onClick={() => setExpandedId(isExpanded ? null : log.id)} style={{
                  display: 'flex', gap: '1rem', padding: '1rem', cursor: 'pointer',
                  borderBottom: index === filteredLogs.length - 1 ? 'none' : '1px solid #f1f5f9',
                  alignItems: 'flex-start', background: isExpanded ? '#f8fafc' : 'transparent', transition: 'background 0.15s',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'flex-start' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', flexShrink: 0, background: `${actionMeta.color}15`, color: actionMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{actionMeta.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#0f172a', margin: 0 }}>
                          <strong style={{ fontWeight: 800 }}>{log.user?.name || log.user?.email || 'Sistema'}</strong>
                          <span style={{ color: '#64748b', fontWeight: 500 }}> ejecutó </span>
                          <strong style={{ color: actionMeta.color, fontWeight: 700 }}>{actionMeta.label}</strong>
                          <span style={{ color: '#64748b', fontWeight: 500 }}> en </span>
                          <span style={{ color: '#ea580c', fontWeight: 700, textTransform: 'capitalize' }}>{log.entity_type}</span>
                          {log.entity_id && (
                            <span style={{ fontSize: '0.6875rem', background: '#f1f5f9', color: '#475569', padding: '0.125rem 0.375rem', borderRadius: '0.375rem', marginLeft: '0.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                              {log.entity_id.split('-')[0]}
                            </span>
                          )}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
                          {new Date(log.created_at).toLocaleString('es-UY', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && log.details && Object.keys(log.details).length > 0 && (
                    <div style={{ marginTop: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem', overflowX: 'auto', width: '100%' }}>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Detalle JSON</p>
                      <pre style={{ margin: 0, fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
