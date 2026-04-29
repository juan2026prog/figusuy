import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

const categoryLabels = {
  matching: { icon: 'distance', label: 'Matching y Proximidad', color: '#3b82f6' },
  ranking: { icon: 'trending_up', label: 'Ranking y Visibilidad', color: '#ea580c' },
  penalties: { icon: 'gavel', label: 'Penalizaciones', color: '#ef4444' },
  limits: { icon: 'tune', label: 'Límites y Restricciones', color: '#f59e0b' },
  business: { icon: 'store', label: 'Negocios', color: '#8b5cf6' },
  general: { icon: 'settings', label: 'General', color: '#64748b' },
}

export default function AdminAlgorithm() {
  const { algorithmConfig, fetchAlgorithmConfig, updateAlgorithmConfig } = useAdminStore()
  const { user } = useAuthStore()
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAlgorithmConfig() }, [])

  const grouped = algorithmConfig.reduce((acc, c) => {
    acc[c.category] = acc[c.category] || []
    acc[c.category].push(c)
    return acc
  }, {})

  const handleSave = async (key) => {
    setSaving(true)
    let val = editValue
    try { val = JSON.parse(editValue) } catch {}
    await updateAlgorithmConfig(key, val, user.id)
    setEditingKey(null)
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>psychology</span>
          Configuración del Algoritmo
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
          Controla las reglas de visibilidad, ranking, penalizaciones y matching. Los cambios se registran en auditoría.
        </p>
      </div>

      {algorithmConfig.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Cargando configuración del algoritmo...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([cat, items]) => {
            const meta = categoryLabels[cat] || categoryLabels.general
            return (
              <div key={cat} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span className="material-symbols-outlined" style={{ color: meta.color }}>{meta.icon}</span>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>{meta.label}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {items.map(config => {
                    const isEditing = editingKey === config.config_key
                    const rawValue = typeof config.config_value === 'string' ? config.config_value : JSON.stringify(config.config_value)

                    return (
                      <div key={config.config_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '12rem' }}>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{config.config_key.replace(/_/g, ' ')}</p>
                          {config.description && <p style={{ fontSize: '0.6875rem', color: '#94a3b8', margin: '0.125rem 0 0' }}>{config.description}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isEditing ? (
                            <>
                              <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave(config.config_key)}
                                style={{ width: '8rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', fontWeight: 700 }} />
                              <button onClick={() => handleSave(config.config_key)} disabled={saving} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                {saving ? '...' : '✓'}
                              </button>
                              <button onClick={() => setEditingKey(null)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#f1f5f9', color: '#64748b', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✕</button>
                            </>
                          ) : (
                            <>
                              <code style={{ fontSize: '0.875rem', fontWeight: 800, color: meta.color, background: 'white', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                                {rawValue.replace(/"/g, '')}
                              </code>
                              <button onClick={() => { setEditingKey(config.config_key); setEditValue(rawValue.replace(/"/g, '')) }}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: '#fff7ed', color: '#ea580c', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}>✏️</button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Warning */}
      <div style={{ ...card, marginTop: '2rem', background: '#fff7ed', border: '1px solid #ffedd5' }}>
        <h4 style={{ fontWeight: 800, color: '#9a3412', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined">warning</span>
          Reglas Críticas del Motor
        </h4>
        <ul style={{ fontSize: '0.875rem', color: '#c2410c', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
          <li><strong>premium_boost</strong> no puede superar <strong>1.20x</strong> — funciona solo como desempate.</li>
          <li><strong>sponsor_boost</strong> no puede superar <strong>1.15x</strong> — no puede alterar relevancia fuerte.</li>
          <li>Penalizaciones por reportes se aplican automáticamente cuando un reporte es confirmado.</li>
          <li>Todos los cambios quedan registrados en auditoría con tu usuario.</li>
        </ul>
      </div>
    </div>
  )
}
