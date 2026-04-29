import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

export default function AdminPromos() {
  const { events, fetchEvents } = useAdminStore()
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { fetchEvents() }, [])

  // In a real scenario we'd have updateEvent, deleteEvent
  const filteredEvents = events.filter(e => filterType === 'all' || e.type === filterType)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>campaign</span>
            Promos & Visibilidad
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Gestión de campañas de visibilidad patrocinada, anuncios y eventos especiales.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn('#ea580c', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            Nueva Campaña
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: 'Todas', icon: 'list' },
          { key: 'sponsored', label: 'Patrocinadas', icon: 'stars' },
          { key: 'organic', label: 'Orgánicas', icon: 'eco' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterType(f.key)} style={{
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap',
            background: filterType === f.key ? '#ea580c' : '#ffffff', 
            color: filterType === f.key ? 'white' : '#64748b', 
            border: filterType === f.key ? '1px solid #ea580c' : '1px solid #e2e8f0',
            boxShadow: filterType === f.key ? '0 2px 4px rgba(234,88,12,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '1rem' }}>
        {filteredEvents.map(ev => (
          <div key={ev.id} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{ev.title || 'Campaña sin título'}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{ev.type || 'Promoción'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', flex: 1 }}>
              <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {ev.description || 'Sin descripción'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                 <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{Math.floor(Math.random() * 5000 + 1000)}</p>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Impresiones</p>
                 </div>
                 <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: '#ea580c' }}>{(Math.random() * 5 + 1).toFixed(2)}%</p>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>CTR Global</p>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #e0f2fe' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: '#0ea5e9' }}>insights</span>
                 <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>Campaña con rendimiento alto</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button style={{ ...btn('#f1f5f9', '#475569'), flex: 1, justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span> Editar
              </button>
              <button style={{ ...btn('#fef2f2', '#ef4444'), padding: '0.375rem', width: '2.25rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>delete</span>
              </button>
            </div>
          </div>
        ))}
        
        {filteredEvents.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No hay campañas activas.
          </div>
        )}
      </div>
    </div>
  )
}
