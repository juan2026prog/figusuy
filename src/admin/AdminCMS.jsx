import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const badge = (published) => ({ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 800, background: published ? '#ecfdf5' : "var(--admin-panel2)", color: published ? '#10b981' : "var(--admin-muted)", textTransform: 'uppercase' })

export default function AdminCMS() {
  const { cmsContent, fetchCMS, createCMSContent, updateCMSContent, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ title: '', slug: '', content: '', type: 'page', is_published: false })

  useEffect(() => {
    fetchCMS()
  }, [])

  const handleEdit = (item) => {
    setEditing(item.id)
    setFormData(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editing) {
      await updateCMSContent(editing, { ...formData, updated_by: user.id })
    } else {
      await createCMSContent({ ...formData, updated_by: user.id })
    }
    setEditing(null)
    setFormData({ title: '', slug: '', content: '', type: 'page', is_published: false })
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>article</span>
          Gestión de Contenido (CMS)
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem' }}>
          Administra páginas estáticas, banners de home, tutoriales y avisos legales.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        {/* Editor */}
        <div>
          <div style={card}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editing ? 'Editar Contenido' : 'Nuevo Contenido'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Título</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Slug (URL)</label>
                  <input 
                    type="text" 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Tipo</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", background: "var(--admin-panel2)" }}
                  >
                    <option value="page">Página</option>
                    <option value="banner">Banner</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Contenido (Markdown/HTML)</label>
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  style={{ width: '100%', minHeight: '15rem', padding: '0.625rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="published" 
                  checked={formData.is_published}
                  onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                />
                <label htmlFor="published" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Publicado</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1, background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
                  {editing ? 'Guardar Cambios' : 'Crear Contenido'}
                </button>
                {editing && (
                  <button type="button" onClick={() => { setEditing(null); setFormData({ title: '', slug: '', content: '', type: 'page', is_published: false }) }} style={{ background: "var(--admin-panel2)", color: "var(--admin-muted2)", border: 'none', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: "#f5f5f5" }}>Páginas y Elementos</h2>
          {cmsContent.map(item => (
            <div key={item.id} style={{ ...card, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={badge(item.is_published)}>{item.is_published ? 'En línea' : 'Borrador'}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>{item.type}</span>
                </div>
                <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>edit</span>
                </button>
              </div>
              <h4 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0 }}>{item.title}</h4>
              <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", marginTop: '0.25rem' }}>/{item.slug}</p>
            </div>
          ))}
          {cmsContent.length === 0 && !loading && (
            <div style={{ ...card, textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>No hay contenido registrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
