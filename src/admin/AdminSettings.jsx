import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e7e5e4' }
const input = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e7e5e4', fontSize: '0.8125rem', outline: 'none' }

export default function AdminSettings() {
  const { settings, fetchSettings, updateSetting } = useAdminStore()
  const { profile } = useAuthStore()
  const [editKey, setEditKey] = useState(null)
  const [editVal, setEditVal] = useState('')

  useEffect(() => { fetchSettings() }, [])

  const grouped = settings.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  const categoryLabels = { general: '⚙️ General', algorithm: '🧠 Algoritmo', limits: '🔒 Límites', safety: '🛡️ Seguridad', social: '🌐 Social' }

  const handleSave = async (key) => {
    let val = editVal
    try { val = JSON.parse(editVal) } catch {}
    await updateSetting(key, val, profile?.id)
    setEditKey(null)
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c1917', marginBottom: '0.25rem' }}>⚙️ Configuración General</h1>
      <p style={{ fontSize: '0.875rem', color: '#78716c', marginBottom: '1.5rem' }}>Controlá toda la plataforma desde acá</p>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ ...card, marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.875rem' }}>{categoryLabels[cat] || cat}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f5f5f4' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1c1917' }}>{s.key.replace(/_/g, ' ')}</p>
                  {s.updated_at && <p style={{ fontSize: '0.625rem', color: '#a8a29e' }}>Actualizado: {new Date(s.updated_at).toLocaleString()}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editKey === s.key ? (
                    <>
                      <input style={{ ...input, width: '12rem' }} value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave(s.key)} />
                      <button onClick={() => handleSave(s.key)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>💾</button>
                      <button onClick={() => setEditKey(null)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#f5f5f4', color: '#78716c', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <code style={{ fontSize: '0.75rem', background: '#f5f5f4', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#475569' }}>
                        {JSON.stringify(s.value).replace(/"/g, '')}
                      </code>
                      <button onClick={() => { setEditKey(s.key); setEditVal(typeof s.value === 'string' ? s.value : JSON.stringify(s.value)) }} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: '#fff7ed', color: '#ea580c', border: 'none', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer' }}>✏️</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
