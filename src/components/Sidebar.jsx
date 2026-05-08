import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { canAccessBusinessDashboard } from '../helpers/businessAccess'
import { useFeatureFlagStore } from '../stores/featureFlagStore'
import { useLogoutStore } from '../stores/logoutStore'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const { matches, chats } = useAppStore()
  const profile = useAuthStore(state => state.profile)
  const { openConfirm } = useLogoutStore()
  const matchCount = matches?.length || 0
  const unreadChats = chats?.filter(c => c.has_unread)?.length || 0

  const isFeatureEnabled = useFeatureFlagStore(state => state.isFeatureEnabled)

  let navItems = [
    { path: '/album', icon: 'menu_book', label: 'Ãlbumes', feature: 'album' },
    { path: '/matches', icon: 'swap_horiz', label: 'Intercambios', badge: matchCount },
    { path: '/chats', icon: 'chat', label: 'Chats', badge: unreadChats, feature: 'chats' },
    { path: '/favorites', icon: 'favorite', label: 'Favoritos' },
    { path: '/achievements', icon: 'military_tech', label: 'Mis Logros' },
    { path: '/referidos', icon: 'group_add', label: 'Invitar Amigos' },
    { path: '/stores', icon: 'location_on', label: 'Lugares' },
    { path: '/premium', icon: 'workspace_premium', label: 'Premium' },
    ...(profile?.role === 'influencer' ? [{ path: '/influencer/dashboard', icon: 'campaign', label: 'Mi campaña' }] : []),
    ...(canAccessBusinessDashboard(profile) ? [{ path: '/business', icon: 'storefront', label: 'Mi local' }] : []),
    { path: '/profile', icon: 'person', label: 'Perfil' },
  ].filter(item => !item.feature || isFeatureEnabled(item.feature))

  if (profile?.role === 'influencer') {
    navItems = [
      { path: '/influencer/dashboard', icon: 'campaign', label: 'Mi campaña' },
      { path: '/profile', icon: 'person', label: 'Mi Perfil' },
    ]
  }

  return (
    <aside className="app-sidebar">

      {/* Styles migrated to index.css â€” .app-sidebar section */}

      <div className="sidebar-logo-container">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="sidebar-logo-avatar" />
        ) : (
          <div className="sidebar-logo-icon">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : (profile?.email ? profile.email.charAt(0).toUpperCase() : 'F')}
          </div>
        )}
        <div>
          <p className="sidebar-logo-text">
            {profile?.name || (profile?.email ? profile.email.split('@')[0] : 'FigusUY')}
          </p>
          <p className="sidebar-logo-subtext">Coleccioná mejor</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}
          >
            <span className="sidebar-icon material-symbols-outlined">{item.icon}</span>
            {item.label}
            {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <button 
          className="sidebar-footer-btn btn-logout"
          onClick={openConfirm}
        >
          <span className="sidebar-icon material-symbols-outlined">logout</span> Salir
        </button>
      </div>
    </aside>
  )
}
