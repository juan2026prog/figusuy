import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UniversalAddressAutocomplete from '../components/UniversalAddressAutocomplete'
import { useToast } from '../components/Toast'

export default function BusinessProfile() {
  const { location, fetchLocation } = useOutletContext()
  const [saving, setSaving] = useState(false)
  const [previewImages, setPreviewImages] = useState([])
  const toast = useToast()

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
    partner_benefit_title: meta.partner_benefit_title || (location.business_plan === 'legend' ? '10% OFF en sobres' : ''),
    partner_benefit_desc: meta.partner_benefit_desc || (location.business_plan === 'legend' ? 'Válido para usuarios que completen y validen su álbum en tienda.' : '')
  })

  useEffect(() => {
    if (location?.id) {
      fetchPreviewImages()
    }
  }, [location?.id])

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

    if (location.business_plan === 'legend' && (!formData.partner_benefit_title.trim() || !formData.partner_benefit_desc.trim())) {
      toast.error('Las Tiendas PartnerStore deben configurar un beneficio obligatorio.')
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
          padding: 1.35rem;
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
          gap: 1rem;
        }

        .profile-preview-card {
          background:
            linear-gradient(180deg, rgba(255, 90, 0, .08) 0%, rgba(255, 90, 0, 0) 100%),
            var(--panel2);
        }

        .preview-store-card {
          border: 1px solid var(--line);
          background: #0d0d0d;
          overflow: hidden;
        }

        .preview-image {
          width: 100%;
          height: 210px;
          object-fit: cover;
          display: block;
          background: #111;
        }

        .preview-image-empty {
          width: 100%;
          height: 210px;
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, rgba(255, 90, 0, .12) 0%, rgba(255, 90, 0, .03) 26%, transparent 50%),
            #111;
          color: var(--muted2);
          font: italic 900 1.6rem 'Barlow Condensed';
          text-transform: uppercase;
        }

        .preview-body {
          padding: 1rem;
        }

        .preview-store-card h3 {
          margin: .6rem 0 0;
          font: italic 900 1.9rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .preview-store-card p {
          margin-top: .5rem;
          color: var(--muted);
          line-height: 1.55;
          font-size: .92rem;
        }

        .preview-meta {
          display: flex;
          flex-wrap: wrap;
          gap: .55rem;
          margin: 1rem 0;
        }

        .preview-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: .55rem;
        }

        .preview-action {
          padding: .72rem .6rem;
          border: 1px solid var(--line2);
          background: transparent;
          color: #fff;
          font: 900 .74rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          text-align: center;
        }

        .preview-action.primary {
          background: var(--orange);
          border-color: var(--orange);
        }

        @media (max-width: 900px) {
          .profile-grid-2,
          .preview-actions {
            grid-template-columns: 1fr;
          }
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
              <label className="form-label">Barrio o zona</label>
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
              Vende figuritas o sobres oficiales.
            </label>
          </div>

          {location?.business_plan === 'legend' && (
            <>
              <div className="biz-section-head" style={{ marginTop: '1.25rem' }}>
                <div>
                  <div className="biz-page-kicker">/ beneficio obligatorio</div>
                  <h2 style={{ fontSize: '2rem' }}>Beneficio PartnerStore</h2>
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
          <h2 className="biz-card-title">Asi te ven en FigusUY</h2>
          <p className="biz-card-copy">La vista previa te ayuda a ajustar tono, claridad y nivel de confianza antes de publicar cambios.</p>
        </div>

        <article className="preview-store-card">
          {previewImages[0]?.image_url ? (
            <img src={previewImages[0].image_url} alt={formData.name || 'Foto del local'} className="preview-image" />
          ) : (
            <div className="preview-image-empty">Sin foto principal</div>
          )}

          <div className="preview-body">
            <span className={badge.className}>{badge.text}</span>
            <h3>{formData.name || 'Nombre del local'}</h3>
            <p>{formData.display_type} · {locationStr || 'Direccion no definida'}</p>
            <p>{formData.description || 'Descripcion de tu local...'}</p>

            <div className="preview-meta">
              {formData.hours && <span className="biz-chip">{formData.hours}</span>}
              {formData.whatsapp && <span className="biz-chip orange">WhatsApp</span>}
              {formData.sells_stickers && <span className="biz-chip green">Sobres oficiales</span>}
              {location?.business_plan === 'legend' && formData.partner_benefit_title && <span className="biz-chip" style={{ background: 'linear-gradient(90deg, var(--yellow), var(--orange))', color: '#111', fontWeight: 900 }}>🎁 {formData.partner_benefit_title}</span>}
            </div>

            <div className="preview-actions">
              {formData.whatsapp && <div className="preview-action primary">WhatsApp</div>}
              <div className="preview-action">Como llegar</div>
              <div className="preview-action">Ver detalle</div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
