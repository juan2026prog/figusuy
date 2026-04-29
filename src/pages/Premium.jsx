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
      // Pasar el ID del usuario como referencia para el webhook de Mercado Pago
      const url = new URL(plan.mp_payment_link)
      if (profile?.id) url.searchParams.append('external_reference', profile.id)
      window.location.href = url.toString()
    } else {
      setShowPlans(true)
    }
  }

  const features = [
    { name: 'Calidad de cruces', free: 'Básicos', plus: 'Optimizados', pro: 'Avanzados' },
    { name: 'Álbumes activos', free: '1', plus: '3', pro: 'Ilimitados' },
    { name: 'Chat', free: 'Vence en 3 días', plus: 'Sin vencimiento', pro: 'Sin vencimiento' },
    { name: 'Favoritos', free: '10', plus: '50', pro: 'Ilimitados' },
    { name: 'Alertas', free: '—', plus: 'Nuevos relevantes', pro: 'Tiempo real' },
    { name: 'Sugerencias inteligentes', free: '—', plus: '—', pro: '✓' },
    { name: 'Acceso anticipado', free: '—', plus: '—', pro: '✓' },
  ]

  return (
    <>
      {/* Topbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1e293b' }}>
        <div style={{ height: '5rem', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Planes</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.025em', color: 'white', margin: 0 }}>Premium</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'white', color: '#020617', fontWeight: 900, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
          >
            Volver
          </button>
        </div>
      </header>

      {/* Content */}
      <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem 7rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Hero */}
          <div style={{ borderRadius: '2rem', background: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #431407 100%)', border: '1px solid #1e293b', padding: '1.5rem 2rem', color: 'white', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', right: '-6rem', top: '-6rem', width: '16rem', height: '16rem', background: 'rgba(234,88,12,0.15)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
              <div>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 10px 25px rgba(234,88,12,0.3)' }}>👑</div>
                <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
                  {isPremium ? 'Ya sos Premium' : 'Desbloqueá más intercambios'}
                </h2>
                <p style={{ marginTop: '0.75rem', color: '#cbd5e1', maxWidth: '40rem' }}>
                  Elegí el plan que mejor se adapte a cómo completás tus álbumes. Más cruces, más alertas y menos tiempo perdido.
                </p>
              </div>
              <div style={{ borderRadius: '1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem', minWidth: '260px' }}>
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 700 }}>Tu plan actual</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 900, marginTop: '0.25rem', textTransform: 'uppercase' }}>{currentTier}</p>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  {isPremium ? 'Beneficios activos.' : 'Te quedan 1 de 3 cruces este mes.'}
                </p>
                {!isPremium && (
                  <div style={{ marginTop: '1rem', height: '0.75rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '66%', background: '#ea580c', borderRadius: '9999px' }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

            {/* Free */}
            <article style={{ borderRadius: '2rem', background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>🎒</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>Gratis</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Para empezar a probar la app.</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>$0</span>
                <span style={{ marginBottom: '0.5rem', color: '#64748b', fontWeight: 700 }}>/mes</span>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#cbd5e1', flex: 1 }}>
                <p style={{ margin: 0 }}>✓ <b>1</b> álbum activo</p>
                <p style={{ margin: 0 }}>✓ Cruces <b>básicos</b></p>
                <p style={{ margin: 0 }}>✓ Chat por <b>3 días</b></p>
                <p style={{ margin: 0 }}>✓ Favoritos <b>básicos</b></p>
                <p style={{ margin: 0 }}>✓ Puntos y tiendas</p>
              </div>
              <button style={{ marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: '1rem', background: '#1e293b', color: 'white', fontWeight: 900, border: 'none', cursor: 'default' }}>Plan actual</button>
            </article>

            {/* Plus */}
            <article style={{ position: 'relative', borderRadius: '2rem', background: '#0f172a', border: '2px solid #ea580c', boxShadow: '0 20px 25px -5px rgba(234,88,12,0.1)', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '0.5rem', background: '#ea580c' }}></div>
              <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: '#ea580c', color: 'white', fontSize: '0.75rem', fontWeight: 900 }}>RECOMENDADO</div>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: '#431407', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>💎</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>Plus</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Para completar el álbum más fácil y cómodo.</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>$99</span>
                <span style={{ marginBottom: '0.5rem', color: '#64748b', fontWeight: 700 }}>/mes</span>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#cbd5e1', flex: 1 }}>
                <p style={{ margin: 0 }}>✓ Hasta <b>3</b> álbumes activos</p>
                <p style={{ margin: 0 }}>✓ Cruces <b>optimizados</b></p>
                <p style={{ margin: 0 }}>✓ Chat <b>sin vencimiento</b></p>
                <p style={{ margin: 0 }}>✓ Favoritos <b>ampliados</b></p>
                <p style={{ margin: 0 }}>✓ Alertas de <b>nuevos cruces</b> relevantes</p>
                <p style={{ margin: 0 }}>✓ Menos ruido, <b>mejores oportunidades</b></p>
              </div>
              <button
                onClick={() => handleSubscribe('Plus')}
                style={{ marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: '1rem', background: '#ea580c', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(234,88,12,0.2)' }}
              >
                Elegir Plus
              </button>
            </article>

            {/* Pro */}
            <article style={{ borderRadius: '2rem', background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem', display: 'flex', flexDirection: 'column', color: 'white' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>🚀</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Pro</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.25rem' }}>Ventaja para usuarios intensivos.</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>$199</span>
                <span style={{ marginBottom: '0.5rem', color: '#94a3b8', fontWeight: 700 }}>/mes</span>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#e2e8f0', flex: 1 }}>
                <p style={{ margin: 0 }}>✓ Álbumes activos <b>ilimitados</b></p>
                <p style={{ margin: 0 }}>✓ Cruces <b>avanzados</b></p>
                <p style={{ margin: 0 }}>✓ Alertas en <b>tiempo real</b></p>
                <p style={{ margin: 0 }}>✓ Favoritos <b>ilimitados</b></p>
                <p style={{ margin: 0 }}>✓ Sugerencias <b>inteligentes</b></p>
                <p style={{ margin: 0 }}>✓ Mejores oportunidades <b>primero</b></p>
                <p style={{ margin: 0 }}>✓ Acceso <b>anticipado</b> a funciones</p>
              </div>
              <button
                onClick={() => handleSubscribe('Pro')}
                style={{ marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: '1rem', background: 'white', color: '#0f172a', fontWeight: 900, border: 'none', cursor: 'pointer' }}
              >
                Elegir Pro
              </button>
            </article>
          </div>

          {/* Comparison table */}
          <div style={{ borderRadius: '2rem', background: '#0f172a', border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>Comparar planes</h3>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>La diferencia real entre Gratis, Plus y Pro.</p>
              </div>
              <button
                onClick={() => setShowPlans(true)}
                style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', background: '#ea580c', color: 'white', fontWeight: 900, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
              >
                Ver tabla compacta
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.875rem', minWidth: '760px', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#020617' }}>
                  <tr style={{ textAlign: 'left', color: 'white' }}>
                    <th style={{ padding: '1.25rem', fontWeight: 900 }}>Funcionalidad</th>
                    <th style={{ padding: '1.25rem', fontWeight: 900 }}>Gratis</th>
                    <th style={{ padding: '1.25rem', fontWeight: 900, color: '#ea580c' }}>Plus</th>
                    <th style={{ padding: '1.25rem', fontWeight: 900 }}>Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f.name} style={{ borderTop: '1px solid #1e293b' }}>
                      <td style={{ padding: '1.25rem', fontWeight: 700, color: 'white' }}>{f.name}</td>
                      <td style={{ padding: '1.25rem', color: '#94a3b8' }}>{f.free}</td>
                      <td style={{ padding: '1.25rem', color: '#ea580c', fontWeight: 900 }}>{f.plus}</td>
                      <td style={{ padding: '1.25rem', color: 'white', fontWeight: 900 }}>{f.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust bar */}
          <div style={{ borderRadius: '1.5rem', background: '#0f172a', border: '1px solid #1e293b', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8' }}>
            <span>🔒 Pago seguro</span>
            <span>❌ Sin compromiso</span>
            <span>💳 Mercado Pago</span>
            <span>⚙️ Cancelás cuando quieras</span>
          </div>

        </div>
      </section>

      <PlansModal isOpen={showPlans} onClose={() => setShowPlans(false)} />
    </>
  )
}