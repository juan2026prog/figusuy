import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { buildSuggestedCopies, buildSuggestedCtas, createShareCardSvg, downloadSvgCard, getInfluencerLink } from '../lib/influencerDashboard'

export default function InfluencerAssets() {
  const { dashboard } = useOutletContext()
  const toast = useToast()
  const campaign = dashboard.activeCampaign
  const link = getInfluencerLink(campaign)
  const copies = buildSuggestedCopies(dashboard)
  const ctas = buildSuggestedCtas(dashboard)
  const shareCards = [
    {
      name: 'share-card-principal.svg',
      title: 'COMPARTE TU CODIGO',
      subtitle: 'Lleva mas trafico a tu campana',
    },
    {
      name: 'share-card-beneficio.svg',
      title: 'ACTIVA EL BENEFICIO',
      subtitle: 'Un mensaje claro convierte mejor',
    },
  ]

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiado`)
  }

  const share = async (text) => {
    try {
      if (navigator.share) {
        await navigator.share({ text, url: link || undefined, title: 'FigusUY' })
      } else {
        await navigator.clipboard.writeText(text)
      }
      toast.success('Contenido listo para compartir')
    } catch {
      toast.error('No se pudo abrir el share del dispositivo')
    }
  }

  const downloadCard = (config) => {
    const svg = createShareCardSvg({
      title: config.title,
      subtitle: config.subtitle,
      code: campaign?.code || 'FIGUSUY',
      benefit: dashboard.activeBenefit?.benefit_label || 'Comparte tu acceso FigusUY',
      handle: dashboard.affiliate?.handle,
    })
    downloadSvgCard(config.name, svg)
    toast.success('Share card descargada')
  }

  return (
    <div className="affiliate-content">
      <section className="affiliate-grid-2">
        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Kit de sharing</h2>
            <p>Tu codigo, tu link y los CTA mas faciles de usar.</p>
          </div>
          <div className="affiliate-panel-body affiliate-list">
            <div className="affiliate-list-item">
              <strong>{campaign?.code || 'Sin codigo activo'}</strong>
              <div className="affiliate-inline-actions" style={{ marginTop: 12 }}>
                <button className="affiliate-primary-btn" onClick={() => copy(campaign?.code || '', 'Codigo')}>Copiar codigo</button>
              </div>
            </div>
            <div className="affiliate-list-item">
              <strong>{link || 'Sin link activo'}</strong>
              <div className="affiliate-inline-actions" style={{ marginTop: 12 }}>
                <button className="affiliate-primary-btn" onClick={() => copy(link || '', 'Link')}>Copiar link</button>
                <button className="affiliate-secondary-btn" onClick={() => share(`Entra a FigusUY desde aqui: ${link}`)}>Compartir</button>
              </div>
            </div>
            <div className="affiliate-list-item">
              <strong>{dashboard.activeBenefit?.benefit_label || 'Comparte tu link para empezar'}</strong>
              <div className="affiliate-mini-note">Beneficio comunicado a la audiencia.</div>
            </div>
          </div>
        </article>

        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>CTA sugeridos</h2>
            <p>Mensajes cortos para story, bio o post.</p>
          </div>
          <div className="affiliate-panel-body affiliate-list">
            {ctas.map((cta) => (
              <div className="affiliate-list-item" key={cta}>
                <strong>{cta}</strong>
                <div className="affiliate-inline-actions" style={{ marginTop: 12 }}>
                  <button className="affiliate-secondary-btn" onClick={() => copy(cta, 'CTA')}>Copiar CTA</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="affiliate-panel">
        <div className="affiliate-panel-head">
          <h2>Textos sugeridos</h2>
          <p>Copy comercial listo para pegar. Si no hay conversiones aun, empieza con mensajes simples.</p>
        </div>
        <div className="affiliate-panel-body affiliate-list">
          {copies.map((item) => (
            <div className="affiliate-list-item" key={item}>
              <strong>{item}</strong>
              <div className="affiliate-inline-actions" style={{ marginTop: 12 }}>
                <button className="affiliate-primary-btn" onClick={() => copy(item, 'Texto')}>Copiar texto</button>
                <button className="affiliate-secondary-btn" onClick={() => share(item)}>Compartir</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="affiliate-grid-2">
        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Share cards</h2>
            <p>Creatives descargables generados con tu codigo real.</p>
          </div>
          <div className="affiliate-panel-body affiliate-list">
            {shareCards.map((card) => (
              <div className="affiliate-list-item" key={card.name}>
                <strong>{card.title}</strong>
                <div className="affiliate-mini-note">{card.subtitle}</div>
                <div className="affiliate-inline-actions" style={{ marginTop: 12 }}>
                  <button className="affiliate-primary-btn" onClick={() => downloadCard(card)}>Descargar imagen</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Creatives disponibles</h2>
            <p>Activos visuales conectados a tu perfil y campana.</p>
          </div>
          <div className="affiliate-panel-body affiliate-list">
            {dashboard.affiliate?.avatar_url ? (
              <div className="affiliate-list-item">
                <strong>Avatar / imagen del influencer</strong>
                <div className="affiliate-inline-actions" style={{ marginTop: 12 }}>
                  <a className="affiliate-primary-btn" href={dashboard.affiliate.avatar_url} download target="_blank" rel="noreferrer">Descargar imagen</a>
                </div>
              </div>
            ) : (
              <div className="affiliate-list-item">
                <strong>No hay creatives externos aun</strong>
                <div className="affiliate-mini-note">Mientras tanto puedes usar las share cards generadas arriba.</div>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
