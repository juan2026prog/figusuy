import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLocalBusinessPlanRules } from '../lib/businessPlans'

export default function BusinessPhotos() {
  const { location } = useOutletContext()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [planRules, setPlanRules] = useState(null)

  useEffect(() => {
    if (location) {
      fetchImages()
      fetchPlanRules()
    }
  }, [location])

  const fetchPlanRules = async () => {
    const { data } = await supabase
      .from('business_plan_rules')
      .select('*')
      .eq('plan_name', location.business_plan || 'gratis')
      .single()

    setPlanRules(data || getLocalBusinessPlanRules(location.business_plan || 'gratis'))
  }

  const fetchImages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('location_images')
      .select('*')
      .eq('location_id', location.id)
      .order('sort_order', { ascending: true })

    if (!error) setImages(data || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta foto?')) return
    await supabase.from('location_images').delete().eq('id', id)
    fetchImages()
  }

  const handleUploadFake = async () => {
    if (!planRules) return
    if (images.length >= planRules.max_photos) {
      alert(`Tu plan ${planRules.plan_name} permite hasta ${planRules.max_photos} foto(s). Mejora tu plan para subir mas.`)
      return
    }

    setUploading(true)
    const url = `https://picsum.photos/seed/${Math.random()}/600/400`
    await supabase.from('location_images').insert({
      location_id: location.id,
      image_url: url,
      source: 'owner',
      sort_order: images.length
    })
    setUploading(false)
    fetchImages()
  }

  if (!location) return null

  return (
    <div className="biz-page">
      <style>{`
        .photos-top {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr);
          gap: 1.25rem;
        }

        .photos-limit-card,
        .photos-guide-card,
        .photo-card,
        .upload-card {
          border: 1px solid var(--line);
        }

        .photos-limit-card {
          padding: 1.35rem;
          background:
            linear-gradient(180deg, rgba(255, 90, 0, .1) 0%, rgba(255, 90, 0, 0) 100%),
            var(--panel2);
        }

        .photos-guide-card {
          padding: 1.35rem;
          background: var(--panel);
        }

        .photos-guide-card h3,
        .photos-limit-card h3 {
          margin-top: .5rem;
          font: italic 900 2rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .photos-guide-card p,
        .photos-limit-card p {
          margin-top: .7rem;
          color: var(--muted);
          line-height: 1.55;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }

        .photo-card {
          overflow: hidden;
          background: #0d0d0d;
        }

        .photo-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }

        .photo-actions {
          display: flex;
          justify-content: space-between;
          gap: .6rem;
          padding: .8rem;
          background: var(--panel);
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.3rem;
          height: 2.3rem;
          border: 1px solid var(--line2);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
        }

        .btn-icon:hover {
          color: #fff;
          border-color: var(--orange);
        }

        .btn-icon.danger:hover {
          color: #fca5a5;
          border-color: rgba(239, 68, 68, .35);
        }

        .upload-card {
          min-height: 214px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          background: transparent;
          border-style: dashed;
          color: var(--muted);
          cursor: pointer;
          transition: .2s ease;
        }

        .upload-card:hover {
          border-color: var(--orange);
          color: var(--orange);
          background: rgba(255, 90, 0, .05);
        }

        .upload-card .material-symbols-outlined {
          font-size: 2.5rem;
        }

        @media (max-width: 900px) {
          .photos-top {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="biz-section-head">
        <div>
          <div className="biz-page-kicker">/ fotos del local</div>
          <h2>Mejora tu frente visual</h2>
          <p>Las imagenes correctas elevan confianza, ayudan a ubicar el local y mejoran la calidad percibida de tu punto.</p>
        </div>
      </div>

      <section className="photos-top">
        <div className="photos-limit-card">
          <div className="biz-page-kicker">/ capacidad</div>
          <h3>Gestiona tu cupo de imagenes</h3>
          <p>{planRules ? `Tu plan ${planRules.plan_name.toUpperCase()} permite hasta ${planRules.max_photos} foto(s).` : 'Cargando reglas del plan...'}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.55rem', marginTop: '1rem' }}>
            <span className="biz-chip orange">Subidas: {images.length}</span>
            {planRules && <span className="biz-chip">{planRules.max_photos} maximo</span>}
          </div>
        </div>

        <aside className="photos-guide-card">
          <div className="biz-page-kicker">/ recomendacion</div>
          <h3>Evita fotos genericas</h3>
          <p>Muestra frente, interior y punto de intercambio real. Las imagenes deben ayudar a reconocer el lugar y transmitir confianza.</p>
          {planRules && images.length >= planRules.max_photos && location.business_plan !== 'legend' && (
            <button className="biz-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Mejorar plan</button>
          )}
        </aside>
      </section>

      {loading ? (
        <div className="biz-card"><p className="biz-text-muted">Cargando fotos...</p></div>
      ) : (
        <div className="photo-grid">
          {images.map(img => (
            <div key={img.id} className="photo-card">
              <img src={img.image_url} alt="Local" className="photo-img" />
              <div className="photo-actions">
                <button className="btn-icon" title="Marcar como principal">
                  <span className="material-symbols-outlined">star</span>
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(img.id)} title="Eliminar">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}

          {(!planRules || images.length < planRules.max_photos) && (
            <div className="upload-card" onClick={handleUploadFake}>
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <strong style={{ font: "italic 900 1.5rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>
                {uploading ? 'Subiendo...' : 'Subir foto'}
              </strong>
              <span style={{ fontSize: '.9rem', textAlign: 'center', maxWidth: '14rem' }}>Agrega una imagen clara para reforzar la ficha de tu local.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
