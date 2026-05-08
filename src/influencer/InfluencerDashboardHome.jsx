import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { formatCompactMoney, formatDate, formatPercent, getHealthMeta, getTierMeta, getInfluencerLink, getBenefitSummary } from '../lib/influencerDashboard'
import GamificationIcon from '../components/gamification/icons/GamificationIcon'

export default function InfluencerDashboardHome() {
  const { dashboard, selectedInfluencerId } = useOutletContext()
  const toast = useToast()
  const navigate = useNavigate()
  const campaign = dashboard.activeCampaign
  const link = getInfluencerLink(campaign)
  const benefit = getBenefitSummary(dashboard.activeBenefit)
  const stats = dashboard.stats
  const tierState = dashboard.tierState || {}
  const tierMeta = getTierMeta(tierState.effective_tier)
  const healthMeta = getHealthMeta(tierState.performance_health)
  const nextTierMeta = tierState.next_tier ? getTierMeta(tierState.next_tier) : null
  const nextGap = tierState.next_tier_gap || {}

  const copy = async (value, label) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiado`)
  }

  return (
    <div className="influencer-content">
      <section className="influencer-grid-4">
        <article className="influencer-stat-card">
          <span>Tier actual</span>
          <strong>{tierMeta.label}</strong>
          <p>{tierMeta.tier} · Score {Number(stats.tierScore || 0).toFixed(1)}</p>
        </article>
        <article className="influencer-stat-card">
          <span>Activaciones</span>
          <strong>{stats.activationCount}</strong>
          <p>Usuarios activados de forma real.</p>
        </article>
        <article className="influencer-stat-card">
          <span>Conversiones</span>
          <strong>{stats.conversionCount}</strong>
          <p>Usuarios que generaron valor económico.</p>
        </article>
        <article className="influencer-stat-card">
          <span>Calidad</span>
          <strong>{Number(stats.qualityScore || 0).toFixed(1)}</strong>
          <p>Salud {healthMeta.label.toLowerCase()} de tu audiencia.</p>
        </article>
      </section>

      <section className="influencer-grid-2">
        <article className="influencer-panel">
          <div className="influencer-panel-head">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Tier y progreso</h2>
                <p>Performance real. Nada de vanity.</p>
              </div>
              <GamificationIcon icon={tierMeta.icon} size="md" />
            </div>
          </div>
          <div className="influencer-panel-body influencer-list">
            <div className="influencer-list-item">
              <strong>{tierMeta.tier} · {tierMeta.label}</strong>
              <div className="influencer-mini-note">Tier actual</div>
            </div>
            
            <div className="influencer-list-item" style={{ borderLeft: '2px solid #555', paddingLeft: '1rem', margin: '0.5rem 0' }}>
              <strong>{formatPercent(tierState.tier_2_progress || 0)}</strong>
              <div className="influencer-mini-note">Progreso a Tier 2 (Growth)</div>
            </div>

            <div className="influencer-list-item" style={{ borderLeft: '2px solid #555', paddingLeft: '1rem', margin: '0.5rem 0' }}>
              <strong>{formatPercent(tierState.tier_3_progress || 0)}</strong>
              <div className="influencer-mini-note">Progreso a Tier 3 (Partner)</div>
            </div>

            <div className="influencer-list-item">
              <strong>{Number(stats.userCommission || 0).toFixed(1)}% users · {Number(stats.businessCommission || 0).toFixed(1)}% biz</strong>
              <div className="influencer-mini-note">Comisión actual</div>
            </div>
            <div className="influencer-list-item">
              <strong style={{ color: healthMeta.color }}>{healthMeta.label}</strong>
              <div className="influencer-mini-note">Performance health</div>
            </div>
            <div className="influencer-list-item">
              <strong>{tierState.upgrade_opportunity || 'Sigue activando y convirtiendo.'}</strong>
              <div className="influencer-mini-note">Upgrade opportunity</div>
            </div>
            <div className="influencer-list-item">
              <strong>{tierState.downgrade_risk || 'Sin riesgo relevante.'}</strong>
              <div className="influencer-mini-note">Downgrade risk</div>
            </div>
          </div>
        </article>

        <article className="influencer-panel">
          <div className="influencer-panel-head">
            <h2>Objetivos de Crecimiento</h2>
            <p>Lo que te falta para subir de nivel.</p>
          </div>
          <div className="influencer-panel-body influencer-list">
            {/* TIER 2 SECTION */}
            <div className="tier-milestone" style={{ opacity: tierState.effective_tier === 'growth' || tierState.effective_tier === 'partner' ? 0.6 : 1 }}>
              <div className="tier-milestone-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GamificationIcon icon="UserLevelCollectorIcon" size="sm" />
                  <div>
                    <strong>Tier 2 · Growth</strong>
                    {(tierState.effective_tier === 'growth' || tierState.effective_tier === 'partner') && (
                      <span className="influencer-support-tag" style={{ margin: 0, fontSize: '0.7rem' }}>Alcanzado</span>
                    )}
                  </div>
                </div>
                <span>{formatPercent(tierState.tier_2_progress || 0)}</span>
              </div>
              
              <div className="influencer-bar-track" style={{ margin: '8px 0 12px' }}>
                <div 
                  className="influencer-bar-fill" 
                  style={{ width: `${Math.min(100, (tierState.tier_2_progress || 0) * 100)}%` }} 
                />
              </div>

              {tierState.effective_tier === 'community' ? (
                <div className="tier-milestone-grid">
                  <div className="milestone-stat">
                    <strong>{tierState.tier_2_gap?.activations_missing || 0}</strong>
                    <span>Activaciones</span>
                  </div>
                  <div className="milestone-stat">
                    <strong>{tierState.tier_2_gap?.conversions_missing || 0}</strong>
                    <span>Conversiones</span>
                  </div>
                  <div className="milestone-stat">
                    <strong>{tierState.tier_2_gap?.quality_missing || 0}</strong>
                    <span>Calidad</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-green)', margin: 0 }}>
                  ¡Felicidades! Ya superaste los requisitos de Growth.
                </p>
              )}
            </div>

            {/* TIER 3 SECTION */}
            <div className="tier-milestone" style={{ marginTop: '2rem', opacity: tierState.effective_tier === 'partner' ? 0.6 : 1 }}>
              <div className="tier-milestone-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GamificationIcon icon="UserLevelReferentIcon" size="sm" />
                  <div>
                    <strong>Tier 3 · Partner</strong>
                    {tierState.effective_tier === 'partner' && (
                      <span className="influencer-support-tag" style={{ margin: 0, fontSize: '0.7rem' }}>Alcanzado</span>
                    )}
                  </div>
                </div>
                <span>{formatPercent(tierState.tier_3_progress || 0)}</span>
              </div>

              <div className="influencer-bar-track" style={{ margin: '8px 0 12px' }}>
                <div 
                  className="influencer-bar-fill" 
                  style={{ 
                    width: `${Math.min(100, (tierState.tier_3_progress || 0) * 100)}%`,
                    background: 'linear-gradient(90deg, #facc15, #fbbf24)' 
                  }} 
                />
              </div>

              {tierState.effective_tier !== 'partner' ? (
                <div className="tier-milestone-grid">
                  <div className="milestone-stat">
                    <strong>{tierState.tier_3_gap?.activations_missing || 0}</strong>
                    <span>Activaciones</span>
                  </div>
                  <div className="milestone-stat">
                    <strong>{tierState.tier_3_gap?.conversions_missing || 0}</strong>
                    <span>Conversiones</span>
                  </div>
                  <div className="milestone-stat">
                    <strong>{tierState.tier_3_gap?.quality_missing || 0}</strong>
                    <span>Calidad</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-yellow)', margin: 0 }}>
                  Eres Partner oficial. Estás en la cima del programa.
                </p>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="influencer-grid-2">
        <article className="influencer-panel">
          <div className="influencer-panel-head">
            <h2>Activa tu red</h2>
            <p>Herramientas comerciales para mover usuarios reales.</p>
          </div>
          <div className="influencer-panel-body influencer-list">
            <div className="influencer-list-item"><strong>{campaign?.code || 'Sin campaña activa'}</strong><div className="influencer-mini-note">Código afiliado</div></div>
            <div className="influencer-list-item"><strong>{link || 'Sin link disponible'}</strong><div className="influencer-mini-note">Link para compartir</div></div>
            <div className="influencer-list-item"><strong>{benefit}</strong><div className="influencer-mini-note">Beneficio activo</div></div>
            <div className="influencer-list-item"><strong>{campaign?.ends_at ? formatDate(campaign.ends_at) : 'Sin vencimiento'}</strong><div className="influencer-mini-note">Vigencia</div></div>
            <div className="influencer-inline-actions">
              <button className="influencer-primary-btn" onClick={() => copy(campaign?.code, 'Código')}>
                <span className="material-symbols-outlined">content_copy</span>
                Copiar código
              </button>
              <button className="influencer-secondary-btn" onClick={() => copy(link, 'Link')}>
                Copiar link
              </button>
              <button className="influencer-secondary-btn" onClick={() => navigate(`/influencer/assets${selectedInfluencerId ? `?affiliate=${selectedInfluencerId}` : ''}`)}>
                Ver assets
              </button>
            </div>
          </div>
        </article>

        <article className="influencer-panel">
          <div className="influencer-panel-head">
            <h2>Valor generado</h2>
            <p>Lectura económica y base adquirida.</p>
          </div>
          <div className="influencer-panel-body influencer-grid-2">
            <div className="influencer-list-item">
              <strong>{stats.attributedUsers}</strong>
              <div className="influencer-mini-note">Usuarios atribuidos</div>
            </div>
            <div className="influencer-list-item">
              <strong>{formatCompactMoney(stats.totalRevenue)}</strong>
              <div className="influencer-mini-note">Revenue atribuido</div>
            </div>
            <div className="influencer-list-item">
              <strong>{formatCompactMoney(stats.totalCommission)}</strong>
              <div className="influencer-mini-note">Comisión acumulada</div>
            </div>
            <div className="influencer-list-item">
              <strong>{stats.topPlan || 'Sin plan ganador aún'}</strong>
              <div className="influencer-mini-note">Plan más convertido</div>
            </div>
          </div>
        </article>

        <article className="influencer-panel" style={{ border: '1px solid var(--admin-yellow-alpha)' }}>
          <div className="influencer-panel-head">
            <h2 style={{ color: 'var(--admin-yellow)' }}>Balance y Retiros</h2>
            <p>Tu dinero disponible para retirar vía PayPal.</p>
          </div>
          <div className="influencer-panel-body influencer-list">
            <div className="influencer-list-item">
              <strong style={{ fontSize: '1.5rem', color: 'var(--admin-yellow)' }}>
                {formatCompactMoney(dashboard.balance || 0)}
              </strong>
              <div className="influencer-mini-note">Balance disponible (USD)</div>
            </div>
            
            <div className="influencer-list-item">
              <strong>{dashboard.payoutAccount?.payout_email || 'No configurado'}</strong>
              <div className="influencer-mini-note">Email de PayPal para retiros</div>
            </div>

            <div className="influencer-inline-actions">
              <button 
                className="influencer-primary-btn" 
                style={{ background: 'var(--admin-yellow)', color: 'black' }}
                onClick={() => {
                  const email = prompt('Ingresa tu email de PayPal para recibir pagos:', dashboard.payoutAccount?.payout_email || '')
                  if (email && email.includes('@')) {
                    import('../stores/influencerStore').then(({ useInfluencerStore }) => {
                      useInfluencerStore.getState().updatePayoutAccount(dashboard.affiliate.user_id, email)
                        .then(({ error }) => {
                          if (error) toast.error('Error al actualizar cuenta')
                          else toast.success('Cuenta de PayPal actualizada')
                        })
                    })
                  }
                }}
              >
                <span className="material-symbols-outlined">payments</span>
                Configurar PayPal
              </button>
              
              <button 
                className="influencer-secondary-btn"
                disabled={(dashboard.balance || 0) <= 0 || !dashboard.payoutAccount?.payout_email}
                onClick={() => toast.info('Los retiros se procesan automáticamente al alcanzar los $50 USD.')}
              >
                Solicitar retiro
              </button>
            </div>
            
            {!dashboard.payoutAccount?.payout_email && (
              <p style={{ fontSize: '0.8rem', color: 'var(--admin-red)', marginTop: '0.5rem' }}>
                * Debes configurar tu email de PayPal para poder recibir pagos.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
