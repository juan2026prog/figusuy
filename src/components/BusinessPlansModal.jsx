import React from 'react'

export default function BusinessPlansModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const handleContact = (plan) => {
    window.open(`https://wa.me/59899000000?text=Hola,%20me%20interesa%20contratar%20el%20${plan}%20para%20mi%20local%20en%20FigusUY`, '_blank')
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2100 }}>
      <style>{`
        .plans-modal {
          background: var(--color-bg);
          width: 100%;
          max-width: 60rem;
          max-height: 90vh;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--color-text);
          animation: modal-up 0.3s ease-out;
        }

        .plans-scroll {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .plans-grid-modal {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .plan-card-modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .plan-card-modal.featured {
          border-color: var(--color-primary);
          background: linear-gradient(to bottom right, var(--color-surface), #43140744);
        }

        .plan-card-modal.premium {
          border-color: #8b5cf6;
          background: linear-gradient(to bottom right, var(--color-surface), #2e106544);
        }

        .plan-badge-modal {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-primary);
          color: var(--color-text);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 900;
        }

        .plan-price-modal {
          font-size: 2.5rem;
          font-weight: 900;
          margin: 1rem 0;
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .plan-price-modal span {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .feature-list-modal {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }

        .feature-item-modal {
          display: flex;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .feature-item-modal span {
          color: #10b981;
          font-weight: 900;
        }

        .btn-plan-modal {
          width: 100%;
          padding: 0.875rem;
          border-radius: 4px;
          font-weight: 900;
          border: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-gratis-modal { background: var(--color-border); color: var(--color-text); }
        .btn-turbo-modal { background: var(--color-primary); color: var(--color-text); }
        .btn-dominio-modal { background: #8b5cf6; color: var(--color-text); }

        @keyframes modal-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="plans-modal">
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Planes para Negocios</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Gratis para existir, Turbo para vender y Dominio para dominar tu zona</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="plans-scroll">
          <div className="plans-grid-modal">
            <div className="plan-card-modal">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎒</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Plan Gratis</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Entrada sin costo para figurar en el mapa.</p>
              <div className="plan-price-modal">UYU 0 <span>/mes</span></div>
              <ul className="feature-list-modal">
                <li className="feature-item-modal"><span>✓</span> Aparecer en el mapa</li>
                <li className="feature-item-modal"><span>✓</span> Ficha basica</li>
                <li className="feature-item-modal"><span>✓</span> Direccion y horario</li>
                <li className="feature-item-modal"><span>✓</span> 0 fotos</li>
                <li className="feature-item-modal"><span>✓</span> Sin promos</li>
                <li className="feature-item-modal"><span>✓</span> Metricas minimas</li>
              </ul>
              <button className="btn-plan-modal btn-gratis-modal" onClick={() => handleContact('Plan Gratis')}>Contratar Gratis</button>
            </div>

            <div className="plan-card-modal featured">
              <div className="plan-badge-modal">MAS POPULAR</div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💎</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Plan Turbo</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Escala visibilidad con herramientas para vender mejor.</p>
              <div className="plan-price-modal">UYU 690 <span>/mes</span></div>
              <ul className="feature-list-modal">
                <li className="feature-item-modal"><span>✓</span> Todo Gratis</li>
                <li className="feature-item-modal"><span>✓</span> 1 foto</li>
                <li className="feature-item-modal"><span>✓</span> 1 promo activa</li>
                <li className="feature-item-modal"><span>✓</span> Badge destacado</li>
                <li className="feature-item-modal"><span>✓</span> Boton de WhatsApp visible</li>
                <li className="feature-item-modal"><span>✓</span> Metricas basicas</li>
              </ul>
              <button className="btn-plan-modal btn-turbo-modal" onClick={() => handleContact('Plan Turbo')}>Contratar Turbo</button>
            </div>

            <div className="plan-card-modal premium">
              <div className="plan-badge-modal" style={{ background: '#8b5cf6' }}>MAXIMA VISIBILIDAD</div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚀</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Plan Dominio</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>La capa mas fuerte para posicionarte y dominar tu zona.</p>
              <div className="plan-price-modal">UYU 1490 <span>/mes</span></div>
              <ul className="feature-list-modal">
                <li className="feature-item-modal"><span>✓</span> Todo Turbo</li>
                <li className="feature-item-modal"><span>✓</span> 3 fotos</li>
                <li className="feature-item-modal"><span>✓</span> Logo visible</li>
                <li className="feature-item-modal"><span>✓</span> Multiples promos</li>
                <li className="feature-item-modal"><span>✓</span> Destaque en tu zona</li>
                <li className="feature-item-modal"><span>✓</span> Metricas avanzadas</li>
                <li className="feature-item-modal"><span>✓</span> Prioridad alta en resultados</li>
              </ul>
              <button className="btn-plan-modal btn-dominio-modal" onClick={() => handleContact('Plan Dominio')}>Contratar Dominio</button>
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>Por que elegir un plan</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              La progresion comercial es clara: el plan Gratis te hace existir, Turbo te ayuda a vender mejor y Dominio te da la capa mas fuerte de visibilidad, prioridad y posicionamiento.
            </p>
          </div>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
