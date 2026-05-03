import React, { useEffect, useState } from 'react'

const FALLBACK_THEMES = [
  {
    id: 'orange',
    label: 'Naranja',
    swatch: 'linear-gradient(135deg, #6b2d0b 0%, #22130c 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #6b2d0b 0%, #22130c 52%, #0b0b0b 100%)'
  },
  {
    id: 'red',
    label: 'Rojo',
    swatch: 'linear-gradient(135deg, #5a1810 0%, #24100e 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #5a1810 0%, #24100e 52%, #0b0b0b 100%)'
  },
  {
    id: 'gold',
    label: 'Dorado',
    swatch: 'linear-gradient(135deg, #5a4310 0%, #221b0b 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #5a4310 0%, #221b0b 52%, #0b0b0b 100%)'
  },
  {
    id: 'green',
    label: 'Verde',
    swatch: 'linear-gradient(135deg, #183d1f 0%, #0f1f14 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #183d1f 0%, #0f1f14 52%, #0b0b0b 100%)'
  },
  {
    id: 'blue',
    label: 'Azul',
    swatch: 'linear-gradient(135deg, #153656 0%, #0d1724 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #153656 0%, #0d1724 52%, #0b0b0b 100%)'
  },
  {
    id: 'violet',
    label: 'Violeta',
    swatch: 'linear-gradient(135deg, #35204e 0%, #17111f 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #35204e 0%, #17111f 52%, #0b0b0b 100%)'
  },
  {
    id: 'slate',
    label: 'Grafito',
    swatch: 'linear-gradient(135deg, #2f2f2f 0%, #161616 52%, #0b0b0b 100%)',
    background: 'linear-gradient(135deg, #2f2f2f 0%, #161616 52%, #0b0b0b 100%)'
  }
]

