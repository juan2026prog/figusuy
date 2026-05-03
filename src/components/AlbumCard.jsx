import React from 'react'
import { useThemeStore } from '../stores/themeStore'

export default function AlbumCard({ album, progress, onClick, isSelected }) {
  const { isDark } = useThemeStore()
  const pct = album.total_stickers > 0 ? Math.round((progress / album.total_stickers) * 100) : 0

  const coverImage = album.cover_url || (album.images && album.images.length > 0 ? album.images[0] : null)

  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    padding: '1rem',
    borderRadius: '1.25rem',
    background: isSelected 
      ? (isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed')
      : (isDark ? 'var(--color-surface)' : '#ffffff'), // slate-900 / white
    border: isSelected 
      ? `2px solid ${isDark ? 'var(--color-primary)' : 'var(--color-primary-light)'}` 
      : `1px solid ${isDark ? 'var(--color-border)' : '#e2e8f0'}`, // slate-800 / slate-200
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  }

  const iconStyle = {
    width: '3.5rem',
    height: '4rem',
    borderRadius: '0.75rem',
    background: coverImage ? 'transparent' : 'linear-gradient(135deg, #fb923c, #f59e0b)', // Orange gradient
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: 'white',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }

  return (
    <button onClick={onClick} style={cardStyle} className="hover:scale-[1.01] transition-transform">
      <div style={iconStyle}>
        {coverImage ? (
          <img src={coverImage} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : '⚽'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.125rem', color: isDark ? 'white' : 'var(--color-surface)' }}>
          {album.name}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: isDark ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
          {album.total_stickers} figuritas • {album.year}
        </p>

        {/* Progress bar */}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: isDark ? 'var(--color-primary)' : 'var(--color-primary-light)' }}>{pct}% completado</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isDark ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>{progress} / {album.total_stickers}</span>
          </div>
          <div style={{ height: '0.5rem', borderRadius: '9999px', background: isDark ? 'var(--color-border)' : '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: isDark ? 'var(--color-primary)' : 'var(--color-primary-light)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Chevron */}
      <div style={{ padding: '0.5rem', color: isDark ? '#475569' : 'var(--color-text-secondary)' }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}
