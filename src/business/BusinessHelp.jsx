import React from 'react'

export default function BusinessHelp() {
  const faqs = [
    { q: "¿Cómo aparezco más arriba en el mapa?", a: "Los planes Turbo y Dominio tienen prioridad en el mapa y listados. Además, completar toda tu info (horarios, fotos) mejora tu ranking." },
    { q: "¿Cómo funcionan las promos?", a: "Las promos te permiten destacar un mensaje ('Llegaron álbumes', '20% OFF en sobres') que los usuarios verán mientras navegan. Requiere plan Turbo o Dominio." },
    { q: "¿Puedo cambiar mis fotos?", a: "Sí, desde la sección Fotos podés subir y ordenar tus imágenes." }
  ]

  return (
    <div className="biz-help">
      <style>{`
        .help-card {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 2rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
        }
        .faq-item {
          border-bottom: 1px solid #334155;
          padding: 1.5rem 0;
        }
        .faq-item:last-child { border-bottom: none; }
        .faq-q {
          font-size: 1.125rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }
        .faq-a {
          color: #cbd5e1;
          line-height: 1.5;
        }
        .support-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          color: #0f172a;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 800;
          text-decoration: none;
        }
      `}</style>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Centro de Ayuda</h2>

      <div className="help-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
          Preguntas Frecuentes
        </h3>
        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="help-card" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', borderColor: '#ea580c', color: 'white' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>¿Necesitás más ayuda?</h3>
        <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.9)' }}>
          Nuestro equipo de soporte a tiendas está disponible para ayudarte a sacar el máximo provecho de tu local en FigusUY.
        </p>
        <a href="https://wa.me/59899000000" target="_blank" rel="noreferrer" className="support-btn">
          <span className="material-symbols-outlined">support_agent</span>
          Contactar Soporte
        </a>
      </div>
    </div>
  )
}
