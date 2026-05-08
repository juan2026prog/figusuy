import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import LandingRenderer from '../components/landing/LandingRenderer'
import { ErrorBoundary } from '../components/ErrorBoundary'

export default function Landing() {
  useSEO({
    title: 'FigusUY | Intercambios, comunidad y albumes en movimiento',
    description: 'La forma más rápida de completar tu álbum en Uruguay.'
  })

  const { blocks, handleCta, handleVisible } = useOutletContext()

  const middleBlocks = useMemo(() => {
    return blocks.filter(b => 
      !['navbar', 'footer', 'exchange_points', 'business_plans', 'influencers'].includes(b.block_type)
    )
  }, [blocks])

  return (
    <div className="landing-page-content">
      <ErrorBoundary>
        <LandingRenderer
          blocks={middleBlocks}
          onCta={handleCta}
          onBlockVisible={handleVisible}
        />
      </ErrorBoundary>
    </div>
  )
}
