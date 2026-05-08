import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useInfluencerStore } from '../stores/influencerStore'
import { formatPercent, getHealthMeta, getTierMeta } from '../lib/influencerDashboard'
import GamificationIcon from '../components/gamification/icons/GamificationIcon'

const navItems = [
  { to: '/influencer/dashboard', label: 'Dashboard', icon: 'UserLevelExplorerIcon' },
  { to: '/influencer/assets', label: 'Assets', icon: 'BadgeActiveIcon' },
  { to: '/influencer/performance', label: 'Performance', icon: 'UserLevelTraderIcon' },
  { to: '/influencer/payouts', label: 'Payouts', icon: 'BadgePartnerVerifiedIcon' },
]

function LoadingView() {
  return (
    <div className="influencer-shell">
      <div className="influencer-empty">
        <span className="material-symbols-outlined">hourglass_top</span>
        <h1>Cargando panel</h1>
        <p>Trayendo tu campaña, métricas y pagos.</p>
      </div>
    </div>
  )
}

function EmptyView({ isAdmin }) {
  const navigate = useNavigate()
  return (
    <div className="affiliate-shell">
      <div className="affiliate-empty">
        <span className="material-symbols-outlined">campaign</span>
        <h1>Se parte del equipo</h1>
        <p>Todavía no te has postulado para ser influencer de FigusUY. Empieza hoy mismo y construye tu propio canal de recompensas.</p>
        <button className="affiliate-primary-btn" style={{ marginTop: '2rem' }} onClick={() => navigate('/influencers')}>
          Ver programa de Influencers
        </button>
      </div>
    </div>
  )
}

function ApplicationStatusView({ application }) {
  const isPending = application?.status === 'pending'
  const isRejected = application?.status === 'rejected'

  return (
    <div className="affiliate-shell">
      <div className="affiliate-empty">
        <span className="material-symbols-outlined" style={{ color: isRejected ? '#ef4444' : '#ff5a00' }}>
          {isRejected ? 'error' : 'schedule'}
        </span>
        <h1>{isPending ? 'Postulación en revisión' : 'Postulación rechazada'}</h1>
        <p>
          {isPending 
            ? 'Recibimos tu solicitud. Nuestro equipo la está revisando para asegurar que encaje con el programa actual. Te avisaremos pronto.'
            : 'En este momento no podemos aceptar tu postulación. Revisa los criterios del programa e intenta nuevamente en el futuro.'}
        </p>
        {isRejected && application?.admin_notes && (
          <div className="affiliate-error" style={{ marginTop: '2rem', maxWidth: '500px' }}>
            <strong>Nota del equipo:</strong> {application.admin_notes}
          </div>
        )}
      </div>
    </div>
  )
}

