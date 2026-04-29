import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function PartnerPlans() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [showModal, setShowModal] = useState(false)

  const handleContact = () => {
    // Acá iría la lógica para enviar a WhatsApp de ventas o un formulario
    window.open('https://wa.me/59899000000?text=Hola,%20me%20interesa%20un%20plan%20para%20mi%20local%20en%20FigusUY', '_blank')
  }

  return (
    <>
      <style>{`
        .partner-page {
          max-width: 80rem;
          margin: 0 auto;
          padding: 1.5rem 1rem 7rem;
        }
        
        .partner-hero {
          border-radius: 2rem;
          background: linear-gradient(135deg, #0f172a 0%, #020617 50%, #431407 100%);
          border: 1px solid #1e293b;
          padding: 2.5rem 2rem;
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin-bottom: 2rem;
        }
        
        .partner-hero-glow {
          position: absolute;
          right: -10rem;
          top: -10rem;
          width: 30rem;
          height: 30rem;
          background: rgba(234,88,12,0.15);
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .partner-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
          line-height: 1.1;
        }

        .partner-subtitle {
          font-size: 1.125rem;
          color: #cbd5e1;
          max-width: 48rem;
          margin: 0 auto;
          line-height: 1.5;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .plan-card {
          border-radius: 2rem;
          background: #0f172a;
          border: 1px solid #1e293b;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          color: white;
          position: relative;
          transition: transform 0.2s;
        }

        .plan-card:hover {
          transform: translateY(-4px);
        }

        .plan-card.turbo {
          border: 2px solid #ea580c;
          box-shadow: 0 20px 25px -5px rgba(234,88,12,0.15);
        }

        .plan-card.dominio {
          border: 2px solid #8b5cf6;
          box-shadow: 0 20px 25px -5px rgba(139,92,246,0.15);
        }

        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.25rem 1rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .badge-turbo {
          background: #ea580c;
          color: white;
        }

        .badge-dominio {
          background: #8b5cf6;
          color: white;
        }

        .plan-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          margin-bottom: 1.25rem;
        }

        .plan-name {
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
        }

        .plan-concept {
          color: #94a3b8;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          min-height: 2.5rem;
        }

        .plan-price {
          font-size: 3rem;
          font-weight: 900;
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 2rem;
        }

        .plan-price span {
          font-size: 1rem;
          color: #64748b;
          font-weight: 700;
        }

        .plan-features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
          margin-bottom: 2rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: #e2e8f0;
          line-height: 1.4;
        }

        .feature-icon {
          color: #10b981;
          font-weight: 900;
        }

        .btn-plan {
          width: 100%;
          padding: 1.125rem;
          border-radius: 1rem;
          font-weight: 900;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-gratis {
          background: #1e293b;
          color: white;
        }
        .btn-gratis:hover { background: #334155; }

        .btn-turbo {
          background: #ea580c;
          color: white;
        }
        .btn-turbo:hover { background: #c2410c; }

        .btn-dominio {
          background: #8b5cf6;
          color: white;
        }
        .btn-dominio:hover { background: #7c3aed; }

        .rules-section {
          margin-top: 4rem;
          padding: 2rem;
          background: rgba(255,255,255,0.03);
          border-radius: 2rem;
          border: 1px solid #1e293b;
        }

        .rules-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .rule-card {
          text-align: center;
        }

        .rule-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .rule-card h4 {
          color: white;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .rule-card p {
          color: #94a3b8;
          font-size: 0.875rem;
          line-height: 1.5;
        }
      `}</style>

      {/* Topbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1e293b' }}>
        <div style={{ height: '5rem', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Locales y Tiendas</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.025em', color: 'white', margin: 0 }}>Planes para Puntos</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'white', color: '#020617', fontWeight: 900, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
          >
            Volver
          </button>
        </div>
      </header>

      <div className="partner-page">
        <div className="partner-hero">
          <div className="partner-hero-glow"></div>
          <h2 className="partner-title">Más visibilidad. Más herramientas. Más movimiento.</h2>
          <p className="partner-subtitle">
            Elegí el plan que mejor se adapte a tu local. No vendemos el "primer lugar", te damos mejores herramientas y más chances de aparecer cuando los usuarios buscan figuritas en tu zona.
          </p>
        </div>

        <div className="plans-grid">
          {/* Gratis */}
          <div className="plan-card">
            <div className="plan-icon" style={{ background: '#1e293b' }}>📍</div>
            <h3 className="plan-name">Gratis</h3>
            <p className="plan-concept">Presencia básica para que cualquier local exista en FigusUY.</p>
            
            <div className="plan-price">
              $0 <span>/mes</span>
            </div>

            <div className="plan-features">
              <div className="feature-item"><span className="feature-icon">✓</span> Aparece en el mapa y búsquedas</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Perfil con WhatsApp y horarios</div>
              <div className="feature-item"><span className="feature-icon">✓</span> 1 foto del local</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Métricas básicas</div>
            </div>

            <button className="btn-plan btn-gratis" onClick={() => navigate('/login')}>Crear cuenta gratis</button>
          </div>

          {/* Turbo */}
          <div className="plan-card turbo">
            <div className="plan-badge badge-turbo">MÁS POPULAR</div>
            <div className="plan-icon" style={{ background: '#431407' }}>⚡</div>
            <h3 className="plan-name">Turbo</h3>
            <p className="plan-concept">Destacate y recibí más consultas con mejores herramientas visuales.</p>
            
            <div className="plan-price">
              $690 <span>/mes</span>
            </div>

            <div className="plan-features">
              <div className="feature-item"><span className="feature-icon">✓</span> <b>Todo lo del plan Gratis, más:</b></div>
              <div className="feature-item"><span className="feature-icon">✓</span> Etiqueta de Destacado en resultados</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Botón de WhatsApp más visible</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Más chances de aparecer mejor cuando sos relevante</div>
              <div className="feature-item"><span className="feature-icon">✓</span> 1 promoción activa visible en tu perfil</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Hasta 3 fotos</div>
            </div>

            <button className="btn-plan btn-turbo" onClick={handleContact}>Contactar ventas</button>
          </div>

          {/* Dominio */}
          <div className="plan-card dominio">
            <div className="plan-badge badge-dominio">MAXIMA VISIBILIDAD</div>
            <div className="plan-icon" style={{ background: '#2e1065' }}>🌟</div>
            <h3 className="plan-name">Dominio</h3>
            <p className="plan-concept">Tomá el control de tu zona. Máxima presencia contextual y captación.</p>
            
            <div className="plan-price">
              $1490 <span>/mes</span>
            </div>

            <div className="plan-features">
              <div className="feature-item"><span className="feature-icon">✓</span> <b>Todo lo del plan Turbo, más:</b></div>
              <div className="feature-item"><span className="feature-icon">✓</span> Múltiples promociones activas</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Promociones contextuales en la app</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Prioridad visual como Patrocinador de Zona</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Máximas chances de elegibilidad en tu área</div>
              <div className="feature-item"><span className="feature-icon">✓</span> Estadísticas avanzadas (clicks, rendimiento por zona)</div>
            </div>

            <button className="btn-plan btn-dominio" onClick={handleContact}>Contactar ventas</button>
          </div>
        </div>

        <div className="rules-section">
          <h3 className="rules-title">Nuestra filosofía</h3>
          <div className="rules-grid">
            <div className="rule-card">
              <div className="rule-icon">🎯</div>
              <h4>No vendemos el primer lugar</h4>
              <p>El orden de resultados se basa siempre en la cercanía y relevancia para el usuario. Los planes mejoran tus herramientas y elegibilidad, pero no rompen la experiencia.</p>
            </div>
            <div className="rule-card">
              <div className="rule-icon">👁️</div>
              <h4>Más exposición útil</h4>
              <p>No usamos banners molestos. Tus promociones y destaques aparecen donde realmente importa y suman valor a quienes buscan figuritas.</p>
            </div>
            <div className="rule-card">
              <div className="rule-icon">📈</div>
              <h4>Capacidad de competir</h4>
              <p>Tener un plan te da mejores armas visuales y más chances en desempates de relevancia para destacar frente a otros locales cercanos.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
