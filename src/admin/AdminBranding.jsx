import React, { useState, useEffect } from 'react'
import { useBrandingStore } from '../stores/brandingStore'
import Toast from '../components/Toast'

export default function AdminBranding() {
  const { settings, fetchSettings, updateSettings, uploadAsset, loading } = useBrandingStore()
  const [localSettings, setLocalSettings] = useState({})
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddMenuItem = (menuType) => {
    const items = [...(localSettings[menuType] || [])]
    items.push({ label: 'Nuevo Item', link: '/' })
    setLocalSettings({ ...localSettings, [menuType]: items })
  }

  const handleUpdateMenuItem = (menuType, index, field, value) => {
    const items = [...(localSettings[menuType] || [])]
    items[index][field] = value
    setLocalSettings({ ...localSettings, [menuType]: items })
  }

  const handleRemoveMenuItem = (menuType, index) => {
    const items = [...(localSettings[menuType] || [])]
    items.splice(index, 1)
    setLocalSettings({ ...localSettings, [menuType]: items })
  }

  const handleMoveMenuItem = (menuType, index, direction) => {
    const items = [...(localSettings[menuType] || [])]
    if (direction === 'up' && index > 0) {
      const temp = items[index]
      items[index] = items[index - 1]
      items[index - 1] = temp
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index]
      items[index] = items[index + 1]
      items[index + 1] = temp
    }
    setLocalSettings({ ...localSettings, [menuType]: items })
  }

  const handleSave = async () => {
    setSaving(true)
    let newSettings = { ...localSettings }

    try {
      if (logoFile) {
        const { url, error } = await uploadAsset(logoFile, 'header-logo')
        if (error) throw error
        newSettings.header_logo_url = url
      }

      if (faviconFile) {
        const { url, error } = await uploadAsset(faviconFile, 'favicon')
        if (error) throw error
        newSettings.favicon_url = url
      }

      const { error } = await updateSettings(newSettings)
      if (error) throw error
      
      showToast('Configuración guardada correctamente.')
      setLogoFile(null)
      setFaviconFile(null)
    } catch (err) {
      showToast('Error al guardar configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !localSettings.header_bg_color) return <div className="p-4">Cargando...</div>

  return (
    <div className="admin-generic-page">
      <div className="ag-hero">
        <div className="ag-hero-row">
          <div>
            <h1 className="ag-title">Branding y Apariencia</h1>
            <p className="ag-desc mt-2">Configura la identidad visual básica de la aplicación.</p>
          </div>
          <button className="admin-action-btn admin-action-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="ag-grid">
        <div className="admin-grid-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="ag-card">
            <h3>Header Bar</h3>
            <p>Configura la apariencia y comportamiento de la barra de navegación superior.</p>
            <div className="admin-form-grid mt-4" style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label>Mostrar Logo</label>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="header_show_logo" checked={localSettings.header_show_logo || false} onChange={handleChange} />
                    Habilitado
                  </label>
                </div>
              </div>

              <div>
                <label>Logo del Header</label>
                <input type="file" accept="image/png, image/svg+xml, image/webp" onChange={(e) => setLogoFile(e.target.files[0])} />
                <small>Tamaño recomendado: 240 x 80 px. PNG, SVG o WebP. Max 300 KB.</small>
                {localSettings.header_logo_url && !logoFile && (
                  <img src={localSettings.header_logo_url} alt="Logo" style={{ height: '40px', marginTop: '0.5rem', display: 'block', background: '#333' }} />
                )}
                {logoFile && <small style={{ display: 'block', color: 'var(--admin-green)' }}>Nuevo logo seleccionado.</small>}
              </div>

              <div>
                <label>Texto Alternativo del Logo</label>
                <input type="text" name="header_logo_alt" value={localSettings.header_logo_alt || ''} onChange={handleChange} placeholder="FigusUY" />
              </div>

              <div>
                <label>Link del Logo</label>
                <input type="text" name="header_logo_link" value={localSettings.header_logo_link || ''} onChange={handleChange} placeholder="/" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Color de Fondo</label>
                  <input type="color" name="header_bg_color" value={localSettings.header_bg_color || '#0b0b0b'} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
                </div>
                <div>
                  <label>Color Principal (Acento)</label>
                  <input type="color" name="header_primary_color" value={localSettings.header_primary_color || '#ff5a00'} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
                </div>
                <div>
                  <label>Color de Texto</label>
                  <input type="color" name="header_text_color" value={localSettings.header_text_color || '#ffffff'} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
                </div>
                <div>
                  <label>Comportamiento Sticky</label>
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="header_sticky" checked={localSettings.header_sticky || false} onChange={handleChange} />
                      Fijo al scrollear
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ag-card">
            <h3>Menú Principal (Header)</h3>
            <p>Agrega los links que aparecerán en la barra superior junto al logo.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(localSettings.header_menu_items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--admin-line)' }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input type="text" placeholder="Texto (ej: Negocios)" value={item.label} onChange={(e) => handleUpdateMenuItem('header_menu_items', idx, 'label', e.target.value)} />
                    <input type="text" placeholder="URL (ej: /stores)" value={item.link} onChange={(e) => handleUpdateMenuItem('header_menu_items', idx, 'link', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="admin-icon-btn" onClick={() => handleMoveMenuItem('header_menu_items', idx, 'up')} disabled={idx === 0}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', opacity: idx === 0 ? 0.3 : 1 }}>arrow_upward</span>
                    </button>
                    <button className="admin-icon-btn" onClick={() => handleMoveMenuItem('header_menu_items', idx, 'down')} disabled={idx === (localSettings.header_menu_items?.length || 0) - 1}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', opacity: idx === (localSettings.header_menu_items?.length || 0) - 1 ? 0.3 : 1 }}>arrow_downward</span>
                    </button>
                    <button className="admin-icon-btn" onClick={() => handleRemoveMenuItem('header_menu_items', idx)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--admin-red)' }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
              <button className="admin-action-btn" onClick={() => handleAddMenuItem('header_menu_items')} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span> Agregar Item
              </button>
            </div>
          </div>

          <div className="ag-card">
            <h3>Footer Bar</h3>
            <p>Configura el pie de página de la aplicación.</p>
            <div className="admin-form-grid mt-4" style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label>Mostrar Footer</label>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="footer_enabled" checked={localSettings.footer_enabled || false} onChange={handleChange} />
                    Habilitado
                  </label>
                </div>
              </div>

              <div>
                <label>Texto del Footer</label>
                <input type="text" name="footer_text" value={localSettings.footer_text || ''} onChange={handleChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Color de Fondo</label>
                  <input type="color" name="footer_bg_color" value={localSettings.footer_bg_color || '#090909'} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
                </div>
                <div>
                  <label>Color de Texto</label>
                  <input type="color" name="footer_text_color" value={localSettings.footer_text_color || '#f5f5f5'} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
                </div>
                <div>
                  <label>Color de Links</label>
                  <input type="color" name="footer_link_color" value={localSettings.footer_link_color || '#ff5a00'} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="ag-card">
            <h3>Menú Secundario (Footer)</h3>
            <p>Agrega los links que aparecerán en el pie de página de la plataforma.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(localSettings.footer_menu_items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--admin-line)' }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input type="text" placeholder="Texto (ej: Términos)" value={item.label} onChange={(e) => handleUpdateMenuItem('footer_menu_items', idx, 'label', e.target.value)} />
                    <input type="text" placeholder="URL (ej: /p/terminos)" value={item.link} onChange={(e) => handleUpdateMenuItem('footer_menu_items', idx, 'link', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="admin-icon-btn" onClick={() => handleMoveMenuItem('footer_menu_items', idx, 'up')} disabled={idx === 0}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', opacity: idx === 0 ? 0.3 : 1 }}>arrow_upward</span>
                    </button>
                    <button className="admin-icon-btn" onClick={() => handleMoveMenuItem('footer_menu_items', idx, 'down')} disabled={idx === (localSettings.footer_menu_items?.length || 0) - 1}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', opacity: idx === (localSettings.footer_menu_items?.length || 0) - 1 ? 0.3 : 1 }}>arrow_downward</span>
                    </button>
                    <button className="admin-icon-btn" onClick={() => handleRemoveMenuItem('footer_menu_items', idx)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--admin-red)' }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
              <button className="admin-action-btn" onClick={() => handleAddMenuItem('footer_menu_items')} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span> Agregar Item
              </button>
            </div>
          </div>

        </div>

        <div className="admin-grid-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="ag-card">
            <h3>Favicon</h3>
            <p>Icono de pestaña para el navegador.</p>
            <div className="mt-4">
              <input type="file" accept="image/png, image/x-icon, image/svg+xml" onChange={(e) => setFaviconFile(e.target.files[0])} />
              <small style={{ display: 'block', marginTop: '0.5rem' }}>Tamaño recomendado: 512 x 512 px. PNG, ICO o SVG. Max 200 KB.</small>
              {localSettings.favicon_url && !faviconFile && (
                <img src={localSettings.favicon_url} alt="Favicon" style={{ height: '32px', width: '32px', marginTop: '0.5rem', display: 'block', background: '#333' }} />
              )}
              {faviconFile && <small style={{ display: 'block', color: 'var(--admin-green)' }}>Nuevo favicon seleccionado.</small>}
            </div>
          </div>

          <div className="ag-card">
            <h3>Preview del Header</h3>
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: localSettings.header_bg_color || '#0b0b0b',
              color: localSettings.header_text_color || '#fff',
              border: '1px solid var(--admin-line)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {localSettings.header_show_logo && (
                  localSettings.header_logo_url || logoFile ? 
                    <div style={{ width: '80px', height: '30px', background: 'rgba(255,255,255,0.2)' }}>Logo img</div> :
                    <span style={{ fontWeight: 900, color: localSettings.header_primary_color || '#ff5a00' }}>{localSettings.header_logo_alt || 'LOGO'}</span>
                )}
                {(localSettings.header_menu_items || []).map((item, i) => (
                  <span key={i} style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</span>
                ))}
              </div>
              <button style={{ padding: '0.4rem 1rem', background: localSettings.header_primary_color || '#ff5a00', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Acción
              </button>
            </div>
          </div>

          <div className="ag-card">
            <h3>Preview del Footer</h3>
            {localSettings.footer_enabled && (
              <div style={{
                marginTop: '1rem',
                padding: '1.5rem',
                background: localSettings.footer_bg_color || '#090909',
                color: localSettings.footer_text_color || '#f5f5f5',
                border: '1px solid var(--admin-line)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  {(localSettings.footer_menu_items || []).map((item, i) => (
                    <span key={i} style={{ color: localSettings.footer_link_color || '#ff5a00', fontSize: '0.9rem', fontWeight: 600 }}>
                      {item.label}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{localSettings.footer_text}</p>
              </div>
            )}
            {!localSettings.footer_enabled && (
              <p className="mt-4" style={{ color: 'var(--admin-red)' }}>El footer está oculto actualmente.</p>
            )}
          </div>

        </div>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  )
}
