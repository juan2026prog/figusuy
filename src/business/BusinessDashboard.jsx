import React from 'react'
import { useOutletContext, Link } from 'react-router-dom'

export default function BusinessDashboard() {
  const { location } = useOutletContext()

  if (!location) {
    return (
      <div className="biz-empty-state">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>¡Bienvenido a FigusUY Negocios!</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Parece que aún no tienes un local configurado. Contactá a soporte para reclamar o crear tu local.</p>
        <Link to="/business/help" className="biz-btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Ir a Ayuda</Link>
      </div>
    )
  }

  return (
    <div className="biz-dashboard">
      <style>{`
        .biz-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .kpi-card {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 1.25rem;
          border-radius: 0.75rem;
        }
        .kpi-label {
          font-size: 0.8125rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .kpi-value {
          font-size: 2rem;
          font-weight: 900;
          color: white;
        }
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 0.75rem;
          color: white;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }
        .action-card:hover {
          background: #334155;
          border-color: #475569;
          transform: translateY(-2px);
        }
        .action-card .material-symbols-outlined {
          font-size: 2rem;
          color: #f97316;
        }
      `}</style>

      <div className="biz-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #10b981' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Tu local hoy</h2>
        <p style={{ color: '#cbd5e1' }}>Tu perfil está activo. Mantené tu información actualizada para conseguir más consultas y visitas.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Vistas del Perfil</div>
          <div className="kpi-value">--</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Clicks a WhatsApp</div>
          <div className="kpi-value">--</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cómo llegar</div>
          <div className="kpi-value">--</div>
        </div>
        <div className="kpi-card" style={{ borderColor: '#f97316', background: 'rgba(249,115,22,0.1)' }}>
          <div className="kpi-label" style={{ color: '#fdba74' }}>Plan Actual</div>
          <div className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: '#f97316', textTransform: 'capitalize' }}>
            {location.business_plan}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Acciones Rápidas</h2>
      <div className="quick-actions">
        <Link to="/business/profile" className="action-card">
          <span className="material-symbols-outlined">edit_square</span>
          Editar Perfil
        </Link>
        <Link to="/business/photos" className="action-card">
          <span className="material-symbols-outlined">add_a_photo</span>
          Cambiar Fotos
        </Link>
        <Link to="/business/promo" className="action-card">
          <span className="material-symbols-outlined">campaign</span>
          Activar Promo
        </Link>
        <Link to="/business/billing" className="action-card">
          <span className="material-symbols-outlined">bolt</span>
          Mejorar Plan
        </Link>
      </div>
    </div>
  )
}
