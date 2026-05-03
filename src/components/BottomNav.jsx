import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useFeatureFlagStore } from '../stores/featureFlagStore'

export default function BottomNav() {
  const { matches, chats } = useAppStore()

  const matchCount = matches?.length || 0
  const unreadChats = chats?.filter(c => c.has_unread)?.length || 0

  const isFeatureEnabled = useFeatureFlagStore(state => state.isFeatureEnabled)

  const navItems = [
    { path: '/album', icon: 'menu_book', label: 'Álbum', feature: 'album' },
    { path: '/matches', icon: 'swap_horiz', label: 'Intercambios', badge: matchCount },
    { path: '/chats', icon: 'chat', label: 'Chats', badge: unreadChats, feature: 'chats' },
    { path: '/favorites', icon: 'favorite', label: 'Favoritos' },
    { path: '/profile', icon: 'person', label: 'Perfil' },
  ].filter(item => !item.feature || isFeatureEnabled(item.feature))

  return (
    <nav className="bottom-nav" style={{ zIndex: 100 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${navItems.length}, 1fr)`, gap: '0.5rem', textAlign: 'center', padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', fontWeight: 700 }}>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem',
              textDecoration: 'none', position: 'relative',
              color: isActive ? 'var(--color-brand-600)' : 'var(--color-text-muted)',
              transition: 'color 0.2s',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ position: 'relative', fontSize: '1.25rem', lineHeight: 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                  {item.badge > 0 && <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
                </div>
                <span style={{ fontSize: '0.6875rem', fontWeight: isActive ? 900 : 500 }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
