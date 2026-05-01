import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }
const input = { width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a' }
const btn = (bg = '#ea580c', color = 'white', border = 'none') => ({ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: bg, color, border, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' })

const categories = ['deportes', 'anime', 'comics', 'películas', 'música', 'historia', 'naturaleza', 'otro']
const statuses = ['active', 'new', 'popular', 'coming_soon', 'archived']
const statusLabels = { active: 'Activo', new: 'Nuevo', popular: 'Popular', coming_soon: 'Próximamente', archived: 'Archivado' }
const statusColors = { active: '#10b981', new: '#3b82f6', popular: '#ea580c', coming_soon: '#f59e0b', archived: '#64748b' }

export default function AdminAlbums() {
  const { allAlbums, fetchAllAlbums, createAlbum, updateAlbum, deleteAlbum, loading, albumStickers, fetchAlbumStickers, upsertAlbumStickers, deleteAlbumSticker } = useAdminStore()
  const [showForm, setShowForm] = useState(false)
  const [manageStickersAlbum, setManageStickersAlbum] = useState(null)
  const [stickerForm, setStickerForm] = useState({ sticker_number: '', name: '', team: '', category: '', image_url: '' })
  const [editingSticker, setEditingSticker] = useState(null)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', year: new Date().getFullYear(), total_stickers: 670, editorial: '', country: 'Uruguay', category: 'deportes', status: 'active', is_active: true, special_codes: '[]', images: [] })
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [editingCodes, setEditingCodes] = useState([]) // Array of { prefix, label }

  useEffect(() => { fetchAllAlbums() }, [])

  const resetForm = () => {
    setForm({ name: '', year: new Date().getFullYear(), total_stickers: 670, editorial: '', country: 'Uruguay', category: 'deportes', status: 'active', is_active: true, images: [] })
    setEditingCodes([])
    setEditing(null)
    setShowForm(false)
    setUploadError('')
  }

  const parseSpecialCodes = (codes) => {
    if (!codes) return []
    if (Array.isArray(codes)) {
      return codes.map(c => ({ prefix: c, label: `Especiales ${c}`, sequence: '' }))
    }
    if (typeof codes === 'object') {
      return Object.entries(codes).map(([prefix, val]) => {
        if (typeof val === 'object' && val !== null) {
          return { prefix, label: val.label || '', sequence: val.sequence || '' }
        }
        return { prefix, label: val || '', sequence: '' }
      })
    }
    return []
  }

  const serializeSpecialCodes = (codesArray) => {
    const obj = {}
    codesArray.forEach(c => {
      if (c.prefix) {
        obj[c.prefix.toUpperCase()] = {
          label: c.label || `Especiales ${c.prefix}`,
          sequence: c.sequence || ''
        }
      }
    })
    return obj
  }

  const handleEdit = (album) => {
    setForm({
      name: album.name, year: album.year, total_stickers: album.total_stickers,
      editorial: album.editorial || '', country: album.country || 'Uruguay',
      category: album.category || 'deportes', status: album.status || 'active',
      is_active: album.is_active !== false,
      images: album.images || (album.cover_url ? [album.cover_url] : []),
    })
    setEditingCodes(parseSpecialCodes(album.special_codes))
    setEditing(album.id)
    setShowForm(true)
  }

  const handleDuplicate = (album) => {
    setForm({
      name: `${album.name} (copia)`, year: album.year, total_stickers: album.total_stickers,
      editorial: album.editorial || '', country: album.country || 'Uruguay',
      category: album.category || 'deportes', status: 'coming_soon', is_active: false,
      images: album.images || (album.cover_url ? [album.cover_url] : []),
    })
    setEditingCodes(parseSpecialCodes(album.special_codes))
    setEditing(null)
    setShowForm(true)
  }

  const toggleActive = async (album) => {
    await updateAlbum(album.id, { is_active: !album.is_active })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { 
      name: form.name, 
      year: parseInt(form.year), 
      total_stickers: parseInt(form.total_stickers),
      editorial: form.editorial,
      country: form.country,
      category: form.category,
      status: form.status,
      is_active: form.is_active,
      images: form.images || [],
      cover_url: form.images && form.images.length > 0 ? form.images[0] : null,
      special_codes: serializeSpecialCodes(editingCodes)
    }
    
    let error
    if (editing) {
      error = await updateAlbum(editing, payload)
    } else {
      error = await createAlbum(payload)
    }
    
    if (error) {
      setUploadError(error.message || 'Error al guardar el álbum. Revisa los permisos o los datos.')
    } else {
      resetForm()
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    if (form.images.length + files.length > 3) {
      setUploadError('Máximo 3 imágenes por álbum')
      return
    }

    setUploadingFiles(true)
    setUploadError('')
    
    try {
      const newImageUrls = []
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `covers/${fileName}`

        const { error: uploadError } = await supabase.storage.from('albums').upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('albums').getPublicUrl(filePath)
        newImageUrls.push(publicUrl)
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }))
    } catch (err) {
      setUploadError('Error al subir imágenes: ' + err.message)
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeImage = (index) => {
    setForm(prev => {
      const newImages = [...prev.images]
      newImages.splice(index, 1)
      return { ...prev, images: newImages }
    })
  }

  const filtered = allAlbums.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  const handleManageStickers = (album) => {
    setManageStickersAlbum(album)
    fetchAlbumStickers(album.id)
  }

  const handleStickerSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...stickerForm, album_id: manageStickersAlbum.id }
    if (editingSticker) {
      payload.id = editingSticker.id
    }
    const err = await upsertAlbumStickers([payload])
    if (!err) {
      setStickerForm({ sticker_number: '', name: '', team: '', category: '', image_url: '' })
      setEditingSticker(null)
      fetchAlbumStickers(manageStickersAlbum.id)
    } else {
      alert('Error: ' + err.message)
    }
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length < 2) return alert('CSV vacío o sin formato correcto')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const stickers = lines.slice(1).map(line => {
        // simple split that ignores commas inside quotes is hard, using simple split for now
        // Assuming format: sticker_number,name,category,team,image_url
        const values = line.split(',')
        const obj = { album_id: manageStickersAlbum.id }
        headers.forEach((h, i) => {
          if (values[i] && values[i].trim() !== '') {
            obj[h] = values[i].trim().replace(/^"|"$/g, '')
          }
        })
        return obj
      }).filter(s => s.sticker_number)
      
      if (stickers.length > 0) {
        const err = await upsertAlbumStickers(stickers)
        if (!err) {
          fetchAlbumStickers(manageStickersAlbum.id)
          alert(`¡${stickers.length} figuritas cargadas con éxito!`)
        } else {
          alert('Error al subir CSV: ' + err.message)
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>library_books</span>
            Gestión de Álbumes
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Administra el catálogo, figuritas y metadatos ({allAlbums.length} en total)
          </p>
        </div>
        <button style={btn()} onClick={() => { resetForm(); setShowForm(true) }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
          Crear Álbum
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
          <input style={{ ...input, paddingLeft: '2.5rem' }} placeholder="Buscar por nombre, editorial o categoría..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ ...card, marginBottom: '2rem', border: '2px solid #ea580c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>{editing ? 'edit' : 'add_circle'}</span>
              {editing ? 'Editar Álbum' : 'Nuevo Álbum'}
            </h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Nombre *</label>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Año</label>
              <input style={input} type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Total figuritas *</label>
              <input style={input} type="number" value={form.total_stickers} onChange={e => setForm({ ...form, total_stickers: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Editorial</label>
              <input style={input} value={form.editorial} onChange={e => setForm({ ...form, editorial: e.target.value })} placeholder="Ej: Panini" />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>País</label>
              <input style={input} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Categoría</label>
              <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Sello (Status)</label>
              <select style={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>¿Visible en la app?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" checked={form.is_active} onChange={() => setForm({...form, is_active: true})} /> Sí
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" checked={!form.is_active} onChange={() => setForm({...form, is_active: false})} /> No (Oculto)
                </label>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', background: '#fff7ed', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #ffedd5' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>category</span>
                Grupos Especiales (Promos, Escudos, etc.)
              </label>
              <p style={{ fontSize: '0.75rem', color: '#7c2d12', opacity: 0.8, marginBottom: '1.25rem' }}>Define prefijos (ej: "P") y su nombre. El sistema creará una pestaña en el álbum para estas figuritas.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {editingCodes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0', alignItems: 'stretch', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: '0.625rem', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <div style={{ background: '#f1f5f9', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', padding: '0 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                      Prefijo
                    </div>
                    <input 
                      placeholder="P" 
                      value={c.prefix} 
                      onChange={e => {
                        const next = [...editingCodes]; 
                        next[i].prefix = e.target.value.toUpperCase(); 
                        setEditingCodes(next)
                      }}
                      style={{ border: 'none', padding: '0.625rem 0.5rem', fontSize: '0.875rem', outline: 'none', width: '3rem', textAlign: 'center', fontWeight: 800, color: '#ea580c' }} 
                    />
                    <div style={{ background: '#f1f5f9', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', padding: '0 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                      Nombre
                    </div>
                    <input 
                      placeholder="Promo Coca Cola" 
                      value={c.label} 
                      onChange={e => {
                        const next = [...editingCodes]; 
                        next[i].label = e.target.value; 
                        setEditingCodes(next)
                      }}
                      style={{ border: 'none', padding: '0.625rem 0.75rem', fontSize: '0.875rem', outline: 'none', flex: 2, color: '#0f172a', minWidth: '8rem' }} 
                    />
                    <div style={{ background: '#f8fafc', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', padding: '0 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                      Secuencia (1-34, A-M)
                    </div>
                    <input 
                      placeholder="1-34" 
                      value={c.sequence} 
                      onChange={e => {
                        const next = [...editingCodes]; 
                        next[i].sequence = e.target.value; 
                        setEditingCodes(next)
                      }}
                      style={{ border: 'none', padding: '0.625rem 0.75rem', fontSize: '0.875rem', outline: 'none', flex: 1, color: '#0369a1', fontWeight: 600, background: '#f0f9ff' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const next = [...editingCodes]; 
                        next.splice(i, 1); 
                        setEditingCodes(next)
                      }}
                      style={{ background: '#fff1f2', color: '#e11d48', border: 'none', borderLeft: '1px solid #fecdd3', padding: '0 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Eliminar grupo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={() => setEditingCodes([...editingCodes, { prefix: '', label: '', sequence: '' }])}
                  style={{ 
                    marginTop: '0.5rem', padding: '0.75rem', borderRadius: '0.625rem', background: 'white', color: '#ea580c', border: '2px dashed #ff9d66', 
                    fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#ff9d66'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add_circle</span>
                  Agregar Grupo Especial
                </button>
              </div>
            </div>

            {/* IMÁGENES UPLOAD */}
            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>imagesmode</span>
                Galería y Portada (Máx. 3)
              </label>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {form.images && form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: '6rem', height: '8rem', borderRadius: '0.5rem', overflow: 'hidden', border: i === 0 ? '2px solid #ea580c' : '1px solid #e7e5e4', boxShadow: i === 0 ? '0 0 0 2px rgba(234,88,12,0.2)' : 'none' }}>
                    {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#ea580c', color: 'white', fontSize: '0.625rem', fontWeight: 800, textAlign: 'center', padding: '0.25rem' }}>PORTADA</div>}
                    <img src={img} alt="album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'rgba(15, 23, 42, 0.7)', color: 'white', border: 'none', width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  </div>
                ))}
                
                {(!form.images || form.images.length < 3) && (
                  <div style={{ width: '6rem', height: '8rem', borderRadius: '0.5rem', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#94a3b8' }}>add_photo_alternate</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', marginTop: '0.5rem' }}>Subir</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingFiles} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </div>
                )}
              </div>
              
              {uploadingFiles && <p style={{ fontSize: '0.8125rem', color: '#ea580c', fontWeight: 700, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span> Subiendo imágenes...</p>}
              {uploadError && <p style={{ fontSize: '0.8125rem', color: '#ef4444', fontWeight: 700, marginTop: '1rem' }}>{uploadError}</p>}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button type="submit" style={btn('#ea580c', 'white')}>
                <span className="material-symbols-outlined">{editing ? 'save' : 'check'}</span>
                {editing ? 'Guardar cambios' : 'Crear álbum'}
              </button>
              <button type="button" style={btn('#f1f5f9', '#475569', '1px solid #cbd5e1')} onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                {['Álbum', 'Detalles', 'Sello', 'Estado', 'Métricas', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '1rem', fontWeight: 800, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(album => (
                <tr key={album.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '3.5rem', borderRadius: '0.375rem', background: '#e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
                        {album.cover_url ? (
                          <img src={album.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '1.5rem', margin: '1rem 0.5rem' }}>image</span>
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: '#0f172a' }}>{album.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{album.editorial || 'Sin editorial'} • {album.year}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <p style={{ fontWeight: 600, color: '#475569' }}>{album.total_stickers} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>fig.</span></p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', marginTop: '0.125rem' }}>{album.category || 'Deportes'}</p>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700,
                      background: `${statusColors[album.status || 'active']}15`, 
                      color: statusColors[album.status || 'active']
                    }}>
                      {statusLabels[album.status || 'active']}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => toggleActive(album)}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
                        color: album.is_active !== false ? '#10b981' : '#94a3b8', fontWeight: 700, fontSize: '0.8125rem'
                      }}
                      title="Click para cambiar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                        {album.is_active !== false ? 'toggle_on' : 'toggle_off'}
                      </span>
                      {album.is_active !== false ? 'Público' : 'Oculto'}
                    </button>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>group</span>
                        {album.user_count} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.6875rem' }}>usuarios</span>
                      </p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pie_chart</span>
                        ~{album.avg_completion != null ? Math.round(album.avg_completion) : '—'}% <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.6875rem' }}>completitud</span>
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(album)} style={{ ...btn('#f1f5f9', '#475569', '1px solid #cbd5e1'), padding: '0.375rem', title: 'Editar' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
                      </button>
                      <button onClick={() => handleManageStickers(album)} style={{ ...btn('#f1f5f9', '#2563eb', '1px solid #cbd5e1'), padding: '0.375rem', title: 'Figuritas' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>style</span>
                      </button>
                      <button onClick={() => handleDuplicate(album)} style={{ ...btn('#f1f5f9', '#d97706', '1px solid #cbd5e1'), padding: '0.375rem', title: 'Duplicar' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>content_copy</span>
                      </button>
                      <button onClick={() => { if (confirm(`¿Estás seguro de eliminar el álbum "${album.name}"? Esta acción no se puede deshacer.`)) deleteAlbum(album.id) }} style={{ ...btn('#fef2f2', '#ef4444', '1px solid #fca5a5'), padding: '0.375rem', title: 'Eliminar' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>search_off</span>
              <p style={{ fontWeight: 600 }}>No se encontraron álbumes</p>
            </div>
          )}
        </div>
      </div>
      {/* Stickers Modal */}
      {manageStickersAlbum && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '64rem', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>style</span>
                Figuritas - {manageStickersAlbum.name}
              </h3>
              <button onClick={() => setManageStickersAlbum(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              {/* Form and Bulk */}
              <div>
                <form onSubmit={handleStickerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.875rem' }}>{editingSticker ? 'Editar Figurita' : 'Agregar Figurita Individual'}</h4>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Número/Código *</label>
                    <input style={input} required value={stickerForm.sticker_number} onChange={e => setStickerForm({...stickerForm, sticker_number: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nombre / Jugador</label>
                    <input style={input} value={stickerForm.name} onChange={e => setStickerForm({...stickerForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Equipo / Selección</label>
                    <input style={input} value={stickerForm.team} onChange={e => setStickerForm({...stickerForm, team: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Categoría (ej: Estadio, Legend)</label>
                    <input style={input} value={stickerForm.category} onChange={e => setStickerForm({...stickerForm, category: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>URL de la imagen (Opcional)</label>
                    <input style={input} value={stickerForm.image_url} onChange={e => setStickerForm({...stickerForm, image_url: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" style={{ ...btn('#ea580c', 'white'), flex: 1, justifyContent: 'center' }}>{editingSticker ? 'Guardar' : 'Agregar'}</button>
                    {editingSticker && <button type="button" style={{ ...btn('#f1f5f9', '#475569', '1px solid #cbd5e1') }} onClick={() => { setEditingSticker(null); setStickerForm({ sticker_number: '', name: '', team: '', category: '', image_url: '' }) }}>Cancelar</button>}
                  </div>
                </form>

                <div style={{ marginTop: '1.5rem', background: '#f0f9ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0369a1' }}>Carga Masiva (CSV)</h4>
                  <p style={{ fontSize: '0.75rem', color: '#0c4a6e', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    Sube un CSV con columnas: <code>sticker_number, name, team, category, image_url</code>. Sólo <code>sticker_number</code> es obligatorio.
                  </p>
                  <label style={{ ...btn('#0284c7', 'white'), justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>upload_file</span>
                    Seleccionar CSV
                    <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* List */}
              <div style={{ overflowY: 'auto', maxHeight: '60vh', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Nº/Cod</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Imagen</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Info</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {albumStickers.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 800 }}>{s.sticker_number}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {s.image_url ? <img src={s.image_url} alt={s.sticker_number} style={{ width: '2rem', height: '2.5rem', objectFit: 'cover', borderRadius: '0.25rem' }} /> : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <p style={{ fontWeight: 600 }}>{s.name || '-'}</p>
                          <p style={{ color: '#64748b' }}>{s.team} {s.category && `• ${s.category}`}</p>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingSticker(s); setStickerForm({ sticker_number: s.sticker_number, name: s.name || '', team: s.team || '', category: s.category || '', image_url: s.image_url || '' }) }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span></button>
                            <button onClick={async () => { if(confirm('¿Eliminar figurita?')) { await deleteAlbumSticker(s.id); fetchAlbumStickers(manageStickersAlbum.id) } }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {albumStickers.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay figuritas cargadas en este álbum</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
