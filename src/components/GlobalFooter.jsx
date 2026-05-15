import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBrandingStore } from '../stores/brandingStore'

export default function GlobalFooter() {
  const { settings, footerPages, fetchFooterPages } = useBrandingStore()

  useEffect(() => {
    void fetchFooterPages()
  }, [fetchFooterPages])

  if (!settings.footer_enabled) return null

  return (
    <footer style={{
      backgroundColor: settings.footer_bg_color || '#090909',
      color: settings.footer_text_color || '#f5f5f5',
      padding: '3rem 2rem 2rem',
      marginTop: 'auto',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        
        {settings.header_show_logo && (
          <div style={{ marginBottom: '1rem' }}>
            {(settings.header_logo_url && settings.header_logo_url !== 'null') ? (
              <img 
                src={settings.header_logo_url} 
                alt={settings.header_logo_alt || 'FigusUY'} 
                style={{ height: '40px', width: 'auto', display: 'block' }} 
                loading="lazy" 
                decoding="async" 
              />
            ) : (
              <img 
                src="/logo.webp" 
                alt="FigusUY" 
                style={{ height: '40px', width: 'auto', display: 'block' }} 
              />
            )}
          </div>
        )}

        <nav style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1.5rem',
          marginBottom: '1rem'
        }}>
          {footerPages && footerPages.length > 0 && footerPages.filter(p => p.slug !== 'contacto').map((page) => (
            <Link 
              key={page.slug} 
              to={`/p/${page.slug}`}
              style={{ 
                color: settings.footer_link_color || '#ff5a00',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {page.title}
            </Link>
          ))}
          <Link 
            to="/p/contacto"
            style={{ 
              color: settings.footer_link_color || '#ff5a00',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Contacto
          </Link>
        </nav>

        <div style={{
          opacity: 0.6,
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          {settings.footer_text || '© 2026 FigusUY. Todos los derechos reservados.'}
        </div>
      </div>
    </footer>
  )
}
