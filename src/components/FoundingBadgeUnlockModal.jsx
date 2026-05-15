import React, { useState, useEffect, useCallback } from 'react'

const BADGE_IMG = '/assets/badge-desde-el-comienzo.webp'
const DISPLAY_DURATION = 3800

/**
 * FoundingBadgeUnlockModal
 * 
 * Full-screen cinematic unlock animation shown once for founding members.
 */
export default function FoundingBadgeUnlockModal({ isOpen, onClose, proDays = 7 }) {
  const [phase, setPhase] = useState('enter') // enter | reveal | celebrate | exit
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPhase('enter')
      setVisible(false)
      return
    }

    const timers = []

    timers.push(setTimeout(() => setVisible(true), 50))
    timers.push(setTimeout(() => setPhase('reveal'), 520))
    timers.push(setTimeout(() => setPhase('celebrate'), 1450))
    timers.push(setTimeout(() => {
      setPhase('exit')
      setVisible(false)
    }, DISPLAY_DURATION - 500))
    timers.push(setTimeout(() => {
      onClose?.()
    }, DISPLAY_DURATION))

    document.body.style.overflow = 'hidden'

    return () => {
      timers.forEach(clearTimeout)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleSkip = useCallback(() => {
    setPhase('exit')
    setVisible(false)
    setTimeout(() => onClose?.(), 400)
  }, [onClose])

  if (!isOpen && phase === 'enter') return null

  return (
    <>
      <style>{`
        .fb-unlock-overlay {
          position: fixed;
          inset: 0;
          z-index: 11000;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0);
          transition: background 0.8s ease;
          cursor: pointer;
        }
        .fb-unlock-overlay.fb-visible {
          background: rgba(0, 0, 0, 0.95);
        }

        .fb-unlock-content {
          text-align: center;
          color: #f5f5f5;
          font-family: 'Barlow', system-ui, sans-serif;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }

        /* Unlock text */
        .fb-unlock-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 0.78rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ff8c32;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fb-reveal .fb-unlock-label,
        .fb-celebrate .fb-unlock-label {
          opacity: 1;
          transform: translateY(0);
        }

        /* Badge container */
        .fb-badge-wrap {
          position: relative;
          width: 240px;
          height: 240px;
          margin: 1.5rem auto;
        }

        /* Radial glow rings */
        .fb-ring {
          position: absolute;
          inset: -40px;
          border-radius: 50%;
          border: 1px solid rgba(255, 160, 50, 0.15);
          opacity: 0;
          transform: scale(0.5);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fb-ring:nth-child(2) {
          inset: -70px;
          border-color: rgba(255, 160, 50, 0.08);
          transition-delay: 0.15s;
        }
        .fb-ring:nth-child(3) {
          inset: -100px;
          border-color: rgba(255, 160, 50, 0.04);
          transition-delay: 0.3s;
        }
        .fb-reveal .fb-ring,
        .fb-celebrate .fb-ring {
          opacity: 1;
          transform: scale(1);
        }

        /* Core glow */
        .fb-core-glow {
          position: absolute;
          inset: -30px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 160, 50, 0.25) 0%, transparent 70%);
          opacity: 0;
          transform: scale(0.3);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fb-reveal .fb-core-glow,
        .fb-celebrate .fb-core-glow {
          opacity: 1;
          transform: scale(1);
          animation: fb-glow-breathe 2s ease-in-out infinite;
        }
        @keyframes fb-glow-breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        /* Badge image */
        .fb-badge-img {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 40px rgba(255, 160, 50, 0.4));
          transform: scale(0) rotate(-30deg);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fb-reveal .fb-badge-img {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
        .fb-celebrate .fb-badge-img {
          transform: scale(1) rotate(0deg);
          opacity: 1;
          filter: drop-shadow(0 0 60px rgba(255, 160, 50, 0.55));
          animation: fb-badge-settle 2s ease-in-out infinite;
        }
        @keyframes fb-badge-settle {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-4px); }
        }

        /* Badge name */
        .fb-badge-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-style: italic;
          font-size: clamp(2rem, 6vw, 2.8rem);
          text-transform: uppercase;
          line-height: 1;
          margin: 0.5rem 0 0;
          opacity: 0;
          transform: translateY(30px) scale(0.9);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
        }
        .fb-celebrate .fb-badge-name {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .fb-badge-name-gradient {
          background: linear-gradient(135deg, #ffb74d, #ff8c32, #ffd54f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Subtitle */
        .fb-unlock-sub {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-top: 0.6rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease 0.5s;
        }
        .fb-celebrate .fb-unlock-sub {
          opacity: 1;
          transform: translateY(0);
        }

        /* PRO badge */
        .fb-pro-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 1rem;
          padding: 0.5rem 1.2rem;
          border: 1px solid rgba(255, 160, 50, 0.22);
          border-radius: 999px;
          background: rgba(255, 160, 50, 0.08);
          color: #ffd28c;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease 0.7s;
        }
        .fb-celebrate .fb-pro-pill {
          opacity: 1;
          transform: translateY(0);
        }

        /* Celebration particles */
        .fb-sparks {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 11001;
          overflow: hidden;
        }
        .fb-spark {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          opacity: 0;
        }
        .fb-celebrate .fb-spark {
          animation: fb-spark-fly 1.8s ease-out forwards;
        }

        @keyframes fb-spark-fly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0); }
        }

        /* Skip hint */
        .fb-skip {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.25);
          font-size: 0.72rem;
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.5s ease 2s;
        }
        .fb-celebrate .fb-skip {
          opacity: 1;
        }

        /* Exit */
        .fb-exit .fb-badge-img,
        .fb-exit .fb-unlock-label,
        .fb-exit .fb-badge-name,
        .fb-exit .fb-unlock-sub,
        .fb-exit .fb-pro-pill,
        .fb-exit .fb-ring,
        .fb-exit .fb-core-glow {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
          transition: all 0.4s ease;
        }

        @media (max-width: 520px) {
          .fb-badge-wrap {
            width: 180px;
            height: 180px;
          }
        }
      `}</style>

      <div
        className={`fb-unlock-overlay ${visible ? 'fb-visible' : ''}`}
        onClick={handleSkip}
      >
        <div className={`fb-unlock-content fb-${phase}`}>
          {/* Unlock label */}
          <div className="fb-unlock-label">
            BADGE DESBLOQUEADO
          </div>

          {/* Badge */}
          <div className="fb-badge-wrap">
            <div className="fb-ring" />
            <div className="fb-ring" />
            <div className="fb-ring" />
            <div className="fb-core-glow" />
            <img
              className="fb-badge-img"
              src={BADGE_IMG}
              alt="Badge Desde el comienzo"
              loading="eager"
            />
          </div>

          {/* Name */}
          <h2 className="fb-badge-name">
            <span className="fb-badge-name-gradient">Desde el comienzo</span>
          </h2>

          {/* Subtitle */}
          <p className="fb-unlock-sub">
            Ahora sos parte de la primera generación de coleccionistas de FigusUY.
          </p>

          {/* PRO pill */}
          <div className="fb-pro-pill">
            {proDays} DIAS PRO ACTIVADOS
          </div>

          {/* Skip hint */}
          <div className="fb-skip">
            Toca para continuar
          </div>
        </div>

        {/* Celebration sparks */}
        {phase === 'celebrate' && (
          <div className="fb-sparks">
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * 360
              const distance = 120 + Math.random() * 200
              const sx = Math.cos((angle * Math.PI) / 180) * distance
              const sy = Math.sin((angle * Math.PI) / 180) * distance
              const colors = ['#ff8c32', '#ffd54f', '#ffb74d', '#ff6a00', '#a78bfa', '#fff']
              return (
                <div
                  key={i}
                  className="fb-spark"
                  style={{
                    left: '50%',
                    top: '50%',
                    background: colors[i % colors.length],
                    '--sx': `${sx}px`,
                    '--sy': `${sy}px`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    width: `${3 + Math.random() * 4}px`,
                    height: `${3 + Math.random() * 4}px`,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
