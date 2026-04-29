import { useEffect } from 'react'

export function useSEO({ title, description }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | FigusUY`
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', `${title} | FigusUY`)
    }

    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) metaDescription.setAttribute('content', description)

      const ogDescription = document.querySelector('meta[property="og:description"]')
      if (ogDescription) ogDescription.setAttribute('content', description)
    }
  }, [title, description])
}
