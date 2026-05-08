import React, { useEffect, useMemo, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: 'var(--admin-panel)', border: '1px solid var(--admin-line)', padding: '1.25rem' }

const statusColors = {
  pending: '#94a3b8',
  pending_confirmation: '#f59e0b',
  completed: '#22c55e',
  not_completed: '#ef4444',
  disputed: '#fb7185',
  expired: '#64748b',
}

export default function AdminExchangeCompletion() {
  const { profile } = useAuthStore()
  const {
    exchangeCompletions,
    exchangeCompletionMetrics,
    loading,
    fetchExchangeCompletions,
    updateExchangeReviewStatus,
  } = useAdminStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewFilter, setReviewFilter] = useState('all')

  useEffect(() => {
    fetchExchangeCompletions()
  }, [])

  const rows = useMemo(() => {
    return (exchangeCompletions || []).filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (reviewFilter !== 'all' && row.admin_review_status !== reviewFilter) return false
      return true
    })
  }, [exchangeCompletions, statusFilter, reviewFilter])

  const metrics = exchangeCompletionMetrics || {}

  return (
    <div className="admin-generic-page">
      <section className="ag-hero">
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">// exchange completion</div>
            <h1 className="ag-title">Cierres reales del intercambio</h1>
            <p className="ag-desc" style={{ marginTop: '.6rem', maxWidth: '62rem' }}>
              Audita confirmaciones duales, disputas, expirados y patrones sospechosos. Este modulo define que cuenta como liquidez real.
            </p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">verified</span>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '1px', background: 'var(--admin-line)', border: '1px solid var(--admin-line)' }}>
        {[
          { label: 'Total', value: metrics.total || 0 },
          { label: 'Completados', value: metrics.completed || 0, color: '#22c55e' },
          { label: 'Pend. confirm.', value: metrics.pending_confirmation || 0, color: '#f59e0b' },
          { label: 'Disputados', value: metrics.disputed || 0, color: '#fb7185' },
          { label: 'Sospechosos', value: metrics.suspicious || 0, color: '#ef4444' },
          { label: 'Completion rate', value: `${Math.round(metrics.completion_rate || 0)}%`, color: '#38bdf8' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'var(--admin-panel)', padding: '1rem' }}>
            <div style={{ font: "900 .68rem 'Barlow Condensed'", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--admin-muted2)' }}>{item.label}</div>
            <div style={{ marginTop: '.45rem', font: "italic 900 2rem 'Barlow Condensed'", color: item.color || '#f5f5f5' }}>{item.value}</div>
          </div>
        ))}
      </section>

      <section style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos los estados</option>
              <option value="pending_confirmation">Pending confirmation</option>
              <option value="completed">Completed</option>
              <option value="not_completed">Not completed</option>
              <option value="disputed">Disputed</option>
              <option value="expired">Expired</option>
            </select>
            <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
              <option value="all">Todo review</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <button className="admin-action-btn" onClick={fetchExchangeCompletions}>Actualizar</button>
        </div>
      </section>

      <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading && !exchangeCompletions.length ? (
          <div style={{ padding: '2rem', color: 'var(--admin-muted)' }}>Cargando exchange completions...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '2rem', color: 'var(--admin-muted)' }}>No hay registros para este filtro.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Usuarios</th>
                  <th>Album</th>
                  <th>Respuestas</th>
                  <th>Señal</th>
                  <th>Fraude</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span style={{ color: statusColors[row.status] || '#f5f5f5', fontWeight: 800, textTransform: 'uppercase', fontSize: '.72rem' }}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: '#f5f5f5', fontWeight: 700 }}>{row.user_1_name || 'Sin nombre'} / {row.user_2_name || 'Sin nombre'}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--admin-muted2)' }}>{row.user_1_email || 'â€”'} Â· {row.user_2_email || 'â€”'}</div>
                    </td>
                    <td>
                      <div style={{ color: '#f5f5f5', fontWeight: 700 }}>{row.album_name || 'Sin album'}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--admin-muted2)' }}>{row.completion_time ? new Date(row.completion_time).toLocaleString('es-UY') : 'Sin cierre'}</div>
                    </td>
                    <td>
                      <div style={{ color: '#f5f5f5', fontWeight: 700 }}>{row.user_1_response || 'â€”'} / {row.user_2_response || 'â€”'}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--admin-muted2)' }}>{row.message_count || 0} msgs</div>
                    </td>
                    <td>
                      <div style={{ color: '#f5f5f5', fontWeight: 700 }}>{Math.round(row.trigger_score || 0)}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--admin-muted2)' }}>{row.prompt_reason || 'manual'}</div>
                    </td>
                    <td>
                      <div style={{ color: row.is_suspicious ? '#ef4444' : '#22c55e', fontWeight: 800 }}>
                        {row.is_suspicious ? 'Revisar' : 'Normal'}
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--admin-muted2)' }}>
                        {Array.isArray(row.suspicion_reasons) && row.suspicion_reasons.length ? row.suspicion_reasons.join(', ') : 'Sin flags'}
                      </div>
                    </td>
                    <td>
                      <select
                        value={row.admin_review_status || 'open'}
                        onChange={(e) => updateExchangeReviewStatus(row.id, e.target.value, profile?.id)}
                      >
                        <option value="open">Open</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
