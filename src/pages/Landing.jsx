import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useThemeStore } from '../stores/themeStore'
import { useSEO } from '../hooks/useSEO'

function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) return
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
  useSEO({
    title: 'Intercambio de Figuritas',
    description: 'La app #1 en Uruguay para intercambiar figuritas, completar álbumes y encontrar matches cercanos.'
  })

  const navigate = useNavigate()
  const { isDark, toggleTheme } = useThemeStore()
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState({ users: 0, albumsCount: 0 })
  const [albumList, setAlbumList] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [plansRes, usersRes, albumsRes] = await Promise.all([
        supabase.from('premium_plans').select('*').eq('is_active', true).order('price'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('albums').select('id, name, cover_url').eq('is_active', true),
      ])
      if (plansRes.data) setPlans(plansRes.data)
      if (albumsRes.data) setAlbumList(albumsRes.data)
      setStats({ users: usersRes.count || 0, albumsCount: albumsRes.data?.length || 0 })
    }
    load()
  }, [])

  const freePlan = plans.find(p => p.price === 0)
  const premiumPlans = plans.filter(p => p.price > 0).sort((a, b) => a.price - b.price)
  const users = useCounter(stats.users)
  const intervalSuffix = (i) => i === 'monthly' ? '/mes' : i === 'quarterly' ? '/trim' : i === 'yearly' ? '/año' : ''

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* HEADER — Boceto style: sticky, backdrop-blur, border-bottom */}
      <header className="landing-nav glass">
        <div className="landing-nav-inner">
          <div className="flex-center gap-sm">
            <div className="logo-icon" style={{ background: 'var(--color-brand-600)', borderRadius: 'var(--radius-2xl)' }}>F</div>
            <span className="font-extrabold text-xl tracking-tight">FigusUY</span>
          </div>
          <div className="landing-nav-links">
            <a href="#como-funciona" className="landing-nav-link">Cómo funciona</a>
            <a href="#matches" className="landing-nav-link">Intercambios</a>
            <a href="#premium" className="landing-nav-link">Premium</a>
          </div>
          <div className="flex-center gap-sm">
            <button onClick={toggleTheme} className="btn btn-ghost btn-sm" aria-label="Cambiar tema"
              style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: '0.5rem 0.75rem' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-ghost btn-sm hidden-mobile" onClick={() => navigate('/login')}>Entrar</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}
              style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-brand)' }}>
              Crear cuenta
            </button>
            <button className="landing-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">☰</button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-panel" onClick={e => e.stopPropagation()}>
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">✕</button>
          <div className="mobile-menu-links">
            <a href="#como-funciona" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Cómo funciona</a>
            <a href="#matches" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Intercambios</a>
            <a href="#premium" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Premium</a>
            <button className="btn btn-primary w-full mt-lg" onClick={() => navigate('/login')}>Crear cuenta</button>
          </div>
        </div>
      </div>

      {/* HERO — Boceto style: 2-col grid, gradient bg, app mockup */}
      <section className="landing-hero" style={{ textAlign: 'left', padding: '4rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div className="animate-fade-in card" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-600)', marginBottom: '1.5rem' }}>
              🔥 La forma más rápida de completar tu álbum
            </div>

            <h1 className="animate-fade-in-up" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Encontrá cerca quién tiene la <span style={{ color: 'var(--color-brand-600)' }}>figurita que te falta</span>
            </h1>

            <p className="animate-fade-in-up text-lg" style={{ color: 'var(--color-text-secondary)', maxWidth: '36rem', marginBottom: '2rem', animationDelay: '0.1s' }}>
              Cargá tus faltantes, agregá tus repetidas y descubrí intercambios reales en Uruguay.
            </p>

            <div className="animate-fade-in-up flex-center gap-md flex-wrap" style={{ justifyContent: 'flex-start', animationDelay: '0.2s' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}
                style={{ borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-brand)', padding: '1rem 2rem' }}>
                Buscar figuritas cerca
              </button>
              <a href="#como-funciona" className="btn btn-secondary btn-lg" style={{ borderRadius: 'var(--radius-2xl)', padding: '1rem 2rem', textDecoration: 'none' }}>
                Ver cómo funciona
              </a>
            </div>

            <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '28rem', marginTop: '2.5rem', animationDelay: '0.3s' }}>
              <div>
                <p className="font-extrabold text-2xl tracking-tight">+{stats.users > 0 ? users.toLocaleString() : '—'}</p>
                <p className="text-sm text-muted">usuarios</p>
              </div>
              <div>
                <p className="font-extrabold text-2xl tracking-tight">+{stats.albumsCount || '—'}</p>
                <p className="text-sm text-muted">álbumes</p>
              </div>
              <div>
                <p className="font-extrabold text-2xl tracking-tight">UY</p>
                <p className="text-sm text-muted">cerca tuyo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — Boceto: 3 cards in a row */}
      <section id="como-funciona" className="landing-section">
        <div className="text-center mb-3xl" style={{ maxWidth: '40rem', margin: '0 auto 3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>Completá tu álbum en 3 pasos</h2>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Sin grupos desordenados, sin perder tiempo, sin escribir mil mensajes.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '📚', title: 'Elegí tu álbum', desc: 'Seleccioná el álbum activo: Mundial, Pokémon, anime, fútbol o la colección que estés completando.', color: 'var(--color-brand-100)' },
            { icon: '🔁', title: 'Cargá tus repetidas', desc: 'Agregá tus faltantes y repetidas con una grilla simple o carga rápida por números.', color: 'var(--color-success-bg)' },
            { icon: '📍', title: 'Encontrá intercambios', desc: 'Te mostramos personas cercanas con cambios reales: quién tiene lo tuyo y quién necesita lo tuyo.', color: 'var(--color-brand-100)' },
          ].map(item => (
            <div key={item.title} className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-3xl)' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-2xl)', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM / SOLUTION — Boceto: 2 columns */}
      <section className="landing-section-bg">
        <div className="landing-section-inner" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>Dejá de buscar en grupos eternos</h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>FigusUY transforma el caos de WhatsApp en oportunidades claras para cambiar más rápido.</p>
            <div className="flex-col gap-md">
              {['Mensajes perdidos en grupos enormes.', 'No sabés quién vive cerca.', 'No sabés si tenés algo que le sirva al otro.'].map(t => (
                <div key={t} className="flex-center gap-md" style={{ justifyContent: 'flex-start' }}>
                  <span style={{ color: '#ef4444', fontSize: '1.25rem' }}>✕</span>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-3xl)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="flex-col gap-md">
              {[
                { title: '✓ Intercambios reales', desc: 'Solo ves oportunidades útiles para tu álbum.' },
                { title: '✓ Cerca tuyo', desc: 'La app prioriza personas cercanas sin mostrar ubicación exacta.' },
                { title: '✓ Intercambio mutuo', desc: 'Ambos tienen algo que el otro necesita.' },
              ].map(s => (
                <div key={s.title} className="card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-3xl)' }}>
                  <p style={{ fontWeight: 900, color: 'var(--color-success)', marginBottom: '0.25rem' }}>{s.title}</p>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MATCHES PREVIEW — Boceto: 3 match cards, 3rd one locked */}
      <section id="matches" className="landing-section">
        <div style={{ maxWidth: '40rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>Intercambios que dan ganas de contactar</h2>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Cada tarjeta muestra el valor real del intercambio: qué tiene para vos, qué necesita de vos y qué tan cerca está.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.5rem' }}>
          {/* Match 1 */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-3xl)' }}>
            <div className="flex-between mb-md">
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', fontSize: '0.75rem', fontWeight: 900 }}>🔥 Mutuo</span>
              <span className="text-sm text-muted">250m</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Sofía</h3>
            <p className="text-sm text-muted mb-lg">Compatibilidad alta</p>
            <div className="flex-col gap-sm">
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-2xl)', background: 'var(--color-brand-50)' }}><b>Te da:</b> 7, 18, M2</div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-2xl)', background: 'var(--color-success-bg)' }}><b>Le das:</b> 10, 22</div>
            </div>
            <button className="btn btn-primary w-full mt-lg" style={{ borderRadius: 'var(--radius-2xl)' }} onClick={() => navigate('/login')}>Contactar</button>
          </div>

          {/* Match 2 */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-3xl)' }}>
            <div className="flex-between mb-md">
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', fontSize: '0.75rem', fontWeight: 900 }}>📍 Cercano</span>
              <span className="text-sm text-muted">420m</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Diego</h3>
            <p className="text-sm text-muted mb-lg">Tiene una que te falta</p>
            <div className="flex-col gap-sm">
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-2xl)', background: 'var(--color-brand-50)' }}><b>Te da:</b> 45</div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-2xl)', background: 'var(--color-surface-hover)' }}><b>Le das:</b> sin coincidencias</div>
            </div>
            <button className="btn btn-accent w-full mt-lg" style={{ borderRadius: 'var(--radius-2xl)' }} onClick={() => navigate('/login')}>Ver perfil</button>
          </div>

          {/* Match 3 — Locked/Premium */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-3xl)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(2px)', background: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</p>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem' }}>Hay más intercambios</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Desbloqueá más intercambios con Premium.</p>
                <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-2xl)' }} onClick={() => navigate('/login')}>Ver Premium</button>
              </div>
            </div>
            <div style={{ opacity: 0.4 }}>
              <div className="flex-between mb-md">
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', fontSize: '0.75rem', fontWeight: 900 }}>🔥 Mutuo</span>
                <span>900m</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Usuario oculto</h3>
              <div className="flex-col gap-sm mt-lg">
                <div style={{ height: '3rem', borderRadius: 'var(--radius-2xl)', background: 'var(--color-surface-hover)' }} />
                <div style={{ height: '3rem', borderRadius: 'var(--radius-2xl)', background: 'var(--color-surface-hover)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM — Boceto: 3-col pricing */}
      <section id="premium" className="landing-section-bg">
        <div className="landing-section-inner">
          <div className="text-center mb-3xl" style={{ maxWidth: '40rem', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>Completá tu álbum más rápido</h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>Planes simples para encontrar mejores intercambios, sin prometer posiciones falsas.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.5rem' }}>
            {/* Free */}
            <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-3xl)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Gratis</h3>
              <p style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.75rem' }}>$0 <span className="text-sm text-muted" style={{ fontWeight: 500 }}>/mes</span></p>
              <ul className="flex-col gap-sm mt-xl" style={{ listStyle: 'none', color: 'var(--color-text-secondary)' }}>
                <li>✓ 1 álbum activo</li>
                <li>✓ {freePlan?.limits?.max_matches || 3} intercambios mensuales</li>
                <li>✓ Chat por 3 días</li>
                <li>✓ Intercambios desde 500m</li>
              </ul>
            </div>

            {/* Premium Plans from DB */}
            {premiumPlans.map(plan => {
              const isPro = plan.name.toLowerCase().includes('pro')
              const isPlus = plan.name.toLowerCase().includes('plus')
              const isRecommended = isPlus
              return (
                <div key={plan.id} className="card" style={{
                  padding: '1.75rem', borderRadius: 'var(--radius-3xl)', position: 'relative',
                  border: isRecommended ? '2px solid var(--color-brand-600)' : undefined,
                  boxShadow: isRecommended ? 'var(--shadow-xl)' : undefined,
                }}>
                  {isRecommended && (
                    <span style={{ position: 'absolute', top: '-1rem', left: '1.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', background: 'var(--color-brand-600)', color: 'white', fontSize: '0.75rem', fontWeight: 900 }}>RECOMENDADO</span>
                  )}
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{plan.name}</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.75rem' }}>${plan.price} <span className="text-sm text-muted" style={{ fontWeight: 500 }}>{intervalSuffix(plan.interval || 'monthly')}</span></p>
                  <ul className="flex-col gap-sm mt-xl" style={{ listStyle: 'none', color: 'var(--color-text-secondary)' }}>
                    {(isPlus ? [
                      'Hasta 3 álbumes activos', '10 intercambios mensuales', 'Chat ilimitado', 'Alertas de intercambios', 'Mayor visibilidad relevante',
                    ] : isPro ? [
                      'Álbumes ilimitados', 'Intercambios ilimitados', 'Búsqueda todo Uruguay', 'Alertas completas', 'Perfil destacado',
                    ] : []).map(text => (
                      <li key={text}>✓ {text}</li>
                    ))}
                  </ul>
                  {isRecommended && (
                    <button className="btn btn-primary w-full mt-xl" onClick={() => navigate('/login')}
                      style={{ borderRadius: 'var(--radius-2xl)', padding: '1rem' }}>
                      Elegir {plan.name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section className="landing-section">
        <div style={{ borderRadius: 'var(--radius-3xl)', background: 'var(--color-brand-50)', border: '1px solid var(--color-brand-100)', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Intercambios más seguros</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Recomendamos coordinar en lugares públicos. Si sos menor, usá la app acompañado por un adulto responsable.</p>
          </div>
          <button className="btn btn-secondary" style={{ borderRadius: 'var(--radius-2xl)' }}>Ver guía de seguridad</button>
        </div>
      </section>

      {/* CTA FINAL — Boceto: dark/light inverted card */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div className="text-center" style={{
          maxWidth: '56rem', margin: '0 auto', borderRadius: 'var(--radius-3xl)',
          background: isDark ? 'white' : '#1c1917', color: isDark ? '#1c1917' : 'white',
          padding: 'clamp(2.5rem, 5vw, 4rem)',
        }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>Tu próxima figurita puede estar a pocas cuadras</h2>
          <p className="text-lg" style={{ marginTop: '1.25rem', opacity: 0.7 }}>Creá tu cuenta gratis y encontrá tus primeros intercambios.</p>
          <button className="btn btn-primary btn-lg mt-xl" onClick={() => navigate('/login')}
            style={{ borderRadius: 'var(--radius-2xl)' }}>
            Empezar ahora
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem 0' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          <p>© 2026 FigusUY. Uruguay.</p>
          <div className="flex-center gap-lg">
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Seguridad</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
