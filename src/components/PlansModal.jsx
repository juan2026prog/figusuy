import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/meta'
import { useToast } from './Toast'
import { usePremiumAccess } from '../hooks/usePremiumAccess'

const USER_PLAN_COPY = {
  gratis: {
    name: 'Gratis',
    priceLabel: 'USD 0',
    monthlyLabel: 'sin limite',
    badge: 'Producto completo',
    accent: '#6b7280',
    description: 'Todo el core de FigusUY abierto para intercambiar, activar tu red y moverte mas rapido.',
    highlights: [
      'Álbumes ilimitados',
      'Cargar faltantes y repetidas',
      'Matches ilimitados',
      'Chat y mapa',
      'Cargar nuevos álbumes con moderacion',
      'Perfil publico',
      'Reputacion basica'
    ]
  },
  plus: {
    name: 'Plus',
    badge: 'Conveniencia + velocidad',
    accent: 'var(--color-primary)',
    description: 'Para quien ya usa el producto completo y quiere llegar antes, ver mejor y aparecer mas.',
    highlights: [
      'Todo Gratis',
      'Filtros avanzados',
      'Doble check azul',
      'Prioridad de match',
      'Alertas inteligentes',
      'Mas visibilidad',
      'Mejor ranking',
      'Sugerir puntos de intercambio'
    ]
  },
  pro: {
    name: 'Pro',
    badge: 'Aceleracion + ventaja',
    accent: '#f59e0b',
    description: 'La capa mas fuerte para automatizar oportunidades, ganar contexto y jugar con ventaja.',
    highlights: [
      'Todo Plus',
      'Automatches',
      'Top priority',
      'Modo fantasma',
      'Radar extendido',
      'Insights avanzados',
      'Prioridad en nuevas oportunidades'
    ]
  }
}

const COMPARISON_ROWS = [
  { label: 'Core de intercambio', gratis: 'Completo', plus: 'Completo', pro: 'Completo' },
  { label: 'Velocidad', gratis: 'Base', plus: 'Alta', pro: 'Maxima' },
  { label: 'Prioridad', gratis: 'Normal', plus: 'Preferente', pro: 'Top priority' },
  { label: 'Visibilidad', gratis: 'Publica', plus: 'Potenciada', pro: 'Premium' },
  { label: 'Conveniencia', gratis: 'Manual', plus: 'Asistida', pro: 'Automatizada' },
  { label: 'Mapa y radar', gratis: 'Mapa', plus: 'Alertas inteligentes', pro: 'Radar extendido' },
  { label: 'Sugerir puntos', gratis: 'No', plus: 'Si', pro: 'Si' },
  { label: 'Red y oportunidades', gratis: 'Abierta', plus: 'Mejor ranking', pro: 'Prioridad temprana' }
]

function getPlanKey(name = '') {
  const normalized = name.toLowerCase()
  if (normalized.includes('pro')) return 'pro'
  if (normalized.includes('plus')) return 'plus'
  return null
}

