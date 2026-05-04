import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const card = { background: 'var(--admin-panel)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--admin-line)' }

export default function AdminSEO() {
  const [seoConfig, setSeoConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchSEO()
  }, [])

  const fetchSEO = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('key', 'seo_config').single()
    if (data) setSeoConfig(data.value)
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    await supabase.from('app_settings').upsert({ key: 'seo_config', value: seoConfig }, { onConflict: 'key' })
    toast.success('Configuracion SEO guardada')
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#f5f5f5', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>travel_explore</span>
          Control de SEO y Metas
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--admin-muted2)', marginTop: '0.25rem' }}>
          Configuracion global de titulos, descripciones, OpenGraph y schemas de busqueda.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <form onSubmit={handleSave} style={card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Configuracion Global</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-muted2)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Titulo del Sitio</label>
              <input
                type="text"
                value={seoConfig.siteTitle || ''}
                onChange={(e) => setSeoConfig({ ...seoConfig, siteTitle: e.target.value })}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-muted2)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Meta Descripcion</label>
              <textarea
                value={seoConfig.metaDescription || ''}
                onChange={(e) => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
                style={{ width: '100%', minHeight: '5rem', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-muted2)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>OG Image URL</label>
              <input
                type="text"
                value={seoConfig.ogImage || ''}
                onChange={(e) => setSeoConfig({ ...seoConfig, ogImage: e.target.value })}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)' }}
              />
              {seoConfig.ogImage && <img src={seoConfig.ogImage} alt="Preview" style={{ marginTop: '0.5rem', width: '100%', height: '10rem', objectFit: 'cover', borderRadius: '0.5rem' }} />}
            </div>
            <button type="submit" style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
              Guardar Configuracion SEO
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ ...card, background: 'var(--admin-panel2)', borderColor: 'var(--admin-muted)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--admin-line)' }}>Vista previa en Google</h3>
            <div style={{ background: 'var(--admin-panel2)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)' }}>
              <p style={{ color: '#1a0dab', fontSize: '1.125rem', margin: 0 }}>{seoConfig.siteTitle || 'FigusUY | Intercambio de Figuritas'}</p>
              <p style={{ color: '#006621', fontSize: '0.875rem', margin: '0.125rem 0' }}>https://figusuy.com</p>
              <p style={{ color: '#545454', fontSize: '0.8125rem', margin: 0 }}>{seoConfig.metaDescription || 'La plataforma numero 1 para completar tus albumes.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
