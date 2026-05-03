import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import PlansModal from '../components/PlansModal'
import { usePremiumAccess } from '../hooks/usePremiumAccess'

export default function PremiumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [showPlans, setShowPlans] = useState(false)
  const [plans, setPlans] = useState([])

  const { isPremium, planName: currentTier } = usePremiumAccess()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('premium_plans').select('*').eq('is_active', true).order('price')
      if (data) setPlans(data)
    }
    load()
  }, [])

  const handleSubscribe = (planName) => {
    const plan = plans.find(p => p.name.includes(planName))
    if (plan && plan.mp_payment_link) {
      const url = new URL(plan.mp_payment_link)
      if (profile?.id) url.searchParams.append('external_reference', profile.id)
      window.location.href = url.toString()
    } else {
      setShowPlans(true)
    }
  }

  // Precios dinÃ¡micos basados en la carga real de Supabase
  const plusPlan = plans.find(p => p.name.toLowerCase().includes('plus'))
  const proPlan = plans.find(p => p.name.toLowerCase().includes('pro'))
  const plusPrice = plusPlan ? `$${plusPlan.price}` : '$99'
  const proPrice = proPlan ? `$${proPlan.price}` : '$199'
  const normalizedCurrentTier = (currentTier || '').toLowerCase()
  const userPlanLevels = [
    { key: 'gratis', order: 0 },
    { key: 'plus', order: plusPlan?.price ?? 99 },
    { key: 'pro', order: proPlan?.price ?? 199 }
  ]
  const currentUserPlan = normalizedCurrentTier.includes('pro')
    ? 'pro'
    : normalizedCurrentTier.includes('plus')
      ? 'plus'
      : 'gratis'
  const currentUserLevel = userPlanLevels.find(plan => plan.key === currentUserPlan)?.order ?? 0

  const getUserPlanCta = (planKey) => {
    const targetLevel = userPlanLevels.find(plan => plan.key === planKey)?.order ?? 0
    if (targetLevel === currentUserLevel) {
      return { label: 'Plan actual', note: 'Este es tu plan activo.', tone: 'current', disabled: true }
    }
    if (targetLevel > currentUserLevel) {
      return { label: 'Mejorar plan', note: 'Mas alcance, mas oportunidades.', tone: 'upgrade', disabled: false }
    }
    return { label: 'Cambiar plan', note: 'Podes cambiar tu plan cuando quieras.', tone: 'change', disabled: false }
  }

  return (
    <div className="premium-panini-wrapper">
      <style>{`
        .premium-panini-wrapper {
          --bg:#0b0b0b; --panel:#121212; --panel2:#181818; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
          --text:#f5f5f5; --muted:rgba(245,245,245,.58); --muted2:rgba(245,245,245,.36); --orange:#ff5a00; --orange2:#cc4800;
          --green:#22c55e; --blue:#3b82f6; --yellow:#facc15;
          min-height:100vh; color:var(--text); font-family:'Barlow',sans-serif;
          background:radial-gradient(circle at top right, rgba(255,90,0,.14), transparent 28%), linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
        }
        .premium-panini-wrapper * { box-sizing:border-box; }
        .topbar { position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:82px; padding:14px 22px; border-bottom:1px solid var(--line); background:rgba(11,11,11,.96); backdrop-filter:blur(8px); }
        .top-kicker,.kicker,.eyebrow { font:900 .72rem 'Barlow Condensed'; letter-spacing:.16em; text-transform:uppercase; }
        .top-kicker,.kicker { color:var(--orange); }
        .eyebrow { color:var(--muted2); }
        .top-title { font:italic 900 2.45rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .btn { border:1px solid var(--line2); background:transparent; color:#fff; padding:.9rem 1.15rem; font:900 .88rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:.2s ease; text-decoration:none; white-space:nowrap; }
        .btn:hover { border-color:var(--orange); color:var(--orange); }
        .btn.orange { background:var(--orange); border-color:var(--orange); color:#fff; }
        .btn.orange:hover { background:var(--orange2); border-color:var(--orange2); color:#fff; }
        .btn.secondary { background:transparent; color:#fff; }
        .btn.block { width:100%; }
        .btn.inline { border:0; padding-inline:0; }
        .btn.is-current,.btn:disabled { opacity:.5; pointer-events:none; }
        .wrap { width:min(100%, 1420px); margin:0 auto; padding:28px 22px 76px; }
        .section { margin-top:28px; }
        .hero { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr); gap:22px; }
        .hero-main,.hero-panel,.hero-panel-cta,.current-main,.current-side,.comparison,.benefit,.faq-item,.plan { border:1px solid var(--line); background:var(--panel); }
        .hero-main { position:relative; overflow:hidden; min-height:420px; padding:34px; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(135deg, rgba(255,90,0,.18) 0%, rgba(255,90,0,.04) 26%, transparent 45%), linear-gradient(180deg, #181818 0%, #111111 100%); }
        .hero-main:before { content:'PREMIUM'; position:absolute; right:18px; top:-12px; font:italic 900 clamp(5rem,15vw,10rem) 'Barlow Condensed'; line-height:.8; color:rgba(255,255,255,.04); pointer-events:none; }
        .hero-main:after { content:''; position:absolute; inset:auto 0 0 0; height:4px; background:linear-gradient(90deg, var(--orange) 0%, rgba(255,90,0,0) 72%); }
        .hero-copy { position:relative; z-index:1; max-width:780px; }
        .hero-title { margin:10px 0 0; font:italic 900 clamp(3.6rem,7vw,6.5rem) 'Barlow Condensed'; line-height:.82; text-transform:uppercase; }
        .hero-title span { color:var(--orange); }
        .hero-sub,.section-head p,.comparison-caption,.benefit p,.faq-item p,.plan-concept,.plan-note,.hero-panel p,.hero-panel-cta p,.current-copy p,.mini-stat span { color:var(--muted); line-height:1.6; }
        .hero-sub { max-width:640px; margin:18px 0 0; font-size:1.05rem; }
        .hero-badges,.hero-actions,.current-meta,.plan-meta,.mini-grid { display:flex; flex-wrap:wrap; gap:10px; }
        .hero-badges { margin-top:28px; }
        .badge,.current-chip,.plan-tag,.tier-state { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--line2); background:#0d0d0d; font:900 .76rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .badge.orange,.current-chip.orange { color:var(--orange); border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); }
        .badge.green,.tier-state.premium,.current-chip.green { color:var(--green); border-color:rgba(34,197,94,.35); background:rgba(34,197,94,.08); }
        .badge.blue { color:var(--blue); border-color:rgba(59,130,246,.35); background:rgba(59,130,246,.08); }
        .tier-state.free { color:var(--yellow); border-color:rgba(250,204,21,.35); background:rgba(250,204,21,.08); }
        .hero-actions { position:relative; z-index:1; margin-top:26px; }
        .hero-side,.current-card,.plans,.benefits { display:grid; gap:1px; background:var(--line); }
        .hero-panel,.hero-panel-cta,.current-main,.current-side,.plan,.benefit { padding:24px; }
        .hero-panel-cta,.current-side { background:linear-gradient(180deg, rgba(255,90,0,.08) 0%, rgba(255,90,0,0) 100%), var(--panel2); }
        .hero-panel h2,.current-main h2,.section-head h2,.table-head h2,.faq h2 { margin:10px 0 0; font:italic 900 3rem 'Barlow Condensed'; line-height:.88; text-transform:uppercase; }
        .hero-tier { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-top:18px; padding:16px; border:1px solid var(--line); background:#0d0d0d; }
        .hero-tier strong,.current-tier { font:italic 900 2.1rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .mini-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); }
        .mini-stat { padding:14px; border:1px solid var(--line); background:#0d0d0d; }
        .mini-stat strong { display:block; margin-bottom:6px; font:italic 900 1.55rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .section-head,.table-head { display:flex; justify-content:space-between; align-items:end; gap:18px; margin-bottom:18px; }
        .section-head p,.comparison-caption { margin-top:8px; font-size:.96rem; max-width:720px; }
        .current-card { grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr); }
        .current-main { position:relative; overflow:hidden; }
        .current-main:before { content:''; position:absolute; inset:0 auto 0 0; width:5px; background:${isPremium ? 'var(--green)' : 'var(--orange)'}; }
        .current-copy { position:relative; z-index:1; padding-left:12px; }
        .current-meta { margin-top:20px; }
        .usage-box { margin-top:24px; padding:18px; border:1px solid var(--line); background:#0d0d0d; }
        .usage-top { display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; color:var(--muted2); font:900 .78rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .bar { position:relative; overflow:hidden; height:18px; border:1px solid var(--line2); background:#090909; }
        .bar div { height:100%; background:linear-gradient(90deg, var(--orange) 0%, #ff7a2f 100%); }
        .bar.premium div { background:linear-gradient(90deg, var(--green) 0%, #7ce7a4 100%); }
        .bar:before,.bar:after { content:''; position:absolute; top:0; bottom:0; width:1px; background:rgba(255,255,255,.28); }
        .bar:before { left:50%; } .bar:after { left:75%; }
        .current-side { display:flex; flex-direction:column; justify-content:space-between; gap:18px; }
        .current-side-title,.benefit h3 { font:italic 900 1.9rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .plan-nudge-list,.features,.faq-grid { display:grid; gap:12px; }
        .plan-nudge-item,.feature { display:grid; grid-template-columns:20px 1fr; gap:10px; color:var(--muted); font-size:.94rem; line-height:1.45; }
        .plan-nudge-item strong,.feature strong,td strong,.feature-lead strong { color:#fff; }
        .plans { grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid var(--line); }
        .plan { position:relative; overflow:hidden; min-height:680px; display:flex; flex-direction:column; }
        .plan:before { content:''; position:absolute; inset:0 0 auto 0; height:5px; background:transparent; }
        .plan.recommended { background:linear-gradient(180deg, rgba(255,90,0,.11) 0%, rgba(255,90,0,0) 28%), var(--panel2); }
        .plan.recommended:before { background:var(--orange); }
        .plan.pro { background:linear-gradient(180deg, rgba(59,130,246,.12) 0%, rgba(59,130,246,0) 28%), linear-gradient(135deg, #171717 0%, #101010 100%); }
        .plan-ribbon { position:absolute; right:16px; top:16px; padding:5px 10px; background:var(--orange); color:#fff; font:900 .66rem 'Barlow Condensed'; letter-spacing:.1em; text-transform:uppercase; }
        .plan-icon { width:64px; height:64px; display:grid; place-items:center; margin-bottom:18px; border:1px solid var(--line2); background:#0d0d0d; font-size:1.85rem; }
        .plan.recommended .plan-icon { border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); }
        .plan.pro .plan-icon { border-color:rgba(59,130,246,.35); background:rgba(59,130,246,.08); }
        .plan-meta { margin-bottom:10px; }
        .plan-name { font:italic 900 2.7rem 'Barlow Condensed'; text-transform:uppercase; line-height:.86; }
        .plan-concept { min-height:54px; margin:10px 0 0; font-size:.93rem; }
        .price { display:flex; align-items:end; gap:8px; margin:24px 0 18px; }
        .price b { font:italic 900 4.4rem 'Barlow Condensed'; line-height:.8; }
        .price span { margin-bottom:5px; color:var(--muted2); font:900 .82rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .feature-lead { margin-bottom:18px; padding:14px 16px; border:1px solid var(--line); background:#0d0d0d; }
        .feature-lead strong { display:block; margin-bottom:6px; font:italic 900 1.35rem 'Barlow Condensed'; text-transform:uppercase; line-height:.95; }
        .feature-lead span { color:var(--muted); font-size:.9rem; line-height:1.45; }
        .features { flex:1; }
        .check { color:var(--green); font-weight:900; }
        .plan.recommended .check { color:var(--orange); }
        .plan.pro .check { color:var(--blue); }
        .plan-note { margin:14px 0 0; padding-top:14px; border-top:1px solid var(--line); font-size:.8rem; text-align:center; }
        .plan-cta-note { margin:10px 0 14px; color:var(--muted2); font-size:.8rem; line-height:1.45; text-align:center; min-height:34px; }
        .comparison { overflow:hidden; }
        .table-head { padding:22px; margin-bottom:0; background:var(--panel2); border-bottom:1px solid var(--line); }
        .comparison-table { overflow-x:auto; }
        table { width:100%; min-width:780px; border-collapse:collapse; }
        th,td { padding:16px 18px; border-bottom:1px solid var(--line); text-align:left; }
        th { background:#0d0d0d; color:var(--muted2); font:900 .82rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        td { color:var(--muted); font-size:.94rem; }
        .td-orange { color:var(--orange); font-weight:900; }
        .td-green { color:var(--green); font-weight:900; }
        .benefits { grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid var(--line); }
        .benefit:nth-child(2) { background:linear-gradient(180deg, rgba(59,130,246,.08) 0%, rgba(59,130,246,0) 100%), var(--panel); }
        .benefit:nth-child(3) { background:linear-gradient(180deg, rgba(250,204,21,.08) 0%, rgba(250,204,21,0) 100%), var(--panel); }
        .benefit-icon { width:56px; height:56px; display:grid; place-items:center; margin-bottom:18px; border:1px solid var(--line2); background:#0d0d0d; font-size:1.65rem; }
        .benefit p { margin-top:10px; font-size:.93rem; }
        .faq { max-width:980px; margin:0 auto; padding-bottom:20px; }
        .faq h2 { text-align:center; margin-bottom:18px; }
        .faq-item { overflow:hidden; }
        .faq-item summary { list-style:none; cursor:pointer; display:flex; justify-content:space-between; gap:16px; padding:18px 20px; font:900 1rem 'Barlow Condensed'; letter-spacing:.05em; text-transform:uppercase; }
        .faq-item summary::-webkit-details-marker { display:none; }
        .faq-item summary span { color:var(--orange); }
        .faq-item p { padding:16px 20px; border-top:1px solid var(--line); font-size:.93rem; }
        @media (max-width:1150px) {
          .hero,.current-card,.plans,.benefits { grid-template-columns:1fr; }
          .plan { min-height:auto; }
          .mini-grid { grid-template-columns:1fr; }
          .section-head,.table-head { align-items:start; }
        }
        @media (max-width:720px) {
          .topbar { align-items:start; padding-inline:14px; }
          .top-title { font-size:2rem; }
          .wrap { padding:18px 12px 64px; }
          .hero-main,.hero-panel,.hero-panel-cta,.current-main,.current-side,.plan,.benefit { padding:20px; }
          .hero { gap:14px; }
          .hero-title { font-size:3.35rem; }
          .hero-panel h2,.current-main h2,.section-head h2,.table-head h2,.faq h2 { font-size:2.4rem; }
          .current-tier,.hero-tier strong { font-size:1.8rem; }
          .section-head,.table-head { display:block; }
          .section-head .btn,.table-head .btn,.hero-actions .btn,.current-side .btn { width:100%; margin-top:14px; }
          .plans,.benefits,.hero-side,.current-card { gap:14px; background:transparent; border:0; }
          .hero-panel,.hero-panel-cta,.current-main,.current-side,.plan,.benefit { border:1px solid var(--line); }
          .price b { font-size:3.8rem; }
          .faq-item summary,.faq-item p { padding-inline:16px; }
        }
      `}</style>

      <header className="topbar">
        <div>
          <div className="top-kicker">Planes</div>
          <div className="top-title">Premium</div>
        </div>
        <button className="btn inline" onClick={() => navigate(-1)}>&larr; Volver</button>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="hero-main">
            <div className="hero-copy">
              <div className="kicker">// tu ventaja dentro de figusuy</div>
              <h1 className="hero-title">Acelerá, optimizá y <span>completá más rápido.</span></h1>
              <p className="hero-sub">FigusUy es y siempre será gratis. Pero si querés ahorrar tiempo, reducir la fricción y conseguir esas figuritas difíciles antes que nadie, nuestros planes aceleradores son para vos.</p>
              <div className="hero-badges">
                <span className="badge green">✓ Uso principal 100% gratuito</span>
                <span className="badge orange">✓ Ahorro de tiempo garantizado</span>
                <span className="badge blue">✓ Prioridad en matches reales</span>
              </div>
            </div>
            <div className="hero-actions">
              <a className="btn orange" href="#planes">Ver aceleradores</a>
              <button className="btn" onClick={() => setShowPlans(true)}>Comparar planes</button>
            </div>
          </div>

          <aside className="hero-side">
            <div className="hero-panel">
              <div className="eyebrow">Tu estado hoy</div>
              <h2>{currentTier}</h2>
              <p>{isPremium ? 'Estás acelerando tus intercambios con beneficios premium. Filtrá, detectá y cerrá tratos más rápido.' : 'Tenés acceso completo a todas las funciones básicas para completar tu álbum. Podés subir de plan cuando el volumen de matches te tome demasiado tiempo.'}</p>
              <div className="hero-tier">
                <div>
                  <span className="eyebrow">Plan activo</span>
                  <strong>{currentTier}</strong>
                </div>
                <span className={`tier-state ${isPremium ? 'premium' : 'free'}`}>{isPremium ? 'Premium activo' : 'Modo gratis'}</span>
              </div>
            </div>
            <div className="hero-panel-cta">
              <div>
                <div className="eyebrow">Lo que cambia</div>
                <div className="mini-grid">
                  <div className="mini-stat"><strong>{isPremium ? 'Filtros On' : 'Más velocidad'}</strong><span>{isPremium ? 'Ordená tus matches a tu gusto.' : 'Encontrá a la gente cerca tuyo al instante.'}</span></div>
                  <div className="mini-stat"><strong>{isPremium ? 'Radar activo' : 'Certeza'}</strong><span>{isPremium ? 'Avisos por las más difíciles.' : 'Saber si leyeron tu mensaje y si están online.'}</span></div>
                  <div className="mini-stat"><strong>{isPremium ? 'Prioridad' : 'Destacá'}</strong><span>{isPremium ? 'Aparecés primero en búsquedas.' : 'Subí en la lista para que te hablen a vos.'}</span></div>
                </div>
              </div>
              <a className="btn orange block" href="#current-plan">{isPremium ? 'Ver tu plan' : 'Acelerar ahora'}</a>
            </div>
          </aside>
        </section>

        <section className="section" id="current-plan">
          <div className="section-head">
            <div>
              <div className="kicker">// plan actual</div>
              <h2>Tu estado actual</h2>
              <p>Tu progreso real. Actualizá tu plan cuando sientas que necesitás ir más rápido o ahorrar tiempo buscando.</p>
            </div>
          </div>
          <div className="current-card">
            <div className="current-main">
              <div className="current-copy">
                <div className="eyebrow">Tu plan actual</div>
                <h2 className="current-tier">{currentTier}</h2>
                <p>{isPremium ? 'Estás aprovechando el ecosistema FigusUy al máximo. Tus filtros, estado de lectura y radar de prioridades están listos para cerrar los mejores cambios.' : 'Tenés acceso total para agregar figuritas, ver todos tus matches y chatear sin límites. FigusUy es tuyo. Si la búsqueda manual se vuelve lenta, podés acelerarla.'}</p>
                <div className="current-meta">
                  <span className={`current-chip ${isPremium ? 'green' : 'orange'}`}>{isPremium ? 'Acelerador activo' : 'Velocidad base'}</span>
                  <span className="current-chip">{isPremium ? 'Acceso total' : 'Aceleración disponible'}</span>
                </div>
                <div className="usage-box">
                  <div className="usage-top">
                    <span>Álbumes y Matches</span>
                    <span>Ilimitados</span>
                  </div>
                  <div className={`bar premium`}>
                    <div style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <aside className="current-side">
              <div>
                <div className="eyebrow">Siguiente paso</div>
                <div className="current-side-title">{isPremium ? 'Mantené la ventaja y completá más rápido.' : 'Acelerá tus cambios sin perder el ritmo.'}</div>
              </div>
              <div className="plan-nudge-list">
                <div className="plan-nudge-item"><span className="check">✓</span><span><strong>Filtros por distancia</strong> para no viajar de más y cambiar cerca.</span></div>
                <div className="plan-nudge-item"><span className="check">✓</span><span><strong>Confirmación de lectura</strong> para no perder tiempo con fantasmas.</span></div>
                <div className="plan-nudge-item"><span className="check">✓</span><span><strong>Radar de difíciles</strong> para que el sistema trabaje por vos.</span></div>
              </div>
              <a className="btn orange block" href="#planes">Ver aceleradores</a>
            </aside>
          </div>
        </section>

        <section className="section" id="planes">
          <div className="section-head">
            <div>
              <div className="kicker">// planes</div>
              <h2>Elegí tu ritmo para completar</h2>
              <p>El núcleo es gratis. Plus es tu acelerador para ahorrar tiempo. Pro es el radar absoluto para las figuritas difíciles.</p>
            </div>
          </div>
          <div className="plans">
            <article className="plan">
              {(() => {
                const cta = getUserPlanCta('gratis')
                return (
                  <>
              <div className="plan-icon"><span className="material-symbols-outlined" style={{fontSize:'1.85rem'}}>backpack</span></div>
              <div className="plan-meta"><span className="plan-tag">Usar</span></div>
              <h3 className="plan-name">Gratis</h3>
              <p className="plan-concept">Coleccioná a tu ritmo y encontrá tus matches. La experiencia completa, sin barreras.</p>
              <div className="price"><b>$0</b><span>siempre</span></div>
              <div className="feature-lead"><strong>Tu punto de partida.</strong><span>Todo lo que necesitás para completar el álbum con paciencia.</span></div>
              <div className="features">
                <div className="feature"><span className="check">✓</span><span>Cargar figuritas <strong>sin límite</strong></span></div>
                <div className="feature"><span className="check">✓</span><span>Ver <strong>todos</strong> tus matches</span></div>
                <div className="feature"><span className="check">✓</span><span>Chat <strong>ilimitado</strong> con matches</span></div>
                <div className="feature"><span className="check">✓</span><span>Completar tu álbum <strong>gratis</strong></span></div>
              </div>
              <button className={`btn ${cta.tone === 'current' ? '' : 'secondary'} block`} disabled={cta.disabled} onClick={() => setShowPlans(true)}>{cta.label}</button>
              <p className="plan-cta-note">{cta.note}</p>
              <p className="plan-note">El verdadero motor de FigusUy. Pagás con tu tiempo de búsqueda manual.</p>
                  </>
                )
              })()}
            </article>

            <article className="plan recommended">
              {(() => {
                const cta = getUserPlanCta('plus')
                return (
                  <>
              <div className="plan-ribbon">Acelerador</div>
              <div className="plan-icon"><span className="material-symbols-outlined" style={{fontSize:'1.85rem'}}>diamond</span></div>
              <div className="plan-meta"><span className="plan-tag">Ahorrar Tiempo</span><span className="plan-tag">Velocidad</span></div>
              <h3 className="plan-name">Plus</h3>
              <p className="plan-concept">Acelerá tus cambios. Encontrá lo que buscás cerca tuyo, rápido y sin perder tiempo.</p>
              <div className="price"><b>{plusPrice}</b><span>mes UYU</span></div>
              <div className="feature-lead"><strong>El salto para activos.</strong><span>Filtros, confirmaciones y limpieza de ruido.</span></div>
              <div className="features">
                <div className="feature"><span className="check">✓</span><span>Filtro de matches <strong>por distancia</strong></span></div>
                <div className="feature"><span className="check">✓</span><span>Filtro por <strong>figurita específica</strong></span></div>
                <div className="feature"><span className="check">✓</span><span><strong>Doble check azul</strong> (leyeron tu mensaje)</span></div>
                <div className="feature"><span className="check">✓</span><span>Ver el estado <strong>"Última vez online"</strong></span></div>
                <div className="feature"><span className="check">✓</span><span>Experiencia <strong>sin publicidad</strong></span></div>
                <div className="feature"><span className="check">✓</span><span>Saber <strong>quién vio tu perfil</strong></span></div>
                <div className="feature"><span className="check">✓</span><span>Badge Plus destacado</span></div>
              </div>
              <button className={`btn ${cta.tone === 'upgrade' ? 'orange' : cta.tone === 'change' ? 'secondary' : ''} block ${cta.tone === 'current' ? 'is-current' : ''}`} onClick={() => handleSubscribe('Plus')} disabled={cta.disabled}>
                {cta.label}
              </button>
              <p className="plan-cta-note">{cta.note}</p>
              <p className="plan-note">Si tenés decenas de matches y querés filtrar solo a los más cercanos y activos.</p>
                  </>
                )
              })()}
            </article>

            <article className="plan pro">
              {(() => {
                const cta = getUserPlanCta('pro')
                return (
                  <>
              <div className="plan-icon"><span className="material-symbols-outlined" style={{fontSize:'1.85rem'}}>rocket_launch</span></div>
              <div className="plan-meta"><span className="plan-tag">Prioridad Absoluta</span><span className="plan-tag">Radar</span></div>
              <h3 className="plan-name">Pro</h3>
              <p className="plan-concept">Dominá el intercambio. Prioridad máxima y alertas para las figuritas más difíciles.</p>
              <div className="price"><b>{proPrice}</b><span>mes UYU</span></div>
              <div className="feature-lead"><strong>Para las últimas 10.</strong><span>El sistema caza por vos y te pone en el centro de atención.</span></div>
              <div className="features">
                <div className="feature"><span className="check">✓</span><span>Todo lo incluido en <strong>Plus</strong></span></div>
                <div className="feature"><span className="check">✓</span><span><strong>Alertas "Radar"</strong> instantáneas de escasez</span></div>
                <div className="feature"><span className="check">✓</span><span><strong>Aparecés primero</strong> en los matches de otros</span></div>
                <div className="feature"><span className="check">✓</span><span><strong>Modo Fantasma</strong> (navegar sin ser visto)</span></div>
                <div className="feature"><span className="check">✓</span><span>Múltiples álbumes con analíticas</span></div>
                <div className="feature"><span className="check">✓</span><span>Soporte prioritario y Badge Coleccionista</span></div>
              </div>
              <button className={`btn ${cta.tone === 'upgrade' ? 'orange' : cta.tone === 'change' ? 'secondary' : ''} block ${cta.tone === 'current' ? 'is-current' : ''}`} onClick={() => handleSubscribe('Pro')} disabled={cta.disabled}>
                {cta.label}
              </button>
              <p className="plan-cta-note">{cta.note}</p>
              <p className="plan-note">Cuando estás buscando las doradas o las últimas para cerrar el álbum.</p>
                  </>
                )
              })()}
            </article>
          </div>
        </section>

        <section className="section comparison">
          <div className="table-head">
            <div>
              <div className="kicker">// comparacion</div>
              <h2>Comparacion rapida</h2>
              <p className="comparison-caption">Simple, clara y enfocada en lo que cambia de verdad entre Gratis, Plus y Pro.</p>
            </div>
            <button className="btn orange" onClick={() => setShowPlans(true)}>Ver tabla completa</button>
          </div>
          <div className="comparison-table">
            <table>
              <thead>
                <tr><th>Función</th><th>Gratis</th><th>Plus</th><th>Pro / Coleccionista</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>Cargar y ver Matches</strong></td><td>Ilimitado</td><td className="td-orange">Ilimitado</td><td className="td-green">Ilimitado</td></tr>
                <tr><td><strong>Chat y Mensajes</strong></td><td>Ilimitados</td><td className="td-orange">Ilimitados</td><td className="td-green">Ilimitados</td></tr>
                <tr><td><strong>Filtros Avanzados (Distancia)</strong></td><td>Manual</td><td className="td-orange">Sí, precisos</td><td className="td-green">Sí, precisos</td></tr>
                <tr><td><strong>Doble Check en Chat</strong></td><td>No</td><td className="td-orange">Sí</td><td className="td-green">Sí</td></tr>
                <tr><td><strong>Posicionamiento en Matches</strong></td><td>Normal</td><td className="td-orange">Normal</td><td className="td-green">N°1 (Prioridad)</td></tr>
                <tr><td><strong>Radar de Automatch</strong></td><td>No</td><td className="td-orange">No</td><td className="td-green">Automático</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="kicker">// beneficios</div>
              <h2>Por qué acelerar</h2>
              <p>En FigusUy nunca vas a pagar por usar el sistema. Pagás para ahorrar tu propio tiempo cuando la búsqueda se vuelve intensa.</p>
            </div>
          </div>
          <div className="benefits">
            <article className="benefit"><div className="benefit-icon"><span className="material-symbols-outlined" style={{fontSize:'1.65rem'}}>bolt</span></div><h3>Cortá el ruido</h3><p>Con decenas de matches, necesitás filtros de distancia y estado online. Plus limpia tu lista al instante.</p></article>
            <article className="benefit"><div className="benefit-icon"><span className="material-symbols-outlined" style={{fontSize:'1.65rem'}}>done_all</span></div><h3>Certeza en chats</h3><p>Dejá de hablarle a la pared. El doble check y la última hora de conexión te aseguran con quién vale la pena coordinar.</p></article>
            <article className="benefit"><div className="benefit-icon"><span className="material-symbols-outlined" style={{fontSize:'1.65rem'}}>radar</span></div><h3>Atrapá las difíciles</h3><p>Cuando te faltan 5 figuritas, Pro te alerta en el segundo que alguien las sube y pone tu perfil arriba de todo para que te elijan a vos.</p></article>
          </div>
        </section>

        <section className="section faq">
          <div className="kicker" style={{ textAlign: 'center' }}>// faq</div>
          <h2>Preguntas frecuentes</h2>
          <div className="faq-grid">
            <details className="faq-item">
              <summary>&iquest;Me van a cobrar por mandar mensajes? <span>▼</span></summary>
              <p>No. El uso central de FigusUy, incluyendo encontrar matches y chatear para coordinar intercambios, es y siempre será 100% gratuito.</p>
            </details>
            <details className="faq-item">
              <summary>&iquest;Para qué sirve el plan Plus entonces? <span>▼</span></summary>
              <p>Para ahorrarte tiempo. Si tenés muchos matches, Plus te permite filtrarlos por distancia, ver quién está online y si leyeron tus mensajes.</p>
            </details>
            <details className="faq-item">
              <summary>&iquest;Qué significa prioridad de matches en Pro? <span>▼</span></summary>
              <p>Significa que cuando otro usuario busque una figurita que vos tenés repetida, tu perfil le aparecerá primero en su lista, dándote mayor ventaja para concretar.</p>
            </details>
          </div>
        </section>
      </main>

      <PlansModal isOpen={showPlans} onClose={() => setShowPlans(false)} />
    </div>
  )
}
