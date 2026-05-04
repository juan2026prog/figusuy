import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from "../lib/supabase"
import GlobalFooter from '../components/GlobalFooter'

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sanitizeUrl = (url) => {
  const trimmed = String(url || '').trim()
  if (!trimmed) return '#'
  if (trimmed.startsWith('/')) return trimmed
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
  return '#'
}

const parseMarkdown = (text) => {
  if (!text) return { __html: '' }
  let html = escapeHtml(text)
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_, label, url) => `<a href="${sanitizeUrl(url)}" target="_blank" rel="noreferrer" style="color: var(--color-primary)">${label}</a>`)
    // Lists
    .replace(/^\s*\n\*/gm, '<ul>\n*')
    .replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n$2')
    .replace(/^\* (.*)/gm, '<li style="margin-left: 1.5rem; list-style-type: disc">$1</li>')
    // Paragraphs (double line break)
    .replace(/\n\n/gim, '</p><p>')
  
  html = `<p>${html}</p>`
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/gim, '')
  
  return { __html: html }
}

export default function StaticPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPage = async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()
      
      if (data && !error) {
        setPage(data)
        document.title = data.seo_title || data.title
      } else {
        setPage(false)
      }
      setLoading(false)
    }
    fetchPage()
  }, [slug])

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}>Cargando...</div>
  }

  if (page === false) {
    return (
      <div className="flex-center flex-col gap-lg" style={{ minHeight: '100vh' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900 }}>404</h1>
        <p>La página que buscas no existe o no está disponible.</p>
        <a href="/" style={{ color: 'var(--color-primary)', marginTop: '1rem' }}>Volver al inicio</a>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem', textTransform: 'uppercase', fontFamily: 'Barlow Condensed' }}>
          {page.title}
        </h1>
        <div 
          className="markdown-content" 
          style={{ lineHeight: 1.8, color: 'var(--color-text-muted)' }}
          dangerouslySetInnerHTML={parseMarkdown(page.content)}
        />
      </main>
      <GlobalFooter />
    </div>
  )
}
