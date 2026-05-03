import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { canAccessBusinessDashboard } from '../helpers/businessAccess'
import { useFeatureFlagStore } from '../stores/featureFlagStore'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const { matches, chats } = useAppStore()
  const signOut = useAuthStore(state => state.signOut)
  const profile = useAuthStore(state => state.profile)
  const matchCount = matches?.length || 0
  const unreadChats = chats?.filter(c => c.has_unread)?.length || 0

  const isFeatureEnabled = useFeatureFlagStore(state => state.isFeatureEnabled)

  const navItems = [
    { path: '/album', icon: 'menu_book', label: 'Álbumes', feature: 'album' },
    { path: '/matches', icon: 'swap_horiz', label: 'Intercambios', badge: matchCount },
    { path: '/chats', icon: 'chat', label: 'Chats', badge: unreadChats, feature: 'chats' },
    { path: '/favorites', icon: 'favorite', label: 'Favoritos' },
    { path: '/achievements', icon: 'military_tech', label: 'Mis Logros' },
    { path: '/stores', icon: 'location_on', label: 'Puntos' },
    ...(canAccessBusinessDashboard(profile) ? [{ path: '/business', icon: 'storefront', label: 'Mi local' }] : []),
    { path: '/profile', icon: 'person', label: 'Perfil' },
  ].filter(item => !item.feature || isFeatureEnabled(item.feature))

  return (
    <aside className="app-sidebar">
      <style>{`
        .app-sidebar {
          width: 208px; /* 52 in tailwind */
          background-color: var(--color-surface); /* slate-900 */
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        .sidebar-logo-container {
          height: 96px; /* h-24 */
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid var(--color-border);
        }

        .sidebar-logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 4px;
          background-color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-on-primary);
          font-weight: 900;
          font-size: 1.25rem;
        }

        .sidebar-logo-avatar {
          width: 44px;
          height: 44px;
          border-radius: 4px;
          object-fit: cover;
          background-color: var(--color-border);
        }

        .sidebar-logo-text {
          font-weight: 900;
          font-size: 1rem;
          letter-spacing: -0.025em;
          color: var(--color-text);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .sidebar-logo-subtext {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.25rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.9rem;
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: all 0.2s;
        }

        .sidebar-link:hover {
          background-color: var(--color-surface-hover);
          color: var(--color-text);
        }

        .sidebar-link-active {
          background-color: var(--color-primary) !important;
          color: var(--color-on-primary) !important;
          font-weight: 900;
        }

        .sidebar-icon {
          font-size: 1.125rem;
        }

        .sidebar-badge {
          margin-left: auto;
          background-color: #ef4444;
          color: var(--color-text); font-size: 0.625rem;
          font-weight: 900;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }

        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-footer-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .sidebar-footer-btn:hover {
          background-color: var(--color-surface-hover);
          color: var(--color-text);
        }

        .btn-logout:hover {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
      `}</style>

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
          onClick={() => signOut()}
        >
          <span className="sidebar-icon material-symbols-outlined">logout</span> Salir
        </button>
      </div>
    </aside>
  )
}
