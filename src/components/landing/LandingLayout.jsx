import React, { useEffect, useState, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { fetchLandingBlocks, trackLandingEvent } from '../../lib/landingApi'
import { normalizeLandingBlocks, LANDING_DEFAULT_BLOCKS } from '../../lib/landingBuilder'
import { patchLandingBlocks } from '../../lib/landingMenu'
import LandingRenderer from './LandingRenderer'
import AuthModal from '../AuthModal'
import BusinessApplyModal from '../BusinessApplyModal'
import BusinessInfoModal from '../BusinessInfoModal'
import PlansModal from '../PlansModal'
import InfluencerApplyModal from '../InfluencerApplyModal'
import { ErrorBoundary } from '../ErrorBoundary'
import { useAuthStore } from '../../stores/authStore'
import { useBusinessPlanStore } from '../../stores/businessPlanStore'

const PENDING_LANDING_ACTION_KEY = 'figusuy.pendingLandingAction'

function hasPaidPointSuggestionAccess(profile) {
  const planName = String(profile?.plan_name || '').trim().toLowerCase()
  return profile?.is_premium === true || planName === 'plus' || planName === 'pro'
}

const fallbackBlocks = normalizeLandingBlocks(
  LANDING_DEFAULT_BLOCKS.map((block) => ({ ...block, content: block.published_content })),
  'published'
)

const PLAN_METADATA = {
  gratis: {
    stage: 'Entrar en el circuito',
    icon: 'bolt',
    subtitle: 'Presencia inicial para aparecer en el mapa, captar puntos sugeridos y activar una ficha comercial simple.',
    features: [
      'Aparecer en puntos y mapa',
      '1 foto principal',
      'Promo simple',
      'Contacto',
      'Visibilidad basica'
    ]
  },
  turbo: {
    stage: 'Ganar la zona',
    icon: 'location_on',
    subtitle: 'Mas visibilidad local para capturar trafico cercano cuando el usuario ya esta buscando donde ir.',
    features: [
      'Todo Boost',
      'Mas visibilidad',
      'Promos destacadas',
      'Prioridad local',
      'Mejor mapa'
    ]
  },
  dominio: {
    stage: 'Convertir intencion',
    icon: 'ads_click',
    subtitle: 'Top CTA y prioridad comercial para transformar visibilidad en contactos y acciones medibles.',
    features: [
      'Todo Radar',
      'Top CTA',
      'Prioridad comercial',
      'Promo first',
      'Mejor intencion'
    ]
  },
  partner_store: {
    stage: 'Validar y liderar',
    icon: 'workspace_premium',
    subtitle: 'Convierte tu local en punto de confianza para validar, otorgar rewards y capturar liquidez premium.',
    features: [
      'Todo Conversion',
      'Validacion de albumes',
      'Validacion de usuarios',
      'Badge Collector Hub',
      'Prioridad de validacion',
      'Rewards asociados',
      'Visibilidad premium',
      'Descuento minimo configurable 10%'
    ]
  }
}

const USER_PLAN_METADATA = {
  gratis: {
    badge: 'Básico',
    icon: 'backpack',
    subtitle: 'Todo lo que necesitás para completar el álbum con paciencia.',
    features: [
      'Cargar figuritas sin límite',
      'Ver todos tus matches',
      'Chat ilimitado con matches',
      'Completar tu álbum gratis'
    ]
  },
  plus: {
    badge: 'Acelerador',
    icon: 'diamond',
    subtitle: 'Filtros, confirmaciones y limpieza de ruido.',
    features: [
      'Filtro de matches por distancia',
      'Filtro por figurita específica',
      'Doble check azul (lectura)',
      'Ver estado "Última vez"',
      'Experiencia sin publicidad',
      'Saber quién vio tu perfil',
      'Badge Plus destacado'
    ]
  },
  pro: {
    badge: 'Elite',
    icon: 'rocket_launch',
    subtitle: 'El sistema caza por vos y te pone en el centro de atención.',
    features: [
      'Todo lo incluido en Plus',
      'Alertas "Radar" instantáneas',
      'Aparecés primero en matches',
      'Modo Fantasma (invisible)',
      'Múltiples álbumes + analíticas',
      'Soporte VIP y Badge Coleccionista'
    ]
  }
}


export default function LandingLayout() {
  const [blocks, setBlocks] = useState(fallbackBlocks)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [showInfluencerModal, setShowInfluencerModal] = useState(false)
  const [applyType, setApplyType] = useState('store')
  const [authRedirectTo, setAuthRedirectTo] = useState('/home')
  
  const location = useLocation()
  const navigate = useNavigate()
  const profile = useAuthStore(state => state.profile)

  const { plans: dbPlans, userPlans, fetchPlans } = useBusinessPlanStore()


  useEffect(() => {
    fetchPlans()
    const load = async () => {
      try {
        const rows = await fetchLandingBlocks({ mode: 'published' })
        if (rows && rows.length > 0) {
          setBlocks(normalizeLandingBlocks(rows, 'published'))
        }
      } catch (error) {
        console.error('landing layout fetch error', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const syncedBlocks = useMemo(() => {
    return blocks.map(block => {
      // Synchronize Business Plans
      if (block.block_type === 'business_plans' && dbPlans.length > 0) {
        const updatedPlans = dbPlans.map(dbPlan => {
          const dbKey = dbPlan.plan_name
          const meta = PLAN_METADATA[dbKey] || { stage: 'Comercial', icon: 'stars', subtitle: '', features: [] }
          
          const uiName = dbKey === 'turbo' ? 'Radar' : 
                        dbKey === 'dominio' ? 'Conversion' : 
                        dbKey === 'gratis' ? 'Boost' : 'Collector Hub'

          const existing = (block.content.plans || []).find(p => 
            String(p.name).toLowerCase().includes(uiName.toLowerCase())
          )

          return {
            ...existing,
            name: uiName,
            price: `UYU ${dbPlan.monthly_price.toLocaleString()}`,
            badge: meta.stage,
            icon: meta.icon,
            subtitle: meta.subtitle,
            benefits: meta.features,
            cta: { ...existing?.cta, label: dbKey === 'partner_store' ? 'Aplicar ahora' : (existing?.cta?.label || 'Saber más') },
            highlight: dbKey === 'partner_store'
          }
        })

        return { ...block, content: { ...block.content, plans: updatedPlans } }
      }

      // Synchronize User Plans
      if (block.block_type === 'user_plans' && userPlans.length > 0) {
        // Filter ONLY Gratis, Plus, and Pro
        const targetPlans = ['gratis', 'plus', 'pro']
        const filteredPlans = userPlans.filter(p => targetPlans.some(t => p.name.toLowerCase().includes(t)))

        // Map premium_plans from DB to Landing UI structure
        const updatedPlans = filteredPlans.map(dbPlan => {
          const nameLower = dbPlan.name.toLowerCase()
          const dbKey = nameLower.includes('pro') ? 'pro' : nameLower.includes('plus') ? 'plus' : 'gratis'
          const meta = USER_PLAN_METADATA[dbKey] || { badge: 'Nivel', icon: 'stars', subtitle: '', features: [] }

          const existing = (block.content.plans || []).find(p => 
            String(p.name).toLowerCase().includes(dbKey)
          )

          return {
            ...existing,
            name: dbPlan.name,
            price: `UYU ${Number(dbPlan.price).toLocaleString()}`,
            badge: meta.badge,
            icon: meta.icon,
            subtitle: meta.subtitle,
            benefits: meta.features,
            highlight: dbKey === 'plus', // Plus is typically the recommended one
            _sortKey: dbKey
          }
        }).sort((a, b) => {
          const order = { 'gratis': 1, 'plus': 2, 'pro': 3 }
          return order[a._sortKey] - order[b._sortKey]
        })

        return { ...block, content: { ...block.content, plans: updatedPlans } }
      }

      return block
    })
  }, [blocks, dbPlans, userPlans])


  const { navBlock, footerBlock } = useMemo(() => {
    const patched = patchLandingBlocks(syncedBlocks)
    return {
      navBlock: patched.find(b => b.block_type === 'navbar'),
      footerBlock: patched.find(b => b.block_type === 'footer')
    }
  }, [syncedBlocks])

  useEffect(() => {
    if (location.pathname !== '/puntos' || !profile) return

    const pendingAction = window.sessionStorage.getItem(PENDING_LANDING_ACTION_KEY)
    if (pendingAction !== 'suggest-point') return

    window.sessionStorage.removeItem(PENDING_LANDING_ACTION_KEY)

    if (hasPaidPointSuggestionAccess(profile)) {
      setApplyType('suggested')
      setShowApplyModal(true)
      return
    }

    setShowPlansModal(true)
  }, [location.pathname, profile])

  const handleCta = (block, cta, ctaId) => {
    trackLandingEvent({
      pageKey: block.page_key,
      blockSlug: block.slug,
      blockType: block.block_type,
      eventType: 'cta_click',
      ctaId,
      metadata: { url: cta?.url || '' },
    }).catch(console.error)

    const url = String(cta?.url || '')
    if (!url) return
    
    if (url.startsWith('#')) {
      const target = document.getElementById(url.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        navigate(`${location.pathname}${url}`)
      }
      return
    }

    if (url === '/login' || url.startsWith('action:auth')) {
      setAuthRedirectTo('/home')
      setShowAuthModal(true)
      return
    }

    if (url.startsWith('action:suggest-point')) {
      if (!profile?.id) {
        window.sessionStorage.setItem(PENDING_LANDING_ACTION_KEY, 'suggest-point')
        setAuthRedirectTo(null)
        setShowAuthModal(true)
        return
      }

      if (!hasPaidPointSuggestionAccess(profile)) {
        setShowPlansModal(true)
        return
      }

      setApplyType('suggested')
      setShowApplyModal(true)
      return
    }
    
    if (url.startsWith('action:business-apply') || url === '/business/apply') {
      setApplyType('store')
      setShowApplyModal(true)
      return
    }

    if (url.startsWith('action:business-info')) {
      setShowInfoModal(true)
      return
    }

    if (url.startsWith('action:influencer-apply')) {
      setShowInfluencerModal(true)
      return
    }

    if (url.startsWith('action:influencer-info')) {
      navigate('/influencers')
      return
    }

    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    navigate(url)
  }

  const handleVisible = async (block) => {
    await trackLandingEvent({
      pageKey: block.page_key,
      blockSlug: block.slug,
      blockType: block.block_type,
      eventType: 'impression',
      metadata: { visible: true },
    })
  }

  return (
    <div className="landing-layout">
      <ErrorBoundary>
        {navBlock && (
          <LandingRenderer 
            blocks={[navBlock]} 
            onCta={handleCta} 
            onBlockVisible={handleVisible} 
          />
        )}
        
        <main className="landing-main">
          <Outlet context={{ handleCta, handleVisible, blocks: syncedBlocks }} />
        </main>

        {footerBlock && (
          <LandingRenderer 
            blocks={[footerBlock]} 
            onCta={handleCta} 
            onBlockVisible={handleVisible} 
          />
        )}
      </ErrorBoundary>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={authRedirectTo}
      />
      <BusinessApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        initialType={applyType}
      />
      <BusinessInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <PlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} />
      <InfluencerApplyModal isOpen={showInfluencerModal} onClose={() => setShowInfluencerModal(false)} />
    </div>
  )
}
