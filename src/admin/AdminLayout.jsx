import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const menuSections = [
  {
    title: 'Principal',
    items: [
      { path: '/admin', icon: '📊', label: 'Dashboard', end: true },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { path: '/admin/albums', icon: '📖', label: 'Álbumes' },
      { path: '/admin/users', icon: '👥', label: 'Usuarios' },
      { path: '/admin/matches', icon: '🤝', label: 'Matches' },
      { path: '/admin/trades', icon: '🔄', label: 'Intercambios' },
    ]
  },
  {
    title: 'Moderación',
    items: [
      { path: '/admin/reports', icon: '🚨', label: 'Reportes' },
      { path: '/admin/moderation', icon: '🛡️', label: 'Seguridad' },
    ]
  },
  {
    title: 'Monetización',
    items: [
      { path: '/admin/plans', icon: '💎', label: 'Planes' },
      { path: '/admin/payments', icon: '💳', label: 'Pagos' },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { path: '/admin/locations', icon: '📍', label: 'Ubicaciones' },
      { path: '/admin/events', icon: '🎉', label: 'Eventos' },
      { path: '/admin/cms', icon: '📝', label: 'CMS' },
      { path: '/admin/notifications', icon: '🔔', label: 'Notificaciones' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { path: '/admin/settings', icon: '⚙️', label: 'Configuración' },
      { path: '/admin/algorithm', icon: '🧠', label: 'Algoritmo' },
      { path: '/admin/roles', icon: '🔐', label: 'Roles' },
      { path: '/admin/audit', icon: '📋', label: 'Auditoría' },
    ]
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '0.625rem',
    padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    fontSize: '0.8125rem', fontWeight: isActive ? 600 : 500,
    color: isActive ? 'white' : '#94a3b8',
    background: isActive ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
    textDecoration: 'none', transition: 'all 0.2s ease',
    cursor: 'pointer',
  })

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '0.875rem',
          }}>F</div>
          {sidebarOpen && <span style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>God Admin</span>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.125rem', padding: '0.25rem',
        }}>{sidebarOpen ? '◀' : '▶'}</button>
      </div>

      {/* Menu */}
      <div style={{ padding: '0.75rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        {menuSections.map(section => (
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
                <span style={{ fontSize: '1rem', width: '1.25rem', textAlign: 'center' }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #1e293b' }}>
        <div
          onClick={() => navigate('/home')}
          style={{
            ...linkStyle(false),
            gap: '0.5rem', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '1rem' }}>🏠</span>
          {sidebarOpen && <span style={{ fontSize: '0.75rem' }}>Volver a la app</span>}
        </div>
        {sidebarOpen && (
          <div style={{ padding: '0.5rem 0.75rem', marginTop: '0.375rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{profile?.name || 'Admin'}</p>
            <p style={{ fontSize: '0.625rem', color: '#475569' }}>{profile?.email}</p>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
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
        background: '#0f172a', borderRight: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'width 0.3s ease', overflow: 'hidden',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
      className="admin-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '15rem' : '3.5rem', transition: 'margin 0.3s ease' }}>
        {/* Topbar */}
        <header style={{
          height: '3.5rem', background: 'white', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="admin-mobile-toggle"
            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
          >☰</button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>God Admin</span>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.75rem',
            }}>
              {profile?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '1.5rem', background: '#f8fafc', minHeight: 'calc(100vh - 3.5rem)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
