import React, { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { BUSINESS_PLAN_ORDER, getBusinessPlanLabel } from '../lib/businessPlans'
import { useBusinessPlanStore } from '../stores/businessPlanStore'

const PLAN_METADATA = {
  gratis: {
    id: 'gratis',
    name: 'Gratis',
    stage: 'Entrar en el circuito',
    subtitle: 'Presencia inicial para aparecer en el mapa, captar puntos sugeridos y activar una ficha comercial simple.',
    contact: { icon: 'storefront', label: 'Contacto visible', class: 'none' },
    features: [
      'Aparecer en puntos y mapa',
      '1 foto principal',
      'Promo simple',
      'Contacto',
      'Visibilidad basica'
    ],
    priceDisplay: { main: '$0', label: 'SIEMPRE' }
  },
  radar: {
    id: 'turbo',
    name: 'Radar',
    stage: 'Ganar el radar',
    subtitle: 'Mas visibilidad local para capturar trafico cercano cuando el usuario ya esta buscando donde ir.',
    contact: { icon: 'location_on', label: 'Prioridad local', class: 'phone' },
    features: [
      'Todo Boost',
      'Mas visibilidad',
      'Promos destacadas',
      'Prioridad local',
      'Mejor mapa'
    ],
    priceDisplay: { usd: '16.85', uyu: '690' }
  },
  conversion: {
    id: 'dominio',
    name: 'Conversion',
    stage: 'Convertir intencion',
    subtitle: 'Top CTA y prioridad comercial para transformar visibilidad en contactos y acciones medibles.',
    contact: { icon: 'ads_click', label: 'Top CTA', class: 'whatsapp' },
    features: [
      'Todo Radar',
      'Top CTA',
      'Prioridad comercial',
      'Promo first',
      'Mejor intencion'
    ],
    priceDisplay: { usd: '32.20', uyu: '1320' }
  },
  partnerstore: {
    id: 'partner_store',
    name: 'Collector Hub',
    stage: 'Validar y liderar',
    subtitle: 'Convierte tu local en punto de confianza para validar, otorgar rewards y capturar liquidez premium.',
    contact: { icon: 'workspace_premium', label: 'Badge Collector Hub', class: 'legend' },
    features: [
      'Todo Conversion',
      'Validacion de albumes',
      'Validacion de usuarios',
      'Prioridad de validacion',
      'Rewards asociados',
      'Visibilidad premium',
      'Descuento minimo configurable 10%'
    ],
    priceDisplay: { usd: '71.99', uyu: '2990' }
  }
}

export default function BusinessBilling() {
  const { location } = useOutletContext()
  const { plans: dbPlans, userPlans, fetchPlans, loading } = useBusinessPlanStore()
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  if (!location) return null

  // Merge DB plans with metadata
  const plans = dbPlans.map(dbPlan => {
    const dbKey = dbPlan.plan_name
    // Mapeo entre nombres internos de DB y llaves de PayPal / Metadata
    const premiumKey = dbKey === 'turbo' ? 'radar' :
                       dbKey === 'dominio' ? 'conversion' :
                       dbKey === 'partner_store' ? 'partnerstore' : dbKey

    const meta = PLAN_METADATA[premiumKey] || PLAN_METADATA.gratis;

    // Buscar el precio USD en los planes de PayPal (premium_plans)
    const premiumPlan = userPlans?.find(up => up.plan_key === premiumKey)
    const usdPrice = premiumPlan?.price || meta.priceDisplay?.usd

    return {
      ...meta,
      priceDisplay: {
        ...meta.priceDisplay,
        usd: usdPrice
      },
      dbRules: dbPlan
    }
  })

  const sortedPlans = plans.sort(
    (a, b) => BUSINESS_PLAN_ORDER.indexOf(a.id) - BUSINESS_PLAN_ORDER.indexOf(b.id)
  )
  const currentBusinessLevel = sortedPlans.findIndex(plan => plan.id === location.business_plan)

  const getBusinessPlanCta = (planId) => {
    const targetLevel = sortedPlans.findIndex(plan => plan.id === planId)

    if (targetLevel === currentBusinessLevel) {
      return {
        label: 'Plan actual',
        note: 'Este es tu nivel activo dentro del circuito comercial de FigusUY.',
        tone: 'current',
        disabled: true
      }
    }

    if (targetLevel > currentBusinessLevel) {
      return {
        label: 'Mejorar plan',
        note: targetLevel === sortedPlans.length - 1
          ? 'Subi a validacion, rewards y autoridad premium.'
          : 'Escala visibilidad, prioridad y conversion.',
        tone: 'upgrade',
        disabled: false
      }
    }

    return {
      label: 'Cambiar plan',
      note: 'Reordena tu nivel comercial segun tu momento.',
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
          min-height: 590px;
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
          background: linear-gradient(135deg, #181818 0%, #101010 60%, rgba(139,92,246,.16) 100%);
        }
        .plan.dominio:before {
          background: #8b5cf6;
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
        .plan.dominio .plan-icon {
          background: rgba(139,92,246,.1);
          border-color: rgba(139,92,246,.3);
          color: #c4b5fd;
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
          min-height: 70px;
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
        .plan.turbo .check {
          color: var(--orange);
        }
        .plan.dominio .check {
          color: #c4b5fd;
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

        .comparison-table-wrapper {
          margin-top: 2rem;
          padding: 2rem;
          background: var(--panel);
          border: 1px solid var(--line);
          overflow-x: auto;
          animation: slideDown .3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          color: var(--text);
          font-size: 0.9rem;
        }

        .comparison-table th, .comparison-table td {
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid var(--line);
        }

        .comparison-table th {
          font: italic 800 1.2rem 'Barlow Condensed';
          text-transform: uppercase;
          color: var(--muted2);
        }

        .comparison-table td:first-child, .comparison-table th:first-child {
          text-align: left;
          font-weight: 700;
          color: var(--muted);
          width: 30%;
        }

        .comparison-table .check { color: var(--green); }
        .comparison-table .cross { color: var(--error); opacity: 0.5; }

        .compare-toggle-btn {
          margin-top: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--panel2);
          border: 1px solid var(--line);
          color: var(--text);
          padding: 0.75rem 1.5rem;
          font: 900 1rem 'Barlow Condensed';
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .compare-toggle-btn:hover {
          background: var(--line);
          border-color: var(--orange);
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
          <p>
            Esta escalera comercial ahora mide visibilidad, puntos sugeridos, capacidad promocional,
            validacion y conversion. Desde aca puedes decidir cuanto peso comercial quieres ganar.
          </p>
        </div>
        <button 
          className="biz-btn-secondary"
          onClick={() => alert('La gestión de pagos a través de la plataforma estará disponible próximamente. Por favor, contacta a soporte para cambios en tu suscripción.')}
        >
          Gestionar pago
        </button>
      </section>

      <div className="biz-section-head" style={{ marginTop: '34px', marginBottom: '18px' }}>
        <div>
          <div className="biz-page-kicker">/ planes</div>
          <h2 style={{ font: 'italic 900 3rem "Barlow Condensed"', textTransform: 'uppercase', lineHeight: '.9', marginTop: '4px' }}>
            Visibilidad, conversion y autoridad
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '.95rem', marginTop: '7px' }}>
            El valor comercial se mueve en cuatro pasos: Gratis te hace aparecer, Radar te da zona,
            Conversion te ayuda a capitalizar intencion y Collector Hub te convierte en punto validado.
          </p>
        </div>
      </div>

      <div className="plans-grid">
        {sortedPlans.map((plan) => {
          const isActive = location.business_plan === plan.id
          const cta = getBusinessPlanCta(plan.id)

          let planClass = 'plan'
          if (plan.id === 'turbo') planClass += ' turbo'
          if (plan.id === 'dominio') planClass += ' dominio'
          if (plan.id === 'legend') planClass += ' legend'

          let iconName = 'bolt'
          if (plan.id === 'turbo') iconName = 'location_on'
          if (plan.id === 'dominio') iconName = 'ads_click'
          if (plan.id === 'legend') iconName = 'workspace_premium'

          return (
            <article key={plan.id} className={planClass}>
              {isActive && <div className="plan-ribbon">Tu plan</div>}
              {plan.id === 'turbo' && !isActive && <div className="plan-ribbon">Mas visibilidad</div>}
              {plan.id === 'legend' && !isActive && (
                <div className="plan-ribbon" style={{ background: 'linear-gradient(90deg, var(--yellow), var(--orange))', color: '#111' }}>
                  Validacion
                </div>
              )}

              <div className="plan-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>{iconName}</span>
              </div>
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-concept">
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>{plan.stage}</strong>
                {plan.subtitle}
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
                  border: '1px solid var(--line2)',
                  background: 'rgba(255,255,255,.03)',
                  color: 'var(--muted2)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{plan.contact?.icon}</span>
                {plan.contact?.label}
              </div>

              <div className="plan-price" style={{ margin: '28px 0 22px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {plan.id === 'gratis' ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <b style={{ font: 'italic 900 3.2rem "Barlow Condensed"', lineHeight: '.8', color: '#fff' }}>{plan.priceDisplay?.main}</b>
                    <span style={{ color: 'var(--muted2)', fontSize: '.82rem', fontWeight: '800', marginBottom: '4px' }}>{plan.priceDisplay?.label}</span>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>USD</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <b style={{ font: 'italic 900 3.8rem "Barlow Condensed"', lineHeight: '.75', color: '#fff' }}>{plan.priceDisplay?.usd}</b>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                        <span style={{ fontSize: '.78rem', color: 'var(--muted2)', fontWeight: '800', whiteSpace: 'nowrap' }}>
                          â‰ˆ ${plan.dbRules?.monthly_price || plan.priceDisplay?.uyu} UYU APROX.
                        </span>
                        <span style={{ color: 'var(--muted2)', fontSize: '.78rem', fontWeight: '800' }}>/MES</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="plan-features">
                {plan.features.map((feature) => (
                  <div key={feature} className="feature">
                    <span className="check">+</span>
                    <span>{feature}</span>
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

      <button 
        className="compare-toggle-btn"
        onClick={() => setShowComparison(!showComparison)}
      >
        <span className="material-symbols-outlined">
          {showComparison ? 'keyboard_arrow_up' : 'compare_arrows'}
        </span>
        {showComparison ? 'Cerrar comparación' : 'Comparar planes'}
      </button>

      {showComparison && (
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Funcionalidad</th>
                {sortedPlans.map(p => <th key={p.id}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fotos en local</td>
                {sortedPlans.map(p => <td key={p.id}>{p.dbRules?.max_photos || 'âˆž'}</td>)}
              </tr>
              <tr>
                <td>Promociones activas</td>
                {sortedPlans.map(p => <td key={p.id}>{p.dbRules?.max_active_promos || 'Sin límite'}</td>)}
              </tr>
              <tr>
                <td>Boost de visibilidad</td>
                {sortedPlans.map(p => <td key={p.id}>+{((p.dbRules?.eligibility_boost || 0) * 100).toFixed(0)}%</td>)}
              </tr>
              <tr>
                <td>Badge destacado</td>
                {sortedPlans.map(p => (
                  <td key={p.id}>
                    <span className={`material-symbols-outlined ${p.dbRules?.can_have_featured_badge ? 'check' : 'cross'}`}>
                      {p.dbRules?.can_have_featured_badge ? 'check_circle' : 'cancel'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>CTA personalizado</td>
                {sortedPlans.map(p => (
                  <td key={p.id}>
                    <span className={`material-symbols-outlined ${p.dbRules?.can_have_featured_cta ? 'check' : 'cross'}`}>
                      {p.dbRules?.can_have_featured_cta ? 'check_circle' : 'cancel'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Métricas avanzadas</td>
                {sortedPlans.map(p => (
                  <td key={p.id}>
                    <span className={`material-symbols-outlined ${p.dbRules?.can_have_advanced_metrics ? 'check' : 'cross'}`}>
                      {p.dbRules?.can_have_advanced_metrics ? 'check_circle' : 'cancel'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Validación de álbumes</td>
                {sortedPlans.map(p => (
                  <td key={p.id}>
                    <span className={`material-symbols-outlined ${p.id === 'partner_store' ? 'check' : 'cross'}`}>
                      {p.id === 'partner_store' ? 'check_circle' : 'cancel'}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
