import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useFeatureFlagStore } from '../stores/featureFlagStore'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useLogoutStore } from '../stores/logoutStore'
import ConfirmDialog from './ConfirmDialog'

export default function BottomNav() {
  const { matches, chats } = useAppStore()

  const matchCount = matches?.length || 0
  const unreadChats = chats?.filter(c => c.has_unread)?.length || 0

  const isFeatureEnabled = useFeatureFlagStore(state => state.isFeatureEnabled)
  const signOut = useAuthStore(state => state.signOut)
  const navigate = useNavigate()

  const { openConfirm } = useLogoutStore()

  const [showLogoutOption, setShowLogoutOption] = React.useState(false)
  const longPressTimer = React.useRef(null)

  const handleTouchStart = (e, item) => {
    if (item.path !== '/profile') return
    longPressTimer.current = setTimeout(() => {
      setShowLogoutOption(true)
      if (navigator.vibrate) navigator.vibrate(50)
      // Marcar que fue un long press para evitar el click de NavLink
      longPressTimer.current = 'long-pressed'
    }, 600)
  }

  const handleTouchEnd = (e) => {
    if (longPressTimer.current === 'long-pressed') {
      e.preventDefault()
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleLogoutClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowLogoutOption(false)
    openConfirm()
  }

  const navItems = [
    { path: '/album', icon: 'menu_book', label: '́lbum', feature: 'album' },
    { path: '/matches', icon: 'swap_horiz', label: 'Intercambios', badge: matchCount },
    { path: '/chats', icon: 'chat', label: 'Chats', badge: unreadChats, feature: 'chats' },
    { path: '/favorites', icon: 'favorite', label: 'Favoritos' },
    { path: '/profile', icon: 'person', label: 'Perfil' },
  ].filter(item => !item.feature || isFeatureEnabled(item.feature))

  return (
    <>
      <nav className="bottom-nav" style={{ zIndex: 1000 }} onClick={() => setShowLogoutOption(false)}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${navItems.length}, 1fr)`, gap: '0.5rem', textAlign: 'center', padding: '0.5rem 1rem 0.25rem', fontSize: '0.75rem', fontWeight: 700, position: 'relative' }}>
          {navItems.map(item => (
            <div key={item.path} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <NavLink
                to={item.path}
                onTouchStart={(e) => handleTouchStart(e, item)}
                onTouchEnd={(e) => handleTouchEnd(e)}
                onContextMenu={(e) => { if (item.path === '/profile') e.preventDefault() }}
                style={({ isActive }) => ({
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem',
                  textDecoration: 'none', position: 'relative',
                  color: isActive ? 'var(--color-brand-600)' : 'var(--color-text-muted)',
                  transition: 'color 0.2s',
                  width: '100%',
                  padding: '4px 0'
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

              {item.path === '/profile' && showLogoutOption && (
                <div
                  onClick={handleLogoutClick}
                  style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginBottom: '15px', background: '#dc2626', color: '#fff', padding: '12px 24px',
                    borderRadius: '8px', font: 'italic 900 1.1rem "Barlow Condensed"',
                    textTransform: 'uppercase', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 2001, animation: 'logout-opt-in 0.2s ease-out',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <style>{`
                    @keyframes logout-opt-in {
                      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                      to { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                    .nav-logout-arrow {
                      position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
                      border-left: 10px solid transparent; border-right: 10px solid transparent;
                      border-top: 10px solid #dc2626;
                    }
                  `}</style>
                  Salir de FigusUY
                  <div className="nav-logout-arrow"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
