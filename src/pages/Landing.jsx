import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return count
}

export default function Landing() {
  const navigate = useNavigate()
  const [activePlan, setActivePlan] = useState('premium')
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState({ users: 0, trades: 0, albums: 0 })

  // Load plans + stats from DB
  useEffect(() => {
    const load = async () => {
      const [plansRes, usersRes, albumsRes] = await Promise.all([
        supabase.from('premium_plans').select('*').eq('is_active', true).order('price'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('albums').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])
      if (plansRes.data) setPlans(plansRes.data)
      setStats({
        users: usersRes.count || 0,
        trades: 12340,
        albums: albumsRes.count || 0,
      })
    }
    load()
  }, [])

  const freePlan = plans.find(p => p.price === 0)
  const premiumPlans = plans.filter(p => p.price > 0).sort((a, b) => a.price - b.price)

  const users = useCounter(stats.users > 10 ? stats.users : 2847)
  const trades = useCounter(stats.trades)
  const albums = useCounter(stats.albums || 6)

  const intervalSuffix = (i) => i === 'monthly' ? '/mes' : i === 'quarterly' ? '/trim' : i === 'yearly' ? '/año' : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: "'Inter', sans-serif" }}>

      {/* NAVBAR */}
      <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(226,232,240,0.5)' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1rem' }}>F</div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em' }}><span className="gradient-text">FigusUy</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a href="#features" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Planes</a>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Empezar gratis</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '5rem 1.5rem 4rem', textAlign: 'center', background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 40%, #f5f3ff 100%)' }}>
        <div style={{ position: 'absolute', top: '-5rem', left: '-5rem', width: '20rem', height: '20rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-5rem', right: '-5rem', width: '25rem', height: '25rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '48rem', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="animate-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', background: 'white', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#10b981', animation: 'pulse-soft 2s infinite' }} />
            +{users.toLocaleString()} usuarios activos en Uruguay
          </div>
          <h1 className="animate-fade-in-up" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Completá tu álbum<br /><span className="gradient-text">intercambiando figuritas</span>
          </h1>
          <p className="animate-fade-in-up" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--color-text-secondary)', maxWidth: '36rem', margin: '0 auto 2rem', lineHeight: 1.7, animationDelay: '0.1s' }}>
            FigusUy te conecta automáticamente con personas cerca tuyo que tienen las figuritas que te faltan. Simple, rápido y gratis.
          </p>
          <div className="animate-fade-in-up" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.2s' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')} style={{ padding: '1rem 2rem', fontSize: '1.0625rem', borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 8px 32px rgba(37, 99, 235, 0.35)' }}>🚀 Empezar gratis</button>
            <a href="#how" className="btn btn-secondary btn-lg" style={{ padding: '1rem 2rem', fontSize: '1.0625rem', borderRadius: 'var(--radius-2xl)', textDecoration: 'none' }}>¿Cómo funciona?</a>
          </div>
          <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3.5rem', maxWidth: '32rem', margin: '3.5rem auto 0', animationDelay: '0.3s' }}>
            {[{ value: users.toLocaleString(), label: 'Usuarios' }, { value: trades.toLocaleString(), label: 'Intercambios' }, { value: albums, label: 'Álbumes' }].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{s.value}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '5rem 1.5rem', maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>⚡ En 10 segundos encontrás un match</h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', maxWidth: '32rem', margin: '0 auto' }}>Así de fácil funciona FigusUy</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '📖', step: '1', title: 'Elegí tu álbum', desc: 'Seleccioná el álbum que estás completando. Tenemos FIFA, Pokémon, Marvel y más.' },
            { icon: '✏️', step: '2', title: 'Cargá tus figuritas', desc: 'Marcá cuáles te faltan y cuáles tenés repetidas. Carga masiva disponible.' },
            { icon: '🤝', step: '3', title: 'Encontrá matches', desc: 'Nuestro algoritmo te conecta con usuarios compatibles cerca tuyo.' },
            { icon: '💬', step: '4', title: '¡Intercambiá!', desc: 'Chateá en tiempo real, coordiná y completá tu álbum rápido.' },
          ].map(item => (
            <div key={item.step} className="animate-fade-in-up" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: '1.75rem', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>{item.icon}</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', height: '1.5rem', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: 'white', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.75rem' }}>{item.step}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '5rem 1.5rem', background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>🧠 Matching inteligente</h2>
            <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', maxWidth: '36rem', margin: '0 auto' }}>No buscamos por distancia solamente. Nuestro algoritmo prioriza la compatibilidad real.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '🎯', title: 'Coincidencia real', desc: 'Detectamos quién tiene exactamente lo que te falta y viceversa.' },
              { icon: '🔄', title: 'Intercambio mutuo', desc: 'Priorizamos usuarios donde ambos se benefician del intercambio.' },
              { icon: '📍', title: 'Geolocalización', desc: 'Usuarios cercanos a vos usando GPS en tiempo real.' },
              { icon: '⭐', title: 'Reputación', desc: 'Rating y verificación para intercambios seguros.' },
              { icon: '💬', title: 'Chat en tiempo real', desc: 'Mensajería instantánea para coordinar el intercambio.' },
              { icon: '📊', title: 'Progreso visual', desc: 'Seguí tu avance con estadísticas detalladas del álbum.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', border: '1px solid var(--color-border-light)', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{f.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>🗣️ Lo que dicen nuestros usuarios</h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)' }}>Miles de personas ya completaron sus álbumes con FigusUy.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: '1.5rem' }}>
          {[
            { name: 'María', location: 'Pocitos', text: 'Excelente aplicación. Pude completar el álbum de la Copa América en solo dos semanas gracias a los matches cercanos.', avatar: 'M' },
            { name: 'Juan', location: 'Centro', text: 'Me encanta que el algoritmo te muestra exactamente quién necesita tus repetidas y tiene las que te faltan. 100% recomendado.', avatar: 'J' },
            { name: 'Pedro', location: 'Malvín', text: 'Muy fácil de usar. Cambié más de 100 figuritas en un fin de semana. El chat en vivo facilita mucho la coordinación.', avatar: 'P' },
          ].map(user => (
            <div key={user.name} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                  {user.avatar}
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{user.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📍 {user.location}</p>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{user.text}"</p>
              <div style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.875rem' }}>⭐⭐⭐⭐⭐</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING - DYNAMIC FROM DB */}
      <section id="pricing" style={{ padding: '5rem 1.5rem', maxWidth: '56rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>💎 Elegí tu plan</h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)' }}>Empezá gratis, desbloqueá todo cuando quieras.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* FREE PLAN */}
          <div onClick={() => setActivePlan('free')} style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: '2rem 1.5rem',
            border: activePlan === 'free' ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)',
            boxShadow: activePlan === 'free' ? '0 0 0 4px rgba(37,99,235,0.1)' : 'var(--shadow-sm)',
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.5rem' }}>🆓</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{freePlan?.name || 'Gratis'}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Para empezar</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>${freePlan?.price || 0}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>/mes</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { text: `Hasta ${freePlan?.limits?.max_matches || 3} matches/mes`, included: true },
                { text: `Matches a mínimo 500m`, included: true },
                { text: `Chat expira en 3 días`, included: true },
                { text: 'Matches a mínimo 100m', included: false },
                { text: 'Matches ilimitados', included: false },
                { text: 'Prioridad en ranking', included: false },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: item.included ? '#10b981' : '#cbd5e1', fontWeight: 700 }}>{item.included ? '✓' : '✗'}</span>
                  <span style={{ color: item.included ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')} style={{ width: '100%' }}>Empezar gratis</button>
          </div>

          {/* PREMIUM PLANS */}
          {premiumPlans.map(plan => {
            const isPro = plan.name.toLowerCase().includes('pro');
            const isPlus = plan.name.toLowerCase().includes('plus');
            return (
              <div key={plan.id} onClick={() => setActivePlan(plan.id)} style={{
                background: isPro ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: 'var(--radius-2xl)', padding: '2rem 1.5rem', 
                color: isPro ? 'white' : 'var(--color-text)',
                border: activePlan === plan.id ? '2px solid #a78bfa' : '2px solid transparent',
                boxShadow: isPro ? '0 20px 40px rgba(30,27,75,0.3)' : 'var(--shadow-sm)', 
                cursor: 'pointer', transition: 'all 0.3s ease',
                position: 'relative', overflow: 'hidden', 
                transform: activePlan === plan.id ? 'scale(1.02)' : '',
              }}>
                {isPro && <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.03em', color: 'white' }}>⭐ RECOMENDADO</div>}
                {isPro && <div style={{ position: 'absolute', right: '-3rem', top: '-3rem', width: '8rem', height: '8rem', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', pointerEvents: 'none' }} />}
                
                <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.5rem' }}>{isPro ? '🚀' : '💎'}</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.75 }}>{isPro ? 'Sin límites' : 'Mejores intercambios'}</p>
                </div>
                
                <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>${plan.price}</span>
                  <span style={{ fontSize: '0.875rem', opacity: 0.7, marginLeft: '0.25rem' }}>{intervalSuffix(plan.interval || 'monthly')}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                  {isPlus && [
                    'Chat ilimitado',
                    'Hasta 3 álbumes activos',
                    'Matches cercanos desde 250m',
                    'Alertas: 20+ figuritas faltantes',
                    'Ver quién necesita tus repetidas (+10)',
                    'Mayor visibilidad',
                  ].map(text => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#a78bfa', fontWeight: 700 }}>✓</span>
                      <span>{text}</span>
                    </div>
                  ))}
                  
                  {isPro && [
                    'Todo lo de Premium Plus',
                    'Álbumes y matches ilimitados',
                    'Búsqueda sin límite (todo Uruguay)',
                    'Alertas en tiempo real (cualquier fig)',
                    'Ver quién necesita tus repetidas (sin min)',
                    'Alta visibilidad + Badge ⭐',
                    'Sugerencias inteligentes',
                  ].map(text => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#a78bfa', fontWeight: 700 }}>✓</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-lg" onClick={() => navigate('/login')} style={{ width: '100%', background: isPro ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--color-primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: isPro ? '0 4px 16px rgba(245,158,11,0.4)' : 'none', position: 'relative', zIndex: 1 }}>⭐ Desbloquear {plan.name}</button>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Cancelá cuando quieras · Sin compromiso · Pago seguro</p>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white' }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏆</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>¿Listo para completar tu álbum?</h2>
          <p style={{ fontSize: '1.0625rem', opacity: 0.85, marginBottom: '2rem', lineHeight: 1.7 }}>Más de {users.toLocaleString()} usuarios ya están intercambiando figuritas en FigusUy. Unite hoy y encontrá las que te faltan.</p>
          <button className="btn btn-lg" onClick={() => navigate('/login')} style={{ padding: '1rem 2.5rem', fontSize: '1.0625rem', borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(245,158,11,0.35)', fontWeight: 700 }}>🚀 Crear cuenta gratis</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>F</div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>FigusUy</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>© 2026 FigusUy. Hecho con 💙 en Uruguay.</p>
        </div>
      </footer>
    </div>
  )
}
