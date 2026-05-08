import React, { useState } from 'react'
import BusinessPlansModal from './BusinessPlansModal'

const PLAN_PREVIEW = [
  {
    name: 'Boost',
    price: 'UYU 0',
    accent: '#10b981',
    description: 'Visibilidad basica, contacto y presencia en puntos sugeridos.'
  },
  {
    name: 'Radar',
    price: 'UYU 690/mes',
    accent: 'var(--color-primary)',
    description: 'Mas visibilidad local, promos destacadas y mejor mapa.'
  },
  {
    name: 'Conversion',
    price: 'UYU 1490/mes',
    accent: '#8b5cf6',
    description: 'Top CTA, prioridad comercial y lectura de intencion.'
  },
  {
    name: 'PartnerStore',
    price: 'UYU 1900/mes',
    accent: '#f59e0b',
    description: 'Validacion, badge oficial, rewards y visibilidad premium.'
  }
]

export default function BusinessInfoModal({ isOpen, onClose }) {
  const [showPlansModal, setShowPlansModal] = useState(false)
  if (!isOpen) return null

  const faq = [
    {
      q: '1. Que es FigusUY Negocios?',
      a: 'Es la capa comercial de FigusUY para locales, kioscos y puntos aliados que quieren captar trafico real de la comunidad.'
    },
    {
      q: '2. Que valor nuevo genera hoy la plataforma?',
      a: 'Ya no es solo compra o intercambio. FigusUY ahora canaliza puntos sugeridos por usuarios, visibilidad local, promos, validacion y conversion.'
    },
    {
      q: '3. Puedo sumarme aunque no venda figuritas?',
      a: 'Si. Tambien podes operar como punto sugerido o aliado de intercambio si ofreces un espacio util, visible y confiable.'
    },
    {
      q: '4. Para que sirven los planes?',
      a: 'Escalan cuatro cosas concretas: visibilidad, promos, validacion y conversion. No compran el primer lugar, pero si mas capacidad comercial.'
    },
    {
      q: '5. Que cambia con PartnerStore?',
      a: 'Te convierte en punto de confianza para validar albumes y usuarios, sumar rewards asociados y operar con autoridad dentro del ecosistema.'
    },
    {
      q: '6. Que tiene de especial sugerir puntos?',
      a: 'Los usuarios ayudan a descubrir lugares utiles. Los negocios que entran bien posicionados capturan trafico, contexto y oportunidades de conversion.'
    }
  ]

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <style>{`
        .business-modal {
          background: var(--color-bg);
          width: 100%;
          max-width: 46rem;
          max-height: 90vh;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--color-text);
          animation: modal-up 0.3s ease-out;
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
          padding: 1.15rem 1.2rem;
          margin-bottom: 0.8rem;
        }

        .faq-item {
          margin-bottom: 1.3rem;
        }

        .faq-q {
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 0.45rem;
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, fontStyle: 'italic', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
              FigusUY para Negocios
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Informacion, valor y planes para locales, kioscos y puntos aliados
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-content-scroll">
          <section style={{ marginBottom: '2rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255,90,0,.12), rgba(255,90,0,.03))',
                border: '1px solid rgba(255,90,0,.24)',
                borderRadius: '1rem',
                padding: '1rem 1.1rem',
                marginBottom: '1.4rem'
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
                El negocio ahora captura mas que presencia.
              </strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Gana visibilidad, recibe trafico desde puntos sugeridos, activa promos, valida y convierte mejor.
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--color-text)', fontStyle: 'italic', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
              Vista rapida de planes
            </h3>

            {PLAN_PREVIEW.map((plan) => (
              <div key={plan.name} className="plan-mini-card" style={{ borderColor: plan.accent }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', gap: '0.8rem' }}>
                  <span style={{ fontWeight: 900, color: plan.accent }}>{plan.name}</span>
                  <span style={{ fontWeight: 900, color: 'var(--color-text-secondary)' }}>{plan.price}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{plan.description}</p>
              </div>
            ))}
          </section>

          <section>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.2rem', color: 'var(--color-text)' }}>
              FAQ - Negocios
            </h3>
            {faq.map((item) => (
              <div key={item.q} className="faq-item">
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
