import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { supabase } from '../lib/supabase'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const input = { width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--admin-line)", fontSize: "0.875rem", outline: "none", background: "#0d0d0d", color: "#fff" }
const btn = (bg = 'var(--color-primary)', color = 'white', border = 'none') => ({ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: bg, color, border, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' })

const categories = ['deportes', 'anime', 'comics', 'películas', 'música', 'historia', 'naturaleza', 'otro']
const statuses = ['active', 'new', 'popular', 'coming_soon', 'archived']
const statusLabels = { active: 'Activo', new: 'Nuevo', popular: 'Popular', coming_soon: 'Próximamente', archived: 'Archivado' }
const statusColors = { active: '#10b981', new: '#3b82f6', popular: 'var(--color-primary)', coming_soon: '#f59e0b', archived: "var(--admin-muted2)" }

export default function AdminAlbums() {
  const { allAlbums, fetchAllAlbums, createAlbum, updateAlbum, deleteAlbum, loading, albumStickers, fetchAlbumStickers, upsertAlbumStickers, deleteAlbumSticker } = useAdminStore()
  const [showForm, setShowForm] = useState(false)
  const [manageStickersAlbum, setManageStickersAlbum] = useState(null)
  const [stickerForm, setStickerForm] = useState({ sticker_number: '', name: '', team: '', category: '', image_url: '' })
  const [editingSticker, setEditingSticker] = useState(null)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', year: new Date().getFullYear(), total_stickers: 670, editorial: '', country: 'Uruguay', category: 'deportes', status: 'active', is_active: true, special_codes: '[]', images: [], has_detailed_stickers: false, has_sticker_codes: false, has_sticker_names: false, has_sticker_images: false, numbering_type: 'standard' })
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [editingCodes, setEditingCodes] = useState([]) // Array of { prefix, label }

  const [csvPreviewData, setCsvPreviewData] = useState(null)
  const [csvErrors, setCsvErrors] = useState([])

  useEffect(() => { fetchAllAlbums() }, [])

  const resetForm = () => {
    setForm({ name: '', year: new Date().getFullYear(), total_stickers: 670, editorial: '', country: 'Uruguay', category: 'deportes', status: 'active', is_active: true, images: [], has_detailed_stickers: false, has_sticker_codes: false, has_sticker_names: false, has_sticker_images: false, numbering_type: 'standard' })
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
      has_detailed_stickers: album.has_detailed_stickers || false,
      has_sticker_codes: album.has_sticker_codes || false,
      has_sticker_names: album.has_sticker_names || false,
      has_sticker_images: album.has_sticker_images || false,
      numbering_type: album.numbering_type || 'standard'
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
      has_detailed_stickers: album.has_detailed_stickers || false,
      has_sticker_codes: album.has_sticker_codes || false,
      has_sticker_names: album.has_sticker_names || false,
      has_sticker_images: album.has_sticker_images || false,
      numbering_type: album.numbering_type || 'standard'
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
      special_codes: serializeSpecialCodes(editingCodes),
      has_detailed_stickers: form.has_detailed_stickers,
      has_sticker_codes: form.has_sticker_codes,
      has_sticker_names: form.has_sticker_names,
      has_sticker_images: form.has_sticker_images,
      numbering_type: form.numbering_type
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
    setCsvPreviewData(null)
    setCsvErrors([])
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

  const downloadCSVTemplate = () => {
    const isWC = manageStickersAlbum?.name?.toLowerCase().includes('world cup 2026')
    
    let content = 'album_code,album_name,section,sticker_number,sticker_code,sticker_name,team,country,type,rarity,image_url,sort_order\n'
    
    if (isWC) {
      content += 'WC2026,Panini FIFA World Cup 2026,FWC,FWC 1,FWC 1,Panini Logo,Panini,World,Logo,Common,,1\n'
      content += 'WC2026,Panini FIFA World Cup 2026,ARG,ARG 1,ARG 1,Emiliano Martinez,Argentina,Argentina,Player,Common,,2\n'
    } else {
      content += 'ALBUM01,Mi Album,Base,1,001,Figurita 1,Equipo A,Pais A,Base,Common,,1\n'
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'plantilla_figuritas.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const parseCSVLine = (text) => {
    const result = []; let col = ''; let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') { col += '"'; i++; } else { inQuotes = false; }
        } else { col += char; }
      } else {
        if (char === '"') { inQuotes = true; } else if (char === ',') { result.push(col.trim()); col = ''; } else { col += char; }
      }
    }
    result.push(col.trim());
    return result;
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split(/\\r?\\n/).filter(l => l.trim() !== '')
      if (lines.length < 2) return alert('CSV vacío o sin formato correcto')
      
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
      
      const parsedData = []
      const errors = []
      
      lines.slice(1).forEach((line, index) => {
        const values = parseCSVLine(line)
        const obj = { album_id: manageStickersAlbum.id }
        headers.forEach((h, i) => {
          if (values[i] !== undefined && values[i] !== '') {
            obj[h] = values[i]
          }
        })
        
        let rowValid = true
        // Validate required fields
        if (!obj.sticker_number) {
          errors.push(`Fila ${index + 2}: sticker_number está vacío`)
          rowValid = false
        }
        if (manageStickersAlbum.has_sticker_names && !obj.sticker_name) {
          errors.push(`Fila ${index + 2}: sticker_name está vacío pero el álbum requiere nombres`)
          rowValid = false
        }
        
        // Clean fields
        obj.sticker_number = String(obj.sticker_number).trim()
        if (obj.sticker_name) obj.sticker_name = obj.sticker_name.trim()
        if (obj.sort_order) obj.sort_order = parseInt(obj.sort_order) || 0
        
        // Map common columns directly to DB names
        const dbObj = {
          album_id: manageStickersAlbum.id,
          sticker_number: obj.sticker_number,
          name: obj.sticker_name || obj.name,
          team: obj.team,
          category: obj.category || obj.type,
          image_url: obj.image_url,
          section: obj.section,
          sticker_code: obj.sticker_code,
          country: obj.country,
          rarity: obj.rarity,
          sort_order: obj.sort_order || 0
        }

        if (rowValid) parsedData.push(dbObj)
      })
      
      setCsvPreviewData(parsedData)
      setCsvErrors(errors)
    }
    reader.readAsText(file)
  }

  const confirmCSVImport = async () => {
    if (!csvPreviewData || csvPreviewData.length === 0) return
    const err = await upsertAlbumStickers(csvPreviewData)
    if (!err) {
      fetchAlbumStickers(manageStickersAlbum.id)
      alert(`¡${csvPreviewData.length} figuritas procesadas con éxito!`)
      setCsvPreviewData(null)
      setCsvErrors([])
    } else {
      alert('Error al importar CSV: ' + err.message)
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Gestión de Álbumes</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Administra el catálogo, figuritas y metadatos ({allAlbums.length} en total)</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">library_books</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button style={btn()} onClick={() => { resetForm(); setShowForm(true) }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
          Crear Álbum
        </button></div>
      </section>

      {/* Search & Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: "var(--admin-muted)" }}>search</span>
          <input style={{ ...input, paddingLeft: '2.5rem' }} placeholder="Buscar por nombre, editorial o categoría..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ ...card, marginBottom: '2rem', border: '2px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: "#f5f5f5", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>{editing ? 'edit' : 'add_circle'}</span>
              {editing ? 'Editar Álbum' : 'Nuevo Álbum'}
            </h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: "var(--admin-muted)" }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>Nombre *</label>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>Año</label>
              <input style={input} type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>Total figuritas *</label>
              <input style={input} type="number" value={form.total_stickers} onChange={e => setForm({ ...form, total_stickers: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>Editorial</label>
              <input style={input} value={form.editorial} onChange={e => setForm({ ...form, editorial: e.target.value })} placeholder="Ej: Panini" />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>País</label>
              <input style={input} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>Categoría</label>
              <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>Sello (Status)</label>
              <select style={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: "var(--admin-muted)", display: 'block', marginBottom: '0.375rem' }}>¿Visible en la app?</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" checked={form.is_active} onChange={() => setForm({...form, is_active: true})} /> Sí
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" checked={!form.is_active} onChange={() => setForm({...form, is_active: false})} /> No (Oculto)
                </label>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', background: '#e0f2fe', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #bae6fd' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>dataset</span>
                Configuración Detallada del Álbum
              </label>
              <p style={{ fontSize: '0.75rem', color: '#0c4a6e', opacity: 0.8, marginBottom: '1rem' }}>Ajusta las capacidades de checklist detallado para este álbum (ej: Mundial Panini 2026).</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.has_detailed_stickers} onChange={e => setForm({...form, has_detailed_stickers: e.target.checked})} />
                  Habilitar Checklist Detallado
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.has_sticker_codes} onChange={e => setForm({...form, has_sticker_codes: e.target.checked})} />
                  Usar Códigos de Figuritas
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.has_sticker_names} onChange={e => setForm({...form, has_sticker_names: e.target.checked})} />
                  Requerir Nombres
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.has_sticker_images} onChange={e => setForm({...form, has_sticker_images: e.target.checked})} />
                  Usar Imágenes de Figuritas
                </label>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Tipo de Numeración</label>
                  <select style={{...input, padding: '0.375rem 0.5rem', fontSize: '0.75rem'}} value={form.numbering_type} onChange={e => setForm({...form, numbering_type: e.target.value})}>
                    <option value="standard">Estándar (1-N)</option>
                    <option value="mixed">Mixta (ARG 1, FWC 1)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', background: "rgba(249, 115, 22, 0.1)", padding: '1.25rem', borderRadius: '1rem', border: '1px solid #ffedd5' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>category</span>
                Grupos Especiales (Promos, Escudos, etc.)
              </label>
              <p style={{ fontSize: '0.75rem', color: '#7c2d12', opacity: 0.8, marginBottom: '1.25rem' }}>Define prefijos (ej: "P") y su nombre. El sistema creará una pestaña en el álbum para estas figuritas.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {editingCodes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0', alignItems: 'stretch', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: '0.625rem', overflow: 'hidden', border: '1px solid var(--color-text-secondary)' }}>
                    <div style={{ background: "var(--admin-panel2)", borderRight: '1px solid var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: '0 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: "var(--admin-muted2)", whiteSpace: 'nowrap' }}>
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
                      style={{ border: 'none', padding: '0.625rem 0.5rem', fontSize: '0.875rem', outline: 'none', width: '3rem', textAlign: 'center', fontWeight: 800, color: 'var(--color-primary)' }} 
                    />
                    <div style={{ background: "var(--admin-panel2)", borderLeft: '1px solid var(--color-text-secondary)', borderRight: '1px solid var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: '0 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: "var(--admin-muted2)", whiteSpace: 'nowrap' }}>
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
                      style={{ border: 'none', padding: '0.625rem 0.75rem', fontSize: '0.875rem', outline: 'none', flex: 2, color: "#f5f5f5", minWidth: '8rem' }} 
                    />
                    <div style={{ background: "var(--admin-panel2)", borderLeft: '1px solid var(--color-text-secondary)', borderRight: '1px solid var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: '0 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: "var(--admin-muted)", whiteSpace: 'nowrap' }}>
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
                    marginTop: '0.5rem', padding: '0.75rem', borderRadius: '0.625rem', background: "var(--admin-panel2)", color: 'var(--color-primary)', border: '2px dashed #ff9d66', 
                    fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#ff9d66'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add_circle</span>
                  Agregar Grupo Especial
                </button>
              </div>
            </div>

            {/* IMÁGENES UPLOAD */}
            <div style={{ gridColumn: '1 / -1', background: "var(--admin-panel2)", padding: '1.25rem', borderRadius: '0.75rem', border: '1px dashed var(--color-text-secondary)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 800, color: "#f5f5f5", display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>imagesmode</span>
                Galería y Portada (Máx. 3)
              </label>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {form.images && form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: '6rem', height: '8rem', borderRadius: '0.5rem', overflow: 'hidden', border: i === 0 ? '2px solid var(--color-primary)' : '1px solid #e7e5e4', boxShadow: i === 0 ? '0 0 0 2px rgba(234,88,12,0.2)' : 'none' }}>
                    {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--color-primary)', color: 'white', fontSize: '0.625rem', fontWeight: 800, textAlign: 'center', padding: '0.25rem' }}>PORTADA</div>}
                    <img src={img} alt="album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'rgba(15, 23, 42, 0.7)', color: 'white', border: 'none', width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  </div>
                ))}
                
                {(!form.images || form.images.length < 3) && (
                  <div style={{ width: '6rem', height: '8rem', borderRadius: '0.5rem', border: '2px dashed var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: "var(--admin-panel2)", cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: "var(--admin-muted)" }}>add_photo_alternate</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: "var(--admin-muted2)", marginTop: '0.5rem' }}>Subir</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingFiles} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </div>
                )}
              </div>
              
              {uploadingFiles && <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span> Subiendo imágenes...</p>}
              {uploadError && <p style={{ fontSize: '0.8125rem', color: '#ef4444', fontWeight: 700, marginTop: '1rem' }}>{uploadError}</p>}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button type="submit" style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined">{editing ? 'save' : 'check'}</span>
                {editing ? 'Guardar cambios' : 'Crear álbum'}
              </button>
              <button type="button" style={btn("var(--admin-panel2)", "var(--admin-muted)", '1px solid var(--color-text-secondary)')} onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: "var(--admin-panel2)", borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                {['Álbum', 'Detalles', 'Sello', 'Estado', 'Métricas', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '1rem', fontWeight: 800, color: "var(--admin-muted)", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(album => (
                <tr key={album.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--admin-panel2)"}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '3.5rem', borderRadius: '0.375rem', background: "var(--admin-line)", overflow: 'hidden', flexShrink: 0 }}>
                        {album.cover_url ? (
                          <img src={album.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: "var(--admin-muted)", fontSize: '1.5rem', margin: '1rem 0.5rem' }}>image</span>
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: "#f5f5f5" }}>{album.name}</p>
                        <p style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", fontWeight: 500 }}>{album.editorial || 'Sin editorial'} • {album.year}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <p style={{ fontWeight: 600, color: "var(--admin-muted)" }}>{album.total_stickers} <span style={{ fontSize: '0.75rem', color: "var(--admin-muted)", fontWeight: 500 }}>fig.</span></p>
                    <p style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", textTransform: 'capitalize', marginTop: '0.125rem' }}>{album.category || 'Deportes'}</p>
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
                        color: album.is_active !== false ? '#10b981' : "var(--admin-muted)", fontWeight: 700, fontSize: '0.8125rem'
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
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>group</span>
                        {album.user_count} <span style={{ color: "var(--admin-muted)", fontWeight: 500, fontSize: '0.6875rem' }}>usuarios</span>
                      </p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: "var(--admin-muted2)", display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pie_chart</span>
                        ~{album.avg_completion != null ? Math.round(album.avg_completion) : '—'}% <span style={{ color: "var(--admin-muted)", fontWeight: 500, fontSize: '0.6875rem' }}>completitud</span>
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(album)} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)", '1px solid var(--color-text-secondary)'), padding: '0.375rem', title: 'Editar' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
                      </button>
                      <button onClick={() => handleManageStickers(album)} style={{ ...btn("var(--admin-panel2)", '#2563eb', '1px solid var(--color-text-secondary)'), padding: '0.375rem', title: 'Figuritas' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>style</span>
                      </button>
                      <button onClick={() => handleDuplicate(album)} style={{ ...btn("var(--admin-panel2)", '#d97706', '1px solid var(--color-text-secondary)'), padding: '0.375rem', title: 'Duplicar' }}>
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
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: "var(--admin-muted)", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
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
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: "#f5f5f5", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>style</span>
                Figuritas - {manageStickersAlbum.name}
              </h3>
              <button onClick={() => setManageStickersAlbum(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: "var(--admin-muted)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              {/* Form and Bulk */}
              <div>
                <form onSubmit={handleStickerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: "var(--admin-panel2)", padding: '1rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }}>
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
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Categoría (ej: Estadio, PartnerStore)</label>
                    <input style={input} value={stickerForm.category} onChange={e => setStickerForm({...stickerForm, category: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>URL de la imagen (Opcional)</label>
                    <input style={input} value={stickerForm.image_url} onChange={e => setStickerForm({...stickerForm, image_url: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" style={{ ...btn('var(--color-primary)', 'white'), flex: 1, justifyContent: 'center' }}>{editingSticker ? 'Guardar' : 'Agregar'}</button>
                    {editingSticker && <button type="button" style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)", '1px solid var(--color-text-secondary)') }} onClick={() => { setEditingSticker(null); setStickerForm({ sticker_number: '', name: '', team: '', category: '', image_url: '' }) }}>Cancelar</button>}
                  </div>
                </form>

                <div style={{ marginTop: '1.5rem', background: '#f0f9ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0369a1' }}>Carga Masiva (CSV / Excel)</h4>
                    <button type="button" onClick={downloadCSVTemplate} style={{ background: 'none', border: 'none', color: '#0284c7', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Descargar Plantilla</button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#0c4a6e', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    Columnas soportadas: <code>album_code, album_name, section, sticker_number, sticker_code, sticker_name, team, country, type, rarity, image_url, sort_order</code>
                  </p>
                  
                  {!csvPreviewData ? (
                    <label style={{ ...btn('#0284c7', 'white'), justifyContent: 'center', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>upload_file</span>
                      Seleccionar Archivo
                      <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
                    </label>
                  ) : (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: "var(--admin-panel2)", borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }}>
                      <h5 style={{ fontWeight: 800, color: "#f5f5f5", marginBottom: '0.5rem' }}>Vista Previa de Importación</h5>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{csvPreviewData.length} filas válidas</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{csvErrors.length} errores</span>
                      </div>
                      
                      {csvErrors.length > 0 && (
                        <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: '0.75rem', borderRadius: '0.25rem', marginBottom: '1rem', maxHeight: '100px', overflowY: 'auto' }}>
                          <ul style={{ margin: 0, paddingLeft: '1rem', color: '#ef4444', fontSize: '0.75rem' }}>
                            {csvErrors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={confirmCSVImport} style={{ ...btn('#10b981', 'white'), flex: 1, justifyContent: 'center' }} disabled={csvPreviewData.length === 0}>Confirmar Importación</button>
                        <button type="button" onClick={() => { setCsvPreviewData(null); setCsvErrors([]); }} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)", '1px solid var(--color-text-secondary)') }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* List */}
              <div style={{ overflowY: 'auto', maxHeight: '60vh', border: "1px solid var(--admin-line)", borderRadius: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead style={{ background: "var(--admin-panel2)", position: 'sticky', top: 0 }}>
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
                        <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                          {s.sticker_number}
                          {s.sticker_code && <span style={{ display: 'block', fontSize: '0.625rem', color: "var(--admin-muted2)", fontWeight: 600 }}>{s.sticker_code}</span>}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {s.image_url ? <img src={s.image_url} alt={s.sticker_number} style={{ width: '2rem', height: '2.5rem', objectFit: 'cover', borderRadius: '0.25rem' }} /> : <span style={{ color: "var(--admin-muted)" }}>-</span>}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <p style={{ fontWeight: 600 }}>{s.name || '-'}</p>
                          <p style={{ color: "var(--admin-muted2)" }}>
                            {s.team || s.country} {s.section && `• Sec: ${s.section}`} {s.category && `• ${s.category}`}
                          </p>
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
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: "var(--admin-muted)" }}>No hay figuritas cargadas en este álbum</td></tr>
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
