import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

// Bump this value each time you release a new Alpha version
// so the modal re-shows to all users.
export const CURRENT_ALPHA_VERSION = 'alpha_1'

export default function AlphaWelcomeModal({ forceOpen = false, onClose }) {
  const { user, profile, updateProfile } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    if (forceOpen) {
      setVisible(true)
      return
    }

    // Check localStorage first (for guests and as a fast path)
    const localDismissedVersion = localStorage.getItem('figusuy_alpha_dismissed')
    if (localDismissedVersion === CURRENT_ALPHA_VERSION) {
      return
    }

    // If logged in, check profile
    if (user && profile) {
      const seen = profile.alpha_notice_seen === true
      const versionMatch = profile.alpha_notice_version === CURRENT_ALPHA_VERSION
      
      if (seen && versionMatch) {
        // Sync local storage if DB says it's seen
        localStorage.setItem('figusuy_alpha_dismissed', CURRENT_ALPHA_VERSION)
        return
      }
    }

    // If we got here, it should be visible
    setVisible(true)
  }, [user, profile, forceOpen])

  const handleDismiss = async () => {
    if (dismissing) return
    setDismissing(true)
    
    // Always update localStorage
    localStorage.setItem('figusuy_alpha_dismissed', CURRENT_ALPHA_VERSION)

    try {
      if (user) {
        await updateProfile({
          alpha_notice_seen: true,
          alpha_notice_version: CURRENT_ALPHA_VERSION,
        })
      }
    } catch (err) {
      console.error('Error dismissing alpha notice:', err)
    }
    
    setVisible(false)
    setDismissing(false)
    onClose?.()
  }

  const handleReport = () => {
    window.open(
      'mailto:soporte@figusuy.com?subject=Reporte%20Alpha%20-%20FigusUY&body=Hola%2C%20encontré%20un%20problema%20en%20la%20app%20Alpha...',
      '_blank'
    )
  }

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={handleDismiss} style={{ zIndex: 9999 }}>
      <div
        className="animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '26rem',
          borderRadius: '2rem',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background card */}
        <div style={{
          background: 'linear-gradient(165deg, var(--color-surface) 0%, var(--color-bg) 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: '2rem',
          padding: '2.5rem 2rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute',
            top: '-3rem',
            right: '-3rem',
            width: '12rem',
            height: '12rem',
            background: 'radial-gradient(circle, rgba(234, 88, 12, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-2rem',
            left: '-2rem',
            width: '8rem',
            height: '8rem',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          {/* Alpha badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            background: 'rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            marginBottom: '1.5rem',
          }}>
            <span style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'inline-block',
              animation: 'pulse-soft 2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              color: 'var(--color-primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Versión Alpha
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.03em',
            margin: '0 0 1rem 0',
            lineHeight: 1.2,
          }}>
            Bienvenido a FigusUY Alpha
          </h2>

          {/* Body text */}
          <div style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              Estás entrando a una versión temprana de FigusUY.
            </p>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              Ya podés probar álbumes, cargar figuritas y explorar la app, pero algunas funciones todavía están en desarrollo y pueden tener errores.
            </p>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              Tu feedback en esta etapa es clave para ayudarnos a mejorar la experiencia antes del lanzamiento.
            </p>
            <p style={{
              margin: 0,
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
            }}>
              Gracias por probarla primero. 🙌
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              id="alpha-dismiss-btn"
              onClick={handleDismiss}
              disabled={dismissing}
              style={{
                width: '100%',
                padding: '0.9375rem 1.5rem',
                borderRadius: '1.25rem',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.9375rem',
                cursor: dismissing ? 'wait' : 'pointer',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35)',
                transition: 'all 0.2s ease',
                opacity: dismissing ? 0.7 : 1,
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!dismissing) e.target.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)' }}
            >
              {dismissing ? 'Guardando...' : 'Entendido, probar Alpha'}
            </button>

            <button
              id="alpha-report-btn"
              onClick={handleReport}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '1.25rem',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = '#334155'
                e.target.style.color = 'var(--color-text-secondary)'
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.color = 'var(--color-text-muted)'
              }}
            >
              🐛 Reportar un problema
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
