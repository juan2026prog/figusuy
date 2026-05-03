import React, { useEffect, useState } from 'react'
import { useAffiliateStore } from '../stores/affiliateStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.875rem', fontWeight: 500, outline: 'none', background: "var(--admin-panel2)" }
const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const statusColors = {
  pendiente: { bg: '#fef3c7', color: '#d97706', icon: 'schedule' },
  aprobado: { bg: '#dbeafe', color: '#2563eb', icon: 'check_circle' },
  pagado: { bg: '#dcfce7', color: '#16a34a', icon: 'paid' },
  retenido: { bg: '#fee2e2', color: '#dc2626', icon: 'block' },
}

export default function AdminAffiliatePayments() {
  const { payments, affiliates, fetchPayments, fetchAffiliates, createPayment, updatePayment, loading } = useAffiliateStore()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    affiliate_id: '', period_start: '', period_end: '',
    total_conversions: '0', total_revenue: '0', commission_total: '0',
    status: 'pendiente', payment_method: '', payment_reference: '', notes: ''
  })

  useEffect(() => { fetchPayments(); fetchAffiliates() }, [])

  const openCreate = () => {
    setForm({
      affiliate_id: '', period_start: '', period_end: '',
      total_conversions: '0', total_revenue: '0', commission_total: '0',
      status: 'pendiente', payment_method: '', payment_reference: '', notes: ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.affiliate_id || !form.period_start || !form.period_end) return
    await createPayment({
      ...form,
      total_conversions: parseInt(form.total_conversions) || 0,
      total_revenue: parseFloat(form.total_revenue) || 0,
      commission_total: parseFloat(form.commission_total) || 0,
    })
    setShowModal(false)
  }

  const handleStatusChange = async (id, newStatus) => {
    const extra = {}
    if (newStatus === 'aprobado') extra.approved_at = new Date().toISOString()
    if (newStatus === 'pagado') extra.paid_at = new Date().toISOString()
    await updatePayment(id, { status: newStatus, ...extra })
  }

  const filtered = payments.filter(p => filter === 'all' || p.status === filter)

  // Aggregations
  const totals = {
    pendiente: payments.filter(p => p.status === 'pendiente').reduce((s, p) => s + Number(p.commission_total), 0),
    aprobado: payments.filter(p => p.status === 'aprobado').reduce((s, p) => s + Number(p.commission_total), 0),
    pagado: payments.filter(p => p.status === 'pagado').reduce((s, p) => s + Number(p.commission_total), 0),
    retenido: payments.filter(p => p.status === 'retenido').reduce((s, p) => s + Number(p.commission_total), 0),
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Pagos a Afiliados</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Backoffice financiero: aprobar, retener, pagar y exportar liquidaciones.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={openCreate} style={btn('var(--color-primary)', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            Nuevo Pago
          </button>
          <button onClick={() => {
            // Export CSV
            const csv = ['Influencer,Período,Conversiones,Revenue,Comisión,Estado']
            filtered.forEach(p => {
              csv.push(`${p.affiliates?.name || '—'},${p.period_start} - ${p.period_end},${p.total_conversions},${p.total_revenue},${p.commission_total},${p.status}`)
            })
            const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pagos_afiliados_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
          }} style={btn("var(--admin-panel2)", "var(--admin-muted)")}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>download</span>
            Exportar
          </button></div>
      </div>
      </section>

      {/* Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.entries(statusColors).map(([key, st]) => (
          <div key={key} style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: `4px solid ${st.color}` }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: st.color }}>{st.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 900, color: "#f5f5f5" }}>${totals[key].toFixed(0)}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>{key}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'Todos' }, ...Object.keys(statusColors).map(s => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.4rem 0.875rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            background: filter === f.key ? 'var(--color-primary)' : '#fff',
            color: filter === f.key ? 'white' : "var(--admin-muted)",
            border: filter === f.key ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
            transition: 'all 0.2s'
          }}>{f.label}</button>
        ))}
      </div>

      {/* Payments Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: "var(--admin-panel2)", borderBottom: '1px solid #e2e8f0' }}>
                {['Influencer', 'Período', 'Conversiones', 'Revenue', 'Comisión', 'Estado', 'Método', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: "var(--admin-muted)", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const aff = p.affiliates || {}
                const st = statusColors[p.status] || statusColors.pendiente
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--admin-panel2)"}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ fontWeight: 700, color: "#f5f5f5", margin: 0 }}>{aff.name || '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>@{aff.handle || '...'}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: "var(--admin-muted)" }}>
                      {p.period_start} → {p.period_end}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: "#f5f5f5" }}>
                      {p.total_conversions}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#16a34a' }}>
                      ${Number(p.total_revenue).toFixed(0)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#ea580c' }}>
                      ${Number(p.commission_total).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.625rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: 700,
                        background: st.bg, color: st.color, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{st.icon}</span>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: "var(--admin-muted)" }}>
                      {p.payment_method || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {p.status === 'pendiente' && (
                          <>
                            <button onClick={() => handleStatusChange(p.id, 'aprobado')} style={{ ...btn('#dbeafe', '#2563eb'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>check</span> Aprobar
                            </button>
                            <button onClick={() => handleStatusChange(p.id, 'retenido')} style={{ ...btn('#fee2e2', '#dc2626'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>block</span> Retener
                            </button>
                          </>
                        )}
                        {p.status === 'aprobado' && (
                          <button onClick={() => handleStatusChange(p.id, 'pagado')} style={{ ...btn('#dcfce7', '#16a34a'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>paid</span> Marcar Pagado
                          </button>
                        )}
                        {p.status === 'retenido' && (
                          <button onClick={() => handleStatusChange(p.id, 'pendiente')} style={{ ...btn('#fef3c7', '#d97706'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>undo</span> Liberar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: "var(--admin-muted)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.3, display: 'block', marginBottom: '0.5rem' }}>account_balance_wallet</span>
                  No hay pagos {filter !== 'all' ? `con estado "${filter}"` : ''}.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>Nuevo Pago</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: "var(--admin-muted)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Afiliado *</label>
                <select style={inputStyle} value={form.affiliate_id} onChange={e => setForm({ ...form, affiliate_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {affiliates.filter(a => a.status === 'activo').map(a => (
                    <option key={a.id} value={a.id}>{a.name} (@{a.handle})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Período inicio *</label>
                  <input type="date" style={inputStyle} value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Período fin *</label>
                  <input type="date" style={inputStyle} value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Conversiones</label>
                  <input type="number" style={inputStyle} value={form.total_conversions} onChange={e => setForm({ ...form, total_conversions: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Revenue ($)</label>
                  <input type="number" style={inputStyle} value={form.total_revenue} onChange={e => setForm({ ...form, total_revenue: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Comisión ($)</label>
                  <input type="number" style={inputStyle} value={form.commission_total} onChange={e => setForm({ ...form, commission_total: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Método de pago</label>
                  <input style={inputStyle} value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} placeholder="Transferencia, MercadoPago, etc." />
                </div>
                <div>
                  <label style={labelStyle}>Referencia</label>
                  <input style={inputStyle} value={form.payment_reference} onChange={e => setForm({ ...form, payment_reference: e.target.value })} placeholder="Nro. transferencia, etc." />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea style={{ ...inputStyle, minHeight: '3rem', resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={btn("var(--admin-panel2)", "var(--admin-muted)")}>Cancelar</button>
              <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>add</span>
                Crear Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
