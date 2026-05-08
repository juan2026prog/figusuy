import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import GamificationIcon from '../components/gamification/icons/GamificationIcon'

const PLANS = [
  {
    name: 'Boost',
    price: 'UYU 0',
    ribbon: 'Presencia inicial',
    className: '',
    icon: 'bolt',
    iconKey: 'PlanFreeBoostIcon',
    concept: 'Entrar en el circuito',
    description: 'Aparece, deja una promo simple y empieza a capturar trafico desde puntos sugeridos por usuarios.',
    features: ['Aparecer en lugares', '1 foto', 'Promo simple', 'Contacto', 'Visibilidad basica'],
    cta: 'Empezar con Boost',
    action: 'auth'
  },
  {
    name: 'Radar',
    price: 'UYU 690',
    ribbon: 'Mas popular',
    className: 'radar',
    icon: 'location_on',
    iconKey: 'PlanRadarTurboIcon',
    concept: 'Ganar radar',
    description: 'Gana mas visibilidad local y mejora tu presencia en mapa cuando el usuario ya esta listo para salir.',
    features: ['Todo Boost', 'Mas visibilidad', 'Promos destacadas', 'Prioridad local', 'Mejor mapa'],
    cta: 'Contactar ventas',
    action: 'contact'
  },
  {
    name: 'Conversion',
    price: 'UYU 1490',
    ribbon: 'Top CTA',
    className: 'conversion',
    icon: 'ads_click',
    iconKey: 'PlanConversionDominioIcon',
    concept: 'Capitalizar intencion',
    description: 'Top CTA, prioridad comercial y promo first para transformar interes en accion medible.',
    features: ['Todo Radar', 'Top CTA', 'Prioridad comercial', 'Promo first', 'Mejor intencion'],
    cta: 'Escalar a Conversion',
    action: 'contact'
  },
  {
    name: 'Collector Hub',
    price: 'UYU 1900',
    ribbon: 'Autoridad premium',
    className: 'partnerstore',
    icon: 'workspace_premium',
    iconKey: 'CollectorHubIcon',
    concept: 'Validar y liderar',
    description: 'La capa mas alta: valida albumes y usuarios, suma rewards y se vuelve punto premium del ecosistema.',
    features: ['Todo Conversion', 'Validacion de albumes', 'Validacion de usuarios', 'Badge Collector Hub', 'Rewards asociados', 'Visibilidad premium'],
    cta: 'Aplicar ahora',
    action: 'contact'
  }
]

const COMPARISON = [
  { label: 'Visibilidad', boost: 'Basica', radar: 'Alta', conversion: 'Prioritaria', partnerstore: 'Premium' },
  { label: 'Promos', boost: 'Simple', radar: 'Destacadas', conversion: 'Promo first', partnerstore: 'Promo + rewards' },
  { label: 'Lugares sugeridos', boost: 'Si', radar: 'Si', conversion: 'Si', partnerstore: 'Si + prioridad' },
  { label: 'Validacion', boost: '-', radar: '-', conversion: '-', partnerstore: 'Albumes y usuarios' },
  { label: 'Objetivo', boost: 'Existir', radar: 'Ganar radar', conversion: 'Convertir', partnerstore: 'Liderar' }
]

