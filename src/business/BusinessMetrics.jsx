import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BusinessMetrics() {
  const { location } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    profile_views: 0,
    whatsapp_clicks: 0,
    map_clicks: 0,
    detail_clicks: 0
  })

  useEffect(() => {
    if (location) {
      fetchMetrics()
    }
  }, [location])

  const fetchMetrics = async () => {
    setLoading(true)
    // Here we'd group business_events by event_type.
    // For now we do a simple client-side aggregation or count
    const { data, error } = await supabase
      .from('business_events')
      .select('event_type')
      .eq('location_id', location.id)
    
    if (!error && data) {
      const counts = {
        profile_views: 0,
        whatsapp_clicks: 0,
        map_clicks: 0,
        detail_clicks: 0
      }
      data.forEach(e => {
        if (counts[e.event_type] !== undefined) {
          counts[e.event_type]++
        }
      })
      setStats(counts)
    }
    setLoading(false)
  }

  if (!location) return null

  const isAdvanced = location.business_plan === 'dominio'

  return (
    <div className="biz-metrics">
      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 1.5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .metric-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: rgba(249,115,22,0.1);
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .metric-icon .material-symbols-outlined { font-size: 1.5rem; }
        .metric-info h4 {
          font-size: 0.875rem;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .metric-info p {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
        }
        
        .insight-card {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          padding: 1.5rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .insight-icon { font-size: 2rem; color: #10b981; }
        
        .blur-overlay {
          position: relative;
          overflow: hidden;
        }
        .blur-overlay::after {
          content: "Métricas Avanzadas en Plan Dominio";
          position: absolute;
          inset: 0;
          background: rgba(2,6,23,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.25rem;
          color: white;
          z-index: 10;
        }
      `}</style>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Rendimiento de tu local</h2>

      <div className="insight-card">
        <span className="material-symbols-outlined insight-icon">lightbulb</span>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Consejo para mejorar</h3>
          <p style={{ color: '#cbd5e1' }}>Sumar una tercera foto puede mejorar tus clicks. Mantener tu horario actualizado también genera más confianza.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><span className="material-symbols-outlined">visibility</span></div>
          <div className="metric-info">
            <h4>Vistas del Perfil</h4>
            <p>{stats.profile_views}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}><span className="material-symbols-outlined">chat</span></div>
          <div className="metric-info">
            <h4>Clicks a WhatsApp</h4>
            <p>{stats.whatsapp_clicks}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><span className="material-symbols-outlined">directions</span></div>
          <div className="metric-info">
            <h4>Clicks en Mapa</h4>
            <p>{stats.map_clicks}</p>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2rem 0 1rem' }}>Métricas Avanzadas</h3>
      
      <div className={`metrics-grid ${!isAdvanced ? 'blur-overlay' : ''}`}>
        <div className="metric-card">
          <div className="metric-info">
            <h4>Click-Through Rate (CTR)</h4>
            <p>14.2%</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-info">
            <h4>Mejor Día</h4>
            <p>Sábados</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-info">
            <h4>Barrio Top</h4>
            <p>Pocitos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
