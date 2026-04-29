import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'

// Permission key derived from path: /admin/albums -> admin.albums
const menuSections = [
  {
    title: 'Principal',
    items: [
      { path: '/admin', icon: 'bar_chart', label: 'Dashboard', end: true, perm: 'admin.dashboard' },
    ]
  },
  {
    title: 'Producto',
    items: [
      { path: '/admin/albums', icon: 'menu_book', label: 'Álbumes', perm: 'admin.albums' },
      { path: '/admin/users', icon: 'group', label: 'Usuarios', perm: 'admin.users' },
      { path: '/admin/matches', icon: 'swap_horiz', label: 'Cruces', perm: 'admin.matches' },
      { path: '/admin/chats', icon: 'chat', label: 'Chats', perm: 'admin.chats' },
      { path: '/admin/favorites', icon: 'favorite', label: 'Favoritos', perm: 'admin.favorites' },
    ]
  },
  {
    title: 'Puntos & Negocios',
    items: [
      { path: '/admin/locations', icon: 'storefront', label: 'Puntos', perm: 'admin.locations' },
      { path: '/admin/location-requests', icon: 'how_to_reg', label: 'Solicitudes de locales', perm: 'admin.location_requests' },
      { path: '/admin/business-plans', icon: 'store', label: 'Planes de negocios', perm: 'admin.business_plans' },
      { path: '/admin/promos', icon: 'campaign', label: 'Promos / Visibilidad', perm: 'admin.promos' },
    ]
  },
  {
    title: 'Moderación',
    items: [
      { path: '/admin/reports', icon: 'report', label: 'Reportes', perm: 'admin.reports' },
      { path: '/admin/blocks', icon: 'block', label: 'Bloqueos', perm: 'admin.blocks' },
      { path: '/admin/security', icon: 'security', label: 'Seguridad', perm: 'admin.security' },
      { path: '/admin/audit', icon: 'assignment', label: 'Auditoría', perm: 'admin.audit' },
    ]
  },
  {
    title: 'Monetización',
    items: [
      { path: '/admin/plans', icon: 'diamond', label: 'Planes de usuarios', perm: 'admin.plans' },
      { path: '/admin/subscriptions', icon: 'card_membership', label: 'Suscripciones', perm: 'admin.subscriptions' },
      { path: '/admin/payments', icon: 'payments', label: 'Pagos', perm: 'admin.payments' },
      { path: '/admin/metrics', icon: 'trending_up', label: 'Métricas comerciales', perm: 'admin.metrics' },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { path: '/admin/cms', icon: 'article', label: 'CMS', perm: 'admin.cms' },
      { path: '/admin/notifications', icon: 'notifications', label: 'Notificaciones', perm: 'admin.notifications' },
      { path: '/admin/seo', icon: 'travel_explore', label: 'SEO', perm: 'admin.seo' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { path: '/admin/settings', icon: 'settings', label: 'Configuración', perm: 'admin.settings' },
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
        // Load permissions for the role
        const { adminRole: role } = useAdminStore.getState()
        if (role) await fetchRolePermissions(role)
      }
      setChecking(false)
    }
    verifyAccess()
  }, [profile?.id, checkAdmin, fetchRolePermissions])

  // Filter menu sections based on permissions
  const canAccess = (perm) => {
    if (adminRole === 'god_admin') return true
    return adminPermissions.includes(perm)
  }

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => canAccess(item.perm))
  })).filter(section => section.items.length > 0)

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '0.625rem',
    padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    fontSize: '0.8125rem', fontWeight: isActive ? 600 : 500,
    color: isActive ? 'white' : '#a8a29e',
    background: isActive ? '#ea580c' : 'transparent',
    textDecoration: 'none', transition: 'all 0.2s ease',
    cursor: 'pointer',
  })

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #292524', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '0.5rem',
            background: '#ea580c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '0.875rem',
          }}>F</div>
          {sidebarOpen && <span style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>Admin Panel</span>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', fontSize: '1.125rem', padding: '0.25rem', display: 'flex', alignItems: 'center'
        }}>
          <span className="material-symbols-outlined">{sidebarOpen ? 'chevron_left' : 'chevron_right'}</span>
        </button>
      </div>

      {/* Menu */}
      <div style={{ padding: '0.75rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        {filteredSections.map(section => (
          <div key={section.title} style={{ marginBottom: '1rem' }}>
            {sidebarOpen && (
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.375rem' }}>
                {section.title}
              </p>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => linkStyle(isActive)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', width: '1.25rem', textAlign: 'center' }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #292524' }}>
        <div
          onClick={() => navigate('/profile')}
          style={{
            ...linkStyle(false),
            gap: '0.5rem', cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>home</span>
          {sidebarOpen && <span style={{ fontSize: '0.75rem' }}>Volver a la app</span>}
        </div>
        {sidebarOpen && (
          <div style={{ padding: '0.5rem 0.75rem', marginTop: '0.375rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#a8a29e', fontWeight: 600 }}>{profile?.name || 'Admin'}</p>
            <p style={{ fontSize: '0.625rem', color: '#475569' }}>{profile?.email}</p>
          </div>
        )}
      </div>
    </>
  )

  if (checking) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1c1917', color: 'white' }}>Verificando credenciales seguras...</div>
  }

  if (accessDenied) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#020617', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', marginBottom: '1rem' }}>Acceso Denegado</h1>
        <p style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '400px', marginBottom: '2rem' }}>
          Este intento ha sido registrado. No tienes privilegios administrativos confirmados por el servidor. Las políticas RLS han bloqueado tu acceso.
        </p>
        <button 
          onClick={() => navigate('/profile')}
          style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Volver a mi perfil
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1c1917' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '15rem' : '3.5rem',
        background: '#1c1917', borderRight: '1px solid #292524',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'width 0.3s ease, transform 0.3s ease', overflow: 'hidden',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
      }}
      className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="admin-main" style={{ flex: 1, marginLeft: sidebarOpen ? '15rem' : '3.5rem', transition: 'margin 0.3s ease' }}>
        {/* Topbar */}
        <header className="admin-topbar" style={{
          height: '3.5rem', background: 'white', borderBottom: '1px solid #e7e5e4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="admin-mobile-toggle"
            aria-label="Abrir menú"
            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 500 }}>Admin Panel</span>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              background: '#ea580c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.75rem',
            }}>
              {profile?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '1.5rem', background: '#fafaf9', minHeight: 'calc(100vh - 3.5rem)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
