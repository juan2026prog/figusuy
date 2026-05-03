import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isBusinessPlanAtLeast } from '../lib/businessPlans'

export default function BusinessMetrics() {
  const { location } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    profile_views: 0,
    whatsapp_clicks: 0,
    map_clicks: 0,
    detail_clicks: 0
  })

  useEffect(() => {
    if (location) {
      fetchMetrics()
    }
  }, [location])

  const fetchMetrics = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('business_events')
      .select('event_type')
      .eq('location_id', location.id)

    if (!error && data) {
      const counts = {
        profile_views: 0,
        whatsapp_clicks: 0,
        map_clicks: 0,
        detail_clicks: 0
      }
      data.forEach(e => {
        if (counts[e.event_type] !== undefined) {
          counts[e.event_type]++
        }
      })
      setStats(counts)
    }
    setLoading(false)
  }

  if (!location) return null

  const plan = location.business_plan
  const isTurbo = isBusinessPlanAtLeast(plan, 'turbo')
  const isDominio = isBusinessPlanAtLeast(plan, 'dominio')

  // Derived metrics
  const totalVisibility = stats.profile_views + stats.map_clicks
  const totalInteraction = stats.whatsapp_clicks + stats.detail_clicks
  const ctr = totalVisibility > 0 ? ((totalInteraction / totalVisibility) * 100).toFixed(1) : '0.0'

  return (
    <div className="biz-page">
      <style>{`
        /* Layer header */
        .metrics-layer {
          margin-top: 28px;
        }
        .metrics-layer:first-of-type {
          margin-top: 0;
        }
        .layer-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border: 1px solid var(--line);
          background: var(--panel2);
          margin-bottom: 1px;
        }
        .layer-head .material-symbols-outlined {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 1px solid var(--line2);
          background: #0d0d0d;
          font-size: 1.35rem;
        }
        .layer-head h3 {
          font: italic 900 1.85rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
          margin: 0;
        }
        .layer-head p {
          margin: 4px 0 0;
          color: var(--muted2);
          font: 900 .74rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        /* Metrics grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
          border-top: 0;
        }

        .metric-card {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 1.2rem;
          background: var(--panel);
        }

        .metric-icon {
          width: 3rem;
          height: 3rem;
          display: grid;
          place-items: center;
          border: 1px solid var(--line2);
          background: rgba(255, 90, 0, .08);
          color: var(--orange);
        }

        .metric-info h4 {
          margin: 0 0 .2rem;
          color: var(--muted2);
          font: 900 .76rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .metric-info p {
          margin: 0;
          font: italic 900 2rem 'Barlow Condensed';
          line-height: .88;
          text-transform: uppercase;
        }

        /* Optimizacion layer */
        .optimization-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
          border-top: 0;
        }

        .optimization-card {
          padding: 1.2rem;
          background: #0d0d0d;
        }

        .optimization-card h4 {
          margin: 0 0 .35rem;
          color: var(--muted2);
          font: 900 .76rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .optimization-card p {
          margin: 0;
          font: italic 900 1.8rem 'Barlow Condensed';
          line-height: .88;
          text-transform: uppercase;
        }

        /* Tip card */
        .metrics-tip {
          padding: 1.35rem;
          border: 1px solid rgba(34, 197, 94, .22);
          background: rgba(34, 197, 94, .08);
          display: flex;
          gap: 1rem;
          align-items: start;
          margin-bottom: 22px;
        }

        .metrics-tip .material-symbols-outlined {
          color: var(--green);
          font-size: 2rem;
        }

        /* Locked overlay */
        .locked-wrap {
          position: relative;
        }

        .locked-wrap.locked::after {
          content: '';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(2, 6, 23, .82);
          backdrop-filter: blur(4px);
        }

        .locked-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          background: var(--panel2);
          border: 1px solid var(--line2);
          font: italic 900 1.1rem 'Barlow Condensed';
          text-transform: uppercase;
          white-space: nowrap;
        }

        .locked-badge .material-symbols-outlined {
          color: var(--orange);
          font-size: 1.4rem;
        }

        /* Plan access labels */
        .plan-access {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          font: 900 .66rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-left: auto;
        }
        .plan-access.free { color: var(--muted2); border: 1px solid var(--line); }
        .plan-access.turbo { color: var(--orange); border: 1px solid rgba(255,90,0,.3); background: rgba(255,90,0,.06); }
        .plan-access.dominio { color: #a78bfa; border: 1px solid rgba(139,92,246,.3); background: rgba(139,92,246,.06); }

        @media (max-width: 980px) {
          .metrics-grid,
          .optimization-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="biz-section-head">
        <div>
          <div className="biz-page-kicker">/ metricas</div>
          <h2>Rendimiento del local</h2>
          <p>Tu sistema de metricas organizado en 4 capas: visibilidad, interaccion, conversion y optimizacion.</p>
        </div>
      </div>

      {/* Tip card */}
      <div className="metrics-tip">
        <span className="material-symbols-outlined">lightbulb</span>
        <div>
          <h3 style={{ margin: '0 0 .25rem', font: "italic 900 1.6rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Consejo para mejorar</h3>
          <p className="biz-card-copy">Sumar fotos puede mejorar tus clicks. Mantener horario y descripcion actualizados tambien eleva confianza.</p>
        </div>
      </div>

      {loading ? (
        <div className="biz-card"><p className="biz-text-muted">Cargando metricas...</p></div>
      ) : (
        <>
          {/* LAYER 1: VISIBILIDAD */}
          <div className="metrics-layer">
            <div className="layer-head">
              <span className="material-symbols-outlined" style={{ color: 'var(--orange)' }}>visibility</span>
              <div style={{ flex: 1 }}>
                <h3>Visibilidad</h3>
                <p>¿Me están viendo?</p>
              </div>
              <span className="plan-access free">Todos los planes</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon"><span className="material-symbols-outlined">person</span></div>
                <div className="metric-info"><h4>Vistas del perfil</h4><p>{stats.profile_views}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(56,189,248,.08)', color: 'var(--blue)' }}><span className="material-symbols-outlined">map</span></div>
                <div className="metric-info"><h4>Vistas en mapa</h4><p>{stats.map_clicks}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(250,204,21,.08)', color: 'var(--yellow)' }}><span className="material-symbols-outlined">search</span></div>
                <div className="metric-info"><h4>Apariciones en resultados</h4><p>{stats.detail_clicks}</p></div>
              </div>
            </div>
          </div>

          {/* LAYER 2: INTERACCION — Turbo+ */}
          <div className={`metrics-layer locked-wrap ${!isTurbo ? 'locked' : ''}`}>
            <div className="layer-head">
              <span className="material-symbols-outlined" style={{ color: 'var(--green)' }}>touch_app</span>
              <div style={{ flex: 1 }}>
                <h3>Interacción</h3>
                <p>¿Me prestan atención?</p>
              </div>
              <span className="plan-access turbo">Turbo +</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(34,197,94,.08)', color: 'var(--green)' }}><span className="material-symbols-outlined">chat</span></div>
                <div className="metric-info"><h4>Clicks a WhatsApp / telefono</h4><p>{stats.whatsapp_clicks}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(255,90,0,.08)', color: 'var(--orange)' }}><span className="material-symbols-outlined">campaign</span></div>
                <div className="metric-info"><h4>Clicks en promo</h4><p>{stats.detail_clicks}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(250,204,21,.08)', color: 'var(--yellow)' }}><span className="material-symbols-outlined">favorite</span></div>
                <div className="metric-info"><h4>Favoritos guardados</h4><p>--</p></div>
              </div>
            </div>
            {!isTurbo && (
              <div className="locked-badge">
                <span className="material-symbols-outlined">lock</span>
                Disponible desde Plan Turbo
              </div>
            )}
          </div>

          {/* LAYER 3: CONVERSION — Dominio */}
          <div className={`metrics-layer locked-wrap ${!isDominio ? 'locked' : ''}`}>
            <div className="layer-head">
              <span className="material-symbols-outlined" style={{ color: '#a78bfa' }}>shopping_cart</span>
              <div style={{ flex: 1 }}>
                <h3>Conversión</h3>
                <p>¿Me están eligiendo?</p>
              </div>
              <span className="plan-access dominio">Dominio</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(139,92,246,.08)', color: '#a78bfa' }}><span className="material-symbols-outlined">directions</span></div>
                <div className="metric-info"><h4>Clicks en cómo llegar</h4><p>{stats.map_clicks}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(139,92,246,.08)', color: '#a78bfa' }}><span className="material-symbols-outlined">forum</span></div>
                <div className="metric-info"><h4>Chats iniciados</h4><p>{stats.whatsapp_clicks}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'rgba(139,92,246,.08)', color: '#a78bfa' }}><span className="material-symbols-outlined">percent</span></div>
                <div className="metric-info"><h4>CTR</h4><p>{ctr}%</p></div>
              </div>
            </div>
            {!isDominio && (
              <div className="locked-badge">
                <span className="material-symbols-outlined">lock</span>
                Disponible en Plan Dominio
              </div>
            )}
          </div>

          {/* LAYER 4: OPTIMIZACION — Dominio */}
          <div className={`metrics-layer locked-wrap ${!isDominio ? 'locked' : ''}`}>
            <div className="layer-head">
              <span className="material-symbols-outlined" style={{ color: 'var(--yellow)' }}>auto_fix_high</span>
              <div style={{ flex: 1 }}>
                <h3>Optimización</h3>
                <p>¿Qué hago ahora?</p>
              </div>
              <span className="plan-access dominio">Dominio</span>
            </div>
            <div className="optimization-grid">
              <div className="optimization-card">
                <h4>Mejor día</h4>
                <p>Sábados</p>
              </div>
              <div className="optimization-card">
                <h4>Mejor horario</h4>
                <p>14 – 18h</p>
              </div>
              <div className="optimization-card">
                <h4>Barrio top</h4>
                <p>Pocitos</p>
              </div>
            </div>
            {!isDominio && (
              <div className="locked-badge">
                <span className="material-symbols-outlined">lock</span>
                Disponible en Plan Dominio
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
