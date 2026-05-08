import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { useLandingPageBlocks } from '../hooks/useLandingPageBlocks'
import { LANDING_INFLUENCERS_PAGE_KEY } from '../lib/landingBuilder'
import { useAuthStore } from '../stores/authStore'
import LandingRenderer from '../components/landing/LandingRenderer'
import { ErrorBoundary } from '../components/ErrorBoundary'

export default function InfluencersPage() {
  useSEO({
    title: 'Influencer Program | FigusUY',
    description: 'Transforma tu influencia en activacion real. Unite al programa de influencers de FigusUY y gana por performance.',
  })

  const { handleCta, handleVisible } = useOutletContext()
  const { profile } = useAuthStore()
  const { blocks } = useLandingPageBlocks(LANDING_INFLUENCERS_PAGE_KEY)

  const pageBlocks = useMemo(() => {
    if (profile?.role !== 'influencer') return blocks

    return blocks.map((block) => {
      if (block.block_type !== 'influencer_program_hero') return block
      return {
        ...block,
        content: {
          ...block.content,
          primaryCta: {
            label: 'Ir a mi dashboard',
            url: '/influencer/dashboard',
            style: 'primary',
          },
        },
      }
    })
  }, [blocks, profile?.role])

  return (
    <div className="influencers-page-content">
      <ErrorBoundary>
        <LandingRenderer
          blocks={pageBlocks}
          onCta={handleCta}
          onBlockVisible={handleVisible}
        />
      </ErrorBoundary>
    </div>
  )
}
