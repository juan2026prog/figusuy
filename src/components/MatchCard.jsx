import React from 'react'
import { getCompatibilityLevel } from '../lib/matching'
import { formatDistance } from '../lib/haversine'

export default function MatchCard({ match, onContact, blurred = false }) {
  const compat = getCompatibilityLevel(match.score)

  return (
    <div
      className={`match-card animate-fade-in-up ${blurred ? 'blur-overlay' : ''}`}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border-light)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Row: Avatar + Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
        {/* Avatar */}
        <div style={{
          width: '3rem',
          height: '3rem',
          borderRadius: 'var(--radius-full)',
          background: `linear-gradient(135deg, ${compat.color}22, ${compat.color}44)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: compat.color,
          flexShrink: 0,
        }}>
          {match.profile.avatar_url ? (
            <img
              src={match.profile.avatar_url}
              alt=""
              style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
            />
          ) : (
            (match.profile.name || '?')[0].toUpperCase()
          )}
        </div>

        {/* Name + Distance */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              {match.profile.name || 'Usuario'}
            </span>
            {match.isPremium && <span className="badge badge-premium">⭐ Premium</span>}
            {match.isActive && <span className="badge badge-active">● Activo</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.125rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              📍 {formatDistance(match.distance)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              ⭐ {match.rating?.toFixed?.(1) || '5.0'}
            </span>
          </div>
        </div>

        {/* Score Badge */}
        <div className="badge badge-score" style={{ fontSize: '0.875rem', padding: '0.25rem 0.625rem' }}>
          {match.score}
        </div>
      </div>

      {/* Compatibility Stars */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        marginBottom: '0.875rem',
        padding: '0.5rem 0.75rem',
        background: `${compat.color}08`,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${compat.color}18`,
      }}>
        <div style={{ display: 'flex', gap: '0.125rem' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= compat.stars ? compat.color : '#e2e8f0', fontSize: '0.875rem' }}>★</span>
          ))}
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: compat.color }}>
          {compat.label}
        </span>
        {match.isMutual && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-success)',
            background: '#dcfce7',
            padding: '0.125rem 0.5rem',
            borderRadius: 'var(--radius-full)',
          }}>
            🔄 Intercambio mutuo
          </span>
        )}
      </div>

      {/* Sticker Exchange Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        {/* They give me */}
        <div style={{
          padding: '0.625rem',
          background: '#f0fdf4',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #bbf7d0',
        }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#166534', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Te ofrece
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {match.theyCanGiveMe.slice(0, 8).map(n => (
              <span key={n} style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#dcfce7',
                color: '#166534',
                padding: '0.125rem 0.375rem',
                borderRadius: 'var(--radius-sm)',
              }}>
                #{n}
              </span>
            ))}
            {match.theyCanGiveMe.length > 8 && (
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                +{match.theyCanGiveMe.length - 8}
              </span>
            )}
          </div>
        </div>

        {/* I give them */}
        <div style={{
          padding: '0.625rem',
          background: '#eff6ff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #bfdbfe',
        }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Necesita
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {match.iCanGiveThem.slice(0, 8).map(n => (
              <span key={n} style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.125rem 0.375rem',
                borderRadius: 'var(--radius-sm)',
              }}>
                #{n}
              </span>
            ))}
            {match.iCanGiveThem.length > 8 && (
              <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                +{match.iCanGiveThem.length - 8}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Button */}
      {!blurred && (
        <button
          className="btn btn-primary"
          onClick={() => onContact?.(match)}
          style={{ width: '100%' }}
        >
          💬 Contactar
        </button>
      )}
    </div>
  )
}
