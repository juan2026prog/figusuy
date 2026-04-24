import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Inicio' },
  { path: '/album', icon: AlbumIcon, label: 'Álbum' },
  { path: '/matches', icon: MatchIcon, label: 'Matches' },
  { path: '/chats', icon: ChatIcon, label: 'Chat' },
  { path: '/profile', icon: ProfileIcon, label: 'Perfil' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: '32rem', margin: '0 auto' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/home' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                padding: '0.25rem 0.75rem',
                textDecoration: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transition: 'color 0.2s ease',
                fontSize: '0.625rem',
                fontWeight: isActive ? 600 : 500,
                position: 'relative',
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: '-0.5rem',
                  width: '1.25rem',
                  height: '0.1875rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                }} />
              )}
              <item.icon size={22} active={isActive} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function AlbumIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function MatchIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ChatIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ProfileIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
