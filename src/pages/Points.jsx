import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { useLandingPageBlocks } from '../hooks/useLandingPageBlocks'
import { LANDING_POINTS_PAGE_KEY } from '../lib/landingBuilder'
import LandingRenderer from '../components/landing/LandingRenderer'
import { useBusinessPlanStore } from '../stores/businessPlanStore'

const PLAN_METADATA = {
  gratis: {
    stage: 'Entrar en el circuito',
    icon: 'bolt',
    subtitle: 'Presencia inicial para aparecer en el mapa y activar una ficha comercial simple.',
    features: ['Aparecer en lugares y mapa', '1 foto principal', 'Promo simple', 'Contacto', 'Visibilidad basica'],
  },
  turbo: {
    stage: 'Ganar la zona',
    icon: 'location_on',
    subtitle: 'Mas visibilidad local para capturar trafico cercano con intencion real.',
    features: ['Todo Gratis', 'Mas visibilidad', 'Promos destacadas', 'Prioridad local', 'Mejor mapa'],
  },
  dominio: {
    stage: 'Convertir intencion',
    icon: 'ads_click',
    subtitle: 'Prioridad comercial para transformar visibilidad en acciones medibles.',
    features: ['Todo Radar', 'Top CTA', 'Prioridad comercial', 'Promo first', 'Mejor intencion'],
  },
  partner_store: {
    stage: 'Validar y liderar',
    icon: 'workspace_premium',
    subtitle: 'Convierte tu local en lugar de confianza para validar y otorgar rewards.',
    features: ['Todo Conversion', 'Validación de álbumes', 'Validación de usuarios', 'Badge Collector Hub', 'Rewards asociados', 'Visibilidad premium'],
  },
}

export default function Points() {
  useSEO({
    title: 'Lugares de Intercambio | FigusUY',
    description: 'Encontra los mejores lugares para cambiar tus figuritas de forma segura.',
  })

  const { handleCta, handleVisible } = useOutletContext()
  const { blocks } = useLandingPageBlocks(LANDING_POINTS_PAGE_KEY)
  const { plans: dbPlans, userPlans } = useBusinessPlanStore()

  const pageBlocks = useMemo(() => {
    return blocks.map((block) => {
      if (block.block_type !== 'business_plans' || dbPlans.length === 0) return block

      const updatedPlans = dbPlans.map((dbPlan) => {
        const dbKey = dbPlan.plan_name
        // Mapping between internal DB names and PayPal plan keys
        const premiumKey = dbKey === 'turbo' ? 'radar' :
                           dbKey === 'dominio' ? 'conversion' :
                           dbKey === 'partner_store' ? 'partnerstore' : dbKey

        const meta = PLAN_METADATA[dbKey] || { stage: 'Comercial', icon: 'stars', subtitle: '', features: [] }

        const uiName = dbKey === 'turbo' ? 'Radar' :
          dbKey === 'dominio' ? 'Conversion' :
          dbKey === 'gratis' ? 'Gratis' : 'Collector Hub'

        // Buscar el precio USD en los planes de PayPal (premium_plans)
        const premiumPlan = userPlans?.find(up => up.plan_key === premiumKey)

        const existing = (block.content.plans || []).find((plan) =>
          String(plan.name).toLowerCase().includes(uiName.toLowerCase())
        )

        return {
          ...existing,
          name: uiName,
          price: dbKey === 'gratis' ? '$0' : 
                 dbKey === 'partner_store' ? '71.99' :
                 String(premiumPlan?.price || '0'),
          currency: dbKey === 'gratis' ? '' : 'USD',
          priceMeta: dbKey === 'gratis' ? 'siempre' : `≈ $${dbPlan.monthly_price.toLocaleString()} UYU aprox.`,
          badge: meta.stage,
          icon: meta.icon,
          subtitle: meta.subtitle,
          benefits: meta.features,
          cta: { label: dbKey === 'partner_store' ? 'Aplicar ahora' : (existing?.cta?.label || 'Saber más') },
          highlight: dbKey === 'partner_store',
        }
      })

      return { ...block, content: { ...block.content, plans: updatedPlans } }
    })
  }, [blocks, dbPlans])

  return (
    <div className="points-page-content">
      <LandingRenderer
        blocks={pageBlocks}
        onCta={handleCta}
        onBlockVisible={handleVisible}
      />
    </div>
  )
}
