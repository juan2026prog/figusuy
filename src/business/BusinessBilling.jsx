import React from 'react'
import { useOutletContext, Link } from 'react-router-dom'

export default function BusinessBilling() {
  const { location } = useOutletContext()

  if (!location) return null

  const plans = [
    {
      id: 'gratis',
      name: 'Gratis',
      price: 'UYU 0',
      features: ['1 Foto', 'Sin promos', 'Aparecer en el mapa', 'Métricas básicas']
    },
    {
      id: 'turbo',
      name: 'Turbo',
      price: 'UYU 690',
      features: ['3 Fotos', '1 Promo activa', 'Badge de Destacado', 'Botón de WhatsApp visible']
    },
    {
      id: 'dominio',
      name: 'Dominio',
      price: 'UYU 1.490',
      features: ['3 Fotos', 'Múltiples promos', 'Patrocinador de zona', 'Métricas avanzadas']
    }
  ]

  return (
    <div className="biz-billing">
      <style>{`
        .current-plan-card {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 2rem;
          border-radius: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }
        .current-plan-card h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
          text-transform: capitalize;
          margin-bottom: 0.5rem;
        }
        .current-plan-card p {
          color: #94a3b8;
          font-size: 0.9375rem;
        }
        .btn-manage {
          background: transparent;
          border: 1px solid #475569;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-manage:hover { background: #334155; }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .plan-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          padding: 2rem;
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .plan-card.active {
          border-color: #f97316;
          background: rgba(249,115,22,0.02);
        }
        .plan-badge {
          position: absolute;
          top: -12px;
          right: 2rem;
          background: #f97316;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .plan-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }
        .plan-price {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          margin-bottom: 1.5rem;
        }
        .plan-price span {
          font-size: 1rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
          flex: 1;
        }
        .plan-features li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #cbd5e1;
          margin-bottom: 0.75rem;
          font-size: 0.9375rem;
        }
        .plan-features .material-symbols-outlined {
          color: #10b981;
          font-size: 1.25rem;
        }
        .btn-upgrade {
          background: white;
          color: #0f172a;
          border: none;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-weight: 800;
          width: 100%;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
        }
        .btn-upgrade:hover { background: #f1f5f9; }
        .plan-card.active .btn-upgrade {
          background: #1e293b;
          color: #94a3b8;
          cursor: default;
        }
      `}</style>

      <div className="current-plan-card">
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: '#f97316', marginBottom: '0.25rem' }}>Tu plan actual</p>
          <h2>Plan {location.business_plan}</h2>
          <p>Estado: Activo</p>
        </div>
        <button className="btn-manage">Gestionar Pago</button>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Mejorá tu visibilidad</h3>

      <div className="plans-grid">
        {plans.map(p => {
          const isActive = location.business_plan === p.id
          return (
            <div key={p.id} className={`plan-card ${isActive ? 'active' : ''}`}>
              {isActive && <div className="plan-badge">TU PLAN</div>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">{p.price} <span>/ mes</span></div>
              <ul className="plan-features">
                {p.features.map((f, i) => (
                  <li key={i}><span className="material-symbols-outlined">check_circle</span> {f}</li>
                ))}
              </ul>
              {isActive ? (
                <div className="btn-upgrade">Plan Actual</div>
              ) : (
                <Link to="/partners" className="btn-upgrade" style={{ background: '#f97316', color: 'white' }}>
                  Mejorar Plan
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
