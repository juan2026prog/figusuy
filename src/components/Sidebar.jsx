import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export default function Sidebar() {
  const { matches, chats } = useAppStore()
  const signOut = useAuthStore(state => state.signOut)
  const matchCount = matches?.length || 0
  const unreadChats = chats?.filter(c => c.has_unread)?.length || 0

  const navItems = [
    { path: '/album', icon: 'menu_book', label: 'Álbumes' },
    { path: '/matches', icon: 'swap_horiz', label: 'Intercambios', badge: matchCount },
    { path: '/chats', icon: 'chat', label: 'Chats', badge: unreadChats },
    { path: '/favorites', icon: 'favorite', label: 'Favoritos' },
    { path: '/stores', icon: 'location_on', label: '📍 Puntos' },
    { path: '/profile', icon: 'person', label: 'Perfil' },
  ]

  return (
    <aside className="app-sidebar">
      <style>{`
        .app-sidebar {
          width: 208px; /* 52 in tailwind */
          background-color: #0f172a; /* slate-900 */
          border-right: 1px solid #1e293b;
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
          border-bottom: 1px solid #1e293b;
        }

        .sidebar-logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 1rem;
          background-color: #ea580c;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 1.25rem;
        }

        .sidebar-logo-text {
          font-weight: 900;
          font-size: 1.125rem;
          letter-spacing: -0.025em;
          color: white;
          margin: 0;
        }

        .sidebar-logo-subtext {
          font-size: 0.75rem;
          color: #94a3b8;
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
          border-radius: 1rem;
          font-weight: 700;
          font-size: 0.875rem;
          color: #cbd5e1;
          text-decoration: none;
          transition: all 0.2s;
        }

        .sidebar-link:hover {
          background-color: #1e293b;
          color: white;
        }

        .sidebar-link-active {
          background-color: #ea580c !important;
          color: white !important;
          font-weight: 900;
        }

        .sidebar-icon {
          font-size: 1.125rem;
        }

        .sidebar-badge {
          margin-left: auto;
          background-color: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: 900;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }

        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid #1e293b;
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
          border-radius: 1rem;
          font-weight: 700;
          font-size: 0.875rem;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .sidebar-footer-btn:hover {
          background-color: #1e293b;
          color: white;
        }

        .btn-logout:hover {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
      `}</style>

      <div className="sidebar-logo-container">
        <div className="sidebar-logo-icon">F</div>
        <div>
          <p className="sidebar-logo-text">FigusUY</p>
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
