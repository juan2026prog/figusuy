import React, { useEffect, useState, useRef, useCallback } from 'react'
import whpIcon from '../components/WhpIcon.png'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UniversalAddressAutocomplete from '../components/UniversalAddressAutocomplete'
import { useToast } from '../components/Toast'

export default function BusinessProfile() {
  const { location, fetchLocation } = useOutletContext()
  const [saving, setSaving] = useState(false)
  const [previewImages, setPreviewImages] = useState([])
  const toast = useToast()
  const previewRef = useRef(null)
  const scalerRef = useRef(null)
  const [previewScale, setPreviewScale] = useState(0.38)
  const [containerHeight, setContainerHeight] = useState('auto')

  if (!location) return null

  const meta = location.metadata || {}
  const [formData, setFormData] = useState({
    name: location.name || '',
    address: location.address || '',
    whatsapp: location.whatsapp || meta.whatsapp || '',
    description: meta.description || '',
    hours: meta.hours || '',
    display_type: meta.display_type || location.type || 'store',
    country: meta.country || 'Uruguay',
    department: meta.department || '',
    city: meta.city || '',
    zone: meta.zone || meta.neighborhood || '',
    allows_exchange: location.allows_exchange || false,
    sells_stickers: location.sells_stickers || false,
    partner_benefit_title: meta.partner_benefit_title || ((location.business_plan === 'legend' || location.business_plan === 'partner_store') ? '10% OFF en sobres' : ''),
    partner_benefit_desc: meta.partner_benefit_desc || ((location.business_plan === 'legend' || location.business_plan === 'partner_store') ? 'Válido para usuarios que completen y validen su álbum en tienda.' : '')
  })

  useEffect(() => {
    if (location?.id) {
      fetchPreviewImages()
    }
  }, [location?.id])

  // Dynamically compute scale and container height
  useEffect(() => {
    if (!previewRef.current) return

    const updateDimensions = () => {
      const containerWidth = previewRef.current?.clientWidth || 400
      const cardInternalWidth = 1200
      const newScale = Math.min(containerWidth / cardInternalWidth, 0.5)
      setPreviewScale(newScale)

      // After scale updates, measure internal card height
      requestAnimationFrame(() => {
        if (scalerRef.current) {
          const internalHeight = scalerRef.current.scrollHeight
          setContainerHeight(Math.ceil(internalHeight * newScale))
        }
      })
    }

    const observer = new ResizeObserver(() => updateDimensions())
    observer.observe(previewRef.current)
    updateDimensions()
    return () => observer.disconnect()
  }, [formData, previewImages])

  const fetchPreviewImages = async () => {
    const { data } = await supabase
      .from('location_images')
      .select('*')
      .eq('location_id', location.id)
      .order('sort_order', { ascending: true })

    setPreviewImages(data || [])
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const newMetadata = {
      ...meta,
      description: formData.description,
      whatsapp: formData.whatsapp,
      hours: formData.hours,
      display_type: formData.display_type,
      country: formData.country,
      department: formData.department,
      city: formData.city,
      zone: formData.zone,
      neighborhood: formData.zone,
      allows_exchange: formData.allows_exchange,
      partner_benefit_title: formData.partner_benefit_title,
      partner_benefit_desc: formData.partner_benefit_desc
    }

    const updates = {
      name: formData.name,
      address: formData.address,
      whatsapp: formData.whatsapp,
      allows_exchange: formData.allows_exchange,
      sells_stickers: formData.sells_stickers,
      metadata: newMetadata,
      type: formData.display_type === 'Punto de intercambio' ? 'safe_point' : 'store'
    }

    if ((location.business_plan === 'legend' || location.business_plan === 'partner_store') && (!formData.partner_benefit_title.trim() || !formData.partner_benefit_desc.trim())) {
      toast.error('Las Tiendas Collector Hub deben configurar un beneficio obligatorio.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id)

    if (error) {
      toast.error('Error guardando perfil: ' + error.message)
    } else {
      toast.success('Perfil guardado exitosamente')
      fetchLocation()
    }
    setSaving(false)
  }

  const isExchange = formData.allows_exchange
  const badge = isExchange
    ? { text: 'Punto de intercambio', className: 'biz-chip blue' }
    : { text: 'Tienda aliada', className: 'biz-chip green' }

  const locParts = [formData.zone, formData.department].filter(Boolean)
  const locationStr = locParts.length > 0 ? locParts.join(' · ') : formData.address

  return (
    <div className="biz-two-col">
      <style>{`
        .profile-form-card,
        .profile-preview-card {
          border: 1px solid var(--line);
          background: var(--panel);
          padding: 1rem;
        }

        .profile-form-card {
          display: grid;
          gap: 1.2rem;
        }

        .profile-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: grid;
          gap: .45rem;
        }

        .form-label {
          color: var(--muted2);
          font: 900 .78rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          border: 1px solid var(--line2);
          background: #0d0d0d;
          color: #fff;
          padding: .85rem .95rem;
          font: 600 .95rem 'Barlow', sans-serif;
          outline: none;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          border-color: var(--orange);
        }

        .service-box {
          display: grid;
          gap: .9rem;
        }

        .form-checkbox-label {
          display: flex;
          align-items: center;
          gap: .8rem;
          padding: 1rem;
          border: 1px solid var(--line);
          background: #0d0d0d;
          color: var(--muted);
          cursor: pointer;
        }

        .form-checkbox-label input {
          width: 1.1rem;
          height: 1.1rem;
        }

        .preview-shell {
          position: sticky;
          top: 1.5rem;
          display: grid;
          gap: 0;
        }

        .preview-zoom-container {
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          background: #0a0a0a;
          position: relative;
          /* height is set dynamically via JS */
        }

        .preview-scaler {
          transform-origin: top left;
          width: 1200px;
          transform: scale(var(--preview-scale, 0.38));
        }

        .preview-scaler .sf-point-card {
          pointer-events: none;
          cursor: default;
          min-height: 0;
        }

        .preview-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.06);
          font: 900 0.65rem 'Barlow Condensed';
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted2);
        }
        .preview-label .material-symbols-outlined {
          font-size: 0.9rem;
          color: var(--orange);
        }

      `}</style>

      <div className="profile-form-card">
        <div className="biz-section-head">
          <div>
            <div className="biz-page-kicker">/ perfil publico</div>
            <h2>Configura tu ficha</h2>
            <p>Edita la informacion que ve la comunidad y mejora la claridad comercial de tu local dentro del mapa.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="biz-page">
          <div className="form-group">
            <label className="form-label">Nombre del local</label>
            <input name="name" value={formData.name} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label className="form-label">Descripcion corta</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" rows="3" maxLength="150" placeholder="Ej: veni a intercambiar figuritas y encontrar sobres oficiales..." />
          </div>

          <div className="profile-grid-2">
            <div className="form-group">
              <label className="form-label">Tipo de lugar</label>
              <select name="display_type" value={formData.display_type} onChange={handleChange} className="form-select">
                <option value="store">Tienda</option>
                <option value="cafe">Cafeteria</option>
                <option value="kiosk">Kiosco</option>
                <option value="safe_point">Punto de intercambio</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="form-input" placeholder="59899123456" />
            </div>
          </div>

          <div className="form-group">
            <UniversalAddressAutocomplete
              countryCode="uy"
              label="Direccion exacta"
              value={formData.address}
              onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
              onAddressSelect={(data) => {
                setFormData(prev => ({
                  ...prev,
                  address: data.fullAddress,
                  department: data.department || prev.department,
                  city: data.city || prev.city,
                  zone: data.neighborhood || data.locality || prev.zone
                }))
              }}
              required
            />
          </div>

          <div className="profile-grid-2">
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input name="department" value={formData.department} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Barrio o radar</label>
              <input name="zone" value={formData.zone} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Horarios</label>
            <input name="hours" value={formData.hours} onChange={handleChange} className="form-input" placeholder="Lun a Vie 09 a 18 hs" />
          </div>

          <div className="biz-section-head" style={{ marginTop: '.25rem' }}>
            <div>
              <div className="biz-page-kicker">/ servicios</div>
              <h2 style={{ fontSize: '2rem' }}>Como opera tu local</h2>
            </div>
          </div>

          <div className="service-box">
            <label className="form-checkbox-label">
              <input type="checkbox" name="allows_exchange" checked={formData.allows_exchange} onChange={handleChange} />
              Permite intercambio de figuritas gratis como punto seguro.
            </label>
            <label className="form-checkbox-label">
              <input type="checkbox" name="sells_stickers" checked={formData.sells_stickers} onChange={handleChange} />
              Venta de Álbumes y sobres
            </label>
          </div>

          {(location?.business_plan === 'legend' || location?.business_plan === 'partner_store') && (
            <>
              <div className="biz-section-head" style={{ marginTop: '1.25rem' }}>
                <div>
                  <div className="biz-page-kicker">/ beneficio obligatorio</div>
                  <h2 style={{ fontSize: '2rem' }}>Beneficio Collector Hub</h2>
                  <p>Es condición del plan ofrecer un beneficio mínimo a quienes validen su álbum en tu tienda.</p>
                </div>
              </div>
              <div className="profile-grid-2">
                <div className="form-group">
                  <label className="form-label">Título del beneficio</label>
                  <input name="partner_benefit_title" value={formData.partner_benefit_title} onChange={handleChange} className="form-input" required placeholder="Ej: 10% OFF en sobres" />
                </div>
                <div className="form-group">
                  <label className="form-label">Condición / Descripción</label>
                  <input name="partner_benefit_desc" value={formData.partner_benefit_desc} onChange={handleChange} className="form-input" required placeholder="Ej: Válido para usuarios que completen y validen su álbum en tienda." />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="biz-btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <div className="preview-shell">
        <div className="profile-preview-card">
          <div className="biz-page-kicker">/ preview</div>
          <h2 className="biz-card-title" style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Así te ven en FigusUY</h2>
          <p className="biz-card-copy" style={{ fontSize: '0.8rem', marginBottom: 0 }}>Vista previa en tiempo real de tu ficha en el mapa.</p>

          <div className="preview-zoom-container" ref={previewRef} style={{ height: typeof containerHeight === 'number' ? `${containerHeight + 60}px` : containerHeight, marginTop: '30px', paddingBottom: '30px' }}>
            <div className="preview-scaler" ref={scalerRef} style={{ '--preview-scale': previewScale }}>
              <article className={`sf-point-card sf-store ${location?.business_plan === 'dominio' ? 'sf-dominio' : ''} ${location?.business_plan === 'turbo' ? 'sf-turbo' : ''} ${(location?.business_plan === 'partner_store' || location?.business_plan === 'legend') ? 'sf-hub' : ''}`}>
                <div className="sf-point-icon">
                  <div className="sf-icon-box">
                    <span className="material-symbols-outlined">storefront</span>
                  </div>
                </div>

                <div className="sf-point-body">
                  <div className="sf-point-content-row">
                    <div className="sf-point-info-col">
                      <div className="sf-badges">
                        <span className="sf-badge sf-store">{formData.allows_exchange ? '🛍 Punto de intercambio' : '🛍 Tienda aliada'}</span>
                        <span className="sf-badge">⚡ Activo ahora</span>
                        {(location?.business_plan === 'partner_store' || location?.business_plan === 'legend') && <span className="sf-badge sf-premium-badge">⭐ Punto Oficial</span>}
                      </div>

                      <h3 className="sf-point-name">{formData.name || 'Nombre del local'}</h3>
                      <p className="sf-point-loc">{formData.display_type} · {locationStr || 'Dirección'}</p>
                      <div className="sf-point-address">
                        <span className="material-symbols-outlined">location_on</span> {formData.address || 'Dirección no definida'}
                      </div>
                      {formData.description && <p className="sf-point-desc">{formData.description}</p>}
                    </div>

                    <div className="sf-features-row">
                      {formData.allows_exchange && (
                        <div className="sf-feature-highlight">
                          <span className="material-symbols-outlined sf-fh-icon">sync_alt</span>
                          <strong>Intercambio</strong>
                          <span className="sf-fh-sub">Punto seguro activo.</span>
                        </div>
                      )}
                      {formData.sells_stickers && (
                        <div className="sf-feature-highlight">
                          <span className="material-symbols-outlined sf-fh-icon">shopping_basket</span>
                          <strong>Venta Oficial</strong>
                          <span className="sf-fh-sub">Sobres disponibles.</span>
                        </div>
                      )}
                      {(location?.business_plan === 'partner_store' || location?.business_plan === 'legend') && formData.partner_benefit_title && (
                        <div className="sf-feature-highlight" style={{ border: '1px solid rgba(250,204,21,.3)', background: 'rgba(250,204,21,.05)' }}>
                          <span className="material-symbols-outlined sf-fh-icon" style={{ color: 'var(--yellow)' }}>redeem</span>
                          <strong style={{ color: 'var(--yellow)' }}>{formData.partner_benefit_title}</strong>
                          <span className="sf-fh-sub">{formData.partner_benefit_desc}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sf-point-cover">
                  {previewImages[0]?.image_url ? (
                    <img src={previewImages[0].image_url} alt="Portada" />
                  ) : (
                    <div className="preview-image-empty" style={{ height: '100%', fontSize: '0.8rem' }}>Sin foto</div>
                  )}
                </div>

                <div className="sf-point-actions">
                  {formData.whatsapp && (
                    <button className="sf-action sf-action-wa">
                      <img src={whpIcon} alt="WhatsApp" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px' }} />
                      WhatsApp
                    </button>
                  )}
                  <button className="sf-action sf-action-llegar">Cómo llegar</button>
                  <button className="sf-action sf-action-info">Info / Mapa</button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
