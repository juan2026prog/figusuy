import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminSEO() {
  const [seoConfig, setSeoConfig] = useState({})
  const [loading, setLoading] = useState(true)

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
    alert('Configuración SEO guardada')
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>travel_explore</span>
          Control de SEO y Metas
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Configuración global de títulos, descripciones, OpenGraph y Schemas de búsqueda.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <form onSubmit={handleSave} style={card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Configuración Global</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Título del Sitio (Default)</label>
              <input 
                type="text" 
                value={seoConfig.siteTitle || ''}
                onChange={(e) => setSeoConfig({...seoConfig, siteTitle: e.target.value})}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Meta Descripción (Global)</label>
              <textarea 
                value={seoConfig.metaDescription || ''}
                onChange={(e) => setSeoConfig({...seoConfig, metaDescription: e.target.value})}
                style={{ width: '100%', minHeight: '5rem', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase' }}>OG Image (URL)</label>
              <input 
                type="text" 
                value={seoConfig.ogImage || ''}
                onChange={(e) => setSeoConfig({...seoConfig, ogImage: e.target.value})}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
              />
              {seoConfig.ogImage && <img src={seoConfig.ogImage} alt="Preview" style={{ marginTop: '0.5rem', width: '100%', height: '10rem', objectFit: 'cover', borderRadius: '0.5rem' }} />}
            </div>
            <button type="submit" style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
              Guardar Configuración SEO
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ ...card, background: '#f8fafc', borderColor: '#cbd5e1' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Visualización en Google</h3>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#1a0dab', fontSize: '1.125rem', margin: 0 }}>{seoConfig.siteTitle || 'FigusUY | Intercambio de Figuritas'}</p>
              <p style={{ color: '#006621', fontSize: '0.875rem', margin: '0.125rem 0' }}>https://figusuy.com</p>
              <p style={{ color: '#545454', fontSize: '0.8125rem', margin: 0 }}>{seoConfig.metaDescription || 'La plataforma número 1 para completar tus álbumes...'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
