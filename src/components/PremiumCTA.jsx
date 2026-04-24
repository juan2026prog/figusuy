import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function PremiumCTA({ variant = 'inline' }) {
  const navigate = useNavigate()

  if (variant === 'banner') {
    return (
      <div
        className="animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          borderRadius: 'var(--radius-2xl)',
          padding: '1.5rem',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: '-1rem', top: '-1rem',
          width: '5rem', height: '5rem', borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.2)',
        }} />
        <div style={{
          position: 'absolute', right: '2rem', bottom: '-0.5rem',
          width: '3rem', height: '3rem', borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.2)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>👑</span>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.375rem' }}>
            Desbloquear todos los matches
          </h3>
          <p style={{ fontSize: '0.8125rem', opacity: 0.85, marginBottom: '1rem', lineHeight: 1.5 }}>
            Accedé a intercambios ilimitados, filtros avanzados y prioridad en el ranking.
          </p>
          <button
            className="btn"
            onClick={() => navigate('/premium')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              width: '100%',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
            }}
          >
            ⭐ Desbloquear Premium
          </button>
        </div>
      </div>
    )
  }

  // Inline variant (smaller)
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid #fcd34d',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/premium')}
    >
      <span style={{ fontSize: '1.25rem' }}>👑</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400e' }}>
          Hay más matches disponibles
        </p>
        <p style={{ fontSize: '0.75rem', color: '#a16207' }}>
          Desbloquear con Premium →
        </p>
      </div>
    </div>
  )
}