export default function PlansModal({ isOpen, onClose }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { isPremium } = usePremiumAccess()

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function fetchPlans() {
      const { data } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('is_active', true)
        .order('price')

      if (!cancelled && data) setPlans(data)
    }

    fetchPlans()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  const premiumPlans = plans.reduce((acc, plan) => {
    const key = getPlanKey(plan.name)
    if (key) acc[key] = plan
    return acc
  }, {})

  const handleBuyPlan = async (planId) => {
    const plan = plans.find(item => item.id === planId)
    if (!plan) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión expirada')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()
      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || 'PayPal no está disponible')
      }

      trackEvent('InitiateCheckout', { value: plan.price, currency: plan.currency || 'USD' })
      window.location.href = data.checkout_url
    } catch (error) {
      console.error(error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const planCards = ['gratis', 'plus', 'pro'].map((key) => {
    const plan = premiumPlans[key]
    const copy = USER_PLAN_COPY[key]

    const uyuApprox = key === 'plus' ? '99' : key === 'pro' ? '199' : '0'
    return {
      key,
      ...copy,
      priceLabel: key === 'gratis' ? copy.priceLabel : plan ? `USD ${plan.price}` : 'Consultar',
      uyuApprox: key === 'gratis' ? '' : `≈ $${uyuApprox} UYU estimados`,
      monthlyLabel: key === 'gratis' ? copy.monthlyLabel : '/mes',
      checkoutId: plan?.id || null
    }
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card animate-scale-in" style={{ maxWidth: '1000px' }} onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>x</button>

        <div className="modal-body">
          <header className="text-center mb-xl">
            <span className="modal-icon">+</span>
            <h2 className="text-2xl font-extrabold">Planes FigusUY</h2>
            <p className="text-sm text-muted mt-xs">
              El core es gratis. Pagas por velocidad, prioridad, conveniencia y visibilidad.
            </p>
          </header>

          {!isPremium && (
            <div
              className="mb-lg"
              style={{
                background: 'rgba(234, 88, 12, 0.1)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.1rem',
                border: '1px solid rgba(234, 88, 12, 0.2)'
              }}
            >
              <p className="text-sm font-bold" style={{ color: '#fdba74' }}>
                FigusUY ya no es solo intercambiar.
              </p>
              <p className="text-xs" style={{ color: '#fb923c' }}>
                Tambien activa red, sugiere puntos, carga álbumes, valida y genera liquidez en la comunidad.
              </p>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.25rem'
            }}
          >
            {planCards.map((plan) => (
              <article
                key={plan.key}
                className="card"
                style={{
                  padding: '1rem',
                  border: `1px solid ${plan.accent}`,
                  background: plan.key === 'gratis'
                    ? 'var(--color-surface)'
                    : `linear-gradient(180deg, color-mix(in srgb, ${plan.accent} 12%, transparent), var(--color-surface))`
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,.06)',
                    border: `1px solid ${plan.accent}`,
                    color: plan.accent,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    marginBottom: '0.7rem'
                  }}
                >
                  {plan.badge}
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0 }}>{plan.name}</h3>
                <p className="text-sm text-muted" style={{ minHeight: '3rem', marginTop: '0.5rem' }}>{plan.description}</p>
                <div style={{ margin: '1rem 0 0.9rem' }}>
                  <strong style={{ fontSize: '1.8rem', lineHeight: 1 }}>{plan.priceLabel}</strong>
                  <span className="text-xs text-muted" style={{ marginLeft: '0.35rem' }}>{plan.monthlyLabel}</span>
                  {plan.uyuApprox && <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>{plan.uyuApprox}</div>}
                </div>
                <ul style={{ margin: 0, paddingLeft: '1rem', display: 'grid', gap: '0.45rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  {plan.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="premium-table-wrapper mb-xl">
            <div className="card" style={{ padding: '0.6rem', minWidth: '20rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 4.2rem 4.2rem 4.2rem', gap: '0.375rem', padding: '0.5rem', borderBottom: '2px solid var(--color-border-light)' }}>
                <span className="text-xs font-bold text-muted">Comparativa</span>
                <span className="text-xs font-bold text-center">Gratis</span>
                <span className="text-xs font-bold text-center" style={{ color: 'var(--color-primary)' }}>Plus</span>
                <span className="text-xs font-bold text-center" style={{ color: '#f59e0b' }}>Pro</span>
              </div>
              {COMPARISON_ROWS.map((row, index) => (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.35fr 4.2rem 4.2rem 4.2rem',
                    gap: '0.375rem',
                    padding: '0.5rem',
                    alignItems: 'center',
                    borderBottom: index < COMPARISON_ROWS.length - 1 ? '1px solid var(--color-border-light)' : 'none'
                  }}
                >
                  <span className="text-xs font-semibold">{row.label}</span>
                  <span className="text-xs text-center">{row.gratis}</span>
                  <span className="text-xs text-center font-semibold" style={{ color: 'var(--color-primary)' }}>{row.plus}</span>
                  <span className="text-xs text-center font-bold" style={{ color: '#f59e0b' }}>{row.pro}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}
          >
            {planCards.filter(plan => plan.checkoutId).map((plan) => (
              <div key={plan.key} className="w-full">
                <button
                  onClick={() => handleBuyPlan(plan.checkoutId)}
                  disabled={loading}
                  className={`btn btn-lg w-full ${loading ? 'btn-loading' : ''}`}
                  style={{
                    background: plan.key === 'pro' ? '#1c1917' : 'var(--color-primary)',
                    color: '#fff',
                    fontWeight: 900,
                    border: 'none',
                    boxShadow: plan.key === 'pro'
                      ? '0 4px 12px rgba(15, 23, 42, 0.3)'
                      : '0 4px 12px rgba(234, 88, 12, 0.3)'
                  }}
                >
                  Elegir {plan.name} - {plan.priceLabel}/mes
                </button>
                <p className="text-center mt-xs" style={{ fontSize: '0.65rem', opacity: 0.7, color: 'var(--color-text-secondary)' }}>
                  El cobro se realiza en USD vía PayPal. El valor final en pesos puede variar según la cotización y tu banco.
                </p>
              </div>
            ))}
          </div>

          <div className="flex-center gap-lg flex-wrap mt-xl mb-sm">
            {[
              { icon: 'lock', text: 'Pago seguro' },
              { icon: 'bolt', text: 'Upgrade inmediato' },
              { icon: 'payments', text: 'PayPal' }
            ].map((item) => (
              <span key={item.text} className="text-xs text-muted font-semibold flex-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
