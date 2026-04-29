import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminBusinessPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    setLoading(true)
    const { data } = await supabase.from('business_plan_rules').select('*').order('monthly_price')
    setPlans(data || [])
    setLoading(false)
  }

  const startEdit = (plan) => {
    setEditing(plan.id)
    setForm({ ...plan })
  }

  const handleSave = async () => {
    const { id, created_at, ...updates } = form
    await supabase.from('business_plan_rules').update(updates).eq('id', editing)
    setEditing(null)
    fetchPlans()
  }

  const planColors = { gratis: '#64748b', turbo: '#ea580c', dominio: '#0f172a' }
  const planIcons = { gratis: 'storefront', turbo: 'rocket_launch', dominio: 'diamond' }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>store</span>
          Planes de Negocios
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Configuración de planes para locales y puntos de intercambio: Gratis, Turbo y Dominio.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando planes...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
          {plans.map(plan => {
            const isEditing = editing === plan.id
            const color = planColors[plan.plan_name] || '#64748b'
            const icon = planIcons[plan.plan_name] || 'store'

            return (
              <div key={plan.id} style={{ ...card, borderTop: `4px solid ${color}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>{icon}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', textTransform: 'capitalize', margin: 0 }}>{plan.plan_name}</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color, margin: 0 }}>
                      ${isEditing ? form.monthly_price : plan.monthly_price}
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}> UYU/mes</span>
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { key: 'monthly_price', label: 'Precio mensual (UYU)', type: 'number' },
                      { key: 'max_photos', label: 'Máx fotos', type: 'number' },
                      { key: 'max_active_promos', label: 'Máx promos activas', type: 'number' },
                      { key: 'eligibility_boost', label: 'Boost de elegibilidad', type: 'number', step: '0.01' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{f.label}</label>
                        <input type={f.type} step={f.step} value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
                      </div>
                    ))}
                    {[
                      { key: 'can_have_featured_badge', label: 'Badge destacado' },
                      { key: 'can_have_featured_cta', label: 'CTA personalizado' },
                      { key: 'can_have_mobile_boost', label: 'Boost mobile' },
                      { key: 'can_have_advanced_metrics', label: 'Métricas avanzadas' },
                      { key: 'can_have_context_promos', label: 'Promos contextuales' },
                    ].map(f => (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <input type="checkbox" checked={form[f.key] || false} onChange={e => setForm({ ...form, [f.key]: e.target.checked })} />
                        {f.label}
                      </label>
                    ))}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button onClick={handleSave} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Guardar</button>
                      <button onClick={() => setEditing(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Máx fotos', value: plan.max_photos ?? '∞', icon: 'photo_camera' },
                        { label: 'Máx promos', value: plan.max_active_promos ?? '∞', icon: 'campaign' },
                        { label: 'Boost elegibilidad', value: `+${((plan.eligibility_boost || 0) * 100).toFixed(0)}%`, icon: 'trending_up' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#475569' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#94a3b8' }}>{item.icon}</span>
                            {item.label}
                          </span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
                      {[
                        { key: 'can_have_featured_badge', label: 'Badge' },
                        { key: 'can_have_featured_cta', label: 'CTA' },
                        { key: 'can_have_mobile_boost', label: 'Mobile' },
                        { key: 'can_have_advanced_metrics', label: 'Métricas' },
                        { key: 'can_have_context_promos', label: 'Contexto' },
                      ].map(f => (
                        <span key={f.key} style={{
                          padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 700,
                          background: plan[f.key] ? '#ecfdf5' : '#f1f5f9', color: plan[f.key] ? '#10b981' : '#94a3b8'
                        }}>{plan[f.key] ? '✓' : '✕'} {f.label}</span>
                      ))}
                    </div>
                    <button onClick={() => startEdit(plan)} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', background: `${color}10`, color, border: `1px solid ${color}30`, fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}>
                      Editar Plan
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