export default function InfluencerLayout() {
  const { user, profile } = useAuthStore()
  const { getInfluencerDashboardData, fetchInfluencers, affiliates } = useInfluencerStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const isAdmin = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista'].includes(profile?.role)
  const selectedInfluencerId = searchParams.get('affiliate') || ''
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin) fetchInfluencers()
  }, [isAdmin, fetchInfluencers])

  useEffect(() => {
    let active = true

    // Timeout de carga: Si la DB tarda más de 12s, mostrar los datos que haya
    const timeout = setTimeout(() => {
      if (active && state.loading) {
        console.warn('InfluencerLayout: Tiempo de espera agotado al cargar datos.');
        setState(current => ({ ...current, loading: false, error: 'La carga de datos tardó más de lo esperado. Algunos datos podrían estar incompletos.' }));
      }
    }, 12000);

    const run = async () => {
      if (!user?.id) return
      setState((current) => ({ ...current, loading: true, error: null }))

      const { data, error } = await getInfluencerDashboardData({
        userId: user.id,
        affiliateId: selectedInfluencerId || null,
        isAdmin,
      })

      if (!active) return
      clearTimeout(timeout);
      setState({ loading: false, error: error?.message || null, data: data || null })
    }

    run()
    return () => { 
      active = false;
      clearTimeout(timeout);
    }
  }, [user?.id, selectedInfluencerId, isAdmin, getInfluencerDashboardData])

  const campaign = state.data?.activeCampaign || null
  const tierState = state.data?.tierState || null
  const tierMeta = getTierMeta(tierState?.effective_tier)
  const healthMeta = getHealthMeta(tierState?.performance_health)

  const handleInfluencerChange = (event) => {
    const value = event.target.value
    const next = new URLSearchParams(searchParams)
    if (value) next.set('affiliate', value)
    else next.delete('affiliate')
    setSearchParams(next)
  }

  // Si todavía estamos cargando los datos del afiliado, no decidir todavía
  if (state.loading) {
    return (
      <div className="affiliate-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', flex: 1 }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>hourglass_top</span>
          <p style={{ marginTop: '1rem' }}>Cargando tu panel de influencer...</p>
          {state.error && <p style={{ color: '#ff5a00', marginTop: '0.5rem', fontSize: '0.85rem' }}>{state.error}</p>}
        </div>
      </div>
    )
  }
  
  // Gating logic â€” solo cuando loading terminó
  if (!state.data?.affiliate && !isAdmin) {
    if (state.data?.application) {
      return <ApplicationStatusView application={state.data.application} />
    }
    return <EmptyView isAdmin={isAdmin} />
  }

  // Admin support mode but no affiliate selected and no self-affiliate
  if (isAdmin && !state.data?.affiliate && !selectedInfluencerId) {
    return (
      <div className="affiliate-shell">
        <header className="affiliate-hero">
          <div>
            <div className="affiliate-kicker">/ affiliate operations</div>
            <h1>Panel de Administración</h1>
            <p>Selecciona un influencer para ver su performance o gestionar sus activos.</p>
          </div>
          <div className="affiliate-hero-actions">
            <label className="affiliate-select-wrap">
              <span>Seleccionar Influencer</span>
              <select value={selectedInfluencerId} onChange={handleInfluencerChange}>
                <option value="">-- Elige un influencer --</option>
                {affiliates.filter(item => item.status === 'activo').map(item => (
                  <option key={item.id} value={item.id}>{item.name} (@{item.handle})</option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <div className="affiliate-empty">
          <span className="material-symbols-outlined">person_search</span>
          <h1>Modo Soporte</h1>
          <p>Utiliza el selector superior para cargar los datos de un influencer específico.</p>
        </div>
      </div>
    )
  }

  if (!state.data) return <EmptyView isAdmin={isAdmin} />

  return (
    <div className="affiliate-shell">
      <style>{affiliateStyles}</style>

      <header className="affiliate-hero">
        <div>
          <div className="affiliate-kicker">/ influencer dashboard</div>
          <h1>{state.data.affiliate?.name || 'Influencer'} {isAdmin && selectedInfluencerId ? <span className="affiliate-support-tag">support</span> : null}</h1>
          <p>{campaign ? `Tier ${tierMeta.label}. Lee tu performance real, protege calidad y empuja el siguiente upgrade.` : 'Activa usuarios reales para empezar a construir tu tier.'}</p>
        </div>

        <div className="affiliate-hero-actions">
          {isAdmin ? (
            <label className="affiliate-select-wrap">
              <span>Modo soporte</span>
              <select value={selectedInfluencerId} onChange={handleInfluencerChange}>
                <option value="">Mi afiliado vinculado</option>
                {affiliates.filter(item => item.status === 'activo').map(item => (
                  <option key={item.id} value={item.id}>{item.name} (@{item.handle})</option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="affiliate-primary-btn" onClick={() => navigate(`/influencer/assets${selectedInfluencerId ? `?affiliate=${selectedInfluencerId}` : ''}`)}>
            <span className="material-symbols-outlined">ads_click</span>
            Ver assets
          </button>
        </div>
      </header>

      <section className="affiliate-top-strip">
        <div className="affiliate-strip-card">
          <span>Tier actual</span>
          <strong>{tierMeta.tier} Â· {tierMeta.label}</strong>
        </div>
        <div className="affiliate-strip-card">
          <span>Progreso</span>
          <strong>{formatPercent(state.data?.stats?.nextTierProgress || 0)}</strong>
        </div>
        <div className="affiliate-strip-card">
          <span>Comision actual</span>
          <strong>{Number(state.data?.stats?.userCommission || 0).toFixed(1)}% users Â· {Number(state.data?.stats?.businessCommission || 0).toFixed(1)}% biz</strong>
        </div>
        <div className="affiliate-strip-card">
          <span>Salud</span>
          <strong style={{ color: healthMeta.color }}>{healthMeta.label}</strong>
        </div>
      </section>

      <nav className="influencer-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to + (selectedInfluencerId ? `?affiliate=${selectedInfluencerId}` : '')} className={({ isActive }) => `influencer-nav-link ${isActive ? 'active' : ''}`}>
            <GamificationIcon icon={item.icon} size="sm" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {state.error ? <div className="affiliate-error">{state.error}</div> : null}

      <Outlet context={{
        dashboard: state.data,
        isAdmin,
        selectedInfluencerId,
      }} />
    </div>
  )
}

const affiliateStyles = `
  @keyframes aff-glow-pulse { 0%,100%{ box-shadow: 0 0 12px rgba(255,90,0,.15); } 50%{ box-shadow: 0 0 28px rgba(255,90,0,.3); } }
  @keyframes aff-bar-shine { from{ background-position: -200% center; } to{ background-position: 200% center; } }
  @keyframes aff-float { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-4px); } }

  .influencer-shell { min-height: 100vh; background: #060608; color: #fff; font-family: 'Barlow', sans-serif; padding-bottom: 80px; }

  /* — HERO — */
  .influencer-hero {
    padding: 3.5rem 2.5rem 2.5rem;
    background: linear-gradient(165deg, #0d0d10 0%, #080809 40%, rgba(255,90,0,.04) 100%);
    border-bottom: 1px solid rgba(255,90,0,.12);
    display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem; flex-wrap: wrap;
    position: relative; overflow: hidden;
  }
  .influencer-hero::before { content: ''; position: absolute; top: -80px; right: -80px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(255,90,0,.08) 0%, transparent 70%); pointer-events: none; }
  .influencer-hero::after { content: 'CREATOR'; position: absolute; right: 2.5rem; top: 50%; transform: translateY(-50%); font: italic 900 8rem 'Barlow Condensed'; color: rgba(255,255,255,.018); line-height: 1; pointer-events: none; text-transform: uppercase; }
  .influencer-kicker { font: 900 .75rem 'Barlow Condensed'; text-transform: uppercase; letter-spacing: .25em; color: #ff5a00; margin-bottom: .75rem; display: flex; align-items: center; gap: 8px; }
  .influencer-kicker::before { content: ''; width: 24px; height: 2px; background: #ff5a00; display: inline-block; }
  .influencer-hero h1 { font: italic 900 3.5rem 'Barlow Condensed'; text-transform: uppercase; line-height: .88; margin: 0 0 1rem; background: linear-gradient(135deg, #fff 60%, #ff5a00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .influencer-hero p { color: rgba(255,255,255,.5); max-width: 560px; font-size: 1rem; line-height: 1.5; margin: 0; }
  .influencer-support-tag { font: 900 .65rem 'Barlow Condensed'; background: linear-gradient(135deg, #ff5a00, #ff7c33); color: #fff; padding: 3px 10px; border-radius: 3px; vertical-align: middle; margin-left: 10px; text-transform: uppercase; letter-spacing: .12em; font-style: normal; box-shadow: 0 2px 8px rgba(255,90,0,.3); }

  .influencer-hero-actions { display: flex; gap: 1rem; align-items: center; position: relative; z-index: 2; }
  .influencer-select-wrap { display: flex; flex-direction: column; gap: 4px; }
  .influencer-select-wrap span { font: 900 .65rem 'Barlow Condensed'; text-transform: uppercase; color: rgba(255,255,255,.35); letter-spacing: .12em; }
  .influencer-select-wrap select { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); color: #fff; padding: 10px 14px; font: 700 .9rem 'Barlow Condensed'; cursor: pointer; border-radius: 4px; transition: border-color .2s; }
  .influencer-select-wrap select:hover { border-color: rgba(255,90,0,.4); }

  .influencer-primary-btn { background: linear-gradient(135deg, #ff5a00, #e04e00); color: #fff; border: none; padding: 12px 26px; font: 900 .95rem 'Barlow Condensed'; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all .25s; border-radius: 4px; box-shadow: 0 4px 16px rgba(255,90,0,.2); text-decoration: none; }
  .influencer-primary-btn:hover { background: linear-gradient(135deg, #ff7c33, #ff5a00); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255,90,0,.35); }
  .influencer-secondary-btn { background: rgba(255,255,255,.04); color: rgba(255,255,255,.85); border: 1px solid rgba(255,255,255,.1); padding: 12px 24px; font: 900 .95rem 'Barlow Condensed'; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; transition: all .25s; border-radius: 4px; }
  .influencer-secondary-btn:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); color: #fff; }
  .influencer-secondary-btn:disabled, .influencer-primary-btn:disabled { opacity: .35; cursor: not-allowed; transform: none !important; }

  /* — TOP STRIP — */
  .influencer-top-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); border-bottom: 1px solid rgba(255,255,255,.06); background: linear-gradient(180deg, rgba(255,90,0,.03) 0%, #080809 100%); }
  .influencer-strip-card { padding: 1.5rem 2rem; border-right: 1px solid rgba(255,255,255,.05); position: relative; transition: background .3s; }
  .influencer-strip-card:hover { background: rgba(255,90,0,.03); }
  .influencer-strip-card:last-child { border-right: none; }
  .influencer-strip-card span { display: block; font: 900 .68rem 'Barlow Condensed'; text-transform: uppercase; color: rgba(255,255,255,.35); letter-spacing: .18em; margin-bottom: 6px; }
  .influencer-strip-card strong { font: italic 900 1.5rem 'Barlow Condensed'; text-transform: uppercase; color: #fff; }

  /* — NAV — */
  .influencer-nav { display: flex; gap: 0; padding: 0 2rem; border-bottom: 1px solid rgba(255,255,255,.06); background: rgba(8,8,9,.95); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10; }
  .influencer-nav-link { padding: 1.25rem 1.5rem; font: 900 .85rem 'Barlow Condensed'; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.4); text-decoration: none; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid transparent; transition: all .25s; position: relative; }
  .influencer-nav-link:hover { color: rgba(255,255,255,.85); background: rgba(255,255,255,.02); }
  .influencer-nav-link.active { color: #ff5a00; border-bottom-color: #ff5a00; background: rgba(255,90,0,.04); }
  .influencer-nav-link .material-symbols-outlined { font-size: 1.15rem; }

  /* — CONTENT — */
  .influencer-content { padding: 2.5rem; max-width: 1400px; margin: 0 auto; }
  .influencer-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
  .influencer-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }

  /* — STAT CARDS — */
  .influencer-stat-card { background: linear-gradient(145deg, #0f0f12, #0c0c0e); border: 1px solid rgba(255,255,255,.06); padding: 1.75rem; border-radius: 6px; position: relative; overflow: hidden; transition: all .3s; }
  .influencer-stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,90,0,.3), transparent); opacity: 0; transition: opacity .3s; }
  .influencer-stat-card:hover { border-color: rgba(255,90,0,.15); transform: translateY(-2px); }
  .influencer-stat-card:hover::after { opacity: 1; }
  .influencer-stat-card span { font: 900 .7rem 'Barlow Condensed'; text-transform: uppercase; color: rgba(255,255,255,.35); letter-spacing: .18em; display: block; margin-bottom: 10px; }
  .influencer-stat-card strong { font: italic 900 2.8rem 'Barlow Condensed'; text-transform: uppercase; color: #fff; display: block; line-height: 1; margin-bottom: 8px; }
  .influencer-stat-card p { font-size: .8rem; color: rgba(255,255,255,.35); margin: 0; line-height: 1.4; }

  /* — PANELS — */
  .influencer-panel { background: linear-gradient(145deg, #0f0f12, #0a0a0c); border: 1px solid rgba(255,255,255,.06); display: flex; flex-direction: column; border-radius: 6px; overflow: hidden; transition: border-color .3s; }
  .influencer-panel:hover { border-color: rgba(255,255,255,.1); }
  .influencer-panel-head { padding: 1.5rem 2rem; border-bottom: 1px solid rgba(255,255,255,.05); background: rgba(255,255,255,.01); }
  .influencer-panel-head h2 { font: italic 900 1.6rem 'Barlow Condensed'; text-transform: uppercase; margin: 0 0 4px; color: #fff; }
  .influencer-panel-head p { font-size: .85rem; color: rgba(255,255,255,.35); margin: 0; }
  .influencer-panel-body { padding: 1.5rem 2rem; flex: 1; }

  /* — LIST — */
  .influencer-list-item { padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,.04); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
  .influencer-list-item:last-child { border-bottom: none; }
  .influencer-list-item strong { font: 800 1.05rem 'Barlow Condensed'; text-transform: uppercase; color: #f0f0f0; word-break: break-all; }
  .influencer-mini-note { font: 900 .62rem 'Barlow Condensed'; text-transform: uppercase; color: rgba(255,255,255,.25); letter-spacing: .12em; text-align: right; }

  .influencer-inline-actions { display: flex; gap: .75rem; margin-top: 1.25rem; flex-wrap: wrap; }
  .influencer-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.15); color: #ef4444; padding: 1rem 2rem; font: 700 .85rem 'Barlow'; margin-bottom: 1rem; border-radius: 4px; }

  /* — EMPTY STATE — */
  .influencer-empty { text-align: center; padding: 8rem 2rem; display: flex; flex-direction: column; align-items: center; }
  .influencer-empty .material-symbols-outlined { font-size: 4rem; color: #ff5a00; margin-bottom: 1.5rem; opacity: .4; animation: aff-float 3s ease-in-out infinite; }
  .influencer-empty h1 { font: italic 900 3rem 'Barlow Condensed'; text-transform: uppercase; margin: 0 0 1rem; background: linear-gradient(135deg, #fff 60%, #ff5a00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .influencer-empty p { color: rgba(255,255,255,.4); max-width: 420px; line-height: 1.6; font-size: .95rem; }

  /* — TIER MILESTONES — */
  .tier-milestone { background: rgba(255,255,255,.015); border: 1px solid rgba(255,255,255,.06); border-radius: 6px; padding: 1.5rem; transition: border-color .3s; }
  .tier-milestone:hover { border-color: rgba(255,90,0,.15); }
  .tier-milestone-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; padding-bottom: .75rem; border-bottom: 1px solid rgba(255,255,255,.05); }
  .tier-milestone-header strong { font: italic 900 1.3rem 'Barlow Condensed'; text-transform: uppercase; color: #ff5a00; }
  .tier-milestone-header span { font: 900 1.1rem 'Barlow Condensed'; color: #fff; }
  .tier-milestone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  .milestone-stat { display: flex; flex-direction: column; gap: 4px; padding: .75rem; background: rgba(255,255,255,.02); border-radius: 4px; border: 1px solid rgba(255,255,255,.04); }
  .milestone-stat strong { font: 900 1.4rem 'Barlow Condensed'; color: #ff5a00; line-height: 1; }
  .milestone-stat span { font: 900 .58rem 'Barlow Condensed'; text-transform: uppercase; color: rgba(255,255,255,.35); letter-spacing: .12em; }

  /* — PROGRESS BARS — */
  .influencer-bar-track { height: 8px; background: rgba(255,255,255,.06); border-radius: 4px; overflow: hidden; flex: 1; }
  .influencer-bar-fill { height: 100%; background: linear-gradient(90deg, #ff5a00, #ff7c33); border-radius: 4px; transition: width .6s ease; position: relative; min-width: 2px; }
  .influencer-bar-row { display: flex; align-items: center; gap: 12px; padding: .5rem 0; }
  .influencer-bar-row label { font: 900 .7rem 'Barlow Condensed'; color: rgba(255,255,255,.4); min-width: 52px; text-transform: uppercase; }
  .influencer-bar-row strong { font: 900 .9rem 'Barlow Condensed'; color: #fff; min-width: 28px; text-align: right; }

  @media (max-width: 768px) {
    .influencer-hero::after { display: none; }
    .influencer-nav { padding: 0 1rem; gap: 0; overflow-x: auto; }
    .influencer-nav-link { font-size: .78rem; white-space: nowrap; padding: 1rem; }
    .influencer-content { padding: 1.25rem; }
    .influencer-grid-2 { grid-template-columns: 1fr; }
    .influencer-grid-4 { grid-template-columns: 1fr 1fr; }
    .tier-milestone-grid { grid-template-columns: 1fr; gap: .5rem; }
    .influencer-top-strip { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .influencer-grid-4 { grid-template-columns: 1fr; }
    .influencer-top-strip { grid-template-columns: 1fr; }
    .influencer-hero-actions { flex-direction: column; align-items: stretch; width: 100%; }
  }
`;
