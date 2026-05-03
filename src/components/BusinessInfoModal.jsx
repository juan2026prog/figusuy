import React, { useState } from 'react'
import BusinessPlansModal from './BusinessPlansModal'

export default function BusinessInfoModal({ isOpen, onClose }) {
  const [showPlansModal, setShowPlansModal] = useState(false)
  if (!isOpen) return null

  const handleContact = () => {
    window.open('https://wa.me/59899000000?text=Hola,%20me%20interesa%20un%20plan%20para%20mi%20local%20en%20FigusUY', '_blank')
  }

  const faq = [
    {
      q: "1. ¿Qué es FigusUY Negocios?",
      a: "FigusUY Negocios es la versión para locales, kioscos, tiendas y espacios que quieren aparecer en FigusUY para que más personas los encuentren cuando buscan dónde comprar figuritas o coordinar intercambios cerca."
    },
    {
      q: "2. ¿Mi local puede aparecer aunque no venda figuritas?",
      a: "Sí. También podés sumarte como Punto Aliado si tenés un espacio seguro y visible donde las personas puedan coordinar intercambios, aunque no vendas figuritas directamente."
    },
    {
      q: "3. ¿Cuál es la diferencia entre Tienda y Punto Aliado?",
      a: "Tienda aparece como lugar para comprar figuritas, sobres y productos relacionados. Punto Aliado aparece como lugar sugerido para coordinar intercambios en una zona segura y visible."
    },
    {
      q: "4. ¿Cómo hago para aparecer en FigusUY?",
      a: "Solo tenés que enviar tu solicitud desde “Sumar mi local”, completar los datos básicos y esperar aprobación. Una vez aprobado, tu local podrá aparecer en el mapa, resultados y búsquedas cercanas."
    },
    {
      q: "5. ¿Puedo editar mi local después de publicarlo?",
      a: "Sí. Una vez aprobado, vas a poder acceder a tu panel para actualizar fotos, horarios, descripción, promociones y visibilidad de tu local."
    },
    {
      q: "6. ¿Tiene costo aparecer en FigusUY?",
      a: "Podés empezar gratis con presencia básica. Después vas a poder elegir planes con más visibilidad, métricas, promociones activas y mejor posicionamiento dentro del mapa y resultados."
    }
  ]

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <style>{`
        .business-modal {
          background: var(--color-bg);
          width: 100%;
          max-width: 42rem;
          max-height: 90vh;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--color-text); animation: modal-up 0.3s ease-out;
        }

        .modal-content-scroll {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .plan-mini-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .plan-mini-card.featured {
          border-color: var(--color-primary);
          background: linear-gradient(to bottom right, var(--color-surface), #43140722);
        }

        .faq-item {
          margin-bottom: 1.5rem;
        }

        .faq-q {
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .faq-a {
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        @keyframes modal-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="business-modal">
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>FigusUY para Negocios</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Información y planes para locales</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-content-scroll">
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.5rem', color: '#f8fafc' }}>Nuestros Planes</h3>
            
            <div className="plan-mini-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 900 }}>PLAN GRATIS</span>
                <span style={{ fontWeight: 900, color: '#10b981' }}>$0</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0' }}>Presencia básica en mapa y búsquedas, perfil con contacto y métricas básicas.</p>
            </div>

            <div className="plan-mini-card featured">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--color-primary)' }}>PLAN TURBO ⚡</span>
                <span style={{ fontWeight: 900, color: '#f8fafc' }}>$690/mes</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0' }}>Etiqueta de Destacado, promociones activas y mayor visibilidad en tu zona.</p>
            </div>

            <div className="plan-mini-card" style={{ borderColor: '#8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 900, color: '#8b5cf6' }}>PLAN DOMINIO 🌟</span>
                <span style={{ fontWeight: 900, color: '#f8fafc' }}>$1490/mes</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0' }}>Máxima presencia contextual, múltiples promociones y estadísticas avanzadas.</p>
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.5rem', color: '#f8fafc' }}>FAQ — Negocios / Tiendas</h3>
            {faq.map((item, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">{item.q}</div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </section>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowPlansModal(true)}>
            Ver Planes y Precios
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      <BusinessPlansModal 
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />
    </div>
  )
}
