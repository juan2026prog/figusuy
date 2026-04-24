import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }
const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.04em' }
const btn = (bg) => ({ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: bg, color: 'white', border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' })

export default function AdminPlans() {
  const { plans, fetchPlans, updatePlan } = useAdminStore()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null) // planId that was just saved

  useEffect(() => { fetchPlans() }, [])

  const intervalLabels = { monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual', lifetime: 'Vitalicio' }

  const startEditing = (plan) => {
    setEditingId(plan.id)
    setEditForm({
      name: plan.name,
      price: plan.price,
      currency: plan.currency || 'UYU',
      interval: plan.interval,
      features: JSON.stringify(plan.features || {}, null, 2),
      limits: JSON.stringify(plan.limits || {}, null, 2),
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSave = async (planId) => {
    setSaving(true)
    try {
      let features, limits
      try { features = JSON.parse(editForm.features) } catch { features = {} }
      try { limits = JSON.parse(editForm.limits) } catch { limits = {} }

      await updatePlan(planId, {
        name: editForm.name,
        price: Number(editForm.price),
        currency: editForm.currency,
        interval: editForm.interval,
        features,
        limits,
      })
      setSaved(planId)
      setEditingId(null)
      setEditForm({})
      setTimeout(() => setSaved(null), 3000)
    } catch (e) {
      console.error('Error saving plan:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>💎 Gestión de Planes</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Editá precios, features y límites. Los cambios se reflejan en la landing page automáticamente.</p>
        </div>
      </div>

      {saved && (
        <div style={{
          background: '#dcfce7', border: '1px solid #86efac', borderRadius: '0.5rem',
          padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.8125rem', fontWeight: 600, color: '#166534',
          animation: 'fadeIn 0.3s ease',
        }}>
          ✅ Plan guardado exitosamente. Los cambios se reflejan en la landing.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1rem' }}>
        {plans.map(plan => {
          const isEditing = editingId === plan.id
          const justSaved = saved === plan.id

          return (
            <div key={plan.id} style={{
              ...card,
              borderColor: justSaved ? '#10b981' : plan.price > 0 ? '#8b5cf6' : '#e2e8f0',
              position: 'relative',
              boxShadow: justSaved ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {plan.price > 0 && (
                <div style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: '#8b5cf6', color: 'white', padding: '0.125rem 0.5rem',
                  borderRadius: '1rem', fontSize: '0.625rem', fontWeight: 700,
                }}>PREMIUM</div>
              )}

              {isEditing ? (
                /* ===== EDIT MODE ===== */
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Nombre del plan</label>
                    <input style={inputStyle} value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Precio</label>
                      <input type="number" style={inputStyle} value={editForm.price}
                        onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Moneda</label>
                      <select style={inputStyle} value={editForm.currency}
                        onChange={e => setEditForm({ ...editForm, currency: e.target.value })}>
                        <option value="UYU">UYU</option>
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Período</label>
                    <select style={inputStyle} value={editForm.interval}
                      onChange={e => setEditForm({ ...editForm, interval: e.target.value })}>
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                      <option value="lifetime">Vitalicio</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Features (JSON)</label>
                    <textarea style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.6875rem', minHeight: '5rem', resize: 'vertical' }}
                      value={editForm.features}
                      onChange={e => setEditForm({ ...editForm, features: e.target.value })} />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Límites (JSON)</label>
                    <textarea style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.6875rem', minHeight: '3rem', resize: 'vertical' }}
                      value={editForm.limits}
                      onChange={e => setEditForm({ ...editForm, limits: e.target.value })} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => handleSave(plan.id)} disabled={saving} style={{
                      ...btn('#10b981'),
                      opacity: saving ? 0.6 : 1,
                    }}>
                      {saving ? '⏳ Guardando...' : '💾 Guardar'}
                    </button>
                    <button onClick={cancelEditing} style={btn('#64748b')}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ===== VIEW MODE ===== */
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>{intervalLabels[plan.interval] || plan.interval}</p>

                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: plan.price > 0 ? '#8b5cf6' : '#10b981' }}>
                      ${plan.price}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      /{plan.interval === 'monthly' ? 'mes' : plan.interval === 'quarterly' ? 'trim' : plan.interval === 'yearly' ? 'año' : '∞'}
                    </span>
                    <span style={{ fontSize: '0.625rem', color: '#94a3b8', marginLeft: '0.25rem' }}>{plan.currency || 'UYU'}</span>
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ ...labelStyle, marginBottom: '0.375rem' }}>Features</p>
                    {Object.entries(plan.features || {}).map(([k, v]) => (
                      <p key={k} style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.125rem' }}>
                        <span style={{ color: '#10b981', marginRight: '0.25rem' }}>✓</span>
                        {k.replace(/_/g, ' ')}: <strong>{String(v)}</strong>
                      </p>
                    ))}
                  </div>

                  {/* Limits */}
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ ...labelStyle, marginBottom: '0.375rem' }}>Límites</p>
                    {Object.entries(plan.limits || {}).map(([k, v]) => (
                      <p key={k} style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.125rem' }}>
                        {k.replace(/_/g, ' ')}: <strong>{v}</strong>
                      </p>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button onClick={() => startEditing(plan)} style={btn('#3b82f6')}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => updatePlan(plan.id, { is_active: !plan.is_active })}
                      style={btn(plan.is_active ? '#ef4444' : '#10b981')}>
                      {plan.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
