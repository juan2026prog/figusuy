import React from 'react'
import GamificationIcon from './gamification/icons/GamificationIcon'

const BUSINESS_PLANS = [
  {
    id: 'boost',
    name: 'Boost',
    badge: 'Presencia inicial',
    price: 'USD 0',
    uyuApprox: 'sin costo',
    accent: 'var(--color-text-secondary)',
    className: '',
    iconKey: 'PlanFreeBoostIcon',
    description: 'Para aparecer, recibir puntos sugeridos y activar tu presencia comercial dentro del mapa.',
    features: [
      'Aparecer en puntos sugeridos',
      '1 foto',
      'Promo simple',
      'Contacto visible',
      'Visibilidad basica'
    ]
  },
  {
    id: 'Radar',
    name: 'Radar',
    badge: 'Mas visibilidad',
    price: 'USD 16.85',
    uyuApprox: '≈ $690 UYU estimados',
    accent: 'var(--color-primary)',
    className: 'featured',
    iconKey: 'PlanRadarTurboIcon',
    description: 'Escala presencia local y convierte mejor cuando un usuario esta decidiendo donde ir.',
    features: [
      'Todo Boost',
      'Promos destacadas',
      'Prioridad local',
      'Mejor presencia en mapa',
      'Mas visibilidad en tu radar'
    ]
  },
  {
    id: 'conversion',
    name: 'Conversion',
    badge: 'Intencion comercial',
    price: 'USD 36.20',
    uyuApprox: '≈ $1490 UYU estimados',
    accent: '#8b5cf6',
    className: 'premium',
    iconKey: 'PlanConversionDominioIcon',
    description: 'Pensado para capitalizar trafico, capturar intencion y aparecer primero en el momento correcto.',
    features: [
      'Todo Radar',
      'Top CTA',
      'Prioridad comercial',
      'Promo first',
      'Mejor lectura de intencion'
    ]
  },
  {
    id: 'partnerstore',
    name: 'Collector Hub',
    badge: 'Validación + autoridad',
    price: 'USD 72.90',
    uyuApprox: '≈ $2990 UYU estimados',
    accent: '#f59e0b',
    className: 'partnerstore',
    iconKey: 'CollectorHubIcon',
    description: 'La capa premium para validar, generar confianza, sumar rewards y capturar liquidez del ecosistema.',
    features: [
      'Todo Conversion',
      'Validación de álbumes',
      'Validación de usuarios',
      'Badge Collector Hub',
      'Prioridad de validacion',
      'Rewards asociados',
      'Visibilidad premium',
      'Descuento minimo configurable 10%'
    ]
  }
]

const COMPARISON_ROWS = [
  { label: 'Visibilidad', boost: 'Basica', Radar: 'Alta', conversion: 'Prioritaria', partnerstore: 'Premium' },
  { label: 'Promos', boost: 'Simple', Radar: 'Destacadas', conversion: 'Promo first', partnerstore: 'Promo + rewards' },
  { label: 'Contacto y CTA', boost: 'Visible', Radar: 'Mejorado', conversion: 'Top CTA', partnerstore: 'Top CTA + autoridad' },
  { label: 'Puntos sugeridos', boost: 'Si', Radar: 'Si', conversion: 'Si', partnerstore: 'Si + prioridad' },
  { label: 'Validación', boost: '-', Radar: '-', conversion: '-', partnerstore: 'Álbumes y usuarios' },
  { label: 'Conversion', boost: 'Basica', Radar: 'Local', conversion: 'Alta intencion', partnerstore: 'Premium + rewards' }
]

