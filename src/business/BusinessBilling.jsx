import React from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { BUSINESS_PLAN_ORDER, getBusinessPlanLabel } from '../lib/businessPlans'

export default function BusinessBilling() {
  const { location } = useOutletContext()

  if (!location) return null

  const plans = [
    {
      id: 'gratis',
      name: 'Gratis',
      price: 'UYU 0',
      stage: 'Existis',
      subtitle: 'Entrada sin costo para figurar en el mapa.',
      contact: { icon: 'block', label: 'Sin contacto directo', class: 'none' },
      features: ['Aparecer en el mapa', 'Ficha basica', 'Direccion y horario', '0 fotos', 'Sin promos', 'Metricas minimas']
    },
    {
      id: 'turbo',
      name: 'Turbo',
      price: 'UYU 690',
      stage: 'Convertis',
      subtitle: 'Escala visibilidad con herramientas para vender mejor.',
      contact: { icon: 'phone_in_talk', label: 'Telefono visible', class: 'phone' },
      features: ['Todo Gratis', '1 foto', '1 promo activa', 'Badge destacado', 'Telefono visible', 'Metricas basicas']
    },
    {
      id: 'dominio',
      name: 'Dominio',
      price: 'UYU 1.490',
      stage: 'Dominas',
      subtitle: 'La capa mas fuerte para posicionarte y dominar tu zona.',
      contact: { icon: 'chat', label: 'Boton directo a WhatsApp', class: 'whatsapp' },
      features: ['Todo Turbo', '3 fotos', 'Logo visible', 'Multiples promos', 'Destaque en tu zona', 'Boton directo a WhatsApp', 'Metricas avanzadas', 'Prioridad alta en resultados']
    },
    {
      id: 'legend',
      name: 'Legend',
      price: 'UYU 1.900',
      stage: 'Referente',
      subtitle: 'La capa m\u00e1s alta de autoridad, validaci\u00f3n y prestigio dentro de FigusUY.',
      contact: { icon: 'workspace_premium', label: 'Tienda PartnerStore', class: 'legend' },
      features: ['Todo Dominio', 'Badge Legend', 'Tienda PartnerStore', 'Validación de álbumes completos', 'Verificación de colecciones', 'Validación PartnerStore manual', 'Mayor autoridad y confianza', 'Tráfico físico por validación', 'Máxima prioridad visual']
    }
  ]

  const sortedPlans = [...plans].sort(
    (a, b) => BUSINESS_PLAN_ORDER.indexOf(a.id) - BUSINESS_PLAN_ORDER.indexOf(b.id)
  )
  const currentBusinessLevel = sortedPlans.findIndex(plan => plan.id === location.business_plan)

  const getBusinessPlanCta = (planId) => {
    const targetLevel = sortedPlans.findIndex(plan => plan.id === planId)

    if (targetLevel === currentBusinessLevel) {
      return {
        label: 'Plan actual',
        note: planId === 'legend'
          ? 'Tu punto tiene el nivel mas alto de visibilidad y autoridad activa.'
          : planId === 'dominio'
            ? 'Tenes la maxima visibilidad activa.'
            : 'Este es tu plan activo.',
        tone: 'current',
        disabled: true
      }
    }

    if (targetLevel > currentBusinessLevel) {
      return {
        label: 'Mejorar plan',
        note: planId === 'turbo'
          ? 'Ideal para empezar a convertir mas visitas.'
          : planId === 'legend'
            ? 'No solo destacas. Te convertis en referencia.'
            : 'Desbloquea mas alcance y visibilidad.',
        tone: 'upgrade',
        disabled: false
      }
    }

    return {
      label: 'Cambiar plan',
      note: 'Ajusta tu plan segun lo que necesites.',
      tone: 'change',
      disabled: false
    }
  }

  return (
    <div className="biz-page">
      <style>{`
        .billing-current {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) auto;
          gap: 1rem;
          align-items: center;
          padding: 1.5rem;
          border: 1px solid var(--line);
          background:
            linear-gradient(135deg, rgba(255, 90, 0, .14) 0%, rgba(255, 90, 0, .04) 26%, transparent 48%),
            var(--panel);
        }

        .billing-current h2 {
          margin: .5rem 0 0;
          font: italic 900 2.5rem 'Barlow Condensed';
          line-height: .88;
          text-transform: uppercase;
        }

        .billing-current p {
          margin-top: .7rem;
          color: var(--muted);
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }

        .plan {
          position: relative;
          background: var(--panel);
          padding: 28px;
          display: flex;
          flex-direction: column;
          min-height: 560px;
          overflow: hidden;
        }

        .plan:before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: transparent;
        }

        .plan.turbo {
          background: var(--panel2);
        }
        .plan.turbo:before {
          background: var(--orange);
        }

        .plan.dominio {
          background: linear-gradient(135deg, #181818 0%, #101010 60%, rgba(255,90,0,.16) 100%);
        }

        .plan.legend {
          background: linear-gradient(135deg, rgba(250,204,21,.14) 0%, rgba(255,90,0,.08) 36%, #101010 100%);
        }
        .plan.legend:before {
          background: linear-gradient(90deg, var(--yellow) 0%, var(--orange) 100%);
        }

        .plan-ribbon {
          position: absolute;
          right: 16px;
          top: 16px;
          background: var(--orange);
          color: #fff;
          padding: 5px 9px;
          font: 900 .65rem 'Barlow Condensed';
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .plan-icon {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          background: #0d0d0d;
          border: 1px solid var(--line2);
          font-size: 1.8rem;
          margin-bottom: 18px;
        }
        .plan.turbo .plan-icon {
          background: rgba(255,90,0,.1);
          border-color: rgba(255,90,0,.3);
        }
        .plan.legend .plan-icon {
          background: rgba(250,204,21,.1);
          border-color: rgba(250,204,21,.3);
          color: var(--yellow);
        }

        .plan-name {
          font: italic 900 2.6rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .86;
        }

        .plan-concept {
          color: var(--muted);
          font-size: .92rem;
          line-height: 1.45;
          margin-top: 9px;
          min-height: 48px;
        }

        .plan-price {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          margin: 28px 0 22px;
        }

        .plan-price b {
          font: italic 900 3.2rem 'Barlow Condensed';
          line-height: .8;
          color: var(--muted2);
        }

        .plan-price span {
          color: var(--muted2);
          font-size: .82rem;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .plan-features {
          display: grid;
          gap: 12px;
          margin-bottom: 26px;
          flex: 1;
        }

        .feature {
          display: grid;
          grid-template-columns: 20px 1fr;
          gap: 9px;
          color: var(--muted);
          font-size: .92rem;
          line-height: 1.35;
        }

        .feature .check {
          color: var(--green);
          font-weight: 900;
        }
        .plan.turbo .check,
        .plan.dominio .check {
          color: var(--orange);
        }
        .plan.legend .check {
          color: var(--yellow);
        }

        .btn-plan {
          border: 1px solid var(--line2);
          background: transparent;
          color: #fff;
          padding: .85rem 1.15rem;
          font: 900 .88rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          text-decoration: none;
        }
        .btn-plan.orange {
          background: var(--orange);
          border-color: var(--orange);
        }
        .btn-plan.orange:hover {
          background: var(--orange2);
          border-color: var(--orange2);
        }
        .btn-plan.secondary {
          background: transparent;
          border-color: var(--line2);
          color: #fff;
        }
        .btn-plan:hover:not(.orange) {
          border-color: var(--orange);
          color: var(--orange);
        }
        .btn-plan.disabled {
          opacity: 0.5;
          pointer-events: none;
          background: transparent;
          border-color: var(--line2);
          color: var(--muted);
        }
        .plan-cta-note {
          margin-top: 10px;
          color: var(--muted2);
          font-size: .8rem;
          line-height: 1.45;
          text-align: center;
          min-height: 34px;
        }

        @media (max-width: 1180px) {
          .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 980px) {
          .billing-current {
            grid-template-columns: 1fr;
          }
          .plans-grid {
            grid-template-columns: 1fr;
            gap: 14px;
            background: transparent;
            border: 0;
          }
          .plan {
            border: 1px solid var(--line);
            min-height: auto;
          }
        }
      `}</style>

      <section className="billing-current">
        <div>
          <div className="biz-page-kicker">/ plan actual</div>
          <h2>{getBusinessPlanLabel(location.business_plan)}</h2>
          <p>Tu estado esta activo. Desde aca puedes leer el valor de cada plan con mas claridad y decidir si vale la pena escalar visibilidad, posicionamiento o autoridad.</p>
        </div>
        <button className="biz-btn-secondary">Gestionar pago</button>
      </section>

      <div className="biz-section-head" style={{ marginTop: '34px', marginBottom: '18px' }}>
        <div>
          <div className="biz-page-kicker">/ planes</div>
          <h2 style={{ font: 'italic 900 3rem "Barlow Condensed"', textTransform: 'uppercase', lineHeight: '.9', marginTop: '4px' }}>Existi, converti, domina y valida</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.95rem', marginTop: '7px' }}>La progresion comercial va de presencia basica a autoridad real. Gratis te hace existir, Turbo te ayuda a vender, Dominio te posiciona y Legend te convierte en punto de referencia dentro del ecosistema.</p>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map((p) => {
          const isActive = location.business_plan === p.id
          const cta = getBusinessPlanCta(p.id)

          let planClass = 'plan'
          if (p.id === 'turbo') planClass += ' turbo'
          if (p.id === 'dominio') planClass += ' dominio'
          if (p.id === 'legend') planClass += ' legend'

          let iconName = 'storefront'
          if (p.id === 'turbo') iconName = 'diamond'
          if (p.id === 'dominio') iconName = 'rocket_launch'
          if (p.id === 'legend') iconName = 'workspace_premium'

          const contactBorder =
            p.contact.class === 'whatsapp'
              ? 'rgba(34,197,94,.3)'
              : p.contact.class === 'phone'
                ? 'rgba(255,90,0,.3)'
                : p.contact.class === 'legend'
                  ? 'rgba(250,204,21,.32)'
                  : 'var(--line)'

          const contactBackground =
            p.contact.class === 'whatsapp'
              ? 'rgba(34,197,94,.07)'
              : p.contact.class === 'phone'
                ? 'rgba(255,90,0,.07)'
                : p.contact.class === 'legend'
                  ? 'rgba(250,204,21,.08)'
                  : 'rgba(255,255,255,.03)'

          const contactColor =
            p.contact.class === 'whatsapp'
              ? 'var(--green)'
              : p.contact.class === 'phone'
                ? 'var(--orange)'
                : p.contact.class === 'legend'
                  ? 'var(--yellow)'
                  : 'var(--muted2)'

          return (
            <article key={p.id} className={planClass}>
              {isActive && <div className="plan-ribbon">Tu plan</div>}
              {p.id === 'turbo' && !isActive && <div className="plan-ribbon">Mas popular</div>}
              {p.id === 'legend' && !isActive && (
                <div className="plan-ribbon" style={{ background: 'linear-gradient(90deg, var(--yellow), var(--orange))', color: '#111' }}>
                  PartnerStore
                </div>
              )}

              <div className="plan-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>{iconName}</span>
              </div>
              <h3 className="plan-name">{p.name}</h3>
              <p className="plan-concept">
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>{p.stage}</strong>
                {p.subtitle}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  margin: '0 0 14px',
                  font: "900 .78rem 'Barlow Condensed'",
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  border: `1px solid ${contactBorder}`,
                  background: contactBackground,
                  color: contactColor
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{p.contact.icon}</span>
                {p.contact.label}
              </div>

              <div className="plan-price">
                <b>{p.price}</b>
                <span>/mes</span>
              </div>

              <div className="plan-features">
                {p.features.map((f, i) => (
                  <div key={i} className="feature">
                    <span className="check">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {cta.disabled ? (
                <div className="btn-plan disabled">{cta.label}</div>
              ) : (
                <Link to="/partners" className={`btn-plan ${cta.tone === 'upgrade' ? 'orange' : 'secondary'}`}>{cta.label}</Link>
              )}
              <p className="plan-cta-note">{cta.note}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
