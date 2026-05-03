import React, { useEffect, useState } from 'react'
import { useAffiliateStore } from '../stores/affiliateStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.875rem', fontWeight: 500, outline: 'none', background: "var(--admin-panel2)" }
const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const COMMISSION_TYPES = [
  { value: 'percent', label: 'Porcentaje', icon: 'percent' },
  { value: 'fixed', label: 'Monto fijo', icon: 'paid' },
  { value: 'hybrid', label: 'Híbrido', icon: 'tune' },
  { value: 'reward_only', label: 'Solo reward', icon: 'redeem' },
]

const DEFAULT_TIERS = [
  { min: 0, max: 9, rate: 5 },
  { min: 10, max: 24, rate: 6 },
  { min: 25, max: null, rate: 7 },
]

export default function AdminAffiliateCommissions() {
  const { commissions, campaigns, fetchCommissions, fetchCampaigns, createCommission, updateCommission, loading } = useAffiliateStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    campaign_id: '', commission_type: 'percent', commission_value: '5',
    tiered_commission: JSON.stringify(DEFAULT_TIERS, null, 2),
    max_commission_rate: '8', is_active: true
  })

  useEffect(() => { fetchCommissions(); fetchCampaigns() }, [])

  const resetForm = () => {
    setForm({
      campaign_id: '', commission_type: 'percent', commission_value: '5',
      tiered_commission: JSON.stringify(DEFAULT_TIERS, null, 2),
      max_commission_rate: '8', is_active: true
    })
    setEditing(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (c) => {
    setForm({
      campaign_id: c.campaign_id,
      commission_type: c.commission_type,
      commission_value: c.commission_value,
      tiered_commission: JSON.stringify(c.tiered_commission || DEFAULT_TIERS, null, 2),
      max_commission_rate: c.max_commission_rate || '8',
      is_active: c.is_active
    })
    setEditing(c.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.campaign_id) return
    let tiers = DEFAULT_TIERS
    try { tiers = JSON.parse(form.tiered_commission) } catch (e) {}
    
    const payload = {
      campaign_id: form.campaign_id,
      commission_type: form.commission_type,
      commission_value: parseFloat(form.commission_value) || 5,
      tiered_commission: tiers,
      max_commission_rate: parseFloat(form.max_commission_rate) || 8,
      is_active: form.is_active
    }
    if (editing) {
      await updateCommission(editing, payload)
    } else {
      await createCommission(payload)
    }
    setShowModal(false)
    resetForm()
  }

  // Calculate totals
  const totalPending = commissions.reduce((sum, c) => {
    const camp = c.affiliate_campaigns || {}
    const rev = Number(camp.total_revenue || 0)
    const rate = Number(c.commission_value || 5) / 100
    return sum + (rev * rate)
  }, 0)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Comisiones</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Estructura de comisiones por campaña: base 5%, escalable a 7%, máx 8%.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button onClick={openCreate} style={btn('var(--color-primary)', 'white')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
          Nueva Comisión
        </button></div>
      </section>

      {/* Tiered commission explainer */}
      <div style={{ ...card, background: "rgba(59, 130, 246, 0.1)", borderColor: '#bfdbfe', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '1.5rem' }}>trending_up</span>
          <p style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.9375rem', margin: 0 }}>Estructura de comisión escalable por defecto</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {DEFAULT_TIERS.map((t, i) => (
            <div key={i} style={{ background: "var(--admin-panel2)", padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid #dbeafe', flex: 1, minWidth: '8rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb', margin: 0 }}>{t.rate}%</p>
              <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", fontWeight: 600, margin: 0 }}>
                {t.min}–{t.max !== null ? t.max : '∞'} conv.
              </p>
            </div>
          ))}
          <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid #fecaca', flex: 1, minWidth: '8rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>8%</p>
            <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", fontWeight: 600, margin: 0 }}>Máx manual</p>
          </div>
        </div>
      </div>

      {/* Commission Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: "var(--admin-panel2)", borderBottom: '1px solid #e2e8f0' }}>
                {['Influencer', 'Campaña', 'Tipo', 'Base %', 'Tiers', 'Revenue', 'Comisión Est.', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: "var(--admin-muted)", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => {
                const camp = c.affiliate_campaigns || {}
                const aff = camp.affiliates || {}
                const rev = Number(camp.total_revenue || 0)
                const conv = Number(camp.total_conversions || 0)
                const tiers = c.tiered_commission || DEFAULT_TIERS
                // Determine effective rate from tiers
                let effectiveRate = Number(c.commission_value || 5)
                for (const tier of tiers) {
                  if (conv >= tier.min && (tier.max === null || conv <= tier.max)) {
                    effectiveRate = tier.rate
                    break
                  }
                }
                const estCommission = rev * (effectiveRate / 100)
                const typeInfo = COMMISSION_TYPES.find(t => t.value === c.commission_type) || COMMISSION_TYPES[0]

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--admin-panel2)"}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <p style={{ fontWeight: 700, color: "#f5f5f5", margin: 0 }}>{aff.name || '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>@{aff.handle || '...'}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: '#ea580c', fontFamily: 'monospace' }}>{camp.code || '—'}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: "var(--admin-muted)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{typeInfo.icon}</span>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#2563eb' }}>
                      {c.commission_value}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {tiers.map((t, i) => (
                          <span key={i} style={{
                            padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.625rem', fontWeight: 700,
                            background: conv >= t.min && (t.max === null || conv <= t.max) ? '#dbeafe' : "var(--admin-panel2)",
                            color: conv >= t.min && (t.max === null || conv <= t.max) ? '#2563eb' : '#94a3b8'
                          }}>{t.rate}%</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#16a34a' }}>
                      ${rev.toFixed(0)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#ea580c' }}>
                      ${estCommission.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.625rem', fontWeight: 700,
                        background: c.is_active ? '#dcfce7' : "var(--admin-panel2)",
                        color: c.is_active ? '#16a34a' : "var(--admin-muted)"
                      }}>{c.is_active ? 'ACTIVO' : 'INACTIVO'}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => openEdit(c)} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                        </button>
                        <button onClick={async () => { await updateCommission(c.id, { is_active: !c.is_active }) }} style={{ ...btn(c.is_active ? '#fef3c7' : '#dcfce7', c.is_active ? '#d97706' : '#16a34a'), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{c.is_active ? 'toggle_off' : 'toggle_on'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {commissions.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: "var(--admin-muted)" }}>
                  No hay comisiones configuradas.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '36rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>
                {editing ? 'Editar Comisión' : 'Nueva Comisión'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: "var(--admin-muted)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Campaña *</label>
                <select style={inputStyle} value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })}>
                  <option value="">Seleccionar campaña...</option>
                  {campaigns.filter(c => c.status !== 'cerrada').map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.affiliates?.name || 'Afiliado'}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select style={inputStyle} value={form.commission_type} onChange={e => setForm({ ...form, commission_type: e.target.value })}>
                    {COMMISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Comisión base (%)</label>
                  <input type="number" step="0.5" style={inputStyle} value={form.commission_value} onChange={e => setForm({ ...form, commission_value: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Máximo comisión (%)</label>
                <input type="number" step="0.5" style={inputStyle} value={form.max_commission_rate} onChange={e => setForm({ ...form, max_commission_rate: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Tiers de comisión (JSON)</label>
                <textarea style={{ ...inputStyle, fontFamily: 'monospace', minHeight: '6rem', fontSize: '0.75rem', resize: 'vertical' }} value={form.tiered_commission} onChange={e => setForm({ ...form, tiered_commission: e.target.value })} />
                <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", marginTop: '0.25rem' }}>{'Formato: [{"min":0,"max":9,"rate":5}, ...]'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: "var(--admin-muted)" }}>Comisión activa</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={btn("var(--admin-panel2)", "var(--admin-muted)")}>Cancelar</button>
              <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{editing ? 'save' : 'add'}</span>
                {editing ? 'Guardar' : 'Crear Comisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
