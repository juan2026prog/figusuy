import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useThemeStore } from '../stores/themeStore'
import { useSEO } from '../hooks/useSEO'
import { useAuthStore } from '../stores/authStore'
import { useBrandingStore } from '../stores/brandingStore'
import BusinessApplyModal from '../components/BusinessApplyModal'
import BusinessInfoModal from '../components/BusinessInfoModal'
import AuthModal from '../components/AuthModal'
import GlobalFooter from '../components/GlobalFooter'

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

/* Sticker wall data for hero */
const WALL = [
  { num: '18', type: 'match', art: 'sa1', label: 'Match' },
  { num: '24', type: 'have',  art: 'sa2', label: 'Tengo' },
  { num: '45', type: 'missing', label: 'Falta' },
  { num: 'M3', type: 'dup',  art: 'sa4', label: 'Repet.' },
  { num: '10', type: 'have',  art: 'sa5', label: 'Tengo' },
  { num: '88', type: 'missing', label: 'Falta' },
  { num: '101',type: 'match', art: 'sa7', label: 'Cerca' },
  { num: '122',type: 'have',  art: 'sa8', label: 'Tengo' },
  { num: '7',  type: 'dup',  art: 'sa9', label: 'Repet.' },
  { num: '16', type: 'missing', label: 'Falta' },
  { num: '31', type: 'have',  art: 'sa11',label: 'Tengo' },
  { num: 'M1', type: 'match', art: 'sa12',label: 'Match' },
]

/* Album preview data */
const HAVE = new Set([1,2,3,4,7,8,10,11,13,14,18,22,24,31,34,38])
const DUP  = new Set([4,10,22,31])
const MISS = new Set([5,6,9,12,15,16,17])

