import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAnchorId, resolveUrl } from '../../lib/landingBuilder'

export default function LandingRenderer({
  blocks = [],
  device = 'desktop',
  preview = false,
  onCta,
  onBlockVisible,
}) {
  const isMobile = device === 'mobile'

  return (
    <div className={`fy-landing ${isMobile ? 'is-mobile' : ''}`}>
      {blocks.map((block) => (
        <TrackedBlock
          key={block.id || block.slug}
          block={block}
          preview={preview}
          onBlockVisible={onBlockVisible}
        >
          <BlockRenderer block={block} preview={preview} onCta={onCta} />
        </TrackedBlock>
      ))}
    </div>
  )
}

function TrackedBlock({ block, children, preview, onBlockVisible }) {
  const ref = useRef(null)
  const fired = useRef(false)

  useEffect(() => {
    if (preview || !onBlockVisible || !ref.current) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true
            onBlockVisible(block)
          }
        })
      },
      { threshold: 0.35 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [block, onBlockVisible, preview])

  const isNavbar = block.block_type === 'navbar'
  return (
    <section 
      ref={ref} 
      id={getAnchorId(block)} 
      className={`fy-block fy-block-${block.block_type}`}
    >
      {children}
    </section>
  )
}

function BlockRenderer({ block, preview, onCta }) {
  const content = block.content || {}

  switch (block.block_type) {
    case 'navbar':
      return <NavbarBlock block={block} content={content} preview={preview} onCta={onCta} />
    case 'hero':
      return <HeroBlock block={block} content={content} onCta={onCta} />
    case 'now':
      return <NowBlock block={block} content={content} onCta={onCta} />
    case 'albums':
      return <AlbumsBlock block={block} content={content} />
    case 'exchange_points':
      return <PromoBlock block={block} content={content} onCta={onCta} />
    case 'how_it_works':
      return <HowItWorksBlock content={content} />
    case 'influencers':
      return <InfluencersBlock block={block} content={content} onCta={onCta} />
    case 'gamification':
      return <GamificationBlock content={content} />
    case 'user_plans':
    case 'business_plans':
      return <PlansBlock block={block} content={content} onCta={onCta} />
    case 'final_cta':
      return <FinalCtaBlock block={block} content={content} onCta={onCta} />
    case 'influencer_program_hero':
      return <InfluencerProgramHeroBlock block={block} content={content} onCta={onCta} />
    case 'influencer_program_pillars':
      return <InfluencerProgramPillarsBlock content={content} />
    case 'influencer_program_tiers':
      return <InfluencerProgramTiersBlock content={content} />
    case 'influencer_program_steps':
      return <InfluencerProgramStepsBlock content={content} />
    case 'influencer_program_cta':
      return <InfluencerProgramCtaBlock block={block} content={content} onCta={onCta} />
    case 'faq':
      return <FAQBlock content={content} />
    case 'footer':
      return <FooterBlock block={block} content={content} onCta={onCta} />
    default:
      return null
  }
}

