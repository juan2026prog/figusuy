import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

export default function AdminLocations() {
  const { locations, fetchLocations, updateLocation, deleteLocation } = useAdminStore()
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { fetchLocations() }, [])

  const filteredLocations = locations.filter(l => filterType === 'all' || l.type === filterType)

  const toggleActive = (id, currentStatus) => {
    updateLocation(id, { is_active: !currentStatus })
  }

  const handleDelete = (id) => {
    if(window.confirm('¿Estás seguro de eliminar este local/punto? Esta acción no se puede deshacer.')) {
      deleteLocation(id)
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>storefront</span>
            Locales y Puntos
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Administración de negocios, kioskos y puntos de encuentro.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn('#ea580c', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            Nuevo Local
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: 'Todos', icon: 'map' },
          { key: 'store', label: 'Kioskos/Tiendas', icon: 'store' },
          { key: 'meetup', label: 'Puntos de Encuentro', icon: 'group' },
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
        {filteredLocations.map(loc => (
          <div key={loc.id} style={{ ...card, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {!loc.is_active && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'grayscale(1)', zIndex: 1, pointerEvents: 'none' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: loc.type === 'store' ? '#fff7ed' : '#f0fdf4', color: loc.type === 'store' ? '#ea580c' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <span className="material-symbols-outlined">{loc.type === 'store' ? 'store' : 'group'}</span>
                </div>
                <div>
                   <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{loc.name}</h3>
                   <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{loc.type === 'store' ? 'Tienda Comercial' : 'Punto de Intercambio'}</span>
                </div>
              </div>
              <div style={{ 
                padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase',
                background: loc.plan === 'dominio' ? '#0f172a' : (loc.plan === 'turbo' ? '#ea580c' : '#f1f5f9'),
                color: loc.plan === 'dominio' || loc.plan === 'turbo' ? 'white' : '#64748b'
              }}>
                {loc.plan || 'Free'}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', flex: 1, zIndex: 2 }}>
              <p style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#94a3b8' }}>location_on</span>
                {loc.address || 'Sin dirección'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#94a3b8' }}>map</span>
                {loc.city}, {loc.department}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person</span>
                Propietario: <span style={{ color: '#64748b', fontWeight: 600 }}>{loc.owner_id ? loc.owner_id.substring(0,8) : 'Sistema'}</span>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', zIndex: 2 }}>
               <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>{loc.views_count || 0}</p>
                  <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Visitas</p>
               </div>
               <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>{loc.favorites_count || 0}</p>
                  <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Favoritos</p>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', zIndex: 2 }}>
              <button 
                onClick={() => toggleActive(loc.id, loc.is_active)} 
                style={{ ...btn(loc.is_active ? '#fff7ed' : '#ecfdf5', loc.is_active ? '#ea580c' : '#10b981'), flex: 1, justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{loc.is_active ? 'pause_circle' : 'play_circle'}</span>
                {loc.is_active ? 'Pausar' : 'Activar'}
              </button>
              <button style={{ ...btn('#f1f5f9', '#475569'), padding: '0.375rem', width: '2.25rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
              </button>
              <button onClick={() => handleDelete(loc.id)} style={{ ...btn('#fef2f2', '#ef4444'), padding: '0.375rem', width: '2.25rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>delete</span>
              </button>
            </div>
          </div>
        ))}
        
        {filteredLocations.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No hay locales registrados en esta categoría.
          </div>
        )}
      </div>
    </div>
  )
}
