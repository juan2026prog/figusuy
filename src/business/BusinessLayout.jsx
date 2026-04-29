import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function BusinessLayout() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLocation()
    }
  }, [user])

  const fetchLocation = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('owner_user_id', user.id)
      .single()
    
    if (error) {
      console.warn("No location found for user", error)
      // They don't have a location, redirect to home or somewhere to create one.
      // For now, let's keep them here but they see no data
    } else {
      setLocation(data)
    }
    setLoading(false)
  }

  const navItems = [
    { path: '/business', label: 'Resumen', icon: 'dashboard', end: true },
    { path: '/business/profile', label: 'Mi perfil', icon: 'storefront' },
    { path: '/business/photos', label: 'Fotos', icon: 'photo_library' },
    { path: '/business/promo', label: 'Promo activa', icon: 'campaign' },
    { path: '/business/metrics', label: 'Métricas', icon: 'insights' },
    { path: '/business/billing', label: 'Plan y facturación', icon: 'payments' },
    { path: '/business/help', label: 'Ayuda', icon: 'help' }
  ]

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: '#020617' }}>
        <p style={{ color: 'white' }}>Cargando panel...</p>
      </div>
    )
  }

  return (
    <div className="business-layout">
      <style>{`
        .business-layout {
          display: flex;
          min-height: 100vh;
          background: #020617;
          color: #f8fafc;
        }

        .biz-sidebar {
          width: 260px;
          background: #0f172a;
          border-right: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
        }

        .biz-sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #1e293b;
        }
        .biz-sidebar-header h2 {
          font-size: 1.25rem;
          font-weight: 900;
          color: #f97316;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }
        .biz-sidebar-header p {
          font-size: 0.8125rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .biz-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .biz-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .biz-nav-item:hover {
          background: #1e293b;
          color: white;
        }
        .biz-nav-item.active {
          background: #f97316;
          color: white;
        }
        .biz-nav-item .material-symbols-outlined {
          font-size: 1.25rem;
        }

        .biz-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow-y: auto;
          height: 100vh;
        }

        .biz-header {
          padding: 1.5rem 2rem;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .biz-content {
          padding: 2rem;
          flex: 1;
        }

        .biz-exit-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #1e293b;
          border: 1px solid #334155;
          color: #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .biz-exit-btn:hover {
          background: #334155;
        }

        @media (max-width: 1024px) {
          .business-layout {
            flex-direction: column;
          }
          .biz-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #1e293b;
          }
          .biz-nav {
            flex-direction: row;
            overflow-x: auto;
            padding: 1rem;
            gap: 1rem;
          }
          .biz-nav-item {
            white-space: nowrap;
            padding: 0.5rem 1rem;
          }
          .biz-header {
            padding: 1rem;
          }
          .biz-content {
            padding: 1rem;
          }
        }
      `}</style>

      <aside className="biz-sidebar">
        <div className="biz-sidebar-header">
          <h2>FigusUY Negocios</h2>
          <p>Mi local</p>
        </div>
        <nav className="biz-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `biz-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="biz-main">
        <header className="biz-header">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{location ? location.name : 'Configurando local...'}</h1>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{location?.business_plan === 'dominio' ? '🌟 Plan Dominio' : (location?.business_plan === 'turbo' ? '⭐ Plan Turbo' : 'Plan Gratis')}</p>
          </div>
          <button className="biz-exit-btn" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>logout</span>
            Volver a FigusUY
          </button>
        </header>

        <div className="biz-content">
          <Outlet context={{ location, setLocation, fetchLocation }} />
        </div>
      </main>
    </div>
  )
}