export default function Landing() {
  useSEO({
    title: 'Intercambio de Figuritas',
    description: 'La app #1 en Uruguay para intercambiar figuritas, completar álbumes y encontrar matches cercanos.'
  })

  const navigate = useNavigate()
  const { isDark, toggleTheme } = useThemeStore()
  const { profile } = useAuthStore()
  const settings = useBrandingStore(state => state.settings)
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState({ users: 0, albumsCount: 0 })
  const [albumList, setAlbumList] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authType, setAuthType] = useState(null)

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

  const previewCells = useMemo(() => {
    const cells = []
    for (let i = 1; i <= 48; i++) {
      let cls = ''
      if (DUP.has(i)) cls = 'pf-dup'
      else if (MISS.has(i)) cls = 'pf-miss'
      else if (HAVE.has(i)) cls = 'pf-have'
      cells.push({ num: i, cls, label: DUP.has(i) ? 'repet.' : MISS.has(i) ? 'falta' : HAVE.has(i) ? 'tengo' : '' })
    }
    return cells
  }, [])

  const openAuthModal = (type = null) => {
    setAuthType(type)
    setShowAuthModal(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ═══ NAVBAR ═══ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sports_soccer</span></div>
            FIGUS<span className="uy">UY</span>
          </div>
          <div className="landing-nav-links">
            {(settings.header_menu_items || []).map((item, idx) => (
              <a key={idx} href={item.link} className="landing-nav-link">{item.label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: '.9rem', display: 'flex', alignItems: 'center' }} aria-label="Cambiar tema">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="landing-nav-cta" onClick={() => openAuthModal()}>Entrar</button>
            <button className="landing-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú"><span className="material-symbols-outlined">menu</span></button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-menu-panel" onClick={e => e.stopPropagation()}>
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú"><span className="material-symbols-outlined">close</span></button>
          <div className="mobile-menu-links">
            {(settings.header_menu_items || []).map((item, idx) => (
              <a key={idx} href={item.link} className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
            ))}
            <button className="btn-main" style={{ width: '100%', marginTop: '1rem' }} onClick={() => openAuthModal()}>Crear cuenta</button>
          </div>
        </div>
      </div>

      <main>
        {/* ═══ HERO ═══ */}
        <section className="landing-hero">
          <div className="hero-left">
            <div className="landing-eyebrow">
              <div className="landing-dot" />
              <span>{stats.users > 0 ? `${users.toLocaleString()} coleccionistas activos` : 'Coleccionistas activos ahora'}</span>
            </div>

            <h1>
              Completá<br />
              <span className="orange">tu</span>
              álbum.
            </h1>

            <p className="hero-sub">
              Te faltan 12. A 600 metros hay 3 personas que las tienen. Cargá tu álbum, encontrá cruces reales y completalo sin perder semanas en grupos.
            </p>

            <div className="hero-actions">
              <button className="btn-main" onClick={() => openAuthModal()}>Empezar gratis</button>
              <a href="#album" className="btn-link-hero">Ver demo →</a>
            </div>

            <div className="quick-stats">
              <div className="quick-stat"><b>12</b><span>te faltan hoy</span></div>
              <div className="quick-stat"><b>{stats.albumsCount || '—'}</b><span>álbumes activos</span></div>
              <div className="quick-stat"><b>78%</b><span>completo</span></div>
            </div>
          </div>

          <div className="hero-right">
            <div className="sticker-wall">
              {WALL.map((s, i) => {
                const cls = s.type === 'match' ? 'cs-match' : s.type === 'dup' ? 'cs-dup' : s.type === 'missing' ? 'cs-missing' : ''
                return (
                  <div key={i} className={`card-sticker ${cls}`}>
                    {s.art && <div className={`sticker-art ${s.art}`} />}
                    <span className="sticker-num">{s.num}</span>
                    <span className="sticker-label">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══ ALBUM PREVIEW ═══ */}
        <section id="album" className="landing-section">
          <div className="landing-inner">
            <span className="landing-kicker">// álbum</span>
            <h2>Vé lo que tenés.<br />Encontrá lo que falta.</h2>
            <p className="landing-section-sub">Tu álbum deja de ser una lista. Pasa a ser un mapa visual de lo que necesitás para completarlo.</p>

            <div className="album-preview-box">
              <div className="album-preview-top">
                <h3>Mundial 2026 · Base</h3>
                <span>528 / 670 · 78% completo</span>
              </div>
              <div className="preview-grid">
                {previewCells.map(c => (
                  <div key={c.num} className={`pf ${c.cls}`}>
                    <b>{c.num}</b>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="benefits-grid">
              <div className="benefit-card benefit-main">
                <h3>Completá más rápido</h3>
                <p>Entrás y ves quién tiene justo lo que te falta. Menos vueltas, más figuritas.</p>
              </div>
              <div className="benefit-card">
                <h3>Intercambiá más cerca</h3>
                <p>Priorizamos cruces útiles y cercanos, no listas infinitas sin sentido.</p>
              </div>
              <div className="benefit-card">
                <h3>Perdé menos tiempo</h3>
                <p>El sistema te muestra oportunidades reales, no conversaciones eternas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CÓMO FUNCIONA ═══ */}
        <section id="como" className="landing-section">
          <div className="landing-inner">
            <span className="landing-kicker">// cómo funciona</span>
            <h2>Completá tu álbum<br />en 3 pasos.</h2>
            <p className="landing-section-sub">Sin grupos desordenados, sin perder tiempo, sin escribir mil mensajes.</p>

            <div className="benefits-grid" style={{ marginTop: 36 }}>
              <div className="benefit-card">
                <h3><span className="material-symbols-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: 6 }}>menu_book</span> Elegí tu álbum</h3>
                <p>Seleccioná el álbum activo: Mundial, Pokémon, anime, fútbol o la colección que estés completando.</p>
              </div>
              <div className="benefit-card">
                <h3><span className="material-symbols-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: 6 }}>swap_horiz</span> Cargá tus repetidas</h3>
                <p>Agregá tus faltantes y repetidas con una grilla simple o carga rápida por números.</p>
              </div>
              <div className="benefit-card">
                <h3><span className="material-symbols-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: 6 }}>location_on</span> Encontrá intercambios</h3>
                <p>Te mostramos personas cercanas con cambios reales: quién tiene lo tuyo y quién necesita lo tuyo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PROBLEMA / SOLUCIÓN ═══ */}
        <section className="landing-section">
          <div className="landing-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            <div>
              <span className="landing-kicker">// el problema</span>
              <h2 style={{ marginBottom: '1.5rem' }}>Dejá de buscar en grupos eternos</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>FigusUY transforma el caos de WhatsApp en oportunidades claras para cambiar más rápido.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {['Mensajes perdidos en grupos enormes.', 'No sabés quién vive cerca.', 'No sabés si tenés algo que le sirva al otro.'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '1.25rem' }}>close</span>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { icon: 'swap_horiz', title: 'Intercambios reales', desc: 'Solo ves oportunidades útiles para tu álbum.' },
                { icon: 'near_me', title: 'Cerca tuyo', desc: 'La app prioriza personas cercanas sin mostrar ubicación exacta.' },
                { icon: 'handshake', title: 'Intercambio mutuo', desc: 'Ambos tienen algo que el otro necesita.' },
              ].map(s => (
                <div key={s.title} style={{ padding: '1rem', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>
                  <p style={{ fontWeight: 900, color: 'var(--color-success)', marginBottom: '.25rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '.04em', display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{s.icon}</span> {s.title}</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '.9rem' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MATCHES PREVIEW ═══ */}
        <section className="landing-section">
          <div className="landing-inner">
            <span className="landing-kicker">// intercambios</span>
            <h2>Intercambios que dan ganas de contactar</h2>
            <p className="landing-section-sub">Cada tarjeta muestra el valor real del intercambio: qué tiene para vos, qué necesita de vos y qué tan cerca está.</p>

            <div className="benefits-grid" style={{ marginTop: 36 }}>
              {/* Match 1 */}
              <div className="benefit-card" style={{ borderTop: '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: '.75rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>local_fire_department</span> Mutuo</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '.8rem' }}>250m</span>
                </div>
                <h3>Sofía</h3>
                <p style={{ marginTop: 4, marginBottom: 12 }}>Compatibilidad alta</p>
                <div className="match-label-box match-give"><b>Te da:</b> 7, 18, M2</div>
                <div className="match-label-box match-take"><b>Le das:</b> 10, 22</div>
                <button className="btn-main" style={{ width: '100%', marginTop: '1rem' }} onClick={() => openAuthModal()}>Contactar</button>
              </div>

              {/* Match 2 */}
              <div className="benefit-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: '.75rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span> Cercano</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '.8rem' }}>420m</span>
                </div>
                <h3>Diego</h3>
                <p style={{ marginTop: 4, marginBottom: 12 }}>Tiene una que te falta</p>
                <div className="match-label-box match-give"><b>Te da:</b> 45</div>
                <div className="match-label-box match-neutral"><b>Le das:</b> sin coincidencias</div>
                <button className="plan-btn" style={{ marginTop: '1rem' }} onClick={() => openAuthModal()}>Ver perfil</button>
              </div>

              {/* Match 3 — Locked */}
              <div className="benefit-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(3px)', background: 'rgba(11,11,11,.55)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem' }}>
                  <div>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '.5rem', color: '#fff' }}>lock</span>
                    <h3 style={{ color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase' }}>Hay más intercambios</h3>
                    <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.85rem', margin: '.5rem 0 1rem' }}>Desbloqueá más intercambios con Premium.</p>
                    <button className="btn-main" onClick={() => openAuthModal()}>Ver Premium</button>
                  </div>
                </div>
                <div style={{ opacity: 0.3 }}>
                  <h3>Usuario oculto</h3>
                  <div style={{ height: '3rem', background: 'var(--color-surface-hover)', marginTop: '1rem', marginBottom: '.5rem' }} />
                  <div style={{ height: '3rem', background: 'var(--color-surface-hover)' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BUSINESS CTA ═══ */}
        {(!profile || profile.business_status !== 'approved') && (
          <section className="landing-section">
            <div className="landing-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <span className="landing-kicker">// negocios</span>
                <h2 style={{ marginBottom: '1rem' }}>¿Tenés un local o espacio con movimiento?</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                  Sumate a FigusUY como punto aliado y aparecé cuando alguien busque dónde intercambiar o comprar figuritas cerca.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '2rem' }}>
                  {['Más visibilidad local', 'Nuevos clientes cerca', 'Presencia en mapa y resultados'].map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>check_circle</span>
                      <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{b}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-main" onClick={() => setShowApplyModal(true)}>Quiero aparecer</button>
                  <button className="btn-link-hero" onClick={() => setShowInfoModal(true)}>Ver cómo funciona</button>
                </div>
              </div>
              <div style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16/9' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--color-text-muted)' }}>storefront</span>
              </div>
            </div>
          </section>
        )}

        {/* ═══ PLANES ═══ */}
        <section id="planes" className="landing-section">
          <div className="landing-inner">
            <span className="landing-kicker">// planes</span>
            <h2>Coleccioná mejor.<br />Cuando quieras.</h2>
            <p className="landing-section-sub">No pagás por funciones. Pagás por completar más rápido.</p>

            <div className="plans-grid">
              {/* Free */}
              <article className="plan-card">
                <div className="plan-name-label">Gratis</div>
                <div className="plan-price">$0</div>
                <ul>
                  <li>1 álbum activo</li>
                  <li>Hasta {freePlan?.limits?.max_matches || 3} cruces por mes</li>
                  <li>Chat por 3 días</li>
                  <li>Búsqueda por barrio</li>
                </ul>
                <button className="plan-btn" onClick={() => openAuthModal()}>Empezar gratis</button>
              </article>

              {/* Premium Plans from DB */}
              {premiumPlans.map(plan => {
                const isPro = plan.name.toLowerCase().includes('pro')
                const isPlus = plan.name.toLowerCase().includes('plus')
                const isFeatured = isPlus
                return (
                  <article key={plan.id} className={`plan-card ${isFeatured ? 'plan-featured' : ''}`}>
                    <div className="plan-name-label">{plan.name}</div>
                    <div className="plan-price">${plan.price}</div>
                    <ul>
                      {(isPlus ? [
                        'Hasta 3 álbumes activos', 'Más cruces útiles', 'Alertas cuando aparece la que falta',
                      ] : isPro ? [
                        'Álbumes ilimitados', 'Prioridad en cruces', 'Todo más rápido',
                      ] : []).map(t => <li key={t}>{t}</li>)}
                    </ul>
                    <button className="plan-btn" onClick={() => openAuthModal()}>
                      {isFeatured ? 'Probar 7 días' : 'Elegir plan'}
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══ SAFETY ═══ */}
        <section className="landing-section">
          <div className="landing-inner">
            <div className="landing-safety">
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>Intercambios más seguros</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '.5rem', fontSize: '.9rem' }}>Recomendamos coordinar en lugares públicos. Si sos menor, usá la app acompañado por un adulto responsable.</p>
              </div>
              <button className="plan-btn" style={{ width: 'auto' }}>Ver guía de seguridad</button>
            </div>
          </div>
        </section>

        {/* ═══ CTA FINAL ═══ */}
        <section className="landing-section">
          <div className="landing-inner">
            <div className="landing-cta-final">
              <h2 style={{ marginBottom: '1rem' }}>Tu próxima figurita puede estar a pocas cuadras</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Creá tu cuenta gratis y encontrá tus primeros intercambios.</p>
              <button className="btn-main" onClick={() => openAuthModal()}>Empezar ahora</button>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <GlobalFooter />

      <BusinessApplyModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} />
      <BusinessInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialType={authType} />
    </div>
  )
}