export default function BusinessPlansModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const handleContact = (plan) => {
    window.open(`https://wa.me/59899000000?text=Hola,%20me%20interesa%20contratar%20el%20plan%20${plan}%20para%20mi%20local%20en%20FigusUY`, '_blank')
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2100 }}>
      <style>{`
        .plans-modal {
          background: var(--color-bg);
          width: 100%;
          max-width: 72rem;
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
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .plan-card-modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 100%;
        }

        .plan-card-modal.featured {
          border-color: var(--color-primary);
          background: linear-gradient(to bottom right, var(--color-surface), #43140744);
        }

        .plan-card-modal.premium {
          border-color: #8b5cf6;
          background: linear-gradient(to bottom right, var(--color-surface), #2e106544);
        }

        .plan-card-modal.partnerstore {
          border-color: #f59e0b;
          background: linear-gradient(to bottom right, var(--color-surface), #78350f44);
        }

        .plan-badge-modal {
          display: inline-flex;
          width: fit-content;
          background: rgba(255,255,255,.05);
          border: 1px solid currentColor;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 900;
          margin-bottom: 0.8rem;
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
          margin-bottom: 0.7rem;
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

        .btn-boost-modal { background: var(--color-border); color: var(--color-text); }
        .btn-Radar-modal { background: var(--color-primary); color: var(--color-text); } /* Radar */
        .btn-conversion-modal { background: #8b5cf6; color: var(--color-text); }
        .btn-partnerstore-modal { background: #f59e0b; color: #000000; }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, minmax(72px, 1fr));
          gap: 0.4rem;
        }

        .comparison-grid > div {
          padding: 0.65rem 0.5rem;
          border-bottom: 1px solid var(--color-border);
          font-size: 0.8rem;
        }

        @keyframes modal-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 760px) {
          .comparison-grid {
            grid-template-columns: 1.4fr repeat(4, minmax(54px, 1fr));
          }
        }
      `}</style>

      <div className="plans-modal">
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Planes para Negocios</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Visibilidad, promos, validacion, trafico y conversion en una misma escalera comercial.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="plans-scroll">
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255,90,0,.12), rgba(255,90,0,.03))',
              border: '1px solid rgba(255,90,0,.25)',
              padding: '1rem 1.1rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.35rem' }}>El valor ya no es solo aparecer.</strong>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              FigusUY ahora canaliza puntos sugeridos por usuarios, promueve promos, habilita validaciones y genera liquidez local.
            </span>
          </div>

          <div className="plans-grid-modal">
            {BUSINESS_PLANS.map((plan) => (
              <div key={plan.id} className={`plan-card-modal ${plan.className}`}>
                <div className="plan-badge-modal" style={{ color: plan.accent, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {plan.iconKey && <GamificationIcon icon={plan.iconKey} size="sm" />}
                  {plan.badge}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>{plan.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', minHeight: '3rem' }}>{plan.description}</p>
                <div className="plan-price-modal" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>{plan.price} <span>/mes</span></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{plan.uyuApprox}</div>
                </div>
                <ul className="feature-list-modal">
                  {plan.features.map((item) => (
                    <li key={item} className="feature-item-modal"><span>+</span>{item}</li>
                  ))}
                </ul>
                <button className={`btn-plan-modal btn-${plan.id}-modal`} onClick={() => handleContact(plan.name)}>
                  {plan.id === 'partnerstore' ? 'Aplicar ahora' : `Contratar ${plan.name}`}
                </button>
                <p style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '0.7rem', lineHeight: 1.3 }}>
                  El cobro se realiza en USD vía PayPal. El valor final en pesos puede variar según la cotización y tu banco.
                </p>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '1.2rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontWeight: 900, marginBottom: '0.9rem' }}>Tabla comparativa</h4>
            <div className="comparison-grid">
              <div style={{ fontWeight: 800, color: 'var(--color-text-secondary)' }}>Beneficio</div>
              <div style={{ textAlign: 'center', fontWeight: 900 }}>Boost</div>
              <div style={{ textAlign: 'center', fontWeight: 900, color: 'var(--color-primary)' }}>Radar</div>
              <div style={{ textAlign: 'center', fontWeight: 900, color: '#8b5cf6' }}>Conversion</div>
              <div style={{ textAlign: 'center', fontWeight: 900, color: '#f59e0b' }}>Collector Hub</div>
              {COMPARISON_ROWS.map((row) => (
                <React.Fragment key={row.label}>
                  <div style={{ fontWeight: 700 }}>{row.label}</div>
                  <div style={{ textAlign: 'center' }}>{row.boost}</div>
                  <div style={{ textAlign: 'center' }}>{row.Radar}</div>
                  <div style={{ textAlign: 'center' }}>{row.conversion}</div>
                  <div style={{ textAlign: 'center' }}>{row.partnerstore}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
