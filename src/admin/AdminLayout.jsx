"use client"

import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export const dynamic = "force-dynamic"
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
      { path: '/admin/albums', icon: 'menu_book', label: 'Álbumes', perm: 'admin.albums' },
      { path: '/admin/users', icon: 'person', label: 'Usuarios', perm: 'admin.users' },
      { path: '/admin/matches', icon: 'swap_horiz', label: 'Cruces', perm: 'admin.matches' },
      { path: '/admin/exchange-completion', icon: 'verified', label: 'Exchange Completion', perm: 'admin.exchange_completion' },
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
      { path: '/admin/sponsored', icon: 'campaign', label: 'Promos', perm: 'admin.promos' },
    ]
  },
  {
    title: 'Moderacion',
    items: [
      { path: '/admin/reports', icon: 'report', label: 'Reportes', perm: 'admin.reports' },
      { path: '/admin/contact-requests', icon: 'contact_support', label: 'Contactos', perm: 'admin.reports' },
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
      { path: '/admin/influencers', icon: 'campaign', label: 'Influencers', perm: 'admin.affiliates' },
      { path: '/admin/influencer-applications', icon: 'person_add', label: 'Solicitudes', perm: 'admin.affiliates' },
      { path: '/admin/influencer-campaigns', icon: 'ads_click', label: 'Campanas', perm: 'admin.affiliates' },
      { path: '/admin/influencer-benefits', icon: 'redeem', label: 'Beneficios', perm: 'admin.affiliates' },
      { path: '/admin/influencer-commissions', icon: 'tune', label: 'Tier Engine', perm: 'admin.affiliates' },
      { path: '/admin/influencer-payments', icon: 'payments', label: 'Pagos afiliados', perm: 'admin.affiliates' },
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
      { path: '/admin/email-lifecycle', icon: 'mail', label: 'Email Lifecycle', perm: 'admin.settings' },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { path: '/admin/cms', icon: 'article', label: 'Landings', perm: 'admin.cms' },
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
  const { profile, signOut } = useAuthStore()
  const { checkAdmin, fetchRolePermissions, adminRole, adminPermissions } = useAdminStore()
  const [accessDenied, setAccessDenied] = useState(false)
  const [checking, setChecking] = useState(true)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

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
          <button className="admin-nav-link admin-nav-ghost" onClick={handleLogout} style={{ color: 'var(--admin-red)' }}>
            <span className="material-symbols-outlined">logout</span>
            {sidebarOpen && <span>Salir</span>}
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
            <button className="admin-icon-btn" onClick={handleLogout} style={{ color: 'var(--admin-red)' }} title="Salir">
              <span className="material-symbols-outlined">logout</span>
            </button>
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
  .admin-action-btn {
    display: flex;
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
      flex-wrap: wrap;
    }

    .admin-top-status {
      display: none;
    }

    .ag-hero-row {
      flex-direction: column;
      align-items: stretch;
    }

    .ag-icon-box {
      align-self: flex-start;
    }
  }
`;
