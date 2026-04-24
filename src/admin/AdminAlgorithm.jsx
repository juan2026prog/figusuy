import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e2e8f0' }

const sliders = [
  { key: 'match_weight_compatibility', label: 'Peso de compatibilidad', desc: 'Puntos por cada figurita coincidente', min: 1, max: 30, unit: 'pts' },
  { key: 'match_weight_mutual', label: 'Peso de intercambio mutuo', desc: 'Bonus cuando ambos se benefician', min: 5, max: 50, unit: 'pts' },
  { key: 'match_weight_active', label: 'Peso de actividad reciente', desc: 'Bonus por usuario activo', min: 0, max: 20, unit: 'pts' },
  { key: 'match_weight_rating', label: 'Peso de rating', desc: 'Multiplicador por reputación', min: 0, max: 10, unit: 'x' },
  { key: 'match_weight_premium_boost', label: 'Premium boost', desc: 'Puntos extra para premium', min: 0, max: 20, unit: 'pts' },
  { key: 'match_max_free', label: 'Matches gratis', desc: 'Cantidad visible para plan gratis', min: 1, max: 10, unit: '' },
]

export default function AdminAlgorithm() {
  const { settings, fetchSettings, updateSetting } = useAdminStore()
  const { profile } = useAuthStore()
  const [values, setValues] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  useEffect(() => {
    const v = {}
    settings.forEach(s => {
      if (s.category === 'algorithm') {
        v[s.key] = typeof s.value === 'string' ? parseInt(s.value) || 0 : s.value
      }
    })
    setValues(v)
  }, [settings])

  const handleChange = (key, val) => {
    setValues({ ...values, [key]: parseInt(val) })
  }

  const handleSave = async () => {
    for (const [key, val] of Object.entries(values)) {
      await updateSetting(key, val, profile?.id)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>🧠 Configuración del Algoritmo</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Ajustá los pesos del motor de matching sin programar</p>
        </div>
        <button onClick={handleSave} style={{
          padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
          background: saved ? '#10b981' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.3s',
        }}>{saved ? '✅ Guardado!' : '💾 Guardar cambios'}</button>
      </div>

      {/* Formula preview */}
      <div style={{ ...card, marginBottom: '1.5rem', background: '#0f172a', border: 'none', color: 'white' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: '#94a3b8' }}>📐 Fórmula actual</h3>
        <code style={{ fontSize: '0.8125rem', lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: '#7dd3fc' }}>score</span> = (coincidencias × <span style={{ color: '#fbbf24' }}>{values.match_weight_compatibility || 10}</span>)
          + (mutuo ? <span style={{ color: '#fbbf24' }}>{values.match_weight_mutual || 20}</span> : 5)
          + (activo ? <span style={{ color: '#fbbf24' }}>{values.match_weight_active || 5}</span> : 0)
          + (rating × <span style={{ color: '#fbbf24' }}>{values.match_weight_rating || 2}</span>)
          + (premium ? <span style={{ color: '#fbbf24' }}>{values.match_weight_premium_boost || 8}</span> : 0)
          − penalización_distancia
        </code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1rem' }}>
        {sliders.map(s => (
          <div key={s.key} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{s.label}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.desc}</p>
              </div>
              <span style={{
                fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6',
                background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '0.5rem',
                minWidth: '3rem', textAlign: 'center',
              }}>
                {values[s.key] || 0}{s.unit}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              value={values[s.key] || 0}
              onChange={e => handleChange(s.key, e.target.value)}
              style={{ width: '100%', accentColor: '#3b82f6', height: '0.375rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              <span>{s.min}</span>
              <span>{s.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
