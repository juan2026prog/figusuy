import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { formatScore, getScoreColor, buildScoreBreakdown } from '../lib/ranking'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

export default function AdminLocations() {
  const { locations, fetchLocations, updateLocation, deleteLocation, calculateBusinessRanking, getBusinessRanking } = useAdminStore()
  const { user: adminUser } = useAuthStore()
  const [filterType, setFilterType] = useState('all')
  const [bizScores, setBizScores] = useState({})
  const [scoringBiz, setScoringBiz] = useState(null)

  const loadBizScore = async (id) => {
    const data = await getBusinessRanking(id)
    if (data) setBizScores(prev => ({ ...prev, [id]: data }))
  }

  const recalcBiz = async (id) => {
    setScoringBiz(id)
    const result = await calculateBusinessRanking(id, adminUser?.id)
    if (result) {
      const data = await getBusinessRanking(id)
      if (data) setBizScores(prev => ({ ...prev, [id]: data }))
    }
    setScoringBiz(null)
  }

  useEffect(() => { fetchLocations() }, [])

  // Auto-fetch scores when locations load
  useEffect(() => {
    locations.forEach(l => {
      if (!bizScores[l.id]) loadBizScore(l.id)
    })
  }, [locations])

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
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Locales y Puntos</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Administración de negocios, kioskos y puntos de encuentro.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">storefront</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn('var(--color-primary)', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            Nuevo Local
          </button></div>
      </div>
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: 'Todos', icon: 'map' },
          { key: 'store', label: 'Kioskos/Tiendas', icon: 'store' },
          { key: 'meetup', label: 'Puntos de Encuentro', icon: 'group' },
          { key: 'safe_exchange_zone', label: 'Zonas Seguras', icon: 'verified_user' },
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
        {filteredLocations.map(loc => (
          <div key={loc.id} style={{ ...card, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {!loc.is_active && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'grayscale(1)', zIndex: 1, pointerEvents: 'none' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', 
                  background: loc.type === 'store' ? '#fff7ed' : (loc.type === 'safe_exchange_zone' ? '#eff6ff' : '#f0fdf4'), 
                  color: loc.type === 'store' ? 'var(--color-primary)' : (loc.type === 'safe_exchange_zone' ? '#3b82f6' : '#16a34a'), 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                   <span className="material-symbols-outlined">
                     {loc.type === 'store' ? 'store' : (loc.type === 'safe_exchange_zone' ? 'verified_user' : 'group')}
                   </span>
                </div>
                <div>
                   <h3 style={{ fontSize: '1rem', fontWeight: 800, color: "#f5f5f5", margin: 0, lineHeight: 1.2 }}>{loc.name}</h3>
                   <span style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", fontWeight: 600 }}>
                     {loc.type === 'store' ? 'Tienda Comercial' : (loc.type === 'safe_exchange_zone' ? 'Zona Segura (Seed)' : 'Punto de Intercambio')}
                   </span>
                </div>
              </div>
              <div style={{ 
                padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase',
                background: loc.plan === 'dominio' ? "#f5f5f5" : (loc.plan === 'turbo' ? 'var(--color-primary)' : "var(--admin-panel2)"),
                color: loc.plan === 'dominio' || loc.plan === 'turbo' ? 'white' : "var(--admin-muted2)"
              }}>
                {loc.plan || 'Free'}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', flex: 1, zIndex: 2 }}>
              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted)", display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: "var(--admin-muted)" }}>location_on</span>
                {loc.address || 'Sin dirección'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted)", display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: "var(--admin-muted)" }}>map</span>
                {loc.city}, {loc.department}
              </p>
              <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person</span>
                Propietario: <span style={{ color: "var(--admin-muted2)", fontWeight: 600 }}>{loc.owner_user_id ? loc.owner_user_id.substring(0,8) : 'Sistema'}</span>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', zIndex: 2 }}>
               <div style={{ background: "var(--admin-panel2)", padding: '0.5rem', borderRadius: '0.375rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>{loc.views_count || 0}</p>
                  <p style={{ fontSize: '0.625rem', color: "var(--admin-muted)", fontWeight: 700, textTransform: 'uppercase' }}>Visitas</p>
               </div>
               <div style={{ background: "var(--admin-panel2)", padding: '0.5rem', borderRadius: '0.375rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 800 }}>{loc.favorites_count || 0}</p>
                  <p style={{ fontSize: '0.625rem', color: "var(--admin-muted)", fontWeight: 700, textTransform: 'uppercase' }}>Favoritos</p>
               </div>
            </div>

            {/* Ranking Score */}
            <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", marginBottom: '1rem', zIndex: 2 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                 <p style={{ fontSize: '0.6875rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                   <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#8b5cf6' }}>leaderboard</span> Ranking Score
                 </p>
                 <button onClick={() => recalcBiz(loc.id)} disabled={scoringBiz === loc.id} style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', background: '#f5f3ff', color: '#8b5cf6', border: "1px solid var(--admin-line)", fontSize: '0.625rem', fontWeight: 700, cursor: 'pointer' }}>
                   {scoringBiz === loc.id ? '...' : '🔄'}
                 </button>
               </div>
               {bizScores[loc.id] ? (() => {
                 const sc = bizScores[loc.id]
                 return (
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <p style={{ fontSize: '1.5rem', fontWeight: 900, color: getScoreColor(sc.final_business_rank), margin: 0 }}>{formatScore(sc.final_business_rank)}</p>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                         {sc.plan_boost_applied > 0 && <span style={{ fontSize: '0.5625rem', background: '#f5f3ff', color: '#8b5cf6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: 700 }}>plan {sc.plan_boost_applied}x</span>}
                         {sc.sponsor_boost_applied > 0 && <span style={{ fontSize: '0.5625rem', background: "rgba(249, 115, 22, 0.1)", color: 'var(--color-primary)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: 700 }}>sponsor {sc.sponsor_boost_applied}x</span>}
                       </div>
                     </div>
                     {sc.badges?.length > 0 && (
                       <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                         {sc.badges.slice(0, 3).map(b => <span key={b} style={{ fontSize: '0.5625rem', background: "rgba(59, 130, 246, 0.1)", color: '#3b82f6', padding: '0.125rem 0.375rem', borderRadius: '1rem', fontWeight: 700 }}>{b}</span>)}
                       </div>
                     )}
                   </div>
                 )
               })() : (
                 <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", margin: 0 }}>Sin calcular</p>
               )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', zIndex: 2 }}>
              <button 
                onClick={() => toggleActive(loc.id, loc.is_active)} 
                style={{ ...btn(loc.is_active ? '#fff7ed' : '#ecfdf5', loc.is_active ? 'var(--color-primary)' : '#10b981'), flex: 1, justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{loc.is_active ? 'pause_circle' : 'play_circle'}</span>
                {loc.is_active ? 'Pausar' : 'Activar'}
              </button>
              <button style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), padding: '0.375rem', width: '2.25rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
              </button>
              <button onClick={() => handleDelete(loc.id)} style={{ ...btn('#fef2f2', '#ef4444'), padding: '0.375rem', width: '2.25rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>delete</span>
              </button>
            </div>
          </div>
        ))}
        
        {filteredLocations.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>
            No hay locales registrados en esta categoría.
          </div>
        )}
      </div>
    </div>
  )
}
