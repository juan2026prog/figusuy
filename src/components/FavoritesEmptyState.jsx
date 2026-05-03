import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../stores/themeStore'

export default function FavoritesEmptyState() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()

  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 1.5rem',
      maxWidth: '24rem',
      margin: '0 auto',
      color: isDark ? 'var(--color-text-secondary)' : 'var(--color-text-muted)'
    }}>
      <div style={{
        width: '4rem', height: '4rem',
        borderRadius: '1rem',
        background: isDark ? 'var(--color-border)' : '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
        color: isDark ? '#475569' : 'var(--color-text-secondary)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>favorite</span>
      </div>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 900,
        color: isDark ? 'white' : 'var(--color-surface)',
        margin: '0 0 0.5rem'
      }}>
        Todavía no tenés favoritos
      </h2>
      <p style={{
        fontSize: '0.875rem',
        lineHeight: 1.5,
        margin: '0 0 1.5rem'
      }}>
        Cuando encuentres alguien interesante para intercambiar, tocá el corazón y lo vas a ver acá.
      </p>
      <button 
        onClick={() => navigate('/matches')}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '1rem',
          background: 'rgba(249, 115, 22, 0.15)',
          color: 'var(--color-primary-light)',
          fontWeight: 900,
          fontSize: '0.875rem',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'}
      >
        Buscar cruces
      </button>
    </div>
  )
}
