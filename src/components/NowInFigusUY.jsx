import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelativeTime } from '../lib/liveMomentum'
import { useNowInFigusUY } from '../hooks/useNowInFigusUY'

function InitialTile({ title }) {
  const letter = String(title || 'F').trim().charAt(0).toUpperCase() || 'F'
  return <div className="nfy-media-fallback">{letter}</div>
}

export default function NowInFigusUY({ albums = [], onAuthAction, onScrollToSection }) {
  const navigate = useNavigate()
  const { hero, cards, feed, meta } = useNowInFigusUY({ albums })

  const handleAction = (action) => {
    if (!action) return
    if (action.kind === 'auth') {
      onAuthAction?.()
      return
    }
    if (action.kind === 'section') {
      onScrollToSection?.(action.target)
      return
    }
    if (action.kind === 'route' && action.target) {
      navigate(action.target)
    }
  }

  if (!hero) return null

  return (
    <section id="ahora" className="nfy-shell">
      <style>{`
        .nfy-shell {
          position: relative;
          padding: 32px 0 8px;
        }
        .nfy-panel {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.1);
          background:
            radial-gradient(circle at top right, rgba(255,90,0,.16), transparent 32%),
            radial-gradient(circle at bottom left, rgba(255,255,255,.05), transparent 34%),
            linear-gradient(180deg, rgba(18,18,18,.98) 0%, rgba(10,10,10,.98) 100%);
          padding: 28px;
        }
        .nfy-panel:before {
          content: 'AHORA';
          position: absolute;
          right: 18px;
          top: -10px;
          font: italic 900 clamp(4rem, 12vw, 9rem) 'Barlow Condensed', sans-serif;
          line-height: .8;
          color: rgba(255,255,255,.04);
          pointer-events: none;
        }
        .nfy-headline {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
          gap: 18px;
          align-items: stretch;
        }
        .nfy-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font: 900 .72rem 'Barlow Condensed', sans-serif;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--color-primary, #ff5a00);
        }
        .nfy-kicker:before {
          content: '';
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ff5a00;
          box-shadow: 0 0 0 6px rgba(255,90,0,.16);
        }
        .nfy-title {
          margin: 10px 0 12px;
          font: italic 900 clamp(2.4rem, 5vw, 4.8rem) 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height: .88;
          color: #fff;
          max-width: 14ch;
        }
        .nfy-copy {
          max-width: 60ch;
          color: rgba(255,255,255,.72);
          font-size: 1rem;
          line-height: 1.6;
        }
        .nfy-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }
        .nfy-btn {
          border: 1px solid rgba(255,255,255,.14);
          background: transparent;
          color: #fff;
          padding: .9rem 1.05rem;
          font: 900 .8rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: .2s ease;
        }
        .nfy-btn:hover {
          border-color: #ff5a00;
          color: #ff5a00;
        }
        .nfy-btn.primary {
          background: #ff5a00;
          border-color: #ff5a00;
          color: #fff;
        }
        .nfy-btn.primary:hover {
          background: #d84b00;
          border-color: #d84b00;
          color: #fff;
        }
        .nfy-hero-side {
          display: grid;
          grid-template-rows: auto auto;
          gap: 12px;
        }
        .nfy-cover {
          min-height: 220px;
          border: 1px solid rgba(255,255,255,.1);
          background: linear-gradient(135deg, rgba(255,90,0,.2), rgba(255,255,255,.03));
          overflow: hidden;
        }
        .nfy-cover img,
        .nfy-cover .nfy-media-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nfy-media-fallback {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff5a00, #ff8c42);
          color: #fff;
          font: italic 900 3.25rem 'Barlow Condensed', sans-serif;
        }
        .nfy-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1px;
          background: rgba(255,255,255,.08);
        }
        .nfy-metric {
          background: rgba(255,255,255,.03);
          padding: 14px;
        }
        .nfy-metric b {
          display: block;
          font: italic 900 2rem 'Barlow Condensed', sans-serif;
          line-height: .9;
          color: #fff;
        }
        .nfy-metric span {
          display: block;
          margin-top: 4px;
          font: 900 .66rem 'Barlow Condensed', sans-serif;
          letter-spacing: .09em;
          text-transform: uppercase;
          color: rgba(255,255,255,.5);
        }
        .nfy-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(280px, .7fr);
          gap: 18px;
          margin-top: 18px;
        }
        .nfy-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .nfy-card {
          position: relative;
          min-height: 210px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03);
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .nfy-card.emphasis {
          background: linear-gradient(135deg, rgba(255,90,0,.18), rgba(255,255,255,.03));
          border-color: rgba(255,90,0,.28);
        }
        .nfy-card-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .nfy-card-type {
          font: 900 .68rem 'Barlow Condensed', sans-serif;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #ff5a00;
        }
        .nfy-card-type.blue { color: #38bdf8; }
        .nfy-card-type.green { color: #22c55e; }
        .nfy-card-type.yellow { color: #facc15; }
        .nfy-card-type.pink { color: #fb7185; }
        .nfy-card-media {
          width: 54px;
          height: 70px;
          border: 1px solid rgba(255,255,255,.1);
          overflow: hidden;
          flex-shrink: 0;
        }
        .nfy-card-media img,
        .nfy-card-media .nfy-media-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nfy-card-title {
          margin: 10px 0 4px;
          font: italic 900 1.7rem 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height: .92;
          color: #fff;
        }
        .nfy-card-detail {
          font: 900 .72rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.56);
        }
        .nfy-card-body {
          margin-top: 10px;
          color: rgba(255,255,255,.74);
          font-size: .92rem;
          line-height: 1.45;
        }
        .nfy-card-btn {
          margin-top: 14px;
          align-self: flex-start;
          border: 0;
          background: transparent;
          color: #fff;
          padding: 0;
          cursor: pointer;
          font: 900 .8rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .nfy-card-btn:hover {
          color: #ff5a00;
        }
        .nfy-feed {
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025);
          padding: 18px;
          display: grid;
          gap: 14px;
          align-content: start;
        }
        .nfy-feed-title {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: end;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .nfy-feed-title h3 {
          margin: 0;
          font: italic 900 1.9rem 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height: .92;
          color: #fff;
        }
        .nfy-feed-title span {
          font-size: .78rem;
          color: rgba(255,255,255,.44);
        }
        .nfy-feed-item {
          display: grid;
          grid-template-columns: 10px 1fr auto;
          gap: 10px;
          align-items: center;
        }
        .nfy-feed-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ff5a00;
          box-shadow: 0 0 0 5px rgba(255,90,0,.14);
        }
        .nfy-feed-dot.blue { background: #38bdf8; box-shadow: 0 0 0 5px rgba(56,189,248,.14); }
        .nfy-feed-dot.green { background: #22c55e; box-shadow: 0 0 0 5px rgba(34,197,94,.14); }
        .nfy-feed-dot.yellow { background: #facc15; box-shadow: 0 0 0 5px rgba(250,204,21,.14); }
        .nfy-feed-dot.pink { background: #fb7185; box-shadow: 0 0 0 5px rgba(251,113,133,.14); }
        .nfy-feed-copy {
          color: rgba(255,255,255,.82);
          font-size: .92rem;
          line-height: 1.35;
        }
        .nfy-feed-time {
          font: 900 .68rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.42);
          white-space: nowrap;
        }
        .nfy-footer {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        .nfy-footer-copy {
          color: rgba(255,255,255,.62);
          max-width: 54ch;
          line-height: 1.5;
        }
        .nfy-footer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }
        .nfy-mini {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.03);
          padding: 8px 10px;
          font: 900 .7rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.74);
        }
        @media (max-width: 1080px) {
          .nfy-headline,
          .nfy-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .nfy-panel {
            padding: 18px;
          }
          .nfy-title {
            font-size: 2.35rem;
          }
          .nfy-cards {
            grid-template-columns: 1fr;
          }
          .nfy-metrics {
            grid-template-columns: 1fr;
          }
          .nfy-footer {
            flex-direction: column;
            align-items: stretch;
          }
          .nfy-footer-actions {
            justify-content: stretch;
          }
          .nfy-footer-actions .nfy-btn {
            width: 100%;
          }
          .nfy-feed-item {
            grid-template-columns: 10px 1fr;
          }
          .nfy-feed-time {
            grid-column: 2;
          }
        }
      `}</style>

      <div className="nfy-panel">
        <div className="nfy-headline">
          <div>
            <span className="nfy-kicker">{hero.kicker}</span>
            <h2 className="nfy-title">{hero.title}</h2>
            <p className="nfy-copy">{hero.description}</p>
            <div className="nfy-actions">
              {hero.actions?.map((action, index) => (
                <button
                  key={`${action.label}-${index}`}
                  className={`nfy-btn ${index === 0 ? 'primary' : ''}`}
                  onClick={() => handleAction(action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <aside className="nfy-hero-side">
            <div className="nfy-cover">
              {hero.coverUrl ? <img src={hero.coverUrl} alt={hero.title} /> : <InitialTile title={hero.title} />}
            </div>
            <div className="nfy-metrics">
              {hero.metrics?.map((metric) => (
                <div key={metric.label} className="nfy-metric">
                  <b>{metric.value}</b>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="nfy-grid">
          <div className="nfy-cards">
            {cards.map((card) => (
              <article key={card.id} className={`nfy-card ${card.emphasis ? 'emphasis' : ''}`}>
                <div>
                  <div className="nfy-card-head">
                    <div>
                      <div className={`nfy-card-type ${card.tone || ''}`}>{card.eyebrow}</div>
                      <h3 className="nfy-card-title">{card.title}</h3>
                      <div className="nfy-card-detail">
                        {card.type === 'achievement' && card.detail ? formatRelativeTime(card.detail) : card.detail}
                      </div>
                    </div>
                    {card.media ? (
                      <div className="nfy-card-media">
                        <img src={card.media} alt={card.title} />
                      </div>
                    ) : null}
                  </div>
                  <p className="nfy-card-body">{card.body}</p>
                </div>
                <button className="nfy-card-btn" onClick={() => handleAction(card.action)}>
                  {card.cta} →
                </button>
              </article>
            ))}
          </div>

          <aside className="nfy-feed">
            <div className="nfy-feed-title">
              <div>
                <div className="nfy-card-type">Live feed</div>
                <h3>Actividad util</h3>
              </div>
              <span>{meta.refreshedAt ? `Actualizado ${formatRelativeTime(meta.refreshedAt)}` : ''}</span>
            </div>

            {feed.map((item) => (
              <div key={item.id} className="nfy-feed-item">
                <div className={`nfy-feed-dot ${item.tone || ''}`} />
                <div className="nfy-feed-copy">{item.title}</div>
                <div className="nfy-feed-time">{formatRelativeTime(item.time)}</div>
              </div>
            ))}
          </aside>
        </div>

        <div className="nfy-footer">
          <p className="nfy-footer-copy">
            Discovery, actividad, oportunidad y contexto unidos en una sola capa editorial para mostrar lo que esta pasando ahora en la red.
          </p>
          <div className="nfy-footer-actions">
            <span className="nfy-mini">{meta.activeNow} activos ahora</span>
            <button className="nfy-btn" onClick={() => onAuthAction?.()}>Ver mas actividad</button>
            <button className="nfy-btn primary" onClick={() => handleAction({ kind: 'section', target: 'album' })}>Explorar álbumes</button>
          </div>
        </div>
      </div>
    </section>
  )
}
