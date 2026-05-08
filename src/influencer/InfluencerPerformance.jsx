import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { formatCompactMoney, formatDate, getHealthMeta } from '../lib/influencerDashboard'

export default function InfluencerPerformance() {
  const { dashboard } = useOutletContext()
  const stats = dashboard.stats
  const tierState = dashboard.tierState || {}
  const series = dashboard.performanceSeries || []
  const maxActivations = Math.max(...series.map(item => item.activations || 0), 1)
  const maxConversions = Math.max(...series.map(item => item.conversions || 0), 1)
  const healthMeta = getHealthMeta(tierState.performance_health)

  return (
    <div className="affiliate-content">
      <section className="affiliate-grid-4">
        <article className="affiliate-stat-card">
          <span>Activaciones 30d</span>
          <strong>{tierState.recent_activation_count || 0}</strong>
          <p>Usuarios activados recientemente.</p>
        </article>
        <article className="affiliate-stat-card">
          <span>Conversiones 30d</span>
          <strong>{tierState.recent_conversion_count || 0}</strong>
          <p>Conversion velocity real del ultimo tramo.</p>
        </article>
        <article className="affiliate-stat-card">
          <span>Inactividad</span>
          <strong>{tierState.inactivity_days || 0}d</strong>
          <p>Dias desde la ultima actividad atribuida.</p>
        </article>
        <article className="affiliate-stat-card">
          <span>Health</span>
          <strong style={{ color: healthMeta.color }}>{healthMeta.label}</strong>
          <p>Estado actual de la red activada.</p>
        </article>
      </section>

      <section className="affiliate-grid-2">
        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Activaciones por dia</h2>
            <p>Movimiento real de red en los ultimos 14 dias.</p>
          </div>
          <div className="affiliate-panel-body affiliate-bars">
            {series.map((item) => (
              <div className="affiliate-bar-row" key={item.date}>
                <label>{new Date(item.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</label>
                <div className="affiliate-bar-track">
                  <div className="affiliate-bar-fill" style={{ width: `${((item.activations || 0) / maxActivations) * 100}%` }} />
                </div>
                <strong>{item.activations || 0}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Conversiones por dia</h2>
            <p>Valor economico cerrado, no interes superficial.</p>
          </div>
          <div className="affiliate-panel-body affiliate-bars">
            {series.map((item) => (
              <div className="affiliate-bar-row" key={item.date}>
                <label>{new Date(item.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</label>
                <div className="affiliate-bar-track">
                  <div className="affiliate-bar-fill" style={{ width: `${((item.conversions || 0) / maxConversions) * 100}%` }} />
                </div>
                <strong>{item.conversions || 0}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="affiliate-grid-2">
        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Upgrade opportunity</h2>
            <p>Que mirar para subir de tier.</p>
          </div>
          <div className="affiliate-panel-body affiliate-list">
            <div className="affiliate-list-item">
              <strong>{tierState.upgrade_opportunity || 'Sin oportunidad clara todavia.'}</strong>
              <div className="affiliate-mini-note">Lectura del motor</div>
            </div>
            <div className="affiliate-list-item">
              <strong>{Number(stats.nextTierProgress || 0).toFixed(1)}%</strong>
              <div className="affiliate-mini-note">Progreso al siguiente tier</div>
            </div>
            <div className="affiliate-list-item">
              <strong>{formatCompactMoney(stats.totalRevenue)}</strong>
              <div className="affiliate-mini-note">Revenue acumulado</div>
            </div>
          </div>
        </article>

        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Downgrade risk</h2>
            <p>Lo que puede hacerte caer.</p>
          </div>
          <div className="affiliate-panel-body affiliate-list">
            <div className="affiliate-list-item">
              <strong>{tierState.downgrade_risk || 'Sin riesgo relevante.'}</strong>
              <div className="affiliate-mini-note">Riesgo actual</div>
            </div>
            <div className="affiliate-list-item">
              <strong>{dashboard.stats.bestDay ? formatDate(dashboard.stats.bestDay.date) : 'Sin dia destacado'}</strong>
              <div className="affiliate-mini-note">Mejor dia reciente</div>
            </div>
            <div className="affiliate-list-item">
              <strong>{dashboard.stats.topPlan || 'Sin plan dominante'}</strong>
              <div className="affiliate-mini-note">Conversion mas comun</div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
