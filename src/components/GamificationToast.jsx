import React, { useEffect, useState } from 'react'
import { useGamificationStore } from '../stores/gamificationStore'
import { LEVELS, ACHIEVEMENTS } from '../lib/gamification'

/**
 * GamificationToast — Shows elegant, non-intrusive notifications
 * when user unlocks achievements or levels up.
 * No confetti. No gamer aesthetics. Premium and clean.
 */
export default function GamificationToast() {
  const { lastUnlock, clearLastUnlock } = useGamificationStore()
  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState(null)

  useEffect(() => {
    if (!lastUnlock) return

    if (lastUnlock.type === 'level') {
      const level = LEVELS[lastUnlock.value]
      setContent({
        icon: level?.icon || '⭐',
        title: '¡Nuevo nivel!',
        message: `Ahora sos ${level?.name || lastUnlock.value}`,
        color: level?.color || '#f59e0b',
        gradient: level?.gradient || 'linear-gradient(135deg, #f59e0b, #d97706)',
      })
    } else if (lastUnlock.type === 'achievement') {
      const def = ACHIEVEMENTS[lastUnlock.key]
      setContent({
        icon: def?.icon || '🎯',
        title: 'Hito desbloqueado',
        message: lastUnlock.name || def?.name || 'Nuevo logro',
        color: '#22c55e',
        gradient: 'linear-gradient(135deg, var(--color-surface), var(--color-bg))',
      })
    }

    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => clearLastUnlock(), 400)
    }, 4000)

    return () => clearTimeout(timer)
  }, [lastUnlock])

  if (!content) return null

  return (
    <>
      <style>{`
        .gam-toast-wrapper {
          position: fixed;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          pointer-events: none;
        }
        .gam-toast {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid var(--color-border-light);
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          pointer-events: auto;
          cursor: pointer;
          min-width: 240px;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .gam-toast-enter {
          opacity: 1;
          transform: translateY(0);
        }
        .gam-toast-exit {
          opacity: 0;
          transform: translateY(-1rem);
        }
        .gam-toast-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.375rem;
          flex-shrink: 0;
          background: var(--color-border-light);
        }
        .gam-toast-text {
          flex: 1;
          min-width: 0;
        }
        .gam-toast-title {
          font-size: 0.6875rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.125rem;
          opacity: 0.75;
          color: var(--color-text); }
        .gam-toast-msg {
          font-size: 0.9375rem;
          font-weight: 800;
          margin: 0;
          color: var(--color-text); }
      `}</style>

      <div className="gam-toast-wrapper">
        <div
          className={`gam-toast ${visible ? 'gam-toast-enter' : 'gam-toast-exit'}`}
          style={{ background: content.gradient }}
          onClick={() => { setVisible(false); setTimeout(clearLastUnlock, 400) }}
        >
          <div className="gam-toast-icon" style={{ background: `${content.color}25` }}>
            {content.icon}
          </div>
          <div className="gam-toast-text">
            <p className="gam-toast-title">{content.title}</p>
            <p className="gam-toast-msg">{content.message}</p>
          </div>
        </div>
      </div>
    </>
  )
}
