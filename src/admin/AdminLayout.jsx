import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'

const menuSections = [
  {
    title: 'Principal',
    items: [
      { path: '/admin', icon: 'dashboard', label: 'Dashboard', end: true, perm: 'admin.dashboard' },
    ]
  },
  {
    title: 'Producto',
    items: [
      { path: '/admin/albums', icon: 'menu_book', label: 'Albumes', perm: 'admin.albums' },
      { path: '/admin/users', icon: 'person', label: 'Usuarios', perm: 'admin.users' },
      { path: '/admin/matches', icon: 'swap_horiz', label: 'Cruces', perm: 'admin.matches' },
      { path: '/admin/chats', icon: 'chat', label: 'Chats', perm: 'admin.chats' },
      { path: '/admin/favorites', icon: 'favorite', label: 'Favoritos', perm: 'admin.favorites' },
      { path: '/admin/gamification', icon: 'military_tech', label: 'Gamificacion', perm: 'admin.users' },
    ]
  },
  {
    title: 'Negocios',
    items: [
      { path: '/admin/locations', icon: 'storefront', label: 'Puntos', perm: 'admin.locations' },
      { path: '/admin/location-requests', icon: 'how_to_reg', label: 'Solicitudes', perm: 'admin.location_requests' },
      { path: '/admin/business-plans', icon: 'store', label: 'Planes negocio', perm: 'admin.business_plans' },
      { path: '/admin/promos', icon: 'campaign', label: 'Promos', perm: 'admin.promos' },
    ]
  },
  {
    title: 'Moderacion',
    items: [
      { path: '/admin/reports', icon: 'report', label: 'Reportes', perm: 'admin.reports' },
      { path: '/admin/blocks', icon: 'block', label: 'Bloqueos', perm: 'admin.blocks' },
      { path: '/admin/security', icon: 'security', label: 'Seguridad', perm: 'admin.security' },
      { path: '/admin/audit', icon: 'assignment', label: 'Auditoria', perm: 'admin.audit' },
    ]
  },
  {
    title: 'Revenue',
    items: [
      { path: '/admin/plans', icon: 'diamond', label: 'Planes usuarios', perm: 'admin.plans' },
      { path: '/admin/subscriptions', icon: 'card_membership', label: 'Suscripciones', perm: 'admin.subscriptions' },
      { path: '/admin/payments', icon: 'payments', label: 'Pagos', perm: 'admin.payments' },
      { path: '/admin/metrics', icon: 'trending_up', label: 'Metricas', perm: 'admin.metrics' },
    ]
  },
  {
    title: 'Afiliados',
    items: [
      { path: '/admin/affiliates', icon: 'campaign', label: 'Influencers', perm: 'admin.affiliates' },
      { path: '/admin/affiliate-campaigns', icon: 'ads_click', label: 'Campanas', perm: 'admin.affiliates' },
      { path: '/admin/affiliate-benefits', icon: 'redeem', label: 'Beneficios', perm: 'admin.affiliates' },
      { path: '/admin/affiliate-commissions', icon: 'account_balance', label: 'Comisiones', perm: 'admin.affiliates' },
      { path: '/admin/affiliate-payments', icon: 'payments', label: 'Pagos afiliados', perm: 'admin.affiliates' },
    ]
  },
  {
    title: 'Growth Engine',
    items: [
      { path: '/admin/smart-notifications', icon: 'notifications_active', label: 'Smart Notifs', perm: 'admin.settings' },
      { path: '/admin/onboarding', icon: 'rocket_launch', label: 'Onboarding', perm: 'admin.settings' },
      { path: '/admin/referrals', icon: 'share', label: 'Referrals', perm: 'admin.settings' },
      { path: '/admin/growth-achievements', icon: 'military_tech', label: 'Growth Logros', perm: 'admin.settings' },
      { path: '/admin/rewards-engine', icon: 'card_giftcard', label: 'Rewards Engine', perm: 'admin.settings' },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { path: '/admin/cms', icon: 'article', label: 'CMS', perm: 'admin.cms' },
      { path: '/admin/branding', icon: 'palette', label: 'Branding', perm: 'admin.settings' },
      { path: '/admin/pages', icon: 'auto_stories', label: 'Paginas', perm: 'admin.settings' },
      { path: '/admin/notifications', icon: 'notifications', label: 'Notificaciones', perm: 'admin.notifications' },
      { path: '/admin/seo', icon: 'travel_explore', label: 'SEO', perm: 'admin.seo' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { path: '/admin/feature-flags', icon: 'toggle_on', label: 'Release control', perm: 'admin.settings' },
      { path: '/admin/settings', icon: 'settings', label: 'Configuracion', perm: 'admin.settings' },
      { path: '/admin/algorithm', icon: 'psychology', label: 'Algoritmo', perm: 'admin.algorithm' },
      { path: '/admin/roles', icon: 'admin_panel_settings', label: 'Roles', perm: 'admin.roles' },
      { path: '/admin/logs', icon: 'receipt_long', label: 'Logs', perm: 'admin.logs' },
    ]
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { checkAdmin, fetchRolePermissions, adminRole, adminPermissions } = useAdminStore()
  const [accessDenied, setAccessDenied] = useState(false)
  const [checking, setChecking] = useState(true)

  React.useEffect(() => {
    const verifyAccess = async () => {
      if (!profile?.id) {
        setAccessDenied(true)
        setChecking(false)
        return
      }

      const isRealAdmin = await checkAdmin(profile.id)
      if (!isRealAdmin) {
        setAccessDenied(true)
      } else {
        const { adminRole: role } = useAdminStore.getState()
        if (role) await fetchRolePermissions(role)
      }
      setChecking(false)
    }
    verifyAccess()
  }, [profile?.id, checkAdmin, fetchRolePermissions])

  const canAccess = (perm) => {
    if (adminRole === 'god_admin') return true
    return adminPermissions.includes(perm)
  }

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccess(item.perm))
    }))
    .filter((section) => section.items.length > 0)

  if (checking) {
    return (
      <div className="admin-shell admin-checking">
        <style>{globalAdminStyles}</style>
        <div className="admin-check-card">
          <div className="admin-kicker">/ acceso seguro</div>
          <h1>Verificando credenciales</h1>
          <p>Comprobando rol, permisos y alcance operativo del panel.</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="admin-shell admin-checking">
        <style>{globalAdminStyles}</style>
        <div className="admin-check-card admin-denied-card">
          <div className="admin-kicker">/ acceso denegado</div>
          <h1>Sin permisos validos</h1>
          <p>Este intento fue bloqueado. Tu usuario no tiene privilegios administrativos confirmados por el servidor.</p>
          <button className="admin-action-btn admin-action-primary" onClick={() => navigate('/profile')}>
            Volver a la app
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <style>{globalAdminStyles}</style>

      {mobileOpen && <div className="admin-mobile-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-top">
          <div className="admin-brand-mark">F</div>
          {sidebarOpen && (
            <div className="admin-brand-copy">
              <div className="admin-kicker">/ control total</div>
              <h2>FigusUY Admin</h2>
            </div>
          )}
          <button className="admin-icon-btn admin-desktop-toggle" onClick={() => setSidebarOpen((value) => !value)} aria-label="Expandir sidebar">
            <span className="material-symbols-outlined">{sidebarOpen ? 'left_panel_close' : 'left_panel_open'}</span>
          </button>
        </div>

        <div className="admin-sidebar-scroll">
          {filteredSections.map((section) => (
            <section key={section.title} className="admin-nav-group">
              {sidebarOpen && <div className="admin-nav-title">{section.title}</div>}
              <div className="admin-nav-list">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="admin-sidebar-bottom">
          <button className="admin-nav-link admin-nav-ghost" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">home</span>
            {sidebarOpen && <span>Volver a la app</span>}
          </button>
          {sidebarOpen && (
            <div className="admin-identity-card">
              <div className="admin-identity-row">
                <div className="admin-avatar-chip">{profile?.name?.[0] || 'A'}</div>
                <div>
                  <strong>{profile?.name || 'Admin'}</strong>
                  <span>{profile?.email}</span>
                </div>
              </div>
              <div className="admin-role-pill">{adminRole || 'admin'}</div>
            </div>
          )}
        </div>
      </aside>

      <div className={`admin-main ${sidebarOpen ? 'wide' : 'compact'}`}>
        <header className="admin-topbar">
          <div>
            <div className="admin-kicker">/ panel operativo</div>
            <h1>Centro de control editorial</h1>
          </div>

          <div className="admin-topbar-actions">
            <button className="admin-icon-btn admin-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="admin-top-status">
              <span className="material-symbols-outlined">shield</span>
              Operacion segura
            </div>
            <div className="admin-top-user">
              <div className="admin-avatar-chip">{profile?.name?.[0] || 'A'}</div>
              <div>
                <strong>{profile?.name || 'Admin'}</strong>
                <span>{adminRole || 'admin'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-theme-scope">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const globalAdminStyles = `
  .admin-shell {
    --admin-bg: #0b0b0b;
    --admin-panel: #121212;
    --admin-panel2: #181818;
    --admin-panel3: #202020;
    --admin-line: rgba(255,255,255,.08);
    --admin-line2: rgba(255,255,255,.14);
    --admin-text: #f5f5f5;
    --admin-muted: rgba(245,245,245,.62);
    --admin-muted2: rgba(245,245,245,.38);
    --admin-orange: #ff5a00;
    --admin-orange2: #cc4800;
    --admin-green: #22c55e;
    --admin-blue: #38bdf8;
    --admin-yellow: #facc15;
    --admin-red: #ef4444;
    min-height: 100vh;
    display: flex;
    background:
      radial-gradient(circle at top right, rgba(255,90,0,.08), transparent 24%),
      linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
    color: var(--admin-text);
    font-family: 'Barlow', sans-serif;
  }

  .admin-generic-page {
    display: grid;
    gap: 1.25rem;
  }

  .ag-hero,
  .ag-card,
  .ag-feature {
    border: 1px solid var(--admin-line);
    background: var(--admin-panel);
  }

  .ag-hero {
    position: relative;
    overflow: hidden;
    padding: 1.4rem;
    background:
      linear-gradient(135deg, rgba(255,90,0,.14) 0%, rgba(255,90,0,.04) 24%, transparent 44%),
      linear-gradient(180deg, #171717 0%, #101010 100%);
  }

  .ag-hero::before {
    content: 'MODULO';
    position: absolute;
    right: 1rem;
    top: -.1rem;
    font: italic 900 clamp(3.2rem, 8vw, 6rem) 'Barlow Condensed';
    line-height: .84;
    color: rgba(255,255,255,.04);
    pointer-events: none;
  }

  .ag-hero-row {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
  }

  .ag-title {
    margin: .5rem 0 0;
    font: italic 900 clamp(2.4rem, 5vw, 4rem) 'Barlow Condensed';
    text-transform: uppercase;
    line-height: .86;
  }

  .ag-desc,
  .ag-card p,
  .ag-feature p {
    color: var(--admin-muted);
    line-height: 1.58;
  }

  .ag-icon-box {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,90,0,.32);
    background: rgba(255,90,0,.08);
    color: var(--admin-orange);
    flex-shrink: 0;
  }

  .ag-icon-box .material-symbols-outlined {
    font-size: 2rem;
  }

  .ag-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, .7fr);
    gap: 1.25rem;
  }

  .ag-card {
    padding: 1.3rem;
  }

  .ag-card h3 {
    margin: .45rem 0 0;
    font: italic 900 2rem 'Barlow Condensed';
    line-height: .9;
    text-transform: uppercase;
  }

  .ag-status {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    padding: .46rem .64rem;
    border: 1px solid rgba(34,197,94,.28);
    background: rgba(34,197,94,.08);
    color: var(--admin-green);
    font: 900 .72rem 'Barlow Condensed';
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .ag-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .ag-feature {
    padding: 1rem;
    background: #0d0d0d;
  }

  .ag-feature-head {
    display: flex;
    align-items: center;
    gap: .55rem;
    color: var(--admin-orange);
    font: 900 .76rem 'Barlow Condensed';
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .ag-feature-head .material-symbols-outlined {
    font-size: 1rem;
  }

  .ag-feature p {
    margin-top: .6rem;
    font-size: .9rem;
  }

  /* Form & Input Reset for ag-card */
  .admin-theme-scope input,
  .admin-theme-scope select,
  .admin-theme-scope textarea {
    background: #0d0d0d !important;
    color: #fff !important;
    border: 1px solid var(--admin-line) !important;
    border-radius: 0.5rem !important;
    padding: 0.625rem 0.875rem;
  }

  .admin-theme-scope table {
    width: 100%;
    border-collapse: collapse;
    background: transparent !important;
  }

  .admin-theme-scope thead {
    background: var(--admin-panel2) !important;
    border-bottom: 2px solid var(--admin-line) !important;
  }

  .admin-theme-scope th {
    padding: 1rem;
    color: #f5f5f5 !important;
    font-weight: 800;
    text-transform: uppercase;
    font-size: 0.75rem;
    border-color: var(--admin-line) !important;
  }

  .admin-theme-scope tr {
    border-bottom: 1px solid var(--admin-line) !important;
  }

  .admin-theme-scope td {
    padding: 1rem;
    color: var(--admin-muted) !important;
    border-color: var(--admin-line) !important;
  }

  .admin-theme-scope tr:hover {
    background: rgba(255,255,255,0.02) !important;
  }

  .admin-shell * {
    box-sizing: border-box;
  }

  .admin-checking {
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .admin-check-card {
    width: min(100%, 40rem);
    padding: 1.8rem;
    border: 1px solid var(--admin-line);
    background:
      linear-gradient(135deg, rgba(255,90,0,.14) 0%, rgba(255,90,0,.04) 28%, transparent 48%),
      var(--admin-panel);
  }

  .admin-denied-card {
    border-color: rgba(239,68,68,.24);
    background:
      linear-gradient(135deg, rgba(239,68,68,.14) 0%, rgba(239,68,68,.04) 28%, transparent 48%),
      var(--admin-panel);
  }

  .admin-check-card h1 {
    margin: .55rem 0 0;
    font: italic 900 clamp(2.3rem, 5vw, 3.8rem) 'Barlow Condensed';
    line-height: .88;
    text-transform: uppercase;
  }

  .admin-check-card p {
    margin-top: .8rem;
    color: var(--admin-muted);
    line-height: 1.55;
  }

  .admin-kicker {
    font: 900 .72rem 'Barlow Condensed';
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--admin-orange);
  }

  .admin-sidebar {
    width: 308px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background:
      linear-gradient(180deg, rgba(255,90,0,.08) 0%, rgba(255,90,0,0) 18%),
      #090909;
    border-right: 1px solid var(--admin-line);
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 40;
    transition: width .25s ease, transform .25s ease;
  }

  .admin-sidebar.collapsed {
    width: 88px;
  }

  .admin-sidebar-top {
    position: relative;
    padding: 1.25rem;
    border-bottom: 1px solid var(--admin-line);
    display: flex;
    gap: .9rem;
    align-items: center;
  }

  .admin-sidebar-top::before {
    content: 'ADMIN';
    position: absolute;
    right: .8rem;
    top: -.1rem;
    font: italic 900 3.6rem 'Barlow Condensed';
    line-height: .85;
    color: rgba(255,255,255,.04);
    pointer-events: none;
  }

  .admin-brand-mark,
  .admin-avatar-chip {
    width: 2.5rem;
    height: 2.5rem;
    display: grid;
    place-items: center;
    background: var(--admin-orange);
    color: #fff;
    font: 900 .95rem 'Barlow Condensed';
    flex-shrink: 0;
  }

  .admin-brand-copy h2 {
    margin: .35rem 0 0;
    font: italic 900 2rem 'Barlow Condensed';
    line-height: .88;
    text-transform: uppercase;
  }

  .admin-icon-btn {
    display: inline-grid;
    place-items: center;
    width: 2.35rem;
    height: 2.35rem;
    border: 1px solid var(--admin-line2);
    background: transparent;
    color: #fff;
    cursor: pointer;
  }

  .admin-icon-btn:hover {
    border-color: var(--admin-orange);
    color: var(--admin-orange);
  }

  .admin-desktop-toggle {
    margin-left: auto;
    position: relative;
    z-index: 1;
  }

  .admin-sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1rem .85rem;
  }

  .admin-nav-group + .admin-nav-group {
    margin-top: 1rem;
  }

  .admin-nav-title {
    margin-bottom: .5rem;
    padding: 0 .75rem;
    color: var(--admin-muted2);
    font: 900 .68rem 'Barlow Condensed';
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .admin-nav-list {
    display: grid;
    gap: .35rem;
  }

  .admin-nav-link {
    display: flex;
    align-items: center;
    gap: .8rem;
    min-height: 44px;
    padding: .75rem .85rem;
    border: 1px solid transparent;
    color: var(--admin-muted);
    text-decoration: none;
    font: 900 .86rem 'Barlow Condensed';
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .admin-nav-link:hover {
    border-color: var(--admin-line2);
    background: #121212;
    color: #fff;
  }

  .admin-nav-link.active {
    border-color: rgba(255,90,0,.35);
    background: rgba(255,90,0,.08);
    color: #fff;
  }

  .admin-nav-link .material-symbols-outlined {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .admin-nav-ghost {
    width: 100%;
    background: transparent;
    cursor: pointer;
  }

  .admin-sidebar-bottom {
    padding: .85rem;
    border-top: 1px solid var(--admin-line);
  }

  .admin-identity-card {
    margin-top: .8rem;
    padding: .9rem;
    border: 1px solid var(--admin-line);
    background: rgba(255,255,255,.03);
  }

  .admin-identity-row {
    display: flex;
    gap: .75rem;
    align-items: center;
  }

  .admin-identity-card strong,
  .admin-top-user strong {
    display: block;
    color: #fff;
    font-size: .88rem;
  }

  .admin-identity-card span,
  .admin-top-user span {
    display: block;
    color: var(--admin-muted2);
    font-size: .74rem;
  }

  .admin-role-pill {
    margin-top: .8rem;
    display: inline-flex;
    align-items: center;
    padding: .38rem .58rem;
    border: 1px solid rgba(255,90,0,.32);
    background: rgba(255,90,0,.08);
    color: var(--admin-orange);
    font: 900 .68rem 'Barlow Condensed';
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .admin-main {
    flex: 1;
    min-width: 0;
    margin-left: 308px;
    transition: margin-left .25s ease;
  }

  .admin-main.compact {
    margin-left: 88px;
  }

  .admin-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.35rem;
    border-bottom: 1px solid var(--admin-line);
    background: rgba(11,11,11,.95);
    backdrop-filter: blur(8px);
  }

  .admin-topbar h1 {
    margin: .35rem 0 0;
    font: italic 900 2rem 'Barlow Condensed';
    line-height: .88;
    text-transform: uppercase;
  }

  .admin-topbar-actions {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .admin-top-status {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    padding: .5rem .72rem;
    border: 1px solid rgba(34,197,94,.25);
    background: rgba(34,197,94,.08);
    color: var(--admin-green);
    font: 900 .72rem 'Barlow Condensed';
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .admin-top-user {
    display: flex;
    align-items: center;
    gap: .7rem;
    padding-left: .2rem;
  }

  .admin-content {
    padding: 1.35rem;
  }

  .admin-theme-scope {
    max-width: 1440px;
    margin: 0 auto;
  }

  .admin-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .45rem;
    padding: .82rem 1.1rem;
    border: 1px solid var(--admin-line2);
    background: transparent;
    color: #fff;
    font: 900 .82rem 'Barlow Condensed';
    letter-spacing: .08em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .admin-action-primary {
    background: var(--admin-orange);
    border-color: var(--admin-orange);
  }

  .admin-action-primary:hover {
    background: var(--admin-orange2);
    border-color: var(--admin-orange2);
  }

  .admin-mobile-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.72);
    z-index: 35;
  }

  .admin-mobile-toggle {
    display: none;
  }

  @media (max-width: 1100px) {
    .admin-sidebar {
      transform: translateX(-100%);
      width: 308px;
    }

    .admin-sidebar.mobile-open {
      transform: translateX(0);
    }

    .admin-main,
    .admin-main.compact {
      margin-left: 0;
    }

    .admin-mobile-toggle {
      display: inline-grid;
    }

    .admin-desktop-toggle {
      display: none;
    }
  }

  @media (max-width: 720px) {
    .admin-topbar,
    .admin-content {
      padding: 1rem;
    }

    .admin-topbar {
      display: block;
    }

    .admin-topbar-actions {
      margin-top: .85rem;
      justify-content: space-between;
    }

    .admin-top-status {
      display: none;
    }
  }
`
