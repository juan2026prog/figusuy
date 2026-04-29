import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
    // If we had the RPC, we could use it. For now, fetch from table:
    const { data } = await supabase
      .from('business_plan_rules')
      .select('*')
      .eq('plan_name', location.business_plan || 'gratis')
      .single()
    
    if (data) setPlanRules(data)
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
    if (!window.confirm('¿Eliminar esta foto?')) return
    await supabase.from('location_images').delete().eq('id', id)
    fetchImages()
  }

  const handleUploadFake = async () => {
    if (!planRules) return
    if (images.length >= planRules.max_photos) {
      alert(`Tu plan ${planRules.plan_name} permite hasta ${planRules.max_photos} foto(s). Mejorá tu plan para subir más.`)
      return
    }

    setUploading(true)
    // Simulate upload
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
    <div className="biz-photos">
      <style>{`
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .photo-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 0.75rem;
          overflow: hidden;
          position: relative;
        }
        .photo-img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          display: block;
        }
        .photo-actions {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: #0f172a;
        }
        .btn-icon {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
        }
        .btn-icon:hover {
          color: white;
        }
        .btn-icon.danger:hover {
          color: #ef4444;
        }
        
        .upload-card {
          border: 2px dashed #334155;
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 150px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        .upload-card:hover {
          border-color: #f97316;
          color: #f97316;
          background: rgba(249,115,22,0.05);
        }
        .plan-alert {
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.2);
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Gestión de Fotos</h2>
      
      {planRules && (
        <div className="plan-alert">
          <div>
            <p style={{ fontWeight: 600, color: '#f97316' }}>Plan {planRules.plan_name.toUpperCase()}</p>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Puedes subir hasta {planRules.max_photos} foto(s).</p>
          </div>
          {images.length >= planRules.max_photos && location.business_plan !== 'dominio' && (
            <button className="btn" style={{ background: '#f97316', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
              Mejorar Plan
            </button>
          )}
        </div>
      )}

      {loading ? <p>Cargando fotos...</p> : (
        <div className="photo-grid">
          {images.map(img => (
            <div key={img.id} className="photo-card">
              <img src={img.image_url} alt="Local" className="photo-img" />
              <div className="photo-actions">
                <button className="btn-icon" title="Marcar como principal"><span className="material-symbols-outlined">star</span></button>
                <button className="btn-icon danger" onClick={() => handleDelete(img.id)} title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
              </div>
            </div>
          ))}

          {(!planRules || images.length < planRules.max_photos) && (
            <div className="upload-card" onClick={handleUploadFake}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>add_photo_alternate</span>
              <span style={{ fontWeight: 600 }}>{uploading ? 'Subiendo...' : 'Subir Foto'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
