import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BADGE_IMG = '/assets/badge-desde-el-comienzo.webp'

/**
 * EarlyAccessPopup
 * 
 * Premium dark popup shown to unauthenticated users on the landing page.
 * Incentivizes profile creation by showing the founding badge and early access benefits.
 */
export default function EarlyAccessPopup({ isOpen, onClose, onCreateProfile, slotsRemaining = 250 }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Preload inteligente de la imagen badge al abrir
      const preloadLink = document.createElement('link')
      preloadLink.href = BADGE_IMG
      preloadLink.rel = 'preload'
      preloadLink.as = 'image'
      preloadLink.fetchPriority = 'high'
      document.head.appendChild(preloadLink)

      // Small delay for mount animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      document.body.style.overflow = 'hidden'
    } else {
      setVisible(false)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleClose = () => {
    setClosing(true)
    setVisible(false)
    setTimeout(() => {
      setClosing(false)
      onClose?.()
    }, 400)
  }

  const handleCreateProfile = () => {
    handleClose()
    if (onCreateProfile) {
      onCreateProfile()
    } else {
      navigate('/login?type=register')
    }
  }

  if (!isOpen && !closing) return null

  return (
    <>
      <style>{`
        .ea-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0);
          transition: background 0.4s ease;
          overflow-y: auto;
          /* Eliminado backdrop-filter agresivo para performance */
        }
        .ea-overlay.ea-visible {
          background: rgba(0, 0, 0, 0.92);
        }

        .ea-popup {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: radial-gradient(ellipse at top center, rgba(255, 140, 50, 0.08) 0%, #0c0c0c 60%);
          border: 1px solid rgba(255, 140, 50, 0.2);
          border-radius: 24px;
          padding: 2.5rem 2rem 2rem;
          text-align: center;
          color: #f5f5f5;
          font-family: 'Barlow', system-ui, sans-serif;
          /* Reducido box-shadow dinámico y caro */
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          transform: scale(0.95) translateY(20px);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          will-change: transform, opacity;
        }
        .ea-visible .ea-popup {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        /* Metallic border static - evitamos animaciones infinitas pesadas */
        .ea-popup::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          border: 1px solid rgba(255, 180, 80, 0.15);
          pointer-events: none;
        }

        /* Particle effects - Reducido a 3 para optimizar GPU */
        .ea-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          border-radius: 24px;
        }
        .ea-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255, 160, 60, 0.6);
          animation: ea-float 6s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .ea-particle:nth-child(1) { left: 15%; top: 25%; animation-duration: 7s; }
        .ea-particle:nth-child(2) { left: 80%; top: 20%; animation-duration: 5s; animation-delay: 1s; }
        .ea-particle:nth-child(3) { left: 30%; top: 75%; animation-duration: 8s; animation-delay: 2s; }

        @keyframes ea-float {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-12px); opacity: 0.7; }
        }

        .ea-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s;
          z-index: 2;
          font-size: 1.1rem;
        }
        .ea-close-btn:hover {
          border-color: rgba(255, 140, 50, 0.4);
          color: #ff8c32;
          background: rgba(255, 140, 50, 0.08);
        }

        .ea-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          border: 1px solid rgba(255, 140, 50, 0.3);
          border-radius: 999px;
          background: rgba(255, 140, 50, 0.08);
          color: #ff8c32;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 1.2rem;
          /* Reemplazo de box-shadow animado por opacity liviana */
          animation: ea-pulse-opacity 3s ease-in-out infinite;
          will-change: opacity;
        }
        @keyframes ea-pulse-opacity {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .ea-badge-container {
          position: relative;
          width: 180px;
          height: 180px;
          margin: 0 auto 1.5rem;
        }

        .ea-badge-glow {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 160, 50, 0.15) 0%, transparent 60%);
          /* Sustituir scale por opacity para no repintar layout */
          animation: ea-badge-pulse 3s ease-in-out infinite;
          will-change: opacity;
        }
        @keyframes ea-badge-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }

        .ea-badge-img {
          position: relative;
          width: 100%;
          height: 100%;
          object-fit: contain;
          /* Reducir blur radius en drop-shadow drásticamente por performance en móviles */
          filter: drop-shadow(0 4px 12px rgba(255, 160, 50, 0.25));
          z-index: 1;
          animation: ea-badge-float 4s ease-in-out infinite;
          will-change: transform;
          transform: translateZ(0); /* Hardware acceleration */
        }
        @keyframes ea-badge-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .ea-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-style: italic;
          font-size: clamp(1.6rem, 5vw, 2rem);
          text-transform: uppercase;
          line-height: 1;
          margin: 0 0 0.3rem;
          background: linear-gradient(180deg, #ffffff 30%, #cccccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ea-title-highlight {
          display: block;
          color: #ff8c32;
          -webkit-text-fill-color: #ff8c32;
          font-size: 1.1em;
        }

        .ea-desc {
          color: rgba(245, 245, 245, 0.65);
          font-size: 0.92rem;
          line-height: 1.6;
          max-width: 360px;
          margin: 0.8rem auto 0;
        }

        .ea-slots {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin: 1.2rem 0;
          padding: 0.5rem 1rem;
          border: 1px solid rgba(255, 140, 50, 0.15);
          border-radius: 10px;
          background: rgba(255, 140, 50, 0.05);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .ea-slots-number {
          color: #ff8c32;
          font-size: 1.2em;
        }
        .ea-slots-text {
          color: rgba(245, 245, 245, 0.7);
        }

        .ea-cta-primary {
          display: block;
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #ff6a00, #ff8c32);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.3s;
          box-shadow: 0 4px 20px rgba(255, 106, 0, 0.3);
        }
        .ea-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255, 106, 0, 0.45);
        }
        .ea-cta-primary:active {
          transform: translateY(0);
        }
        .ea-cta-primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          animation: ea-btn-shine 4s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes ea-btn-shine {
          0% { transform: translateX(-100%); }
          30%, 100% { transform: translateX(100%); }
        }

        .ea-cta-secondary {
          display: block;
          width: 100%;
          padding: 0.8rem 1rem;
          margin-top: 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: transparent;
          color: rgba(245, 245, 245, 0.55);
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ea-cta-secondary:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(245, 245, 245, 0.8);
        }

        .ea-fine-print {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(245, 245, 245, 0.35);
          font-size: 0.72rem;
          line-height: 1.5;
        }

        @media (max-width: 520px) {
          .ea-popup {
            padding: 2rem 1.2rem 1.5rem;
            border-radius: 20px;
            max-width: 100%;
          }
          .ea-badge-container {
            width: 140px;
            height: 140px;
          }
          .ea-title {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div
        ref={overlayRef}
        className={`ea-overlay ${visible ? 'ea-visible' : ''}`}
        onClick={(e) => { if (e.target === overlayRef.current) handleClose() }}
      >
        <div className="ea-popup" role="dialog" aria-modal="true" aria-label="Early Access">
          {/* Particles (reducidas de 8 a 3) */}
          <div className="ea-particles">
            <div className="ea-particle" />
            <div className="ea-particle" />
            <div className="ea-particle" />
          </div>

          {/* Close */}
          <button className="ea-close-btn" onClick={handleClose} aria-label="Cerrar">
            ✕
          </button>

          {/* Eyebrow */}
          <div className="ea-eyebrow">
            <span style={{ fontSize: '0.9em' }}>🔓</span>
            EARLY ACCESS ABIERTO
          </div>

          {/* Badge */}
          <div className="ea-badge-container">
            <div className="ea-badge-glow" />
            <img
              className="ea-badge-img"
              src={BADGE_IMG}
              alt="Badge Desde el comienzo"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width="180"
              height="180"
            />
          </div>

          {/* Title */}
          <h2 className="ea-title">
            Los primeros 250 desbloquean el badge
            <span className="ea-title-highlight">"Desde el comienzo"</span>
          </h2>

          {/* Description */}
          <p className="ea-desc">
            Entrá temprano a la red de coleccionistas de Uruguay y activá beneficios exclusivos durante el lanzamiento.
          </p>

          {/* Slots counter */}
          <div className="ea-slots">
            <span className="ea-slots-number">{slotsRemaining}</span>
            <span className="ea-slots-text">lugares restantes</span>
          </div>

          {/* CTAs */}
          <button className="ea-cta-primary" onClick={handleCreateProfile} id="ea-create-profile-btn">
            CREAR PERFIL Y ENTRAR
          </button>
          <button className="ea-cta-secondary" onClick={handleClose} id="ea-dismiss-btn">
            VER MÁS TARDE
          </button>

          {/* Fine print */}
          <p className="ea-fine-print">
            Al crear tu perfil, si estás dentro de los primeros 250, desbloqueás el badge "Desde el comienzo" y 7 días PRO.
            <br />
            <span style={{ opacity: 0.7, marginTop: '0.3rem', display: 'inline-block' }}>
              Una vez que entrás, la insignia aparece en pantalla como animación de desbloqueo durante unos segundos y luego queda visible permanentemente en tu perfil.
            </span>
          </p>
        </div>
      </div>
    </>
  )
}