function NavbarBlock({ block, content, preview, onCta }) {
  const [open, setOpen] = useState(false)
  const links = toItems(content.links)
  const navigate = useNavigate()
  
  const handleLinkClick = (e, url) => {
    if (url.startsWith('#') || url.includes('/#')) {
      e.preventDefault()
      const hash = url.includes('/#') ? url.split('/#')[1] : url.slice(1)
      if (window.location.pathname === '/' || url.startsWith('#')) {
        const target = document.getElementById(hash)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
          setOpen(false)
          return
        }
      }
      navigate({ pathname: '/', hash: `#${hash}` })
      return
    }
    
    if (url.startsWith('/') && !url.startsWith('//')) {
      e.preventDefault()
      navigate(url)
      setOpen(false)
    }
  }

  return (
    <header className="fy-navbar-shell" style={{ position: content.sticky ? 'sticky' : 'relative', top: 0, zIndex: 1000 }}>
      <div className="fy-shell fy-navbar">
        <Link to="/" className="fy-logo" onClick={() => setOpen(false)}>
          {content.logoUrl ? <img src={content.logoUrl} alt={content.logoText || 'FigusUY'} /> : null}
          <span>{content.logoText || 'FIGUS'}</span>
          <strong>{content.logoAccent || 'UY'}</strong>
        </Link>
        <nav className="fy-navbar-links">
          {links.map((link) => (
            <a 
              key={`${block.slug}-${link.label}`} 
              href={resolveUrl(link.url)}
              onClick={(e) => handleLinkClick(e, link.url)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="fy-navbar-actions">
          <CtaButton block={block} cta={content.cta} onCta={onCta} />
          <button type="button" className="fy-menu-btn" onClick={() => setOpen((value) => !value)}>
            <span className="material-symbols-outlined">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="fy-mobile-drawer">
          {links.map((link) => (
            <a 
              key={`mobile-${link.label}`} 
              href={resolveUrl(link.url)} 
              onClick={(e) => handleLinkClick(e, link.url)}
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  )
}

function HeroBlock({ block, content, onCta }) {
  const stats = toItems(content.stats)
  const chips = toItems(content.chips)
  const feedItems = toItems(content.feedItems)
  const wallItems = toItems(content.wallItems)
  const title = String(content.title || '')
  const highlight = String(content.highlightWord || '').trim()
  const highlightedTitle = highlight
    ? title.replace(highlight, `__MARK__${highlight}__MARK__`)
    : title

  return (
    <div className="fy-shell fy-hero">
      <div className="fy-hero-copy">
        <div className="fy-pill fy-live-pill">
          <span className="fy-dot" />
          {content.eyebrow}
        </div>
        <h1 className={`fy-fit-title ${getTextFitClass(content.title, 'hero-title')}`}>
          {highlightedTitle.split('__MARK__').map((part, index) => (
            index % 2 === 1 ? <span key={`${part}-${index}`}>{part}</span> : part
          ))}
        </h1>
        <p className={`fy-copy-lg ${getTextFitClass(content.subtitle, 'hero-copy')}`}>{content.subtitle}</p>
        <div className="fy-actions">
          <CtaButton block={block} cta={content.primaryCta} onCta={onCta} />
          <CtaButton block={block} cta={content.secondaryCta} onCta={onCta} />
        </div>
        <div className="fy-stat-row">
          {stats.map((item) => (
            <article key={`${block.slug}-${item.label}`} className="fy-stat-card">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="fy-hero-side">
        <div className="fy-live-card">
          <div className="fy-kicker">/ ahora en figusuy</div>
          <h3>{content.feedTitle}</h3>
          <p>{content.feedSubtitle}</p>
          <div className="fy-chip-row">
            {chips.map((chip, index) => (
              <Chip key={`${chip.label}-${index}`} chip={chip} />
            ))}
          </div>
          <div className="fy-feed">
            {feedItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className={`fy-feed-item tone-${item.tone || 'neutral'}`}>
                <div>
                  <b>{item.title}</b>
                  <p>{item.detail}</p>
                </div>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fy-wall">
          {wallItems.map((item, index) => (
            <article key={`${item.number}-${index}`} className={`fy-wall-card tone-${item.tone || 'neutral'}`}>
              <strong>{item.number}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function NowBlock({ block, content, onCta }) {
  const chips = toItems(content.chips)
  const liveItems = toItems(content.liveItems)
  const cards = toItems(content.cards)
  const activityItems = toItems(content.activityItems)
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-chip-row">
        {chips.map((chip, index) => (
          <Chip key={`${chip.label}-${index}`} chip={chip} />
        ))}
      </div>
      <div className="fy-now-grid">
        <div className="fy-panel fy-panel-glow">
          <div className="fy-feed">
            {liveItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className={`fy-feed-item tone-${item.tone || 'neutral'}`}>
                <div>
                  <b>{item.title}</b>
                  <p>{item.detail}</p>
                </div>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fy-stack">
          {cards.map((card, index) => (
            <article key={`${card.title}-${index}`} className="fy-panel fy-mini-card">
              <div className="fy-mini-top">
                <Chip chip={{ label: card.badge, tone: card.tone }} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="fy-activity-strip">
        {activityItems.map((item, index) => (
          <div key={`${item.title}-${index}`} className={`fy-activity-item tone-${item.tone || 'neutral'}`}>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            <span>{item.time}</span>
          </div>
        ))}
      </div>
      <div className="fy-actions">
        <CtaButton block={block} cta={content.cta} onCta={onCta} />
      </div>
    </div>
  )
}

function AlbumsBlock({ content }) {
  const items = toItems(content.items)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!content.autoplay || items.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % items.length)
    }, Number(content.autoplayMs || 4000))
    return () => window.clearInterval(timer)
  }, [content.autoplay, content.autoplayMs, items.length])

  const current = items[active] || items[0]

  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-carousel">
        <div className="fy-carousel-main" style={{ backgroundImage: `url(${current?.image || ''})` }}>
          <div className="fy-overlay" />
          <div className="fy-carousel-copy">
            <Chip chip={{ label: current?.badge, tone: current?.highlight ? 'orange' : 'blue' }} />
            <h3>{current?.title}</h3>
            <p>{current?.activityLabel}</p>
          </div>
        </div>
        <div className="fy-carousel-rail">
          {items.map((item, index) => (
            <button
              key={`${item.title}-${index}`}
              type="button"
              className={`fy-cover-card ${index === active ? 'is-active' : ''}`}
              onClick={() => setActive(index)}
            >
              <div className="fy-cover-image" style={{ backgroundImage: `url(${item.image || ''})` }} />
              <div className="fy-cover-meta">
                <strong>{item.title}</strong>
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PromoBlock({ block, content, onCta }) {
  const chips = toItems(content.chips)
  return (
    <div className="fy-shell fy-section">
      <div className="fy-promo" style={{ '--promo-bg': content.background || '#111111' }}>
        <div className="fy-promo-copy">
          <div className="fy-kicker">{content.kicker}</div>
          <h2 className={`fy-fit-title ${getTextFitClass(content.title, 'section-title')}`}>{content.title}</h2>
          <p className={getTextFitClass(content.description, 'section-copy')}>{content.description}</p>
          <div className="fy-chip-row">
            {chips.map((chip, index) => (
              <Chip key={`${chip.label}-${index}`} chip={chip} />
            ))}
          </div>
          <div className="fy-actions">
            <CtaButton block={block} cta={content.cta} onCta={onCta} />
          </div>
        </div>
        <div className="fy-promo-media" style={{ backgroundImage: `url(${content.image || ''})` }} />
      </div>
    </div>
  )
}

function HowItWorksBlock({ content }) {
  const steps = toItems(content.steps)
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-card-grid fy-steps-grid">
        {steps.map((step, index) => (
          <article key={`${step.title}-${index}`} className="fy-editorial-card">
            <div className="fy-editorial-media" style={{ backgroundImage: `url(${step.image || ''})` }} />
            <div className="fy-editorial-copy">
              <span className="fy-step-index">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {step.ctaLabel ? <small>{step.ctaLabel}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function InfluencersBlock({ block, content, onCta }) {
  const chips = toItems(content.chips)
  const benefits = toItems(content.benefits)
  return (
    <div className="fy-shell fy-section">
      <div className="fy-split">
        <div className="fy-split-media" style={{ backgroundImage: `url(${content.image || ''})` }} />
        <div className="fy-split-copy fy-panel fy-panel-glow">
          <div className="fy-kicker">{content.kicker}</div>
          <h2 className={`fy-fit-title ${getTextFitClass(content.title, 'section-title')}`}>{content.title}</h2>
          <p className={getTextFitClass(content.description, 'section-copy')}>{content.description}</p>
          <div className="fy-chip-row">
            {chips.map((chip, index) => (
              <Chip key={`${chip.label}-${index}`} chip={chip} />
            ))}
          </div>
          <div className="fy-benefits">
            {benefits.map((item) => (
              <div key={item} className="fy-benefit-line">
                <span className="material-symbols-outlined">check_circle</span>
                {item}
              </div>
            ))}
          </div>
          <div className="fy-actions">
            <CtaButton block={block} cta={content.primaryCta} onCta={onCta} />
            <CtaButton block={block} cta={content.secondaryCta} onCta={onCta} />
          </div>
        </div>
      </div>
    </div>
  )
}

function GamificationBlock({ content }) {
  const cards = toItems(content.cards)
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-card-grid fy-quad-grid">
        {cards.map((card, index) => (
          <article key={`${card.title}-${index}`} className="fy-gamify-card">
            <div className="fy-editorial-media" style={{ backgroundImage: `url(${card.image || ''})` }} />
            <div className="fy-gamify-copy">
              <div className="fy-gamify-top">
                <span className="material-symbols-outlined">{card.icon || 'stars'}</span>
                <Chip chip={{ label: card.badge, tone: 'orange' }} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function PlansBlock({ block, content, onCta }) {
  const isUserPlans = block.block_type === 'user_plans'
  
  // Official plans for the landing page to replace outdated database content
  const officialUserPlans = [
    {
      name: 'Gratis',
      subtitle: 'Coleccioná a tu ritmo y encontrá tus matches. La experiencia completa, sin barreras.',
      price: '$0',
      priceMeta: 'siempre',
      icon: 'backpack',
      badge: 'Usar',
      benefits: ['Cargar figuritas sin límite', 'Ver todos tus matches', 'Chat ilimitado con matches', 'Completar tu álbum gratis'],
      cta: { label: 'Empezar Gratis', url: '/login' }
    },
    {
      name: 'Plus',
      subtitle: 'Acelerá tus cambios. Encontrá lo que buscás cerca tuyo, rápido y sin perder tiempo.',
      price: '2.49',
      currency: 'USD',
      priceMeta: 'â‰ˆ $99 UYU aprox.',
      icon: 'diamond',
      badge: 'Acelerador',
      highlight: true,
      benefits: ['Filtro de matches por distancia', 'Filtro por figurita específica', 'Doble check azul', 'Ver el estado "Última vez online"', 'Experiencia sin publicidad', 'Saber quién vio tu perfil', 'Badge Plus destacado'],
      cta: { label: 'Probar 7 días', url: '/premium' }
    },
    {
      name: 'Pro',
      subtitle: 'Dominá el intercambio. Prioridad máxima y alertas para las figuritas más difíciles.',
      price: '4.85',
      currency: 'USD',
      priceMeta: 'â‰ˆ $199 UYU aprox.',
      icon: 'rocket_launch',
      badge: 'Elite',
      benefits: ['Todo lo incluido en Plus', 'Alertas "Radar" instantáneas de escasez', 'Aparecés primero en los matches de otros', 'Modo Fantasma (invisible)', 'Múltiples álbumes con analíticas', 'Soporte VIP y Badge Coleccionista'],
      cta: { label: 'Elegir Pro', url: '/premium' }
    }
  ]

  const plans = isUserPlans ? officialUserPlans : toItems(content.plans)

  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="plans" style={{ marginTop: '32px' }}>
        {plans.map((plan, index) => (
          <article key={`${plan.name}-${index}`} className={`plan ${plan.highlight ? 'recommended' : ''}`}>
            {plan.highlight && plan.badge && <div className="plan-ribbon">{plan.badge}</div>}
            <div className="plan-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '1.85rem' }}>
                {plan.icon || 'stars'}
              </span>
            </div>
            <div className="plan-meta">
              <span className="plan-tag">{plan.badge || 'Plan'}</span>
            </div>
            <h3 className="plan-name">{plan.name}</h3>
            <p className="plan-concept">{plan.subtitle}</p>
            
            <div className="price" style={{ margin: '28px 0 22px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {plan.price === '$0' ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <b style={{ font: 'italic 900 3.2rem "Barlow Condensed"', lineHeight: '.8', color: '#fff' }}>$0</b>
                  <span style={{ color: 'rgba(255,255,255,0.36)', fontSize: '.82rem', fontWeight: '800', marginBottom: '4px' }}>SIEMPRE</span>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>{plan.currency || 'USD'}</span>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <b style={{ font: 'italic 900 3.8rem "Barlow Condensed"', lineHeight: '.75', color: '#fff' }}>{plan.price}</b>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.36)', fontWeight: '800', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                        {plan.priceMeta}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.36)', fontSize: '.72rem', fontWeight: '800', textTransform: 'uppercase' }}>/MES</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="features">
              {toItems(plan.benefits).map((benefit) => (
                <div key={benefit} className="feature">
                  <span className="check">âœ“</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <CtaButton 
                block={block} 
                cta={plan.cta} 
                onCta={onCta} 
                ctaId={`plan-${plan.name}`} 
                className={`btn ${plan.highlight ? 'orange' : 'secondary'} block`}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}


function FinalCtaBlock({ block, content, onCta }) {
  return (
    <div className="fy-shell fy-section">
      <div className="fy-final-cta" style={{ background: content.background || '#141414' }}>
        <div>
          <h2 className={`fy-fit-title ${getTextFitClass(content.title, 'section-title')}`}>{content.title}</h2>
          <p className={getTextFitClass(content.subtitle, 'section-copy')}>{content.subtitle}</p>
          <div className="fy-actions">
            <CtaButton block={block} cta={content.cta} onCta={onCta} />
          </div>
        </div>
        {content.image ? <div className="fy-final-media" style={{ backgroundImage: `url(${content.image})` }} /> : null}
      </div>
    </div>
  )
}

function InfluencerProgramHeroBlock({ block, content, onCta }) {
  const accent = String(content.accentWord || '').trim()
  const secondLine = String(content.titleLineTwo || '')
  const marked = accent ? secondLine.replace(accent, `__MARK__${accent}__MARK__`) : secondLine

  return (
    <div className="fy-program-hero">
      <div className="fy-shell fy-program-hero-content">
        <div className="fy-program-badge">{content.badge}</div>
        <h1 className={`fy-program-title ${getTextFitClass(`${content.titleLineOne} ${content.titleLineTwo}`, 'program-hero-title')}`}>
          <span>{content.titleLineOne}</span>
          <span>
            {marked.split('__MARK__').map((part, index) => (
              index % 2 === 1 ? <em key={`${part}-${index}`}>{part}</em> : part
            ))}
          </span>
        </h1>
        <p className={`fy-program-subtitle ${getTextFitClass(content.subtitle, 'program-hero-copy')}`}>{content.subtitle}</p>
        <div className="fy-actions fy-program-actions">
          <CtaButton block={block} cta={content.primaryCta} onCta={onCta} className="fy-btn fy-btn-primary fy-btn-program" />
          <CtaButton block={block} cta={content.secondaryCta} onCta={onCta} className="fy-btn fy-btn-ghost fy-btn-program-outline" />
        </div>
      </div>
    </div>
  )
}

function InfluencerProgramPillarsBlock({ content }) {
  const items = toItems(content.items)
  return (
    <div className="fy-program-section fy-program-pillars">
      <div className="fy-shell">
        <SectionHeading content={content} variant="program" />
        <div className="fy-program-pillar-grid">
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="fy-program-pillar-card">
              <span className="fy-program-pillar-tag">{item.tag}</span>
              <div className="fy-program-icon-box">
                <span className="material-symbols-outlined fy-program-icon">{item.icon || 'stars'}</span>
              </div>
              <h3 className={getTextFitClass(item.title, 'card-title')}>{item.title}</h3>
              <p className={getTextFitClass(item.description, 'card-copy')}>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfluencerProgramTiersBlock({ content }) {
  const items = toItems(content.items)
  return (
    <div className="fy-program-section fy-program-tiers">
      <div className="fy-shell">
        <SectionHeading content={content} variant="program" />
        <div className="fy-program-tier-grid">
          {items.map((item, index) => (
            <article key={`${item.name}-${index}`} className={`fy-program-tier-card ${item.isFeatured ? 'is-featured' : ''}`}>
              <div className={getTextFitClass(item.name, 'tier-title')}>{item.name}</div>
              <div className={`fy-program-tier-commission ${getTextFitClass(item.commissionLabel, 'card-copy')}`}>{item.commissionLabel}</div>
              <div className="fy-program-tier-benefits">
                {toItems(item.benefits).map((benefit) => (
                  <div key={benefit} className={`fy-program-tier-benefit ${getTextFitClass(benefit, 'card-copy')}`}>{benefit}</div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfluencerProgramStepsBlock({ content }) {
  const items = toItems(content.items)
  return (
    <div className="fy-program-section fy-program-steps">
      <div className="fy-shell fy-program-steps-shell">
        <SectionHeading content={content} variant="program" />
        <div className="fy-program-step-list">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="fy-program-step-item">
              <div className="fy-program-step-number">{item.number || `0${index + 1}`}</div>
              <div className="fy-program-step-copy">
                <h3 className={getTextFitClass(item.title, 'step-title')}>{item.title}</h3>
                <p className={getTextFitClass(item.description, 'section-copy')}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfluencerProgramCtaBlock({ block, content, onCta }) {
  return (
    <div className="fy-program-section fy-program-final">
      <div className="fy-shell fy-program-final-shell">
        <div className="fy-program-final-bg">{content.backgroundWord}</div>
        <div className="fy-program-final-content">
          <SectionHeading content={content} variant="program" />
          <div className="fy-actions fy-program-actions">
            <CtaButton block={block} cta={content.cta} onCta={onCta} className="fy-btn fy-btn-primary fy-btn-program" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQBlock({ content }) {
  const items = toItems(content.items)
  const [active, setActive] = useState(null)

  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-faq-grid">
        {items.map((item, index) => (
          <div 
            key={`${item.question}-${index}`} 
            className={`fy-faq-item ${active === index ? 'is-active' : ''}`}
            onClick={() => setActive(active === index ? null : index)}
          >
            <div className="fy-faq-q">
              <span>{item.question}</span>
              <span className="material-symbols-outlined">
                {active === index ? 'remove' : 'add'}
              </span>
            </div>
            <div className="fy-faq-a">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FooterBlock({ block, content, onCta }) {
  const social = toItems(content.social)
  const links = toItems(content.links)
  const navigate = useNavigate()

  const handleLinkClick = (e, url) => {
    if (url.startsWith('/') && !url.startsWith('//')) {
      e.preventDefault()
      navigate(url)
    }
  }

  return (
    <footer className="fy-footer-shell">
      <div className="fy-shell fy-footer">
        <div className="fy-footer-brand">
          <Link to="/" className="fy-logo">
            <span>{content.logoText || 'FIGUS'}</span>
            <strong>{content.logoAccent || 'UY'}</strong>
          </Link>
          <p className="fy-legal-text">{content.legal || 'Â© 2026 FigusUY'}</p>
        </div>
        <div className="fy-footer-links">
          {links.map((link) => (
            <a 
              key={`footer-${link.label}`} 
              href={resolveUrl(link.url)}
              onClick={(e) => handleLinkClick(e, link.url)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

function SectionHeading({ content, variant = 'default' }) {
  const variantClass = variant === 'program' ? 'is-program' : ''
  return (
    <>
      {content.kicker ? <div className="fy-kicker">{content.kicker}</div> : null}
      {content.title ? <h2 className={`${variantClass} fy-fit-title ${getTextFitClass(content.title, 'section-title')}`}>{content.title}</h2> : null}
      {content.subtitle ? <p className={`fy-section-copy ${variantClass} ${getTextFitClass(content.subtitle, 'section-copy')}`}>{content.subtitle}</p> : null}
    </>
  )
}

function CtaButton({ block, cta, onCta, ctaId, className }) {
  if (!cta?.label) return null
  const style = cta.style || 'primary'
  const baseClass = className || (style === 'primary' ? 'fy-btn fy-btn-primary' : style === 'secondary' ? 'fy-btn fy-btn-secondary' : 'fy-btn fy-btn-ghost')
  const finalClass = `${baseClass} ${getTextFitClass(cta.label, 'button-label')}`

  const handleClick = (event) => {
    if (!onCta) return
    event.preventDefault()
    onCta(block, cta, ctaId || cta.label)
  }

  return (
    <a href={resolveUrl(cta.url)} className={finalClass} onClick={handleClick}>
      {cta.label}
    </a>
  )
}


function Chip({ chip }) {
  return <span className={`fy-chip tone-${chip?.tone || 'neutral'}`}>{chip?.label}</span>
}

function toItems(value) {
  return Array.isArray(value) ? value : []
}

function getTextFitClass(value, preset = 'default') {
  const length = String(value || '').trim().length
  const thresholds = FIT_THRESHOLDS[preset] || FIT_THRESHOLDS.default
  if (length >= thresholds.long) return 'is-fit-long'
  if (length >= thresholds.medium) return 'is-fit-medium'
  return 'is-fit-short'
}

const FIT_THRESHOLDS = {
  default: { medium: 45, long: 80 },
  'hero-title': { medium: 22, long: 34 },
  'hero-copy': { medium: 100, long: 145 },
  'section-title': { medium: 28, long: 44 },
  'section-copy': { medium: 110, long: 160 },
  'button-label': { medium: 16, long: 22 },
  'program-hero-title': { medium: 24, long: 34 },
  'program-hero-copy': { medium: 100, long: 150 },
  'card-title': { medium: 18, long: 28 },
  'card-copy': { medium: 80, long: 130 },
  'tier-title': { medium: 12, long: 18 },
  'step-title': { medium: 14, long: 22 },
}
