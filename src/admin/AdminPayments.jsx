import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const badge = (bg, color) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', background: bg, color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' })

export default function AdminPayments() {
  const { payments, fetchPayments, reviewPayment, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('all')
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => { fetchPayments() }, [])

  const filtered = payments.filter(p => filter === 'all' || p.status === filter)

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0)
  const revenue30d = payments.filter(p => p.status === 'completed' && new Date(p.created_at) >= new Date(Date.now() - 30 * 86400000)).reduce((sum, p) => sum + Number(p.amount), 0)
  const failedCount = payments.filter(p => p.status === 'failed').length
  const pendingCount = payments.filter(p => p.status === 'pending').length

  const handleReview = () => {
    if (reviewNote.trim()) {
      reviewPayment(reviewingId, reviewNote, user.id)
      setReviewingId(null)
      setReviewNote('')
    }
  }

  const statusColors = { completed: { bg: '#ecfdf5', color: '#10b981' }, pending: { bg: '#fff7ed', color: '#f59e0b' }, failed: { bg: '#fef2f2', color: '#ef4444' }, refunded: { bg: '#eff6ff', color: '#3b82f6' }, cancelled: { bg: "var(--admin-panel2)", color: "var(--admin-muted2)" } }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>payments</span>
          Pagos y Transacciones
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem' }}>
          Monitoreo real de transacciones, planes y conciliación de pagos.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ ...card, borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Ingresos Totales</p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5", margin: '0.25rem 0' }}>${totalRevenue.toLocaleString()}</p>
          <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>UYU</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Ingresos (30 días)</p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5", margin: '0.25rem 0' }}>${revenue30d.toLocaleString()}</p>
          <p style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>UYU</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Pendientes</p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5", margin: '0.25rem 0' }}>{pendingCount}</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Fallidos</p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5", margin: '0.25rem 0' }}>{failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'completed', 'pending', 'failed', 'refunded'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            background: filter === s ? 'var(--color-primary)' : '#fff', color: filter === s ? 'white' : "var(--admin-muted2)",
            border: filter === s ? '1px solid var(--color-primary)' : '1px solid #e2e8f0'
          }}>{s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {/* Table */}
      <div style={card}>
        {loading && payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>Cargando pagos...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>No hay pagos en esta categoría.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '0.75rem' }}>Cliente</th>
                <th style={{ padding: '0.75rem' }}>Plan</th>
                <th style={{ padding: '0.75rem' }}>Monto</th>
                <th style={{ padding: '0.75rem' }}>Estado</th>
                <th style={{ padding: '0.75rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem' }}>Revisado</th>
                <th style={{ padding: '0.75rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sc = statusColors[p.status] || statusColors.cancelled
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{p.user?.name || '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", margin: 0 }}>{p.user?.email}</p>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.plan_name}</span>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: "var(--admin-muted)" }}>{p.plan_type === 'user_premium' ? 'Usuario' : 'Negocio'}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>${Number(p.amount).toLocaleString()} <span style={{ fontSize: '0.625rem', color: "var(--admin-muted)" }}>{p.currency}</span></td>
                    <td style={{ padding: '0.75rem' }}><span style={badge(sc.bg, sc.color)}>{p.status}</span></td>
                    <td style={{ padding: '0.75rem', color: "var(--admin-muted2)", fontSize: '0.8125rem' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {p.reviewed_by ? (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✓ {p.reviewer?.name}</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: "var(--admin-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button onClick={() => { setReviewingId(p.id); setReviewNote(p.admin_notes || '') }} style={{
                        padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: "var(--admin-panel2)", color: "var(--admin-muted)", border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                      }}>
                        {p.admin_notes ? 'Ver Nota' : 'Revisar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {reviewingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '28rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>Revisar Pago</h3>
            <textarea placeholder="Nota interna del admin..." value={reviewNote} onChange={e => setReviewNote(e.target.value)}
              style={{ width: '100%', minHeight: '6rem', padding: '0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontFamily: 'inherit', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setReviewingId(null)} style={{ background: 'none', border: 'none', color: "var(--admin-muted2)", fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleReview} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Marcar Revisado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