export default function PromoDetailModal({ promo, location, onClose, onViewLocal }) {
  const [fallbackTheme, setFallbackTheme] = useState(FALLBACK_THEMES[0])

  useEffect(() => {
    if (!promo) return
    const seed = String(promo.id || promo.title || '')
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    setFallbackTheme(FALLBACK_THEMES[hash % FALLBACK_THEMES.length])
  }, [promo])

  if (!promo) return null

  const status = getPromoStatus(promo)
  const s = PROMO_STATUS_CONFIG[status] || PROMO_STATUS_CONFIG.activa

  const formatDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleViewLocal = () => {
    onClose()
    if (onViewLocal && location) onViewLocal(location)
  }

  return (
    <div className="promo-modal-overlay" onClick={onClose}>
      <style>{`
        .promo-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          background: rgba(0,0,0,.82);
          display: grid;
          place-items: center;
          padding: 1rem;
          animation: pdm-fadeIn .2s ease-out;
        }

        @keyframes pdm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pdm-slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .promo-modal-card {
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          background: #121212;
          border: 1px solid rgba(255,255,255,.1);
          position: relative;
          animation: pdm-slideUp .28s ease-out;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.12) transparent;
        }

        .promo-modal-card::-webkit-scrollbar { width: 6px; }
        .promo-modal-card::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); }

        .pdm-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(6px);
          color: #fff;
          cursor: pointer;
          font-size: 1.15rem;
          transition: .15s;
        }

        .pdm-close:hover {
          border-color: #ff5a00;
          color: #ff5a00;
        }

        .pdm-image {
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
          display: block;
          background: #0b0b0b;
        }

        .pdm-fallback-image {
          width: 100%;
          aspect-ratio: 16/9;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,.06);
          position: relative;
          overflow: hidden;
        }

        .pdm-fallback-image:before {
          content: 'PROMO';
          position: absolute;
          right: 12px;
          top: -8px;
          font: italic 900 5rem 'Barlow Condensed', sans-serif;
          line-height: 1;
          color: rgba(255,255,255,.06);
          pointer-events: none;
        }

        .pdm-fallback-top {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .pdm-fallback-kicker {
          font: 900 .7rem 'Barlow Condensed', sans-serif;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: rgba(255,255,255,.74);
        }

        .pdm-fallback-icon {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(0,0,0,.22);
          flex-shrink: 0;
        }

        .pdm-fallback-icon .material-symbols-outlined {
          font-size: 1.9rem;
          color: rgba(255,255,255,.78);
        }

        .pdm-fallback-copy {
          position: relative;
          z-index: 1;
          margin-top: auto;
        }

        .pdm-fallback-title {
          max-width: 22rem;
          font: italic 900 clamp(2.1rem, 6vw, 3.35rem) 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height: .88;
          color: #fff;
          text-wrap: balance;
        }

        .pdm-fallback-meta {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          margin-top: .7rem;
          color: rgba(255,255,255,.7);
          font: 700 .84rem 'Barlow', sans-serif;
        }

        .pdm-theme-picker {
          display: flex;
          flex-wrap: wrap;
          gap: .45rem;
          margin-top: .9rem;
        }

        .pdm-theme-dot {
          width: 26px;
          height: 26px;
          border: 1px solid rgba(255,255,255,.22);
          cursor: pointer;
          transition: transform .15s, border-color .15s;
        }

        .pdm-theme-dot:hover {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,.5);
        }

        .pdm-theme-dot.active {
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(0,0,0,.32);
        }

        .pdm-theme-note {
          margin-top: .6rem;
          color: rgba(255,255,255,.72);
          font-size: .72rem;
          font-weight: 700;
        }

        .pdm-body {
          padding: 1.5rem;
        }

        .pdm-status-badge {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .38rem .65rem;
          font: 900 .72rem 'Barlow Condensed', sans-serif;
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: .9rem;
        }

        .pdm-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .pdm-title {
          font: italic 900 2.4rem 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height: .9;
          color: #f5f5f5;
          margin-bottom: .7rem;
        }

        .pdm-title.pdm-title-hidden {
          display: none;
        }

        .pdm-condition {
          display: flex;
          align-items: flex-start;
          gap: .5rem;
          padding: .85rem 1rem;
          background: rgba(255,90,0,.07);
          border: 1px solid rgba(255,90,0,.22);
          margin-bottom: 1rem;
        }

        .pdm-condition-icon {
          color: #ff5a00;
          font-size: 1.1rem;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .pdm-condition-text {
          font: 700 .95rem 'Barlow', sans-serif;
          color: rgba(245,245,245,.88);
          line-height: 1.4;
        }

        .pdm-description {
          color: rgba(245,245,245,.58);
          font-size: .92rem;
          line-height: 1.55;
          margin-bottom: 1rem;
        }

        .pdm-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(255,255,255,.06);
          margin-bottom: 1.2rem;
        }

        .pdm-date-cell {
          background: #0d0d0d;
          padding: .85rem;
        }

        .pdm-date-label {
          font: 900 .62rem 'Barlow Condensed', sans-serif;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(245,245,245,.34);
          margin-bottom: .3rem;
        }

        .pdm-date-value {
          font: 700 .92rem 'Barlow', sans-serif;
          color: #f5f5f5;
        }

        .pdm-business-row {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .85rem 1rem;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.06);
          margin-bottom: 1.2rem;
        }

        .pdm-biz-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          background: rgba(255,90,0,.12);
          border: 1px solid rgba(255,90,0,.25);
          flex-shrink: 0;
        }

        .pdm-biz-icon .material-symbols-outlined {
          font-size: 1.3rem;
          color: #ff5a00;
        }

        .pdm-biz-name {
          font: italic 900 1.15rem 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height: 1;
          color: #f5f5f5;
        }

        .pdm-biz-address {
          font-size: .8rem;
          color: rgba(245,245,245,.5);
          margin-top: 2px;
        }

        .pdm-actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: .75rem;
        }

        .pdm-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          padding: .92rem 1.2rem;
          background: #ff5a00;
          border: 1px solid #ff5a00;
          color: #fff;
          font: 900 .88rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: .15s;
        }

        .pdm-btn-primary:hover {
          background: #cc4800;
          border-color: #cc4800;
        }

        .pdm-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          padding: .92rem 1.2rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,.14);
          color: #fff;
          font: 900 .88rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: .15s;
        }

        .pdm-btn-secondary:hover {
          border-color: rgba(255,255,255,.35);
        }

        @media (max-width: 560px) {
          .promo-modal-card {
            max-height: 95vh;
          }
          .pdm-title {
            font-size: 2rem;
          }
          .pdm-actions {
            grid-template-columns: 1fr;
          }
          .pdm-fallback-title {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="promo-modal-card" onClick={e => e.stopPropagation()}>
        <button className="pdm-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        {promo.image_url ? (
          <img src={promo.image_url} alt={promo.title} className="pdm-image" />
        ) : (
          <div className="pdm-fallback-image" style={{ background: fallbackTheme.background }}>
            <div className="pdm-fallback-top">
              <div className="pdm-fallback-kicker">Vista promo</div>
              <div className="pdm-fallback-icon">
                <span className="material-symbols-outlined">campaign</span>
              </div>
            </div>
            <div className="pdm-fallback-copy">
              <div className="pdm-fallback-title">{promo.title || 'Promo destacada'}</div>
              {location?.name && (
                <div className="pdm-fallback-meta">
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>storefront</span>
                  {location.name}
                </div>
              )}
              <div className="pdm-theme-picker">
                {FALLBACK_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`pdm-theme-dot ${fallbackTheme.id === theme.id ? 'active' : ''}`}
                    style={{ background: theme.swatch }}
                    onClick={() => setFallbackTheme(theme)}
                    aria-label={`Usar fondo ${theme.label}`}
                    title={theme.label}
                  />
                ))}
              </div>
              <div className="pdm-theme-note">Sin imagen: elegí uno de estos 7 fondos para previsualizar la promo.</div>
            </div>
          </div>
        )}

        <div className="pdm-body">
          <div
            className="pdm-status-badge"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
          >
            <span className="pdm-status-dot" style={{ background: s.color }} />
            {s.label}
          </div>

          <h2 className={`pdm-title ${promo.image_url ? '' : 'pdm-title-hidden'}`}>{promo.title}</h2>

          {promo.condition_text && (
            <div className="pdm-condition">
              <span className="material-symbols-outlined pdm-condition-icon">check_circle</span>
              <span className="pdm-condition-text">{promo.condition_text}</span>
            </div>
          )}

          {promo.description && (
            <p className="pdm-description">{promo.description}</p>
          )}

          <div className="pdm-dates">
            <div className="pdm-date-cell">
              <div className="pdm-date-label">Desde</div>
              <div className="pdm-date-value">{formatDate(promo.starts_at) || 'Ya disponible'}</div>
            </div>
            <div className="pdm-date-cell">
              <div className="pdm-date-label">Hasta</div>
              <div className="pdm-date-value">{formatDate(promo.ends_at) || 'Sin fecha limite'}</div>
            </div>
          </div>

          {location && (
            <div className="pdm-business-row">
              <div className="pdm-biz-icon">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div>
                <div className="pdm-biz-name">{location.name}</div>
                <div className="pdm-biz-address">{location.address || 'Direccion no disponible'}</div>
              </div>
            </div>
          )}

          <div className="pdm-actions">
            <button className="pdm-btn-primary" onClick={handleViewLocal}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>storefront</span>
              Ver local
            </button>
            <button className="pdm-btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function getPromoStatus(promo) {
  if (!promo?.is_active) return 'pausada'

  const now = new Date()
  const start = promo.starts_at ? new Date(promo.starts_at) : null
  const end = promo.ends_at ? new Date(promo.ends_at) : null

  if (end && now > end) return 'finalizada'
  if (start && now < start) return 'proximamente'
  return 'activa'
}

export const PROMO_STATUS_CONFIG = {
  pausada: { label: 'Pausada', color: 'rgba(245,245,245,.56)', bg: 'rgba(255,255,255,.05)', border: 'rgba(255,255,255,.14)', icon: 'pause_circle' },
  activa: { label: 'Activa', color: '#22c55e', bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.35)', icon: 'check_circle' },
  proximamente: { label: 'Proximamente', color: '#facc15', bg: 'rgba(250,204,21,.1)', border: 'rgba(250,204,21,.35)', icon: 'schedule' },
  finalizada: { label: 'Finalizada', color: '#94a3b8', bg: 'rgba(148,163,184,.1)', border: 'rgba(148,163,184,.35)', icon: 'event_busy' }
}
