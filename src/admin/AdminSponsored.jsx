import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminSponsored() {
  const [placements, setPlacements] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    placement_type: 'points_featured',
    album_id: '',
    ends_at: '',
    is_active: true,
    priority: 0,
    cta_label: '',
    cta_url: '',
    whatsapp: '',
    target_neighborhood: '',
    target_department: ''
  });
  const [images, setImages] = useState([{ url: '', is_main: true }]);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, aRes] = await Promise.all([
      supabase.from('sponsored_placements').select('*').order('created_at', { ascending: false }),
      supabase.from('albums').select('id, name').order('name')
    ]);
    if (pRes.data) setPlacements(pRes.data);
    if (aRes.data) setAlbums(aRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.album_id) payload.album_id = null;
    if (!payload.ends_at) payload.ends_at = null;
    else payload.ends_at = new Date(payload.ends_at).toISOString();

    const { data: promo, error } = await supabase.from('sponsored_placements').insert(payload).select().single();
    if (!error && promo) {
      // Insert images
      const validImages = images.filter(i => i.url);
      if (validImages.length > 0) {
        const imagePayload = validImages.map((img, idx) => ({
          sponsored_placement_id: promo.id,
          image_url: img.url,
          source: 'admin_uploaded',
          sort_order: idx,
          is_main: img.is_main
        }));
        await supabase.from('sponsored_images').insert(imagePayload);
      }
      
      setIsCreating(false);
      setFormData({
        title: '', description: '', placement_type: 'points_featured', album_id: '', ends_at: '',
        is_active: true, priority: 0, cta_label: '', cta_url: '', whatsapp: '', target_neighborhood: '', target_department: ''
      });
      setImages([{ url: '', is_main: true }]);
      fetchData();
    } else {
      alert('Error creando promo');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    await supabase.from('sponsored_placements').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  return (
    <div className="page" style={{ padding: '2rem 1rem' }}>
      <h1 className="text-3xl font-black mb-1xl">Gestión de Visibilidad Patrocinada</h1>
      
      {!isCreating ? (
        <button className="btn btn-primary mb-xl" onClick={() => setIsCreating(true)}>
          Crear Nueva Promo
        </button>
      ) : (
        <div className="card mb-xl">
          <h2 className="text-xl font-bold mb-lg">Nueva Promo</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input type="text" className="input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="input" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Placement Type</label>
              <select className="input" value={formData.placement_type} onChange={e => setFormData({...formData, placement_type: e.target.value})}>
                <option value="points_featured">points_featured</option>
                <option value="store_featured">store_featured</option>
                <option value="album_contextual">album_contextual</option>
                <option value="exchange_contextual">exchange_contextual</option>
                <option value="home_contextual">home_contextual</option>
              </select>
            </div>
            
            {(formData.placement_type === 'album_contextual') && (
              <div className="form-group">
                <label className="form-label">Álbum Relacionado</label>
                <select className="input" value={formData.album_id} onChange={e => setFormData({...formData, album_id: e.target.value})}>
                  <option value="">Ninguno</option>
                  {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Fecha Expiración (ends_at)</label>
              <input type="datetime-local" className="input" value={formData.ends_at} onChange={e => setFormData({...formData, ends_at: e.target.value})} />
            </div>

            <h3 className="text-lg font-bold mt-xl mb-sm">Imágenes (Máx 3)</h3>
            {images.map((img, idx) => (
              <div key={idx} className="form-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="url" className="input" placeholder="URL de la imagen" value={img.url} onChange={e => {
                  const newI = [...images]; newI[idx].url = e.target.value; setImages(newI);
                }} />
                <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  <input type="radio" name="is_main" checked={img.is_main} onChange={() => {
                    const newI = images.map((i, iidx) => ({ ...i, is_main: iidx === idx }));
                    setImages(newI);
                  }} /> Principal
                </label>
              </div>
            ))}
            {images.length < 3 && (
              <button type="button" className="btn btn-secondary btn-sm mb-md" onClick={() => setImages([...images, { url: '', is_main: false }])}>
                + Agregar Imagen
              </button>
            )}

            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input type="text" className="input" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">CTA Label</label>
              <input type="text" className="input" value={formData.cta_label} onChange={e => setFormData({...formData, cta_label: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">CTA URL</label>
              <input type="text" className="input" value={formData.cta_url} onChange={e => setFormData({...formData, cta_url: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Guardar</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {placements.map(p => (
            <div key={p.id} className="card flex-between">
              <div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="text-sm text-secondary">{p.placement_type} | Expira: {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : 'Nunca'}</p>
                <p className="text-xs text-muted">Álbum ID: {p.album_id || 'N/A'}</p>
              </div>
              <div>
                <button 
                  className={`btn ${p.is_active ? 'btn-danger' : 'btn-success'}`}
                  style={{ backgroundColor: p.is_active ? 'var(--color-danger)' : 'var(--color-success)', color: 'white' }}
                  onClick={() => toggleActive(p.id, p.is_active)}
                >
                  {p.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
