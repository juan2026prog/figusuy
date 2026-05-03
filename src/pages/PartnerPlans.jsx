import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthModal from '../components/AuthModal'

export default function PartnerPlans() {
  const navigate = useNavigate()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleContact = () => {
    window.open('https://wa.me/59899000000?text=Hola,%20me%20interesa%20un%20plan%20para%20mi%20local%20en%20FigusUY', '_blank')
  }

  return (
    <div className="pp-wrapper">
      <style>{`
        .pp-wrapper {
          --bg:#0b0b0b; --panel:#121212; --panel2:#181818; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
          --text:#f5f5f5; --muted:rgba(245,245,245,.58); --muted2:rgba(245,245,245,.36); --orange:#ff5a00; --orange2:#cc4800;
          --green:#22c55e; --blue:#3b82f6; --purple:#8b5cf6; --yellow:#facc15;
          min-height:100vh; color:var(--text); font-family:'Barlow',sans-serif;
          background:radial-gradient(circle at top right, rgba(255,90,0,.14), transparent 28%), linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
        }
        .pp-wrapper * { box-sizing:border-box; }

        .pp-topbar { position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:82px; padding:14px 22px; border-bottom:1px solid var(--line); background:rgba(11,11,11,.96); backdrop-filter:blur(8px); }
        .pp-kicker { font:900 .72rem 'Barlow Condensed'; letter-spacing:.16em; text-transform:uppercase; color:var(--orange); }
        .pp-top-title { font:italic 900 2.45rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .pp-btn { border:1px solid var(--line2); background:transparent; color:#fff; padding:.85rem 1.15rem; font:900 .88rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:.2s ease; text-decoration:none; white-space:nowrap; }
        .pp-btn:hover { border-color:var(--orange); color:var(--orange); }
        .pp-btn.orange { background:var(--orange); border-color:var(--orange); color:#fff; }
        .pp-btn.orange:hover { background:var(--orange2); border-color:var(--orange2); }
        .pp-btn.purple { background:var(--purple); border-color:var(--purple); color:#fff; }
        .pp-btn.purple:hover { background:#7c3aed; border-color:#7c3aed; }
        .pp-btn.block { width:100%; }
        .pp-btn.inline { border:0; padding-inline:0; }

        .pp-wrap { width:min(100%, 1420px); margin:0 auto; padding:28px 22px 76px; }

        /* Hero */
        .pp-hero { position:relative; overflow:hidden; padding:34px; border:1px solid var(--line); background:linear-gradient(135deg, rgba(255,90,0,.18) 0%, rgba(255,90,0,.04) 26%, transparent 45%), linear-gradient(180deg, #181818 0%, #111111 100%); margin-bottom:28px; }
        .pp-hero:before { content:'NEGOCIOS'; position:absolute; right:18px; top:-12px; font:italic 900 clamp(4rem,12vw,8rem) 'Barlow Condensed'; line-height:.8; color:rgba(255,255,255,.04); pointer-events:none; }
        .pp-hero:after { content:''; position:absolute; inset:auto 0 0 0; height:4px; background:linear-gradient(90deg, var(--orange) 0%, rgba(255,90,0,0) 72%); }
        .pp-hero-title { position:relative; z-index:1; margin:10px 0 0; font:italic 900 clamp(2.8rem,6vw,5rem) 'Barlow Condensed'; line-height:.84; text-transform:uppercase; }
        .pp-hero-title span { color:var(--orange); }
        .pp-hero-sub { position:relative; z-index:1; max-width:680px; margin:18px 0 0; color:var(--muted); font-size:1.05rem; line-height:1.6; }
        .pp-hero-badges { position:relative; z-index:1; display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; }
        .pp-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--line2); background:#0d0d0d; font:900 .76rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .pp-badge.orange { color:var(--orange); border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); }
        .pp-badge.green { color:var(--green); border-color:rgba(34,197,94,.35); background:rgba(34,197,94,.08); }
        .pp-badge.purple { color:var(--purple); border-color:rgba(139,92,246,.35); background:rgba(139,92,246,.08); }

        /* Section head */
        .pp-section-head { display:flex; justify-content:space-between; align-items:end; gap:18px; margin-bottom:18px; }
        .pp-section-head h2 { margin:10px 0 0; font:italic 900 3rem 'Barlow Condensed'; line-height:.88; text-transform:uppercase; }
        .pp-section-head p { margin-top:8px; color:var(--muted); font-size:.96rem; max-width:720px; }
        .pp-section { margin-top:28px; }

        /* Plans grid */
        .pp-plans { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); }
        .pp-plan { position:relative; overflow:hidden; min-height:620px; display:flex; flex-direction:column; padding:28px; background:var(--panel); }
        .pp-plan:before { content:''; position:absolute; inset:0 0 auto 0; height:5px; background:transparent; }
        .pp-plan.turbo { background:linear-gradient(180deg, rgba(255,90,0,.11) 0%, rgba(255,90,0,0) 28%), var(--panel2); }
        .pp-plan.turbo:before { background:var(--orange); }
        .pp-plan.dominio { background:linear-gradient(180deg, rgba(139,92,246,.12) 0%, rgba(139,92,246,0) 28%), linear-gradient(135deg, #171717 0%, #101010 100%); }
        .pp-plan.dominio:before { background:var(--purple); }

        .pp-plan-ribbon { position:absolute; right:16px; top:16px; padding:5px 10px; color:#fff; font:900 .66rem 'Barlow Condensed'; letter-spacing:.1em; text-transform:uppercase; }
        .pp-plan.turbo .pp-plan-ribbon { background:var(--orange); }
        .pp-plan.dominio .pp-plan-ribbon { background:var(--purple); }

        .pp-plan-icon { width:64px; height:64px; display:grid; place-items:center; margin-bottom:18px; border:1px solid var(--line2); background:#0d0d0d; }
        .pp-plan-icon .material-symbols-outlined { font-size:1.85rem; }
        .pp-plan.turbo .pp-plan-icon { border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); color:var(--orange); }
        .pp-plan.dominio .pp-plan-icon { border-color:rgba(139,92,246,.35); background:rgba(139,92,246,.08); color:var(--purple); }

        .pp-plan-tag { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border:1px solid var(--line2); background:#0d0d0d; font:900 .76rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; margin-bottom:14px; }
        .pp-plan-name { font:italic 900 2.7rem 'Barlow Condensed'; text-transform:uppercase; line-height:.86; }
        .pp-plan-concept { min-height:52px; margin:10px 0 0; color:var(--muted); font-size:.93rem; line-height:1.45; }
        .pp-plan-concept strong { color:var(--text); display:block; margin-bottom:4px; font:italic 900 1.35rem 'Barlow Condensed'; text-transform:uppercase; line-height:.95; }

        .pp-price { display:flex; align-items:end; gap:8px; margin:22px 0 18px; }
        .pp-price b { font:italic 900 4rem 'Barlow Condensed'; line-height:.8; }
        .pp-price span { margin-bottom:5px; color:var(--muted2); font:900 .82rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }

        /* Contact differentiation badge */
        .pp-contact-badge { display:flex; align-items:center; gap:8px; padding:10px 14px; margin-bottom:18px; font:900 .8rem 'Barlow Condensed'; letter-spacing:.06em; text-transform:uppercase; }
        .pp-contact-badge .material-symbols-outlined { font-size:1.2rem; }
        .pp-contact-none { border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--muted2); }
        .pp-contact-phone { border:1px solid rgba(255,90,0,.3); background:rgba(255,90,0,.07); color:var(--orange); }
        .pp-contact-whatsapp { border:1px solid rgba(34,197,94,.3); background:rgba(34,197,94,.07); color:var(--green); }

        .pp-features { display:grid; gap:11px; flex:1; margin-bottom:18px; }
        .pp-feature { display:grid; grid-template-columns:20px 1fr; gap:10px; color:var(--muted); font-size:.93rem; line-height:1.4; }
        .pp-check { font-weight:900; }
        .pp-plan .pp-check { color:var(--green); }
        .pp-plan.turbo .pp-check { color:var(--orange); }
        .pp-plan.dominio .pp-check { color:var(--purple); }

        .pp-plan-cta-note { margin:10px 0 0; color:var(--muted2); font-size:.8rem; line-height:1.45; text-align:center; min-height:34px; }

        /* Contact comparison section */
        .pp-contact-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); }
        .pp-contact-card { background:var(--panel); padding:22px; text-align:center; }
        .pp-contact-card .material-symbols-outlined { display:block; margin:0 auto 12px; width:52px; height:52px; display:grid; place-items:center; border:1px solid var(--line2); background:#0d0d0d; font-size:1.6rem; }
        .pp-contact-card h4 { font:italic 900 1.6rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; margin-bottom:8px; }
        .pp-contact-card p { color:var(--muted); font-size:.88rem; line-height:1.45; }
        .pp-contact-card.orange .material-symbols-outlined { color:var(--orange); border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); }
        .pp-contact-card.green .material-symbols-outlined { color:var(--green); border-color:rgba(34,197,94,.35); background:rgba(34,197,94,.08); }

        /* Philosophy */
        .pp-philosophy { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); }
        .pp-philosophy-card { background:var(--panel); padding:22px; }
        .pp-philosophy-card .material-symbols-outlined { display:grid; place-items:center; width:48px; height:48px; border:1px solid var(--line2); background:#0d0d0d; font-size:1.5rem; color:var(--orange); margin-bottom:14px; }
        .pp-philosophy-card h4 { font:italic 900 1.5rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; margin-bottom:8px; }
        .pp-philosophy-card p { color:var(--muted); font-size:.88rem; line-height:1.45; }

        @media (max-width:1100px) {
          .pp-plans, .pp-contact-grid, .pp-philosophy { grid-template-columns:1fr; gap:14px; background:transparent; border:0; }
          .pp-plan, .pp-contact-card, .pp-philosophy-card { border:1px solid var(--line); min-height:auto; }
          .pp-section-head { display:block; }
        }
        @media (max-width:720px) {
          .pp-topbar { align-items:start; padding-inline:14px; }
          .pp-top-title { font-size:2rem; }
          .pp-wrap { padding:18px 12px 64px; }
          .pp-hero { padding:22px; }
          .pp-hero-title { font-size:2.8rem; }
          .pp-plan { padding:22px; }
          .pp-price b { font-size:3.4rem; }
          .pp-section-head h2 { font-size:2.4rem; }
        }
      `}</style>

      <header className="pp-topbar">
        <div>
          <div className="pp-kicker">Locales y Tiendas</div>
          <div className="pp-top-title">Planes para Puntos</div>
        </div>
        <button className="pp-btn pp-btn-inline" onClick={() => navigate(-1)}>&larr; Volver</button>
      </header>

      <main className="pp-wrap">
        {/* Hero */}
        <section className="pp-hero">
          <div className="pp-kicker">// progresion comercial</div>
          <h1 className="pp-hero-title">Existí. Vendé mejor. <span>Dominá tu zona.</span></h1>
          <p className="pp-hero-sub">La progresion es clara: Gratis te da presencia minima, Turbo te ayuda a convertir mejor y Dominio te posiciona con la capa mas fuerte de visibilidad local.</p>
          <div className="pp-hero-badges">
            <span className="pp-badge green">✓ Plan gratis disponible</span>
            <span className="pp-badge orange">✓ Contacto diferenciado por plan</span>
            <span className="pp-badge purple">✓ Destaque en tu zona</span>
          </div>
        </section>

        {/* Plans */}
        <section className="pp-section" id="planes">
          <div className="pp-section-head">
            <div>
              <div className="pp-kicker">// planes</div>
              <h2>Elegí como queres crecer</h2>
              <p>No vendemos el primer lugar. Vendemos herramientas para que tu local convierta mas visitas en contactos reales.</p>
            </div>
          </div>

          <div className="pp-plans">
            {/* Gratis */}
            <article className="pp-plan">
              <div className="pp-plan-icon"><span className="material-symbols-outlined">storefront</span></div>
              <div className="pp-plan-tag">Existir</div>
              <h3 className="pp-plan-name">Gratis</h3>
              <p className="pp-plan-concept"><strong>Existís</strong>Entrada sin costo para figurar en el mapa.</p>
              <div className="pp-price"><b>UYU 0</b><span>/mes</span></div>
              <div className="pp-contact-badge pp-contact-none">
                <span className="material-symbols-outlined">block</span> Sin contacto directo
              </div>
              <div className="pp-features">
                <div className="pp-feature"><span className="pp-check">✓</span><span>Aparecer en el mapa</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Ficha basica</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Direccion y horario</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>0 fotos</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Sin promos</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Metricas minimas</span></div>
              </div>
              <button className="pp-btn block" onClick={() => setShowAuthModal(true)}>Crear cuenta gratis</button>
              <p className="pp-plan-cta-note">Ajustá tu plan segun lo que necesites.</p>
            </article>

            {/* Turbo */}
            <article className="pp-plan turbo">
              <div className="pp-plan-ribbon">Más popular</div>
              <div className="pp-plan-icon"><span className="material-symbols-outlined">diamond</span></div>
              <div className="pp-plan-tag">Vender mejor</div>
              <h3 className="pp-plan-name">Turbo</h3>
              <p className="pp-plan-concept"><strong>Convertís</strong>Escalá visibilidad con herramientas para vender mejor.</p>
              <div className="pp-price"><b>UYU 690</b><span>/mes</span></div>
              <div className="pp-contact-badge pp-contact-phone">
                <span className="material-symbols-outlined">phone_in_talk</span> Teléfono visible
              </div>
              <div className="pp-features">
                <div className="pp-feature"><span className="pp-check">✓</span><span><strong>Todo Gratis</strong></span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>1 foto</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>1 promo activa</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Badge destacado</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Telefono visible</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Metricas basicas</span></div>
              </div>
              <button className="pp-btn orange block" onClick={handleContact}>Contactar ventas</button>
              <p className="pp-plan-cta-note">Ideal para empezar a convertir mas visitas.</p>
            </article>

            {/* Dominio */}
            <article className="pp-plan dominio">
              <div className="pp-plan-ribbon">Máxima visibilidad</div>
              <div className="pp-plan-icon"><span className="material-symbols-outlined">rocket_launch</span></div>
              <div className="pp-plan-tag">Dominar tu zona</div>
              <h3 className="pp-plan-name">Dominio</h3>
              <p className="pp-plan-concept"><strong>Dominás</strong>La capa mas fuerte para posicionarte y dominar tu zona.</p>
              <div className="pp-price"><b>UYU 1.490</b><span>/mes</span></div>
              <div className="pp-contact-badge pp-contact-whatsapp">
                <span className="material-symbols-outlined">chat</span> Botón directo a WhatsApp
              </div>
              <div className="pp-features">
                <div className="pp-feature"><span className="pp-check">✓</span><span><strong>Todo Turbo</strong></span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>3 fotos</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Logo visible</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Multiples promos</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Destaque en tu zona</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Boton directo a WhatsApp</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Metricas avanzadas</span></div>
                <div className="pp-feature"><span className="pp-check">✓</span><span>Prioridad alta en resultados</span></div>
              </div>
              <button className="pp-btn purple block" onClick={handleContact}>Contactar ventas</button>
              <p className="pp-plan-cta-note">Tenes la maxima visibilidad activa.</p>
            </article>
          </div>
        </section>

        {/* Contact differentiation */}
        <section className="pp-section">
          <div className="pp-section-head">
            <div>
              <div className="pp-kicker">// contacto</div>
              <h2>Como te encuentran</h2>
              <p>Cada plan desbloquea un canal de contacto mas directo. La diferencia es comercial y real.</p>
            </div>
          </div>
          <div className="pp-contact-grid">
            <div className="pp-contact-card">
              <span className="material-symbols-outlined">block</span>
              <h4>Gratis</h4>
              <p>Sin contacto directo. El usuario ve tu ficha pero no puede escribirte ni llamarte.</p>
            </div>
            <div className="pp-contact-card orange">
              <span className="material-symbols-outlined">phone_in_talk</span>
              <h4>Turbo</h4>
              <p>Telefono visible. Te pueden llamar desde la ficha. Ya te contactan.</p>
            </div>
            <div className="pp-contact-card green">
              <span className="material-symbols-outlined">chat</span>
              <h4>Dominio</h4>
              <p>Boton directo a WhatsApp. Te escriben sin friccion. Maxima conversion.</p>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="pp-section">
          <div className="pp-section-head">
            <div>
              <div className="pp-kicker">// filosofía</div>
              <h2>Nuestra filosofía</h2>
            </div>
          </div>
          <div className="pp-philosophy">
            <div className="pp-philosophy-card">
              <span className="material-symbols-outlined">target</span>
              <h4>No vendemos el primer lugar</h4>
              <p>El orden de resultados se basa en cercania y relevancia. Los planes mejoran tu visibilidad, no rompen la experiencia.</p>
            </div>
            <div className="pp-philosophy-card">
              <span className="material-symbols-outlined">visibility</span>
              <h4>Mas exposicion util</h4>
              <p>No usamos banners molestos. Tus promos y destaques aparecen donde realmente importa y suman valor.</p>
            </div>
            <div className="pp-philosophy-card">
              <span className="material-symbols-outlined">trending_up</span>
              <h4>Capacidad de competir</h4>
              <p>Un plan mejor te da herramientas de conversion y mas capacidad para destacar frente a otros locales cercanos.</p>
            </div>
          </div>
        </section>
      </main>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
