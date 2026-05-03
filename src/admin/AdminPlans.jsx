import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }

const planColors = { gratis: "var(--admin-muted2)", plus: '#3b82f6', pro: 'var(--color-primary)' }
const planIcons = { gratis: 'person', plus: 'star', pro: 'workspace_premium' }

export default function AdminPlans() {
  const { plans, fetchPlans, updatePlan, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)

  useEffect(() => { fetchPlans() }, [])

  const startEditing = (plan) => {
    setEditingId(plan.id)
    setEditForm({ ...plan })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { id, created_at, ...updates } = editForm
      await updatePlan(editingId, updates)
      setSaved(editingId)
      setEditingId(null)
      setTimeout(() => setSaved(null), 3000)
    } catch (e) {
      console.error('Error saving plan:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>diamond</span>
          Planes de Usuarios
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem' }}>
          Editá los límites, features y reglas de matching de cada plan. Los cambios se aplican inmediatamente.
        </p>
      </div>

      {saved && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
          ✅ Plan guardado exitosamente.
        </div>
      )}

      {plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: "var(--admin-muted)" }}>
          {loading ? 'Cargando planes...' : 'No se encontraron planes en plan_rules. Verificá que la tabla exista y tenga datos.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '1.5rem' }}>
          {plans.map(plan => {
            const isEditing = editingId === plan.id
            const justSaved = saved === plan.id
            const color = planColors[plan.plan_name] || "var(--admin-muted2)"
            const icon = planIcons[plan.plan_name] || 'person'

            return (
              <div key={plan.id} style={{
                ...card, borderTop: `4px solid ${color}`, position: 'relative',
                boxShadow: justSaved ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : card.boxShadow,
                transition: 'all 0.3s'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>{icon}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5", textTransform: 'capitalize', margin: 0 }}>{plan.plan_name}</h3>
                    <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>
                      Boost: +{((plan.priority_boost || 0) * 100).toFixed(0)}% · Ranking: {plan.match_depth}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Limits */}
                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Límites</h4>
                    {[
                      { key: 'max_active_albums', label: 'Máx álbumes activos', type: 'number' },
                      { key: 'favorite_limit', label: 'Límite de favoritos', type: 'number' },
                      { key: 'chat_expiration_hours', label: 'Expiración chat (horas)', type: 'number' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", marginBottom: '0.25rem' }}>{f.label}</label>
                        <input type={f.type} value={editForm[f.key] ?? ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value === '' ? null : Number(e.target.value) })}
                          placeholder="Sin límite"
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.8125rem' }} />
                      </div>
                    ))}

                    {/* Ranking */}
                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0 0' }}>Ranking</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", marginBottom: '0.25rem' }}>Profundidad Match</label>
                        <select value={editForm.match_depth || 'basic'} onChange={e => setEditForm({ ...editForm, match_depth: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.8125rem' }}>
                          <option value="basic">Basic</option>
                          <option value="optimized">Optimized</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", marginBottom: '0.25rem' }}>Refresh Level</label>
                        <select value={editForm.match_refresh_level || 'low'} onChange={e => setEditForm({ ...editForm, match_refresh_level: e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.8125rem' }}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", marginBottom: '0.25rem' }}>Priority Boost (0.00 - 0.20)</label>
                      <input type="number" step="0.01" min="0" max="0.20" value={editForm.priority_boost ?? 0}
                        onChange={e => setEditForm({ ...editForm, priority_boost: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.8125rem' }} />
                    </div>

                    {/* Feature Flags */}
                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0 0' }}>Features</h4>
                    {[
                      { key: 'can_use_optimized_ranking', label: 'Ranking Optimizado' },
                      { key: 'can_use_advanced_ranking', label: 'Ranking Avanzado' },
                      { key: 'can_receive_match_alerts', label: 'Alertas de Match' },
                      { key: 'can_receive_realtime_alerts', label: 'Alertas Realtime' },
                      { key: 'can_use_smart_suggestions', label: 'Sugerencias Smart' },
                      { key: 'can_use_early_features', label: 'Early Access' },
                    ].map(f => (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={editForm[f.key] || false} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.checked })} />
                        {f.label}
                      </label>
                    ))}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                        {saving ? '⏳ Guardando...' : '💾 Guardar'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: "var(--admin-panel2)", color: "var(--admin-muted2)", border: 'none', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* View Mode */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Máx álbumes', value: plan.max_active_albums ?? '∞', icon: 'menu_book' },
                        { label: 'Favoritos', value: plan.favorite_limit ?? '∞', icon: 'favorite' },
                        { label: 'Chat expira', value: plan.chat_expiration_hours ? `${plan.chat_expiration_hours}h` : 'Nunca', icon: 'timer' },
                        { label: 'Match depth', value: plan.match_depth, icon: 'search' },
                        { label: 'Refresh', value: plan.match_refresh_level, icon: 'sync' },
                        { label: 'Boost', value: `+${((plan.priority_boost || 0) * 100).toFixed(0)}%`, icon: 'trending_up' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: "var(--admin-panel2)", borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: "var(--admin-muted)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: "var(--admin-muted)" }}>{item.icon}</span>
                            {item.label}
                          </span>
                          <span style={{ fontWeight: 800, color: "#f5f5f5" }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Feature badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
                      {[
                        { key: 'can_use_optimized_ranking', label: 'Optimizado' },
                        { key: 'can_use_advanced_ranking', label: 'Avanzado' },
                        { key: 'can_receive_match_alerts', label: 'Alertas' },
                        { key: 'can_receive_realtime_alerts', label: 'Realtime' },
                        { key: 'can_use_smart_suggestions', label: 'Smart' },
                        { key: 'can_use_early_features', label: 'Early' },
                      ].map(f => (
                        <span key={f.key} style={{
                          padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 700,
                          background: plan[f.key] ? '#ecfdf5' : "var(--admin-panel2)", color: plan[f.key] ? '#10b981' : "var(--admin-muted)"
                        }}>{plan[f.key] ? '✓' : '✕'} {f.label}</span>
                      ))}
                    </div>

                    <button onClick={() => startEditing(plan)} style={{
                      width: '100%', padding: '0.625rem', borderRadius: '0.5rem',
                      background: `${color}10`, color, border: `1px solid ${color}30`,
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem'
                    }}>
                      ✏️ Editar Plan
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
