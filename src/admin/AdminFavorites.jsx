import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminFavorites() {
  const [stats, setStats] = useState({ total: 0, topUsers: [], topFavorited: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const [
      { count: total },
      { data: favs }
    ] = await Promise.all([
      supabase.from('user_favorites').select('*', { count: 'exact', head: true }),
      supabase.from('user_favorites').select('*, user:user_id(name), favorite:favorite_user_id(name)')
    ])

    // Calculate top users who favorite
    const userCounts = {}
    const favoriteCounts = {}
    
    ;(favs || []).forEach(f => {
      userCounts[f.user?.name] = (userCounts[f.user?.name] || 0) + 1
      favoriteCounts[f.favorite?.name] = (favoriteCounts[f.favorite?.name] || 0) + 1
    })

    const topUsers = Object.entries(userCounts).sort((a,b) => b[1] - a[1]).slice(0, 5)
    const topFavorited = Object.entries(favoriteCounts).sort((a,b) => b[1] - a[1]).slice(0, 5)

    setStats({ total: total || 0, topUsers, topFavorited })
    setLoading(false)
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>favorite</span>
          Monitor de Favoritos
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Métricas de adoptions y usuarios destacados por la comunidad.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando métricas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
          {/* Total */}
          <div style={{ ...card, gridColumn: '1 / -1', background: '#020617', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '4rem', fontWeight: 900, color: '#ea580c', lineHeight: 1 }}>{stats.total}</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem', color: '#94a3b8' }}>Relaciones de Favoritos</p>
            </div>
            <div style={{ width: '1px', height: '4rem', background: '#1e293b' }} />
            <p style={{ maxWidth: '18rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Este indicador muestra el nivel de recurrencia y confianza dentro de la comunidad FigusUY.
            </p>
          </div>

          {/* Top Favorited */}
          <div style={card}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>star</span>
              Más Favoritos (Top 5)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.topFavorited.map(([name, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fafaf9', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{name || 'Anónimo'}</span>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>{count} ❤️</span>
                </div>
              ))}
              {stats.topFavorited.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Sin datos aún</p>}
            </div>
          </div>

          {/* Most Active */}
          <div style={card}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>volunteer_activism</span>
              Más Activos (Top 5)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.topUsers.map(([name, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fafaf9', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{name || 'Anónimo'}</span>
                  <span style={{ fontWeight: 800, color: '#3b82f6' }}>{count} favs</span>
                </div>
              ))}
              {stats.topUsers.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Sin datos aún</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
