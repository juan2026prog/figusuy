import React, { useEffect, useRef, useState } from 'react'
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
      <style>{landingStyles}</style>
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

  return (
    <section ref={ref} id={getAnchorId(block)} className={`fy-block fy-${block.block_type}`}>
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
    case 'footer':
      return <FooterBlock block={block} content={content} onCta={onCta} />
    default:
      return null
  }
}

function NavbarBlock({ block, content, preview, onCta }) {
  const [open, setOpen] = useState(false)
  return (
    <header
      className="fy-navbar-shell"
      style={{ position: content.sticky && !preview ? 'sticky' : 'relative', top: 0 }}
    >
      <div className="fy-shell fy-navbar" style={{ background: content.background || '#080808' }}>
        <a href="/" className="fy-logo">
          {content.logoUrl ? <img src={content.logoUrl} alt={content.logoText || 'FigusUY'} /> : null}
          <span>{content.logoText || 'FIGUS'}</span>
          <strong>{content.logoAccent || 'UY'}</strong>
        </a>
        <nav className="fy-navbar-links">
          {(content.links || []).map((link) => (
            <a key={`${block.slug}-${link.label}`} href={resolveUrl(link.url)}>{link.label}</a>
          ))}
        </nav>
        <div className="fy-navbar-actions">
          <CtaButton block={block} cta={content.cta} onCta={onCta} />
          <button type="button" className="fy-menu-btn" onClick={() => setOpen((value) => !value)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="fy-mobile-drawer">
          {(content.links || []).map((link) => (
            <a key={`mobile-${link.label}`} href={resolveUrl(link.url)} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  )
}

function HeroBlock({ block, content, onCta }) {
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
        <h1>
          {highlightedTitle.split('__MARK__').map((part, index) => (
            index % 2 === 1 ? <span key={`${part}-${index}`}>{part}</span> : part
          ))}
        </h1>
        <p className="fy-copy-lg">{content.subtitle}</p>
        <div className="fy-actions">
          <CtaButton block={block} cta={content.primaryCta} onCta={onCta} />
          <CtaButton block={block} cta={content.secondaryCta} onCta={onCta} />
        </div>
        <div className="fy-stat-row">
          {(content.stats || []).map((item) => (
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
            {(content.chips || []).map((chip, index) => (
              <Chip key={`${chip.label}-${index}`} chip={chip} />
            ))}
          </div>
          <div className="fy-feed">
            {(content.feedItems || []).map((item, index) => (
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
          {(content.wallItems || []).map((item, index) => (
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
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-chip-row">
        {(content.chips || []).map((chip, index) => (
          <Chip key={`${chip.label}-${index}`} chip={chip} />
        ))}
      </div>
      <div className="fy-now-grid">
        <div className="fy-panel fy-panel-glow">
          <div className="fy-feed">
            {(content.liveItems || []).map((item, index) => (
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
          {(content.cards || []).map((card, index) => (
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
        {(content.activityItems || []).map((item, index) => (
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
  const items = content.items || []
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
  return (
    <div className="fy-shell fy-section">
      <div className="fy-promo" style={{ '--promo-bg': content.background || '#111111' }}>
        <div className="fy-promo-copy">
          <div className="fy-kicker">{content.kicker}</div>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="fy-chip-row">
            {(content.chips || []).map((chip, index) => (
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
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-card-grid fy-steps-grid">
        {(content.steps || []).map((step, index) => (
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
  return (
    <div className="fy-shell fy-section">
      <div className="fy-split">
        <div className="fy-split-media" style={{ backgroundImage: `url(${content.image || ''})` }} />
        <div className="fy-split-copy fy-panel fy-panel-glow">
          <div className="fy-kicker">{content.kicker}</div>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="fy-chip-row">
            {(content.chips || []).map((chip, index) => (
              <Chip key={`${chip.label}-${index}`} chip={chip} />
            ))}
          </div>
          <div className="fy-benefits">
            {(content.benefits || []).map((item) => (
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
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-card-grid fy-quad-grid">
        {(content.cards || []).map((card, index) => (
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
  return (
    <div className="fy-shell fy-section">
      <SectionHeading content={content} />
      <div className="fy-card-grid fy-plan-grid">
        {(content.plans || []).map((plan, index) => (
          <article key={`${plan.name}-${index}`} className={`fy-plan-card ${plan.highlight ? 'is-highlight' : ''}`}>
            <Chip chip={{ label: plan.badge, tone: plan.highlight ? 'orange' : 'neutral' }} />
            <h3>{plan.name}</h3>
            <div className="fy-price">{plan.price}</div>
            <div className="fy-benefits">
              {(plan.benefits || []).map((benefit) => (
                <div key={benefit} className="fy-benefit-line">
                  <span className="material-symbols-outlined">arrow_forward</span>
                  {benefit}
                </div>
              ))}
            </div>
            <CtaButton block={block} cta={plan.cta} onCta={onCta} ctaId={`plan-${plan.name}`} />
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
          <h2>{content.title}</h2>
          <p>{content.subtitle}</p>
          <div className="fy-actions">
            <CtaButton block={block} cta={content.cta} onCta={onCta} />
          </div>
        </div>
        {content.image ? <div className="fy-final-media" style={{ backgroundImage: `url(${content.image})` }} /> : null}
      </div>
    </div>
  )
}

function FooterBlock({ block, content, onCta }) {
  return (
    <footer className="fy-shell fy-footer">
      <div className="fy-footer-brand">
        <span>{content.logoText || 'FIGUS'}</span>
        <strong>{content.logoAccent || 'UY'}</strong>
      </div>
      <div className="fy-footer-links">
        {(content.links || []).map((link) => (
          <a key={link.label} href={resolveUrl(link.url)}>{link.label}</a>
        ))}
      </div>
      <div className="fy-footer-social">
        {(content.social || []).map((social) => (
          <a key={social.label} href={resolveUrl(social.url)} target="_blank" rel="noreferrer">{social.label}</a>
        ))}
      </div>
      <div className="fy-footer-legal">{content.legal}</div>
      <CtaButton block={block} cta={content.cta} onCta={onCta} />
    </footer>
  )
}

function SectionHeading({ content }) {
  return (
    <>
      {content.kicker ? <div className="fy-kicker">{content.kicker}</div> : null}
      {content.title ? <h2>{content.title}</h2> : null}
      {content.subtitle ? <p className="fy-section-copy">{content.subtitle}</p> : null}
    </>
  )
}

function CtaButton({ block, cta, onCta, ctaId }) {
  if (!cta?.label) return null
  const style = cta.style || 'primary'
  const className = style === 'primary' ? 'fy-btn fy-btn-primary' : style === 'secondary' ? 'fy-btn fy-btn-secondary' : 'fy-btn fy-btn-ghost'

  const handleClick = (event) => {
    if (!onCta) return
    event.preventDefault()
    onCta(block, cta, ctaId || cta.label)
  }

  return (
    <a href={resolveUrl(cta.url)} className={className} onClick={handleClick}>
      {cta.label}
    </a>
  )
}

function Chip({ chip }) {
  return <span className={`fy-chip tone-${chip?.tone || 'neutral'}`}>{chip?.label}</span>
}

const landingStyles = `
  .fy-landing {
    color: #f5f5f5;
    background:
      radial-gradient(circle at 0% 0%, rgba(255, 90, 0, 0.18), transparent 24%),
      radial-gradient(circle at 100% 20%, rgba(56, 189, 248, 0.12), transparent 18%),
      linear-gradient(180deg, #060606 0%, #0b0b0b 100%);
    font-family: 'Barlow', sans-serif;
  }
  .fy-landing * { box-sizing: border-box; }
  .fy-landing a { color: inherit; text-decoration: none; }
  .fy-block { border-bottom: 1px solid rgba(255,255,255,.08); }
  .fy-shell { width: min(1280px, calc(100% - 48px)); margin: 0 auto; }
  .fy-navbar-shell { z-index: 30; backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.08); }
  .fy-navbar { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .fy-logo { display: inline-flex; align-items: center; gap: 6px; font: italic 900 2rem 'Barlow Condensed', sans-serif; text-transform: uppercase; }
  .fy-logo img { width: 36px; height: 36px; object-fit: cover; }
  .fy-logo strong { color: #ff5a00; }
  .fy-navbar-links { display: flex; gap: 24px; color: rgba(255,255,255,.74); font-size: .95rem; }
  .fy-navbar-links a:hover { color: #fff; }
  .fy-navbar-actions { display: flex; align-items: center; gap: 12px; }
  .fy-menu-btn { display: none; background: transparent; border: 1px solid rgba(255,255,255,.16); color: #fff; width: 42px; height: 42px; }
  .fy-mobile-drawer { display: none; }
  .fy-kicker { color: #ff5a00; font: 900 .74rem 'Barlow Condensed', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
  .fy-hero {
    padding: 64px 0 40px;
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(420px, .98fr);
    gap: 32px;
    align-items: center;
  }
  .fy-hero-copy { max-width: 640px; }
  .fy-hero-copy h1, .fy-section h2, .fy-promo h2, .fy-final-cta h2, .fy-split h2 {
    margin: 14px 0 0;
    font: italic 900 clamp(3rem, 9vw, 7.2rem) 'Barlow Condensed', sans-serif;
    line-height: .85;
    text-transform: uppercase;
    letter-spacing: -.04em;
  }
  .fy-hero-copy h1 span { color: #ff5a00; }
  .fy-copy-lg, .fy-section-copy, .fy-promo p, .fy-final-cta p, .fy-split p {
    color: rgba(255,255,255,.72);
    font-size: 1.02rem;
    line-height: 1.7;
    max-width: 720px;
    margin-top: 14px;
  }
  .fy-pill { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid rgba(255,90,0,.26); background: rgba(255,90,0,.08); font: 900 .76rem 'Barlow Condensed', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #ff8a4c; }
  .fy-dot { width: 8px; height: 8px; border-radius: 999px; background: #22c55e; box-shadow: 0 0 0 6px rgba(34,197,94,.14); }
  .fy-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
  .fy-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 12px 18px; border: 1px solid rgba(255,255,255,.12); font: 900 .9rem 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: .08em; transition: transform .2s ease, border-color .2s ease, background .2s ease; }
  .fy-btn:hover { transform: translateY(-1px); }
  .fy-btn-primary { background: #ff5a00; border-color: #ff5a00; color: #fff; box-shadow: 0 18px 40px rgba(255,90,0,.18); }
  .fy-btn-secondary { background: rgba(255,255,255,.06); color: #fff; }
  .fy-btn-ghost { background: transparent; color: rgba(255,255,255,.78); }
  .fy-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; }
  .fy-stat-card, .fy-panel, .fy-cover-card, .fy-editorial-card, .fy-gamify-card, .fy-plan-card, .fy-activity-item {
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  }
  .fy-stat-card { padding: 14px; }
  .fy-stat-card strong { display: block; font: italic 900 2rem 'Barlow Condensed', sans-serif; }
  .fy-stat-card span { display: block; margin-top: 4px; color: rgba(255,255,255,.58); font: 900 .7rem 'Barlow Condensed', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
  .fy-hero-side { display: grid; gap: 16px; width: min(100%, 520px); justify-self: end; }
  .fy-live-card { padding: 18px; border: 1px solid rgba(255,90,0,.2); background: linear-gradient(135deg, rgba(255,90,0,.1), rgba(255,255,255,.03)); box-shadow: 0 20px 50px rgba(255,90,0,.08); }
  .fy-live-card h3, .fy-editorial-copy h3, .fy-mini-card h3, .fy-gamify-copy h3, .fy-plan-card h3, .fy-carousel-copy h3 {
    margin-top: 10px;
    font: italic 900 2rem 'Barlow Condensed', sans-serif;
    line-height: .9;
    text-transform: uppercase;
  }
  .fy-live-card p, .fy-feed-item p, .fy-mini-card p, .fy-editorial-copy p, .fy-gamify-copy p, .fy-plan-card p, .fy-carousel-copy p, .fy-activity-item p { color: rgba(255,255,255,.68); }
  .fy-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .fy-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border: 1px solid rgba(255,255,255,.12); font: 900 .66rem 'Barlow Condensed', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
  .tone-orange { color: #ff8a4c; border-color: rgba(255,90,0,.3); background: rgba(255,90,0,.12); }
  .tone-green { color: #72f0a1; border-color: rgba(34,197,94,.3); background: rgba(34,197,94,.1); }
  .tone-blue { color: #8bd6ff; border-color: rgba(56,189,248,.3); background: rgba(56,189,248,.1); }
  .tone-yellow { color: #ffe06f; border-color: rgba(250,204,21,.3); background: rgba(250,204,21,.1); }
  .tone-neutral { color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.12); background: rgba(255,255,255,.04); }
  .fy-feed { display: grid; gap: 10px; margin-top: 14px; }
  .fy-feed-item { display: flex; justify-content: space-between; gap: 12px; align-items: start; padding: 12px; background: rgba(0,0,0,.22); border: 1px solid rgba(255,255,255,.08); }
  .fy-feed-item b { display: block; color: #fff; font: 900 .82rem 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: .08em; }
  .fy-feed-item span { color: rgba(255,255,255,.42); font: 900 .66rem 'Barlow Condensed', sans-serif; text-transform: uppercase; white-space: nowrap; }
  .fy-wall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .fy-wall-card { min-height: 116px; display: flex; flex-direction: column; justify-content: space-between; padding: 14px; }
  .fy-wall-card strong { font: italic 900 2.1rem 'Barlow Condensed', sans-serif; }
  .fy-wall-card span { font: 900 .74rem 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: .08em; }
  .fy-section { padding: 34px 0; }
  .fy-section h2, .fy-promo h2, .fy-final-cta h2, .fy-split h2 { font-size: clamp(2.4rem, 6vw, 4.8rem); }
  .fy-now-grid, .fy-split, .fy-carousel, .fy-promo, .fy-final-cta { display: grid; gap: 18px; }
  .fy-now-grid, .fy-carousel, .fy-promo, .fy-final-cta { grid-template-columns: 1.1fr .9fr; }
  .fy-panel { padding: 18px; }
  .fy-panel-glow { background: linear-gradient(135deg, rgba(255,90,0,.08), rgba(255,255,255,.02)); }
  .fy-stack { display: grid; gap: 14px; }
  .fy-mini-top { display: flex; justify-content: flex-start; }
  .fy-activity-strip { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 18px; }
  .fy-activity-item { padding: 16px; }
  .fy-activity-item strong { display: block; font: 900 .9rem 'Barlow Condensed', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
  .fy-activity-item span { display: block; margin-top: 10px; color: rgba(255,255,255,.42); font: 900 .7rem 'Barlow Condensed', sans-serif; text-transform: uppercase; }
  .fy-carousel-main, .fy-split-media, .fy-promo-media, .fy-final-media, .fy-editorial-media {
    min-height: 320px;
    background-position: center;
    background-size: cover;
    position: relative;
    overflow: hidden;
  }
  .fy-carousel-main { display: flex; align-items: end; padding: 24px; border: 1px solid rgba(255,90,0,.2); }
  .fy-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.74)); }
  .fy-carousel-copy { position: relative; z-index: 1; }
  .fy-carousel-rail { display: grid; gap: 10px; }
  .fy-cover-card { padding: 10px; display: grid; grid-template-columns: 84px 1fr; gap: 12px; text-align: left; cursor: pointer; }
  .fy-cover-card.is-active { border-color: rgba(255,90,0,.34); background: rgba(255,90,0,.08); }
  .fy-cover-image { background-position: center; background-size: cover; min-height: 104px; }
  .fy-cover-meta strong { display: block; font: italic 900 1.45rem 'Barlow Condensed', sans-serif; line-height: .9; text-transform: uppercase; }
  .fy-cover-meta span { display: block; margin-top: 8px; color: rgba(255,255,255,.6); font: 900 .72rem 'Barlow Condensed', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
  .fy-promo { background: linear-gradient(135deg, var(--promo-bg, #111111), #0d0d0d); padding: 20px; align-items: center; }
  .fy-promo-media { min-height: 300px; border: 1px solid rgba(255,255,255,.08); }
  .fy-card-grid { display: grid; gap: 16px; margin-top: 20px; }
  .fy-steps-grid { grid-template-columns: repeat(3, 1fr); }
  .fy-quad-grid { grid-template-columns: repeat(4, 1fr); }
  .fy-editorial-card, .fy-gamify-card { overflow: hidden; }
  .fy-editorial-copy, .fy-gamify-copy { padding: 16px; }
  .fy-step-index, .fy-price { color: #ff8a4c; font: 900 .78rem 'Barlow Condensed', sans-serif; letter-spacing: .1em; text-transform: uppercase; }
  .fy-split { grid-template-columns: 1fr 1fr; align-items: stretch; }
  .fy-split-copy { padding: 28px; display: flex; flex-direction: column; justify-content: center; }
  .fy-benefits { display: grid; gap: 10px; margin-top: 18px; }
  .fy-benefit-line { display: inline-flex; gap: 10px; align-items: center; color: rgba(255,255,255,.84); font-weight: 600; }
  .fy-benefit-line .material-symbols-outlined { color: #ff8a4c; font-size: 1rem; }
  .fy-gamify-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .fy-gamify-top .material-symbols-outlined { color: #ff8a4c; }
  .fy-plan-grid { grid-template-columns: repeat(3, 1fr); }
  .fy-plan-card { padding: 18px; display: flex; flex-direction: column; min-height: 100%; }
  .fy-plan-card.is-highlight { border-color: rgba(255,90,0,.32); background: linear-gradient(180deg, rgba(255,90,0,.1), rgba(255,255,255,.03)); }
  .fy-price { font-size: 3rem; margin-top: 12px; }
  .fy-final-cta { padding: 24px; align-items: center; }
  .fy-footer { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; padding: 28px 0; }
  .fy-footer-brand { display: inline-flex; gap: 6px; font: italic 900 2rem 'Barlow Condensed', sans-serif; text-transform: uppercase; }
  .fy-footer-brand strong { color: #ff5a00; }
  .fy-footer-links, .fy-footer-social { display: flex; gap: 16px; flex-wrap: wrap; color: rgba(255,255,255,.62); }
  .fy-footer-legal { grid-column: 1 / -1; color: rgba(255,255,255,.45); font-size: .86rem; }
  @media (max-width: 980px) {
    .fy-shell { width: min(1280px, calc(100% - 28px)); }
    .fy-navbar-links { display: none; }
    .fy-menu-btn { display: inline-grid; place-items: center; }
    .fy-mobile-drawer { display: grid; gap: 10px; padding: 14px 16px 18px; background: #090909; }
    .fy-hero, .fy-now-grid, .fy-carousel, .fy-promo, .fy-split, .fy-final-cta { grid-template-columns: 1fr; }
    .fy-hero { padding-top: 40px; gap: 22px; }
    .fy-hero-copy, .fy-hero-side { max-width: none; width: 100%; justify-self: stretch; }
    .fy-steps-grid, .fy-quad-grid, .fy-plan-grid, .fy-activity-strip, .fy-stat-row { grid-template-columns: 1fr; }
    .fy-footer { grid-template-columns: 1fr; }
  }
  .fy-landing.is-mobile .fy-shell { width: calc(100% - 20px); }
  .fy-landing.is-mobile .fy-navbar-links { display: none; }
  .fy-landing.is-mobile .fy-menu-btn { display: inline-grid; place-items: center; }
  .fy-landing.is-mobile .fy-hero,
  .fy-landing.is-mobile .fy-now-grid,
  .fy-landing.is-mobile .fy-carousel,
  .fy-landing.is-mobile .fy-promo,
  .fy-landing.is-mobile .fy-split,
  .fy-landing.is-mobile .fy-final-cta,
  .fy-landing.is-mobile .fy-steps-grid,
  .fy-landing.is-mobile .fy-quad-grid,
  .fy-landing.is-mobile .fy-plan-grid,
  .fy-landing.is-mobile .fy-activity-strip,
  .fy-landing.is-mobile .fy-stat-row,
  .fy-landing.is-mobile .fy-footer { grid-template-columns: 1fr; }
`
