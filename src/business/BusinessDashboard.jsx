import React from 'react'
import { useOutletContext, Link } from 'react-router-dom'

export default function BusinessDashboard() {
  const { location } = useOutletContext()

  if (!location) {
    return (
      <div className="biz-empty-state">
        <h2>Bienvenido a FigusUY Negocios</h2>
        <p>Parece que todavia no tienes un local configurado. Contacta a soporte para reclamar o crear tu local.</p>
        <Link to="/business/help" className="biz-btn-primary">Ir a ayuda</Link>
      </div>
    )
  }

  return (
    <div className="biz-page">
      <style>{`
        .dashboard-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
          gap: 1.25rem;
        }

        .dashboard-hero-main {
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          border: 1px solid var(--line);
          background:
            linear-gradient(135deg, rgba(255, 90, 0, .14) 0%, rgba(255, 90, 0, .03) 26%, transparent 46%),
            linear-gradient(180deg, #181818 0%, #111111 100%);
        }

        .dashboard-hero-main::before {
          content: 'RESUMEN';
          position: absolute;
          right: 1rem;
          top: -.2rem;
          font: italic 900 clamp(3rem, 7vw, 6.4rem) 'Barlow Condensed';
          line-height: .82;
          color: rgba(255, 255, 255, .04);
          pointer-events: none;
        }

        .dashboard-hero-main::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 4px;
          background: linear-gradient(90deg, var(--orange) 0%, rgba(255, 90, 0, 0) 72%);
        }

        .dashboard-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 48rem;
        }

        .dashboard-hero-copy h2 {
          margin: .5rem 0 0;
          font: italic 900 clamp(2.6rem, 5vw, 4.4rem) 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .86;
        }

        .dashboard-hero-copy h2 span {
          color: var(--orange);
        }

        .dashboard-hero-copy p {
          margin-top: .8rem;
          color: var(--muted);
          line-height: 1.6;
          font-size: .96rem;
        }

        .dashboard-hero-side {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
        }

        .dashboard-hero-side h3 {
          margin-top: .55rem;
          font: italic 900 2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .dashboard-hero-side p {
          margin-top: .65rem;
        }

        .dashboard-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .dashboard-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .dashboard-action-card {
          padding: 1.2rem;
          border: 1px solid var(--line);
          background: var(--panel);
          color: #fff;
          text-decoration: none;
          transition: .18s ease;
        }

        .dashboard-action-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 90, 0, .35);
          background: var(--panel2);
        }

        .dashboard-action-card .material-symbols-outlined {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.75rem;
          height: 2.75rem;
          margin-bottom: .9rem;
          border: 1px solid rgba(255, 90, 0, .35);
          background: rgba(255, 90, 0, .08);
          color: var(--orange);
          font-size: 1.5rem;
        }

        .dashboard-action-card strong {
          display: block;
          font: italic 900 1.55rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .dashboard-action-card span:last-child {
          display: block;
          margin-top: .55rem;
          color: var(--muted);
          font-size: .9rem;
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .dashboard-hero,
          .dashboard-kpis,
          .dashboard-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="dashboard-hero">
        <div className="dashboard-hero-main">
          <div className="dashboard-hero-copy">
            <div className="biz-page-kicker">/ panel del local</div>
            <h2>Tu local esta <span>activo</span> y listo para convertir.</h2>
            <p>Existí, vendé mejor o dominá tu zona. Actualizá fotos, activá promos y mejorá tu presencia en el mapa.</p>
          </div>
        </div>

        <aside className="biz-card emphasis dashboard-hero-side">
          <div>
            <div className="biz-page-kicker">/ tu modelo mental</div>
            <h3>Me ven → me tocan → me eligen.</h3>
            <p className="biz-card-copy">Tus metricas responden ese flujo. El siguiente paso es mejorar visibilidad y sostener presencia consistente.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.55rem' }}>
            <span className="biz-chip green">Perfil activo</span>
            <span className="biz-chip orange" style={{ textTransform: 'capitalize' }}>{location.business_plan}</span>
          </div>
        </aside>
      </section>

      <section className="biz-page">
          <div className="biz-section-head">
          <div>
            <div className="biz-page-kicker">/ resumen</div>
            <h2>Visibilidad hoy</h2>
            <p>Lectura rapida de tu presencia activa. Para analisis completo, entra a Metricas.</p>
          </div>
        </div>

        <div className="dashboard-kpis">
          <div className="biz-kpi">
            <span className="biz-kpi-label">Vistas del perfil</span>
            <strong className="biz-kpi-value">--</strong>
          </div>
          <div className="biz-kpi">
            <span className="biz-kpi-label">Clicks a WhatsApp</span>
            <strong className="biz-kpi-value">--</strong>
          </div>
          <div className="biz-kpi">
            <span className="biz-kpi-label">Como llegar</span>
            <strong className="biz-kpi-value">--</strong>
          </div>
          <div className="biz-kpi" style={{ background: 'rgba(255, 90, 0, .08)', borderColor: 'rgba(255, 90, 0, .22)' }}>
            <span className="biz-kpi-label" style={{ color: 'var(--orange)' }}>Plan actual</span>
            <strong className="biz-kpi-value" style={{ color: 'var(--orange)', textTransform: 'capitalize' }}>{location.business_plan}</strong>
          </div>
        </div>
      </section>

      <section className="biz-page">
        <div className="biz-section-head">
          <div>
            <div className="biz-page-kicker">/ acciones</div>
            <h2>Mejorá tu presencia</h2>
            <p>Cada accion mejora visibilidad, contacto o conversion dentro del ecosistema FigusUY.</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/business/profile" className="dashboard-action-card">
            <span className="material-symbols-outlined">edit_square</span>
            <strong>Editar perfil</strong>
            <span>Actualiza datos publicos, descripcion y servicios para que tu ficha venda mejor.</span>
          </Link>
          <Link to="/business/photos" className="dashboard-action-card">
            <span className="material-symbols-outlined">add_a_photo</span>
            <strong>Subir fotos</strong>
            <span>Mejora la percepcion visual del local y refuerza confianza desde la primera vista.</span>
          </Link>
          <Link to="/business/promo" className="dashboard-action-card">
            <span className="material-symbols-outlined">campaign</span>
            <strong>Activar promo</strong>
            <span>Destaca mensajes comerciales cuando quieras empujar una accion puntual.</span>
          </Link>
          <Link to="/business/billing" className="dashboard-action-card">
            <span className="material-symbols-outlined">bolt</span>
            <strong>Mejorar plan</strong>
            <span>Desbloquea mas visibilidad, mas fotos y herramientas comerciales superiores.</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
