import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { supabase } from '../lib/supabase'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }
const input = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none' }
const btn = (color = '#3b82f6') => ({ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: color, color: 'white', border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' })

const categories = ['deportes', 'anime', 'comics', 'películas', 'música', 'historia', 'naturaleza', 'otro']
const statuses = ['active', 'new', 'popular', 'coming_soon', 'archived']
const statusLabels = { active: '🟢 Activo', new: '🆕 Nuevo', popular: '🔥 Popular', coming_soon: '🔜 Próximamente', archived: '📦 Archivado' }

export default function AdminAlbums() {
  const { allAlbums, fetchAllAlbums, createAlbum, updateAlbum, deleteAlbum, loading } = useAdminStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', year: 2026, total_stickers: 670, editorial: '', country: 'Uruguay', category: 'deportes', status: 'active', special_codes: '[]', images: [] })
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => { fetchAllAlbums() }, [])

  const resetForm = () => {
    setForm({ name: '', year: 2026, total_stickers: 670, editorial: '', country: 'Uruguay', category: 'deportes', status: 'active', special_codes: '[]', images: [] })
    setEditing(null)
    setShowForm(false)
    setUploadError('')
  }

  const handleEdit = (album) => {
    setForm({
      name: album.name, year: album.year, total_stickers: album.total_stickers,
      editorial: album.editorial || '', country: album.country || 'Uruguay',
      category: album.category || 'deportes', status: album.status || 'active',
      special_codes: JSON.stringify(album.special_codes || []),
      images: album.images || (album.cover_url ? [album.cover_url] : []),
    })
    setEditing(album.id)
    setShowForm(true)
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
      images: form.images || [],
      cover_url: form.images && form.images.length > 0 ? form.images[0] : null
    }
    try { payload.special_codes = JSON.parse(form.special_codes) } catch { payload.special_codes = [] }
    
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
    
    // Check limit
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

        const { error: uploadError } = await supabase.storage
          .from('albums')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('albums')
          .getPublicUrl(filePath)

        newImageUrls.push(publicUrl)
      }
      
      setForm(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }))
    } catch (err) {
      setUploadError('Error al subir imágenes: ' + err.message)
      console.error(err)
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

  const handleDuplicate = (album) => {
    setForm({
      name: `${album.name} (copia)`, year: album.year, total_stickers: album.total_stickers,
      editorial: album.editorial || '', country: album.country || 'Uruguay',
      category: album.category || 'deportes', status: 'active',
      special_codes: JSON.stringify(album.special_codes || []),
    })
    setEditing(null)
    setShowForm(true)
  }

  const filtered = allAlbums.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>📖 Gestión de Álbumes</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{allAlbums.length} álbumes en total</p>
        </div>
        <button style={btn()} onClick={() => { resetForm(); setShowForm(true) }}>+ Crear álbum</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input style={input} placeholder="🔍 Buscar álbum..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ ...card, marginBottom: '1.5rem', borderColor: '#3b82f6' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9375rem' }}>
            {editing ? '✏️ Editar álbum' : '📖 Nuevo álbum'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Nombre *</label>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Año</label>
              <input style={input} type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Total figuritas *</label>
              <input style={input} type="number" value={form.total_stickers} onChange={e => setForm({ ...form, total_stickers: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Editorial</label>
              <input style={input} value={form.editorial} onChange={e => setForm({ ...form, editorial: e.target.value })} placeholder="Panini, Topps..." />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>País</label>
              <input style={input} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Categoría</label>
              <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Estado</label>
              <select style={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Códigos especiales (JSON)</label>
              <input style={input} value={form.special_codes} onChange={e => setForm({ ...form, special_codes: e.target.value })} placeholder='["M1","M2","LE1","PROMO1"]' />
            </div>

            {/* IMÁGENES UPLOAD (hasta 3) */}
            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Imágenes del Álbum (Máx. 3)</label>
              
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {form.images && form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: '5rem', height: '5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={img} alt="album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', width: '1.25rem', height: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem' }}>×</button>
                  </div>
                ))}
                
                {(!form.images || form.images.length < 3) && (
                  <div style={{ width: '5rem', height: '5rem', borderRadius: '0.5rem', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', cursor: 'pointer', position: 'relative' }}>
                    <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>+</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingFiles} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </div>
                )}
              </div>
              
              {uploadingFiles && <p style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Subiendo imágenes...</p>}
              {uploadError && <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{uploadError}</p>}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" style={btn()}>{editing ? 'Guardar cambios' : 'Crear álbum'}</button>
              <button type="button" style={btn('#64748b')} onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Álbum', 'Año', 'Figuritas', 'Editorial', 'Categoría', 'Estado', 'Usuarios', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0.625rem 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(album => (
              <tr key={album.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.625rem 0.5rem', fontWeight: 600 }}>{album.name}</td>
                <td style={{ padding: '0.625rem 0.5rem' }}>{album.year}</td>
                <td style={{ padding: '0.625rem 0.5rem' }}>{album.total_stickers}</td>
                <td style={{ padding: '0.625rem 0.5rem', color: '#64748b' }}>{album.editorial || '—'}</td>
                <td style={{ padding: '0.625rem 0.5rem' }}>
                  <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', background: '#eff6ff', color: '#3b82f6', fontSize: '0.6875rem', fontWeight: 600 }}>{album.category || 'deportes'}</span>
                </td>
                <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.75rem' }}>{statusLabels[album.status] || '🟢 Activo'}</td>
                <td style={{ padding: '0.625rem 0.5rem', fontWeight: 700, color: '#3b82f6' }}>{album.user_count}</td>
                <td style={{ padding: '0.625rem 0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(album)} style={{ ...btn('#f59e0b'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>✏️</button>
                    <button onClick={() => handleDuplicate(album)} style={{ ...btn('#8b5cf6'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>📋</button>
                    <button onClick={() => { if (confirm('¿Eliminar?')) deleteAlbum(album.id) }} style={{ ...btn('#ef4444'), padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No se encontraron álbumes</p>}
      </div>
    </div>
  )
}
