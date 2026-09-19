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
    { path: '/home', icon: 'home', label: 'Inicio', ariaLabel: 'Ir al Inicio' },
    { path: '/album', icon: 'menu_book', label: 'Álbum', ariaLabel: 'Ver mi Álbum', feature: 'album' },
    { path: '/matches', icon: 'swap_horiz', label: 'Intercambios', ariaLabel: 'Ver Intercambios', badge: matchCount },
    { path: '/chats', icon: 'chat', label: 'Chats', ariaLabel: 'Ver Chats', badge: unreadChats, feature: 'chats' },
    { path: '/stores', icon: 'location_on', label: 'Lugares', ariaLabel: 'Ver Lugares y Comercios' },
  ].filter(item => !item.feature || isFeatureEnabled(item.feature))

  return (
    <nav 
      className="bottom-nav" 
      aria-label="Navegación principal inferior"
      style={{ zIndex: 1000 }}
    >
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${navItems.length}, 1fr)`, 
          gap: '0.25rem', 
          textAlign: 'center', 
          padding: '0.375rem 0.5rem 0.25rem', 
          position: 'relative' 
        }}
      >
        {navItems.map(item => (
          <div key={item.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <NavLink
              to={item.path}
              aria-label={item.ariaLabel}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                textDecoration: 'none',
                position: 'relative',
                color: isActive ? 'var(--color-brand-500, #ff5a00)' : 'var(--color-text-muted, #888888)',
                transition: 'color 0.15s ease, transform 0.15s ease',
                width: '100%',
                minHeight: '44px',
                padding: '2px 0'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ position: 'relative', fontSize: '1.35rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '1.5rem',
                        fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400"
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.badge > 0 && (
                      <span 
                        className="nav-badge" 
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-10px',
                          background: 'var(--color-danger, #dc2626)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '9999px',
                          lineHeight: '1.2',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                        }}
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: isActive ? 800 : 500,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </div>
    </nav>
  )
}
