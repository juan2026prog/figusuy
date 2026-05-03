import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { getBusinessPlanLabel } from '../lib/businessPlans'

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
      console.warn('No location found for user', error)
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
    { path: '/business/metrics', label: 'Metricas', icon: 'insights' },
    { path: '/business/billing', label: 'Plan y facturacion', icon: 'payments' },
    ...(location?.business_plan === 'legend' ? [{ path: '/business/legend', label: 'Validaciones PartnerStore', icon: 'workspace_premium' }] : []),
    { path: '/business/help', label: 'Ayuda', icon: 'help' }
  ]

  if (loading) {
    return (
      <div className="biz-loading-shell">
        <style>{`
          .biz-loading-shell {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #0b0b0b;
            color: #f5f5f5;
            font-family: 'Barlow', sans-serif;
          }
          .biz-loading-shell p {
            font: italic 900 2.2rem 'Barlow Condensed';
            text-transform: uppercase;
            letter-spacing: .04em;
          }
        `}</style>
        <p>Cargando panel...</p>
      </div>
    )
  }

  return (
    <div className="business-layout">
      <style>{`
        .business-layout {
          --bg: #0b0b0b;
          --panel: #121212;
          --panel2: #181818;
          --panel3: #202020;
          --line: rgba(255, 255, 255, .08);
          --line2: rgba(255, 255, 255, .14);
          --text: #f5f5f5;
          --muted: rgba(245, 245, 245, .58);
          --muted2: rgba(245, 245, 245, .34);
          --orange: #ff5a00;
          --orange2: #cc4800;
          --green: #22c55e;
          --blue: #38bdf8;
          --yellow: #facc15;
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at top right, rgba(255, 90, 0, .1), transparent 26%),
            linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
          color: var(--text);
          font-family: 'Barlow', sans-serif;
        }

        .business-layout * { box-sizing: border-box; }

        .biz-sidebar {
          width: 290px;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(180deg, rgba(255, 90, 0, .08) 0%, rgba(255, 90, 0, 0) 22%),
            #090909;
          border-right: 1px solid var(--line);
        }

        .biz-sidebar-header {
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          border-bottom: 1px solid var(--line);
        }

        .biz-sidebar-header::before {
          content: 'BUSINESS';
          position: absolute;
          right: .6rem;
          top: -.1rem;
          font: italic 900 3.8rem 'Barlow Condensed';
          line-height: .85;
          color: rgba(255, 255, 255, .04);
          pointer-events: none;
        }

        .biz-sidebar-kicker,
        .biz-page-kicker {
          font: 900 .72rem 'Barlow Condensed';
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--orange);
        }

        .biz-sidebar-header h2 {
          position: relative;
          z-index: 1;
          margin: .4rem 0 0;
          font: italic 900 2.25rem 'Barlow Condensed';
          line-height: .88;
          text-transform: uppercase;
        }

        .biz-sidebar-header p {
          position: relative;
          z-index: 1;
          margin-top: .55rem;
          color: var(--muted);
          font-size: .9rem;
          line-height: 1.45;
        }

        .biz-plan-chip {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          margin-top: .9rem;
          padding: .45rem .6rem;
          border: 1px solid rgba(255, 90, 0, .35);
          background: rgba(255, 90, 0, .08);
          color: var(--orange);
          font: 900 .7rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .biz-nav {
          flex: 1;
          padding: 1.2rem .9rem;
          display: flex;
          flex-direction: column;
          gap: .45rem;
        }

        .biz-nav-item {
          display: flex;
          align-items: center;
          gap: .8rem;
          padding: .9rem 1rem;
          border: 1px solid transparent;
          color: var(--muted);
          text-decoration: none;
          font: 900 .9rem 'Barlow Condensed';
          letter-spacing: .04em;
          text-transform: uppercase;
          transition: .2s ease;
        }

        .biz-nav-item:hover {
          border-color: var(--line2);
          background: #121212;
          color: #fff;
        }

        .biz-nav-item.active {
          border-color: rgba(255, 90, 0, .35);
          background: rgba(255, 90, 0, .08);
          color: #fff;
        }

        .biz-nav-item .material-symbols-outlined {
          font-size: 1.2rem;
        }

        .biz-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .biz-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.15rem 1.5rem;
          border-bottom: 1px solid var(--line);
          background: rgba(11, 11, 11, .95);
          backdrop-filter: blur(8px);
        }

        .biz-header-copy h1 {
          margin: 0;
          font: italic 900 2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .biz-header-copy p {
          margin: .35rem 0 0;
          color: var(--muted);
          font-size: .84rem;
        }

        .biz-exit-btn {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .78rem 1rem;
          border: 1px solid var(--line2);
          background: transparent;
          color: #fff;
          font: 900 .8rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .biz-exit-btn:hover {
          border-color: var(--orange);
          color: var(--orange);
        }

        .biz-content {
          flex: 1;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .biz-page,
        .biz-two-col,
        .biz-grid-2,
        .biz-grid-3,
        .biz-grid-auto {
          display: grid;
          gap: 1.25rem;
        }

        .biz-two-col {
          grid-template-columns: minmax(0, 1.45fr) minmax(300px, .95fr);
          align-items: start;
        }

        .biz-grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .biz-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .biz-grid-auto {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .biz-section-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 1rem;
          margin-bottom: .15rem;
        }

        .biz-section-head h2,
        .biz-card-title {
          margin: .45rem 0 0;
          font: italic 900 2.4rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .biz-section-head p,
        .biz-card-copy,
        .biz-text-muted {
          color: var(--muted);
          line-height: 1.58;
        }

        .biz-card,
        .biz-panel,
        .biz-kpi,
        .biz-action-card,
        .biz-table-card {
          border: 1px solid var(--line);
          background: var(--panel);
        }

        .biz-card,
        .biz-panel,
        .biz-table-card {
          padding: 1.35rem;
        }

        .biz-card.emphasis {
          background:
            linear-gradient(180deg, rgba(255, 90, 0, .1) 0%, rgba(255, 90, 0, 0) 100%),
            var(--panel2);
        }

        .biz-kpi {
          padding: 1.2rem;
          background: #0d0d0d;
        }

        .biz-kpi-label {
          color: var(--muted2);
          font: 900 .72rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .biz-kpi-value {
          display: block;
          margin-top: .45rem;
          font: italic 900 2.4rem 'Barlow Condensed';
          line-height: .88;
          text-transform: uppercase;
        }

        .biz-btn-primary,
        .biz-btn-secondary,
        .biz-btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .45rem;
          padding: .82rem 1.1rem;
          border: 1px solid var(--line2);
          font: 900 .82rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }

        .biz-btn-primary {
          background: var(--orange);
          border-color: var(--orange);
          color: #fff;
        }

        .biz-btn-primary:hover {
          background: var(--orange2);
          border-color: var(--orange2);
        }

        .biz-btn-secondary {
          background: transparent;
          color: #fff;
        }

        .biz-btn-secondary:hover {
          border-color: var(--orange);
          color: var(--orange);
        }

        .biz-btn-danger {
          background: rgba(239, 68, 68, .08);
          border-color: rgba(239, 68, 68, .35);
          color: #fca5a5;
        }

        .biz-chip {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          padding: .42rem .62rem;
          border: 1px solid var(--line2);
          background: #0d0d0d;
          font: 900 .7rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .biz-chip.orange {
          color: var(--orange);
          border-color: rgba(255, 90, 0, .35);
          background: rgba(255, 90, 0, .08);
        }

        .biz-chip.green {
          color: var(--green);
          border-color: rgba(34, 197, 94, .35);
          background: rgba(34, 197, 94, .08);
        }

        .biz-chip.blue {
          color: var(--blue);
          border-color: rgba(56, 189, 248, .35);
          background: rgba(56, 189, 248, .08);
        }

        .biz-empty-state {
          padding: 2rem;
          border: 1px solid var(--line);
          background: var(--panel);
        }

        .biz-empty-state h2 {
          margin: 0 0 .7rem;
          font: italic 900 2.4rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .biz-empty-state p {
          margin-bottom: 1.4rem;
          color: var(--muted);
          line-height: 1.58;
        }

        @media (max-width: 1100px) {
          .business-layout {
            flex-direction: column;
          }

          .biz-sidebar {
            width: 100%;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }

          .biz-nav {
            flex-direction: row;
            overflow-x: auto;
            padding: .9rem;
          }

          .biz-nav-item {
            white-space: nowrap;
          }

          .biz-two-col,
          .biz-grid-2,
          .biz-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .biz-header,
          .biz-content {
            padding: 1rem;
          }

          .biz-header {
            display: block;
          }

          .biz-exit-btn {
            width: 100%;
            margin-top: .85rem;
          }

          .biz-section-head {
            display: block;
          }

          .biz-section-head h2,
          .biz-card-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <aside className="biz-sidebar">
        <div className="biz-sidebar-header">
          <div className="biz-sidebar-kicker">/ panel negocios</div>
          <h2>FigusUY Negocios</h2>
          <p>Gestiona tu local, mejora tu visibilidad y mantene activo tu punto dentro del ecosistema.</p>
          <div className="biz-plan-chip">
            {getBusinessPlanLabel(location?.business_plan)}
          </div>
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
          <div className="biz-header-copy">
            <div className="biz-page-kicker">/ local activo</div>
            <h1>{location ? location.name : 'Configurando local...'}</h1>
            <p>{getBusinessPlanLabel(location?.business_plan)} · Panel comercial</p>
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
