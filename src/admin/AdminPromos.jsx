import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

export default function AdminPromos() {
  const { events, fetchEvents } = useAdminStore()
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { fetchEvents() }, [])

  // In a real scenario we'd have updateEvent, deleteEvent
  const filteredEvents = events.filter(e => filterType === 'all' || e.type === filterType)

  return (
    <div style={{ paddingBottom: '2rem' }}>
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Promos & Visibilidad</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Gestión de campañas de visibilidad patrocinada, anuncios y eventos especiales.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">campaign</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn('var(--color-primary)', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            Nueva Campaña
          </button></div>
      </div>
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: 'Todas', icon: 'list' },
          { key: 'sponsored', label: 'Patrocinadas', icon: 'stars' },
          { key: 'organic', label: 'Orgánicas', icon: 'eco' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterType(f.key)} style={{
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap',
            background: filterType === f.key ? 'var(--color-primary)' : "var(--admin-panel)", 
            color: filterType === f.key ? 'white' : "var(--admin-muted2)", 
            border: filterType === f.key ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
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
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: "rgba(249, 115, 22, 0.1)", color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: "#f5f5f5", margin: 0, lineHeight: 1.2 }}>{ev.title || 'Campaña sin título'}</h3>
                  <span style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", fontWeight: 600 }}>{ev.type || 'Promoción'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', flex: 1 }}>
              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted)", marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {ev.description || 'Sin descripción'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                 <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: "#f5f5f5" }}>{ev.impressions || 0}</p>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>Impresiones</p>
                 </div>
                 <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--color-primary)' }}>{ev.impressions > 0 ? ((ev.clicks_count || 0) / ev.impressions * 100).toFixed(2) : '0.00'}%</p>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>CTR Global</p>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #e0f2fe' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: '#0ea5e9' }}>insights</span>
                 <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>Campaña con rendimiento alto</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), flex: 1, justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span> Editar
              </button>
              <button style={{ ...btn('#fef2f2', '#ef4444'), padding: '0.375rem', width: '2.25rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>delete</span>
              </button>
            </div>
          </div>
        ))}
        
        {filteredEvents.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>
            No hay campañas activas.
          </div>
        )}
      </div>
    </div>
  )
}
