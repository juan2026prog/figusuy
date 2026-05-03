import React from 'react'

export default function BusinessHelp() {
  const faqs = [
    { q: 'Como aparezco mas arriba en el mapa?', a: 'Los planes Turbo y Dominio tienen prioridad en el mapa y listados. Completar horarios, fotos y descripcion tambien mejora tu presencia.' },
    { q: 'Como funcionan las promos?', a: 'Las promos destacan un mensaje comercial como llegada de albumes o descuentos puntuales. Requieren plan Turbo o Dominio.' },
    { q: 'Puedo cambiar mis fotos?', a: 'Si. Desde la seccion Fotos puedes subir, reemplazar y mantener actualizada la identidad visual del local.' }
  ]

  return (
    <div className="biz-page">
      <style>{`
        .help-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr);
          gap: 1.25rem;
        }

        .help-faq,
        .help-side,
        .faq-item {
          border: 1px solid var(--line);
          background: var(--panel);
        }

        .help-faq,
        .help-side {
          padding: 1.35rem;
        }

        .faq-list {
          display: grid;
          gap: .8rem;
        }

        .faq-item {
          padding: 1rem 1.1rem;
          background: #0d0d0d;
        }

        .faq-q {
          margin: 0 0 .45rem;
          font: italic 900 1.4rem 'Barlow Condensed';
          line-height: .92;
          text-transform: uppercase;
        }

        .faq-a,
        .help-side p {
          color: var(--muted);
          line-height: 1.58;
        }

        .help-side {
          background:
            linear-gradient(180deg, rgba(255, 90, 0, .1) 0%, rgba(255, 90, 0, 0) 100%),
            var(--panel2);
        }

        .help-side h3 {
          margin-top: .5rem;
          font: italic 900 2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        @media (max-width: 980px) {
          .help-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="biz-section-head">
        <div>
          <div className="biz-page-kicker">/ ayuda</div>
          <h2>Centro de ayuda</h2>
          <p>Esta pantalla se mantiene simple y util: respuestas concretas a dudas frecuentes y una salida clara hacia soporte.</p>
        </div>
      </div>

      <section className="help-layout">
        <div className="help-faq">
          <div className="biz-page-kicker">/ preguntas frecuentes</div>
          <h2 className="biz-card-title">Lo mas consultado</h2>
          <div className="faq-list" style={{ marginTop: '1rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">{faq.q}</div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="help-side">
          <div className="biz-page-kicker">/ soporte</div>
          <h3>Necesitas mas ayuda?</h3>
          <p>Nuestro equipo de soporte a tiendas esta disponible para ayudarte a sacar el maximo provecho de tu local en FigusUY.</p>
          <a href="https://wa.me/59899000000" target="_blank" rel="noreferrer" className="biz-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>support_agent</span>
            Contactar soporte
          </a>
        </aside>
      </section>
    </div>
  )
}
