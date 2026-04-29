import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminConfig() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*')
    const config = {}
    data?.forEach(s => config[s.key] = s.value)
    setSettings(config)
    setLoading(false)
  }

  const handleToggle = async (key, currentVal) => {
    const newVal = !currentVal
    await supabase.from('app_settings').upsert({ key, value: newVal }, { onConflict: 'key' })
    setSettings({...settings, [key]: newVal})
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>settings</span>
          Configuración Global
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Ajustes generales del sistema, modo mantenimiento y feature flags.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
        {/* Maintenance Mode */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Modo Mantenimiento</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>Bloquea el acceso a toda la plataforma.</p>
            </div>
            <button 
              onClick={() => handleToggle('maintenance_mode', settings.maintenance_mode)}
              style={{ 
                width: '3.5rem', height: '1.75rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', position: 'relative',
                background: settings.maintenance_mode ? '#ef4444' : '#e2e8f0', transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '1.25rem', height: '1.25rem', background: 'white', borderRadius: '50%', position: 'absolute', top: '0.25rem', left: settings.maintenance_mode ? '2rem' : '0.25rem', transition: 'all 0.2s' }} />
            </button>
          </div>
        </div>

        {/* Feature Flags */}
        <div style={{ ...card, gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Funcionalidades (Feature Flags)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[
              { key: 'enable_chat', label: 'Chat entre usuarios', icon: 'chat' },
              { key: 'enable_trades', label: 'Propuestas de canje', icon: 'swap_horiz' },
              { key: 'enable_store_requests', label: 'Solicitudes de tiendas', icon: 'add_business' },
              { key: 'enable_premium_plans', label: 'Planes Premium', icon: 'workspace_premium' }
            ].map(flag => (
              <div key={flag.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#64748b' }}>{flag.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{flag.label}</span>
                </div>
                <button 
                  onClick={() => handleToggle(flag.key, settings[flag.key])}
                  style={{ 
                    width: '3rem', height: '1.5rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', position: 'relative',
                    background: settings[flag.key] ? '#ea580c' : '#cbd5e1', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '1.1rem', height: '1.1rem', background: 'white', borderRadius: '50%', position: 'absolute', top: '0.2rem', left: settings[flag.key] ? '1.7rem' : '0.2rem', transition: 'all 0.2s' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
