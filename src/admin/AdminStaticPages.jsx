import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'

export default function AdminStaticPages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [saving, setSaving] = useState(false)

  const fetchPages = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('static_pages').select('*').order('created_at', { ascending: false })
    if (data && !error) setPages(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleEdit = (page) => {
    setEditing(page ? { ...page } : {
      title: '', slug: '', content: '', status: 'draft', show_in_footer: false, footer_order: 0, seo_title: '', seo_description: ''
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditing(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const isNew = !editing.id
    
    let res;
    if (isNew) {
      res = await supabase.from('static_pages').insert([editing])
    } else {
      res = await supabase.from('static_pages').update({
        ...editing, updated_at: new Date().toISOString()
      }).eq('id', editing.id)
    }

    if (res.error) {
      showToast('Error al guardar página', 'error')
    } else {
      showToast('Página guardada correctamente')
      setEditing(null)
      fetchPages()
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta página?')) {
      const { error } = await supabase.from('static_pages').delete().eq('id', id)
      if (error) showToast('Error al eliminar', 'error')
      else {
        showToast('Página eliminada')
        fetchPages()
      }
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <div className="admin-generic-page">
      {!editing ? (
        <>
          <div className="ag-hero">
            <div className="ag-hero-row">
              <div>
                <h1 className="ag-title">Páginas Estáticas</h1>
                <p className="ag-desc mt-2">Administra términos, privacidad y otras páginas.</p>
              </div>
              <button className="admin-action-btn admin-action-primary" onClick={() => handleEdit(null)}>
                + Nueva Página
              </button>
            </div>
          </div>

          <div className="ag-card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Ruta</th>
                  <th>Estado</th>
                  <th>Footer</th>
                  <th>Orden</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id}>
                    <td style={{ fontWeight: 800, color: '#fff' }}>{page.title}</td>
                    <td>/p/{page.slug}</td>
                    <td>
                      <span className="ag-status" style={{ 
                        borderColor: page.status === 'published' ? 'rgba(34,197,94,.28)' : 'rgba(255,204,0,.28)',
                        color: page.status === 'published' ? 'var(--admin-green)' : 'var(--admin-yellow)',
                        background: page.status === 'published' ? 'rgba(34,197,94,.08)' : 'rgba(255,204,0,.08)'
                      }}>
                        {page.status}
                      </span>
                    </td>
                    <td>{page.show_in_footer ? 'Sí' : 'No'}</td>
                    <td>{page.footer_order}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="admin-icon-btn" onClick={() => handleEdit(page)}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span></button>
                        <button className="admin-icon-btn" onClick={() => handleDelete(page.id)}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span></button>
                        <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className="admin-icon-btn"><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span></a>
                      </div>
                    </td>
                  </tr>
                ))}
                {pages.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No hay páginas creadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="ag-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>{editing.id ? 'Editar Página' : 'Nueva Página'}</h3>
            <button className="admin-icon-btn" onClick={() => setEditing(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Título</label>
                <input type="text" name="title" value={editing.title} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
              </div>
              <div>
                <label>Slug (URL)</label>
                <input type="text" name="slug" value={editing.slug} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} placeholder="ej: privacidad" />
              </div>
            </div>

            <div>
              <label>Contenido (Soporta HTML/Markdown básico)</label>
              <textarea 
                name="content" 
                value={editing.content} 
                onChange={handleChange} 
                style={{ width: '100%', height: '300px', marginTop: '0.5rem', fontFamily: 'monospace' }}
                placeholder="# Título&#10;&#10;Párrafo de ejemplo..."
              />
              <small>Usa sintaxis markdown para dar formato rápido.</small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Estado</label>
                <select name="status" value={editing.status} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }}>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <div>
                <label>Mostrar en Footer</label>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="show_in_footer" checked={editing.show_in_footer} onChange={handleChange} />
                    Habilitado
                  </label>
                </div>
              </div>
              <div>
                <label>Orden en Footer</label>
                <input type="number" name="footer_order" value={editing.footer_order} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>SEO Title</label>
                <input type="text" name="seo_title" value={editing.seo_title || ''} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
              </div>
              <div>
                <label>SEO Description</label>
                <input type="text" name="seo_description" value={editing.seo_description || ''} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="admin-action-btn admin-action-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="admin-action-btn" onClick={() => setEditing(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  )
}
