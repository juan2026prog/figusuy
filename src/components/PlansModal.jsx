import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { trackEvent } from '../lib/meta'
import { useToast } from './Toast'
import { usePremiumAccess } from '../hooks/usePremiumAccess'

export default function PlansModal({ isOpen, onClose }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { matches } = useAppStore()
  const { profile } = useAuthStore()
  const { isPremium } = usePremiumAccess()

  useEffect(() => {
    if (isOpen) {
      async function fetchPlans() {
        const { data } = await supabase.from('premium_plans').select('*').eq('is_active', true).order('price')
        if (data) setPlans(data)
      }
      fetchPlans()
    }
  }, [isOpen])

  const handleBuyPlan = async (planId) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    const links = {
      'premium plus': 'https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=b390ad1648d241e384c11f7627eaacab',
      'premium pro': 'https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=a08011dedf1f4331a24330f94c906153'
    }

    const directLink = links[plan.name.toLowerCase()]

    if (directLink) {
      trackEvent('InitiateCheckout', { value: plan.price, currency: plan.currency || 'UYU' })
      window.location.href = directLink
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error(data.error || 'No se pudo generar el link de pago')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const features = [
    { name: 'Filtro por Distancia', plus: 'Sí', pro: 'Sí', icon: '📍' },
    { name: 'Confirmación Lectura', plus: 'Sí', pro: 'Sí', icon: '💬' },
    { name: 'Posicionamiento', plus: 'Alto', pro: 'N°1 (Top)', icon: '⚡' },
    { name: 'Alertas Radar', plus: '-', pro: 'Tiempo real', icon: '🔔' },
    { name: 'Modo Fantasma', plus: '-', pro: 'Sí', icon: '👻' },
  ]

  const premiumPlans = plans.filter(p => p.price > 0).sort((a, b) => a.price - b.price)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-body">
          {/* Header */}
          <header className="text-center mb-xl">
            <span className="modal-icon">👑</span>
            <h2 className="text-2xl font-extrabold">Planes Premium</h2>
            <p className="text-sm text-muted mt-xs">Elegí el mejor para vos</p>
          </header>

          {/* Urgency Banner */}
          {!isPremium && (
            <div className="mb-lg" style={{
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem',
              border: '1px solid #fcd34d', textAlign: 'center',
            }}>
              <p className="text-sm font-bold" style={{ color: '#d97706' }}>
                🚀 Acelerá tus intercambios
              </p>
              <p className="text-xs" style={{ color: '#b45309' }}>Encontrá lo que buscás, más rápido y cerca tuyo</p>
            </div>
          )}

          {/* Comparison Table */}
          <div className="premium-table-wrapper mb-xl">
            <div className="card" style={{ padding: '0.5rem', minWidth: '20rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 4.5rem 4.5rem', gap: '0.375rem', padding: '0.5rem', borderBottom: '2px solid var(--color-border-light)' }}>
                <span className="text-xs font-bold text-muted"></span>
                <span className="text-xs font-bold text-center" style={{ color: 'var(--color-primary)' }}>Plus</span>
                <span className="text-xs font-bold text-center" style={{ color: '#f59e0b' }}>Pro ⭐</span>
              </div>
              {features.map((f, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 4.5rem 4.5rem', gap: '0.375rem',
                  padding: '0.5rem', alignItems: 'center',
                  borderBottom: i < features.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                }}>
                  <span className="text-xs font-semibold">{f.icon} {f.name}</span>
                  <span className="text-xs text-center font-semibold" style={{ color: 'var(--color-primary)' }}>{f.plus}</span>
                  <span className="text-xs text-center font-bold" style={{ color: '#f59e0b' }}>{f.pro}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Buttons */}
          <div className="flex-col gap-md">
            {premiumPlans.map(plan => {
              const isPro = plan.name.toLowerCase().includes('pro')
              return (
                <button
                  key={plan.id}
                  onClick={() => handleBuyPlan(plan.id)}
                  disabled={loading}
                  className={`btn btn-lg w-full ${loading ? 'btn-loading' : ''}`}
                  style={{
                    background: isPro ? '#1c1917' : 'var(--color-primary)',
                    color: 'white', fontWeight: 900,
                    boxShadow: isPro ? '0 4px 12px rgba(15, 23, 42, 0.3)' : '0 4px 12px rgba(234, 88, 12, 0.3)',
                    border: 'none',
                  }}>
                  {plan.name} — ${plan.price}/mes
                </button>
              )
            })}
          </div>

          {/* Trust */}
          <div className="flex-center gap-lg flex-wrap mt-xl mb-sm">
            {[
              { icon: '🔒', text: 'Seguro' },
              { icon: '❌', text: 'Cancelá cuando quieras' },
              { icon: '💳', text: 'Mercado Pago' },
            ].map(t => (
              <span key={t.text} className="text-xs text-muted font-semibold flex-center gap-xs">
                {t.icon} {t.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
