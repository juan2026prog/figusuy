import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { LANDING_DEFAULT_BLOCKS, normalizeLandingBlocks } from '../lib/landingBuilder'
import { fetchLandingBlocks, trackLandingEvent } from '../lib/landingApi'
import LandingRenderer from '../components/landing/LandingRenderer'
import BusinessApplyModal from '../components/BusinessApplyModal'
import BusinessInfoModal from '../components/BusinessInfoModal'
import AuthModal from '../components/AuthModal'

const fallbackBlocks = normalizeLandingBlocks(
  LANDING_DEFAULT_BLOCKS.map((block) => ({ ...block, content: block.published_content })),
  'published'
)

export default function Landing() {
  useSEO({
    title: 'FigusUY | Intercambios, comunidad y albumes en movimiento',
    description: 'La landing oficial de FigusUY renderizada desde bloques CMS administrables.'
  })

  const navigate = useNavigate()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const rows = await fetchLandingBlocks({ mode: 'published' })
        if (!mounted) return
        setBlocks(normalizeLandingBlocks(rows, 'published'))
      } catch (error) {
        console.error('landing fetch error', error)
        if (mounted) setBlocks(fallbackBlocks)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const renderedBlocks = useMemo(() => {
    if (blocks.length) return blocks
    return fallbackBlocks
  }, [blocks])

  const handleCta = async (block, cta, ctaId) => {
    await trackLandingEvent({
      blockSlug: block.slug,
      blockType: block.block_type,
      eventType: 'cta_click',
      ctaId,
      metadata: { url: cta?.url || '' },
    })

    const url = String(cta?.url || '')
    if (!url) return
    if (url.startsWith('#')) {
      const target = document.getElementById(url.slice(1))
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (url === '/login' || url.startsWith('action:auth')) {
      setShowAuthModal(true)
      return
    }
    if (url.startsWith('action:business-apply') || url === '/business/apply') {
      setShowApplyModal(true)
      return
    }
    if (url.startsWith('action:business-info')) {
      setShowInfoModal(true)
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
      blockSlug: block.slug,
      blockType: block.block_type,
      eventType: 'impression',
      metadata: { visible: true },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060606' }}>
      {!loading || renderedBlocks.length ? (
        <LandingRenderer
          blocks={renderedBlocks}
          onCta={handleCta}
          onBlockVisible={handleVisible}
        />
      ) : null}

      <BusinessApplyModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} />
      <BusinessInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