export default function PartnerPlans() {
  const navigate = useNavigate()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useAuthStore()
  const toast = useToast()
  const [loadingPlan, setLoadingPlan] = useState(null)

  const handleContact = () => {
    window.open('https://wa.me/59899000000?text=Hola,%20me%20interesa%20un%20plan%20para%20mi%20local%20en%20FigusUY', '_blank')
  }

  const handleSubscribe = async (planKey) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    setLoadingPlan(planKey)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Buscar el ID del plan en la DB según el nombre
      const { data: planData } = await supabase
        .from('premium_plans')
        .select('id')
        .eq('plan_key', planKey.toLowerCase())
        .single()

      if (!planData) throw new Error('Configuración de plan no encontrada')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ planId: planData.id })
      })

      const data = await response.json()
      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || 'Error al iniciar pago')
      }

      window.location.href = data.checkout_url
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="pp-wrapper">
      

      <header className="pp-topbar">
        <div>
          <div className="pp-kicker">Locales y Tiendas</div>
          <div className="pp-top-title">Planes para Lugares</div>
        </div>
        <button className="pp-btn" onClick={() => navigate(-1)}>Volver</button>
      </header>

      <main className="pp-wrap">
        <section className="pp-hero">
          <div className="pp-kicker">// nuevo valor</div>
          <h1 className="pp-hero-title">No es solo aparecer. <span>Es capturar trafico, validar y convertir.</span></h1>
          <p className="pp-hero-sub">
            FigusUY ahora mueve lugares sugeridos, albumes, red, validacion y liquidez. Los planes para negocios escalan
            visibilidad, promos, autoridad comercial y conversion real.
          </p>
          <div className="pp-hero-badges">
            <span className="pp-badge">Lugares sugeridos por usuarios</span>
            <span className="pp-badge">Promos y trafico local</span>
            <span className="pp-badge">Validacion y rewards</span>
          </div>
        </section>

        <section>
          <div className="pp-section-head">
            <div>
              <div className="pp-kicker">// planes</div>
              <h2>Escala comercial</h2>
              <p>Cada plan agrega capacidad real. No compra el primer puesto. Mejora el peso comercial de tu punto dentro del ecosistema.</p>
            </div>
          </div>

          <div className="pp-plans">
            {PLANS.map((plan) => (
              <article key={plan.name} className={`pp-plan ${plan.className}`}>
                <div className="pp-plan-ribbon">{plan.ribbon}</div>
                <div className="pp-plan-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {plan.iconKey ? <GamificationIcon icon={plan.iconKey} size="lg" /> : <span className="material-symbols-outlined">{plan.icon}</span>}
                </div>
                <h3 className="pp-plan-name">{plan.name}</h3>
                <p className="pp-plan-concept">
                  <strong>{plan.concept}</strong>
                  {plan.description}
                </p>
                <div className="pp-price"><b>{plan.price}</b><span>/mes</span></div>
                <div className="pp-features">
                  {plan.features.map((feature) => (
                    <div key={feature} className="pp-feature"><span className="pp-check">+</span><span>{feature}</span></div>
                  ))}
                </div>
                <button
                  className={`pp-btn block ${plan.action === 'contact' ? 'orange' : ''} ${loadingPlan === plan.name ? 'loading' : ''}`}
                  onClick={
                    plan.action === 'auth' 
                      ? () => setShowAuthModal(true) 
                      : () => handleSubscribe(plan.name)
                  }
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? 'Cargando...' : plan.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="pp-compare">
          <div className="pp-section-head" style={{ marginBottom: '12px' }}>
            <div>
              <div className="pp-kicker">// comparativa</div>
              <h2>Que escala en cada plan</h2>
            </div>
          </div>
          <div className="pp-table">
            <div style={{ fontWeight: 900 }}>Beneficio</div>
            <div style={{ textAlign: 'center', fontWeight: 900 }}>Boost</div>
            <div style={{ textAlign: 'center', fontWeight: 900, color: 'var(--orange)' }}>Radar</div>
            <div style={{ textAlign: 'center', fontWeight: 900, color: '#c4b5fd' }}>Conversion</div>
            <div style={{ textAlign: 'center', fontWeight: 900, color: 'var(--yellow)' }}>Collector Hub</div>
            {COMPARISON.map((row) => (
              <React.Fragment key={row.label}>
                <div style={{ fontWeight: 700 }}>{row.label}</div>
                <div style={{ textAlign: 'center' }}>{row.boost}</div>
                <div style={{ textAlign: 'center' }}>{row.Radar}</div>
                <div style={{ textAlign: 'center' }}>{row.conversion}</div>
                <div style={{ textAlign: 'center' }}>{row.partnerstore}</div>
              </React.Fragment>
            ))}
          </div>
        </section>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
