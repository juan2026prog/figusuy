import React from 'react'

export default function AlbumCard({ album, progress, onClick, isSelected }) {
  const pct = album.total_stickers > 0 ? Math.round((progress / album.total_stickers) * 100) : 0

  const coverImage = album.cover_url || (album.images && album.images.length > 0 ? album.images[0] : null)

  return (
    <button
      onClick={onClick}
      className="animate-fade-in-up"
      style={{
        display: 'block',
        width: '100%',
        background: isSelected
          ? 'linear-gradient(135deg, #eff6ff, #f5f3ff)'
          : 'var(--color-surface)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.25rem',
        boxShadow: isSelected ? '0 0 0 2px var(--color-primary)' : 'var(--shadow-sm)',
        border: isSelected ? '1px solid var(--color-primary-light)' : '1px solid var(--color-border-light)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Album icon */}
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: 'var(--radius-xl)',
          background: coverImage ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
          overflow: 'hidden',
          border: coverImage ? '1px solid var(--color-border)' : 'none',
        }}>
          {coverImage ? (
            <img src={coverImage} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : '📖'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.125rem' }}>
            {album.name}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {album.total_stickers} figuritas • {album.year}
          </p>

          {/* Progress bar */}
          <div style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
              {pct}% completado
            </p>
          </div>
        </div>

        {/* Chevron */}
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}
