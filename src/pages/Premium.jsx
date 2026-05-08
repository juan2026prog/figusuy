import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import PlansModal from '../components/PlansModal'
import { usePremiumAccess } from '../hooks/usePremiumAccess'
import { useToast } from '../components/Toast'



export default function PremiumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [showPlans, setShowPlans] = useState(false)
  const [plans, setPlans] = useState([])
  const [subscribingPlan, setSubscribingPlan] = useState(null)
  const toast = useToast()

  const { isPremium, planName: currentTier } = usePremiumAccess()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const subId = params.get('subscription_id')

    if (status === 'success' && subId) {
      // Solo mostrar confirmación si PayPal envió un subscription_id real
      toast.success('¡Suscripción iniciada! PayPal está procesando tu pago. Tu plan se activará en breve.')
      
      // LIMPIAR URL INMEDIATAMENTE para evitar bucles
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      // Refrescar perfil (la activación real viene del webhook)
      const { session, syncSession } = useAuthStore.getState()
      if (session) syncSession(session)
    } else if (status === 'success' && !subId) {
      // URL manipulada — status=success sin subscription_id de PayPal
      toast.info('Verificando tu suscripción...')
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    } else if (status === 'cancel') {
      toast.info('Suscripción cancelada.')
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('premium_plans').select('*').eq('is_active', true).order('price')
      if (data) setPlans(data)
    }
    load()
  }, [])

  const handleSubscribe = async (planName) => {
    const plan = plans.find(p => p.name.includes(planName))
    if (!plan?.id) {
      setShowPlans(true)
      return
    }

    setSubscribingPlan(plan.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión expirada')

      // TODO: Implementar PayPal Subscriptions
      // Por ahora redirigimos a una página de espera o mostramos un mensaje
      toast.info('Redirigiendo a PayPal Subscriptions...')
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ planId: plan.id })
      })

      const data = await response.json()
      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || 'PayPal no está disponible en este momento')
      }

      window.location.href = data.checkout_url
    } catch (error) {
      console.error('PayPal checkout error:', error)
      toast.error(error.message || 'No se pudo iniciar la suscripción con PayPal')
    } finally {
      setSubscribingPlan(null)
    }
  }

  // Precios dinámicos basados en la carga real de Supabase
  const plusPlan = plans.find(p => p.name.toLowerCase().includes('plus'))
  const proPlan = plans.find(p => p.name.toLowerCase().includes('pro'))
  const plusPrice = plusPlan ? plusPlan.price : '2.49'
  const proPrice = proPlan ? proPlan.price : '4.85'
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
                <span className="badge green">? Uso principal 100% gratuito</span>
                <span className="badge orange">? Ahorro de tiempo garantizado</span>
                <span className="badge blue">? Prioridad en matches reales</span>
              </div>
            </div>
            <div className="hero-actions">
              <a className="btn orange" href="#planes">Ver aceleradores</a>
              <button className="btn" onClick={() => setShowPlans(true)}>Comparar planes</button>
            </div>
          </div>

          <aside className="hero-side">
            <div className="hero-panel-cta">
              <div>
                <div className="eyebrow">Lo que cambia</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.1rem', lineHeight: 1.2, display: 'block', color: 'var(--color-primary)' }}>{isPremium ? 'Filtros On' : 'Más velocidad'}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px', display: 'block' }}>{isPremium ? 'Ordená tus matches a tu gusto.' : 'Encontrá a la gente cerca tuyo al instante.'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.1rem', lineHeight: 1.2, display: 'block', color: 'var(--color-primary)' }}>{isPremium ? 'Radar activo' : 'Certeza'}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px', display: 'block' }}>{isPremium ? 'Avisos por las más difíciles.' : 'Saber si leyeron tu mensaje y si están online.'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.1rem', lineHeight: 1.2, display: 'block', color: 'var(--color-primary)' }}>{isPremium ? 'Prioridad' : 'Destacá'}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px', display: 'block' }}>{isPremium ? 'Aparecés primero en búsquedas.' : 'Subí en la lista para que te hablen a vos.'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <a className="btn orange block" href="#current-plan" style={{ marginTop: '1rem' }}>{isPremium ? 'Ver tu plan' : 'Acelerar ahora'}</a>
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
                <div className="plan-nudge-item"><span className="check">?</span><span><strong>Filtros por distancia</strong> para no viajar de más y cambiar cerca.</span></div>
                <div className="plan-nudge-item"><span className="check">?</span><span><strong>Confirmación de lectura</strong> para no perder tiempo con fantasmas.</span></div>
                <div className="plan-nudge-item"><span className="check">?</span><span><strong>Radar de difíciles</strong> para que el sistema trabaje por vos.</span></div>
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
              <div className="price">
                <div className="price-amount"><b>$0</b></div>
                <div className="price-meta">
                  <span className="price-period" style={{fontSize: "1rem"}}>siempre</span>
                </div>
              </div>
              <div className="feature-lead"><strong>Tu punto de partida.</strong><span>Todo lo que necesitás para completar el álbum con paciencia.</span></div>
              <div className="features">
                <div className="feature"><span className="check">?</span><span>Cargar figuritas <strong>sin límite</strong></span></div>
                <div className="feature"><span className="check">?</span><span>Ver <strong>todos</strong> tus matches</span></div>
                <div className="feature"><span className="check">?</span><span>Chat <strong>ilimitado</strong> con matches</span></div>
                <div className="feature"><span className="check">?</span><span>Completar tu álbum <strong>gratis</strong></span></div>
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
              <div className="price">
                <div className="price-amount">
                  <span className="price-currency">USD</span>
                  <b>{plusPrice}</b>
                </div>
                <div className="price-meta">
                  <span className="price-uyu">˜ $99 UYU aprox.</span>
                  <span className="price-period">/mes</span>
                </div>
              </div>
              <div className="feature-lead"><strong>El salto para activos.</strong><span>Filtros, confirmaciones y limpieza de ruido.</span></div>
              <div className="features">
                <div className="feature"><span className="check">?</span><span>Filtro de matches <strong>por distancia</strong></span></div>
                <div className="feature"><span className="check">?</span><span>Filtro por <strong>figurita específica</strong></span></div>
                <div className="feature"><span className="check">?</span><span><strong>Doble check azul</strong> (leyeron tu mensaje)</span></div>
                <div className="feature"><span className="check">?</span><span>Ver el estado <strong>"Última vez online"</strong></span></div>
                <div className="feature"><span className="check">?</span><span>Experiencia <strong>sin publicidad</strong></span></div>
                <div className="feature"><span className="check">?</span><span>Saber <strong>quién vio tu perfil</strong></span></div>
                <div className="feature"><span className="check">?</span><span>Badge Plus destacado</span></div>
              </div>
              <button className={`btn ${cta.tone === 'upgrade' ? 'orange' : cta.tone === 'change' ? 'secondary' : ''} block ${cta.tone === 'current' ? 'is-current' : ''}`} onClick={() => handleSubscribe('Plus')} disabled={cta.disabled || subscribingPlan === plusPlan?.id}>
                {subscribingPlan === plusPlan?.id ? 'Procesando...' : cta.label}
              </button>
              <p className="plan-cta-note">{cta.note}</p>
              <p className="plan-note" style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.5rem' }}>El cobro se realiza en USD vía PayPal. El valor final en pesos puede variar según la cotización y tu banco.</p>
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
              <div className="price">
                <div className="price-amount">
                  <span className="price-currency">USD</span>
                  <b>{proPrice}</b>
                </div>
                <div className="price-meta">
                  <span className="price-uyu">˜ $199 UYU aprox.</span>
                  <span className="price-period">/mes</span>
                </div>
              </div>
              <div className="feature-lead"><strong>Para las últimas 10.</strong><span>El sistema caza por vos y te pone en el centro de atención.</span></div>
              <div className="features">
                <div className="feature"><span className="check">?</span><span>Todo lo incluido en <strong>Plus</strong></span></div>
                <div className="feature"><span className="check">?</span><span><strong>Alertas "Radar"</strong> instantáneas de escasez</span></div>
                <div className="feature"><span className="check">?</span><span><strong>Aparecés primero</strong> en los matches de otros</span></div>
                <div className="feature"><span className="check">?</span><span><strong>Modo Fantasma</strong> (navegar sin ser visto)</span></div>
                <div className="feature"><span className="check">?</span><span>Múltiples álbumes con analíticas</span></div>
                <div className="feature"><span className="check">?</span><span>Soporte prioritario y Badge Coleccionista</span></div>
              </div>
              <button className={`btn ${cta.tone === 'upgrade' ? 'orange' : cta.tone === 'change' ? 'secondary' : ''} block ${cta.tone === 'current' ? 'is-current' : ''}`} onClick={() => handleSubscribe('Pro')} disabled={cta.disabled || subscribingPlan === proPlan?.id}>
                {subscribingPlan === proPlan?.id ? 'Procesando...' : cta.label}
              </button>
              <p className="plan-cta-note">{cta.note}</p>
              <p className="plan-note" style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.5rem' }}>El cobro se realiza en USD vía PayPal. El valor final en pesos puede variar según la cotización y tu banco.</p>
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
              <summary>&iquest;Me van a cobrar por mandar mensajes? <span>?</span></summary>
              <p>No. El uso central de FigusUy, incluyendo encontrar matches y chatear para coordinar intercambios, es y siempre será 100% gratuito.</p>
            </details>
            <details className="faq-item">
              <summary>&iquest;Para qué sirve el plan Plus entonces? <span>?</span></summary>
              <p>Para ahorrarte tiempo. Si tenés muchos matches, Plus te permite filtrarlos por distancia, ver quién está online y si leyeron tus mensajes.</p>
            </details>
            <details className="faq-item">
              <summary>&iquest;Qué significa prioridad de matches en Pro? <span>?</span></summary>
              <p>Significa que cuando otro usuario busque una figurita que vos tenés repetida, tu perfil le aparecerá primero en su lista, dándote mayor ventaja para concretar.</p>
            </details>
          </div>
        </section>
      </main>

      <PlansModal isOpen={showPlans} onClose={() => setShowPlans(false)} />
    </div>
  )
}







