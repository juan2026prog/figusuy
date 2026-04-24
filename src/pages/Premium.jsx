import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export default function PremiumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase.from('premium_plans').select('*').eq('is_active', true).order('price')
      if (data) setPlans(data)
    }
    fetchPlans()
  }, [])

  const handleBuyPlan = async (planId) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

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
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { free: '3 matches', plus: '10 matches seleccionados', pro: 'Matches ilimitados', icon: '🔍' },
    { free: '1 álbum', plus: 'Hasta 3 álbumes', pro: 'Álbumes ilimitados', icon: '📖' },
    { free: 'Chat 3 días', plus: 'Chat ilimitado', pro: 'Chat ilimitado', icon: '💬' },
    { free: 'A más de 500m', plus: 'Desde 250m', pro: 'Todo Uruguay', icon: '📍' },
    { free: 'Sin alertas', plus: 'Alerta (+20 faltantes)', pro: 'Alertas en tiempo real', icon: '🔔' },
    { free: 'Oculto', plus: 'Ver interesados (+10)', pro: 'Ver interesados siempre', icon: '👀' },
    { free: 'Normal', plus: 'Mayor visibilidad', pro: 'Alta visibilidad + Badge', icon: '👑' },
  ]

  const premiumPlans = plans.filter(p => p.price > 0).sort((a, b) => a.price - b.price)

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← Volver
      </button>

      {/* Hero */}
      <div className="animate-fade-in-up" style={{
        textAlign: 'center', marginBottom: '2rem',
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        borderRadius: 'var(--radius-2xl)', padding: '2rem 1.5rem', color: 'white',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-2rem', top: '-2rem', width: '8rem', height: '8rem', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)' }} />
        <div style={{ position: 'absolute', left: '-1rem', bottom: '-1rem', width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>👑</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Elegí tu Plan Premium</h1>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, lineHeight: 1.6 }}>
            Encontrá intercambios que realmente valen la pena o accedé sin límites.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="animate-fade-in-up" style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden', marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)',
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1.5fr',
          padding: '1rem', borderBottom: '1px solid var(--color-border-light)',
          fontSize: '0.8125rem', fontWeight: 700, textAlign: 'center', alignItems: 'center'
        }}>
          <span></span>
          <span style={{ color: 'var(--color-text-muted)' }}>Gratis</span>
          <span style={{ color: '#3b82f6' }}>Plus</span>
          <span style={{ color: '#f59e0b' }}>Pro</span>
        </div>

        {features.map((feat, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1.5fr',
            padding: '0.875rem 1rem', borderBottom: i < features.length - 1 ? '1px solid var(--color-border-light)' : 'none',
            alignItems: 'center', fontSize: '0.8125rem',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              {feat.icon}
            </span>
            <span style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{feat.free}</span>
            <span style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>{feat.plus}</span>
            <span style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 800 }}>{feat.pro}</span>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {premiumPlans.map(plan => {
          const isPro = plan.name.toLowerCase().includes('pro');
          return (
            <button 
              key={plan.id}
              onClick={() => handleBuyPlan(plan.id)}
              disabled={loading}
              className="btn btn-lg animate-scale-in" style={{
                width: '100%', 
                background: isPro ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #1e1b4b, #312e81)',
                color: 'white', fontWeight: 800, fontSize: '1.0625rem',
                borderRadius: 'var(--radius-2xl)', padding: '1rem',
                boxShadow: isPro ? '0 8px 24px rgba(245, 158, 11, 0.4)' : '0 8px 24px rgba(30, 27, 75, 0.4)', 
                border: 'none', cursor: 'pointer',
              }}>
              {loading ? 'Procesando...' : `⭐ Desbloquear ${plan.name} por $${plan.price}`}
            </button>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
        Cancelá cuando quieras • Sin compromiso
      </p>
    </div>
  )
}

