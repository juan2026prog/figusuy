import { useEffect, useState } from 'react'
import { fetchLandingBlocks } from '../lib/landingApi'
import { getDefaultBlocksForPage, normalizeLandingBlocks } from '../lib/landingBuilder'

export function useLandingPageBlocks(pageKey) {
  const [blocks, setBlocks] = useState(() =>
    normalizeLandingBlocks(
      getDefaultBlocksForPage(pageKey).map((block) => ({
        ...block,
        published_content: block.published_content || block.draft_content,
      })),
      'published'
    )
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const rows = await fetchLandingBlocks({ mode: 'published', pageKey })
        if (!active) return
        if (rows?.length) {
          setBlocks(normalizeLandingBlocks(rows, 'published'))
        }
      } catch (error) {
        console.error(`landing page fetch error for ${pageKey}`, error)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [pageKey])

  return { blocks, loading }
}
