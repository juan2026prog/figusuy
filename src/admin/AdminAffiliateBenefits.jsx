import React, { useEffect, useState } from 'react'
import { useAffiliateStore } from '../stores/affiliateStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.875rem', fontWeight: 500, outline: 'none', background: "var(--admin-panel2)" }
const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const BENEFIT_TYPES = [
  { value: 'extra_days', label: 'Días extra gratis', icon: 'calendar_add_on', unit: 'días' },
  { value: 'percent_off', label: 'Descuento %', icon: 'percent', unit: '%' },
  { value: 'extra_months', label: 'Meses extra', icon: 'date_range', unit: 'meses' },
  { value: 'fixed_off', label: 'Descuento fijo', icon: 'money_off', unit: '$' },
]

export default function AdminAffiliateBenefits() {
  const { benefits, campaigns, fetchBenefits, fetchCampaigns, createBenefit, updateBenefit, loading } = useAffiliateStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    campaign_id: '', benefit_type: 'extra_days', benefit_value: '7',
    benefit_label: 'Pagá 1 mes y llevate 7 días extra gratis',
    applicable_plans: '', min_purchase_required: '0', is_active: true
  })

  useEffect(() => { fetchBenefits(); fetchCampaigns() }, [])

  const resetForm = () => {
    setForm({
      campaign_id: '', benefit_type: 'extra_days', benefit_value: '7',
      benefit_label: 'Pagá 1 mes y llevate 7 días extra gratis',
      applicable_plans: '', min_purchase_required: '0', is_active: true
    })
    setEditing(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (b) => {
    setForm({
      campaign_id: b.campaign_id,
      benefit_type: b.benefit_type,
      benefit_value: b.benefit_value,
      benefit_label: b.benefit_label,
      applicable_plans: (b.applicable_plans || []).join(', '),
      min_purchase_required: b.min_purchase_required || '0',
      is_active: b.is_active
    })
    setEditing(b.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.campaign_id) return
    const payload = {
      ...form,
      benefit_value: parseFloat(form.benefit_value) || 0,
      applicable_plans: form.applicable_plans ? form.applicable_plans.split(',').map(s => s.trim()).filter(Boolean) : [],
      min_purchase_required: parseFloat(form.min_purchase_required) || 0,
    }
    if (editing) {
      await updateBenefit(editing, payload)
    } else {
      await createBenefit(payload)
    }
    setShowModal(false)
    resetForm()
  }

  const toggleActive = async (b) => {
    await updateBenefit(b.id, { is_active: !b.is_active })
  }

  const getTypeInfo = (type) => BENEFIT_TYPES.find(t => t.value === type) || BENEFIT_TYPES[0]

  const activeCampaigns = campaigns.filter(c => c.status !== 'cerrada')

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Beneficios de Afiliados</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Configurar el beneficio que recibe el usuario por cada campaña de influencer.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">redeem</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button onClick={openCreate} style={btn('var(--color-primary)', 'white')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
          Nuevo Beneficio
        </button></div>
      </section>

      {/* Default notice */}
      <div style={{ ...card, background: "rgba(249, 115, 22, 0.1)", borderColor: '#fed7aa', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '1.5rem' }}>tips_and_updates</span>
        <div>
          <p style={{ fontWeight: 700, color: '#9a3412', fontSize: '0.875rem', margin: 0 }}>Default recomendado para campañas nuevas</p>
          <p style={{ color: '#c2410c', fontSize: '0.8125rem', margin: 0 }}>Pagá 1 mes y llevate <strong>7 días extra gratis</strong></p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '1rem' }}>
        {benefits.map(b => {
          const typeInfo = getTypeInfo(b.benefit_type)
          const camp = b.affiliate_campaigns || {}
          const aff = camp.affiliates || {}
          return (
            <div key={b.id} style={{ ...card, opacity: b.is_active ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                    background: b.is_active ? 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' : "var(--admin-line)",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.25rem' }}>{typeInfo.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: "#f5f5f5", margin: 0, fontSize: '0.875rem' }}>{typeInfo.label}</p>
                    <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>
                      {aff.name || '—'} • {camp.code || '—'}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.625rem', fontWeight: 700,
                  background: b.is_active ? '#dcfce7' : "var(--admin-panel2)",
                  color: b.is_active ? '#16a34a' : "var(--admin-muted)"
                }}>
                  {b.is_active ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>

              {/* Value Display */}
              <div style={{ background: "var(--admin-panel2)", padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem', textAlign: 'center', border: "1px solid var(--admin-line)" }}>
                <p style={{ fontSize: '2rem', fontWeight: 900, color: '#ea580c', margin: 0 }}>
                  {b.benefit_value}{typeInfo.unit === '$' ? '$' : ''} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: "var(--admin-muted)" }}>{typeInfo.unit !== '$' ? typeInfo.unit : ''}</span>
                </p>
                <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted)", marginTop: '0.375rem', fontWeight: 500 }}>{b.benefit_label}</p>
              </div>

              {/* Details */}
              <div style={{ fontSize: '0.75rem', color: "var(--admin-muted)", marginBottom: '0.75rem' }}>
                {(b.applicable_plans || []).length > 0 && (
                  <p style={{ margin: '0 0 0.25rem' }}>
                    <strong>Planes:</strong> {b.applicable_plans.join(', ')}
                  </p>
                )}
                {b.min_purchase_required > 0 && (
                  <p style={{ margin: 0 }}>
                    <strong>Compra mínima:</strong> ${b.min_purchase_required}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.375rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <button onClick={() => openEdit(b)} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), flex: 1, justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span> Editar
                </button>
                <button onClick={() => toggleActive(b)} style={{ ...btn(b.is_active ? '#fef3c7' : '#dcfce7', b.is_active ? '#d97706' : '#16a34a'), padding: '0.375rem 0.5rem' }}
                  title={b.is_active ? 'Desactivar' : 'Activar'}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{b.is_active ? 'toggle_off' : 'toggle_on'}</span>
                </button>
              </div>
            </div>
          )
        })}
        {benefits.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.3, display: 'block', marginBottom: '0.5rem' }}>redeem</span>
            No hay beneficios configurados. Creá el primero.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>
                {editing ? 'Editar Beneficio' : 'Nuevo Beneficio'}
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
                  {activeCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.affiliates?.name || 'Afiliado'}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Tipo de beneficio</label>
                  <select style={inputStyle} value={form.benefit_type} onChange={e => setForm({ ...form, benefit_type: e.target.value })}>
                    {BENEFIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Valor ({getTypeInfo(form.benefit_type).unit})</label>
                  <input type="number" style={inputStyle} value={form.benefit_value} onChange={e => setForm({ ...form, benefit_value: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Texto visible al usuario</label>
                <input style={inputStyle} value={form.benefit_label} onChange={e => setForm({ ...form, benefit_label: e.target.value })} placeholder="Pagá 1 mes y llevate 7 días extra gratis" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Planes válidos (separar con coma)</label>
                  <input style={inputStyle} value={form.applicable_plans} onChange={e => setForm({ ...form, applicable_plans: e.target.value })} placeholder="vacío = todos" />
                </div>
                <div>
                  <label style={labelStyle}>Compra mínima ($)</label>
                  <input type="number" style={inputStyle} value={form.min_purchase_required} onChange={e => setForm({ ...form, min_purchase_required: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: "var(--admin-muted)" }}>Beneficio activo</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={btn("var(--admin-panel2)", "var(--admin-muted)")}>Cancelar</button>
              <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{editing ? 'save' : 'add'}</span>
                {editing ? 'Guardar' : 'Crear Beneficio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
