import React, { useEffect, useState } from 'react'
import { useAffiliateStore } from '../stores/affiliateStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })
const input = { width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--admin-line)", fontSize: "0.875rem", outline: "none", background: "#0d0d0d", color: "#fff" }
const label = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const CATEGORIES = ['gaming', 'fútbol', 'collectibles', 'lifestyle', 'anime', 'local', 'creator']
const STATUSES = ['activo', 'pausado', 'archivado']

const categoryColors = {
  gaming: { bg: '#ede9fe', color: '#7c3aed' },
  fútbol: { bg: '#dcfce7', color: '#16a34a' },
  collectibles: { bg: '#fef3c7', color: '#d97706' },
  lifestyle: { bg: '#fce7f3', color: '#db2777' },
  anime: { bg: '#e0e7ff', color: '#4f46e5' },
  local: { bg: '#f0fdfa', color: '#0d9488' },
  creator: { bg: '#fff7ed', color: '#ea580c' },
}

const statusColors = {
  activo: { bg: '#dcfce7', color: '#16a34a' },
  pausado: { bg: '#fef3c7', color: '#d97706' },
  archivado: { bg: "var(--admin-panel2)", color: "var(--admin-muted)" },
}

export default function AdminAffiliates() {
  const { affiliates, fetchAffiliates, createAffiliate, updateAffiliate, loading } = useAffiliateStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', handle: '', category: 'creator', status: 'activo',
    avatar_url: '', notes: '', contact_email: '', contact_phone: ''
  })

  useEffect(() => { fetchAffiliates() }, [])

  const resetForm = () => {
    setForm({ name: '', handle: '', category: 'creator', status: 'activo', avatar_url: '', notes: '', contact_email: '', contact_phone: '' })
    setEditing(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (a) => {
    setForm({ name: a.name, handle: a.handle, category: a.category, status: a.status, avatar_url: a.avatar_url || '', notes: a.notes || '', contact_email: a.contact_email || '', contact_phone: a.contact_phone || '' })
    setEditing(a.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.handle) return
    if (editing) {
      await updateAffiliate(editing, form)
    } else {
      await createAffiliate(form)
    }
    setShowModal(false)
    resetForm()
  }

  const toggleStatus = async (a, newStatus) => {
    await updateAffiliate(a.id, { status: newStatus })
  }

  const filtered = affiliates
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.handle.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Afiliados / Influencers</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Gestión completa de afiliados: perfiles, categorías, estado y contacto.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button onClick={openCreate} style={btn('var(--color-primary)', 'white')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>person_add</span>
          Nuevo Afiliado
        </button></div>
      </section>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Afiliados', value: affiliates.length, icon: 'people', color: '#6366f1' },
          { label: 'Activos', value: affiliates.filter(a => a.status === 'activo').length, icon: 'check_circle', color: '#16a34a' },
          { label: 'Pausados', value: affiliates.filter(a => a.status === 'pausado').length, icon: 'pause_circle', color: '#d97706' },
          { label: 'Archivados', value: affiliates.filter(a => a.status === 'archivado').length, icon: 'archive', color: "var(--admin-muted)" },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{s.value}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ key: 'all', label: 'Todos' }, ...STATUSES.map(s => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.4rem 0.875rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            background: filter === f.key ? 'var(--color-primary)' : '#fff',
            color: filter === f.key ? 'white' : "var(--admin-muted)",
            border: filter === f.key ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
            transition: 'all 0.2s'
          }}>{f.label}</button>
        ))}
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <input
            placeholder="Buscar por nombre o @handle..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...input, maxWidth: '20rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: "var(--admin-panel2)", borderBottom: '1px solid #e2e8f0' }}>
                {['Afiliado', 'Invitación', 'Categoría', 'Estado', 'Contacto', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: "var(--admin-muted)", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--admin-panel2)"}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                        background: categoryColors[a.category]?.bg || "var(--admin-panel2)",
                        color: categoryColors[a.category]?.color || "var(--admin-muted)",
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '0.875rem', flexShrink: 0
                      }}>
                        {a.avatar_url ? <img src={a.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '0.5rem', objectFit: 'cover' }} /> : a.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: "#f5f5f5", margin: 0, lineHeight: 1.2 }}>{a.name}</p>
                        <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>@{a.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {a.user_id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16a34a', fontWeight: 700 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>verified</span>
                        Vinculado
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: "var(--admin-muted)", fontWeight: 600 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>hourglass_empty</span>
                          Pendiente
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code style={{ fontSize: '0.75rem', background: "var(--admin-panel2)", padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: 600 }}>{a.invitation_code}</code>
                          <button 
                            onClick={() => {
                              const link = `${window.location.origin}/affiliate-join/${a.invitation_code}`
                              navigator.clipboard.writeText(link)
                              alert('Link de invitación copiado!')
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Copiar link de invitación"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>content_copy</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.625rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: 700,
                      background: categoryColors[a.category]?.bg || "var(--admin-panel2)",
                      color: categoryColors[a.category]?.color || "var(--admin-muted)"
                    }}>{a.category}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.625rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: 700,
                      background: statusColors[a.status]?.bg,
                      color: statusColors[a.status]?.color
                    }}>{a.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: "var(--admin-muted)" }}>
                    {a.contact_email || a.contact_phone || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button onClick={() => openEdit(a)} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), padding: '0.25rem 0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                      </button>
                      {a.status === 'activo' && (
                        <button onClick={() => toggleStatus(a, 'pausado')} style={{ ...btn('#fef3c7', '#d97706'), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pause</span>
                        </button>
                      )}
                      {a.status === 'pausado' && (
                        <button onClick={() => toggleStatus(a, 'activo')} style={{ ...btn('#dcfce7', '#16a34a'), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>play_arrow</span>
                        </button>
                      )}
                      {a.status !== 'archivado' && (
                        <button onClick={() => toggleStatus(a, 'archivado')} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>archive</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: "var(--admin-muted)" }}>No hay afiliados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>
                {editing ? 'Editar Afiliado' : 'Nuevo Afiliado'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: "var(--admin-muted)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={label}>Nombre *</label>
                <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Lucas García" />
              </div>
              <div>
                <label style={label}>@Handle *</label>
                <input style={input} value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="figuzz" />
              </div>
              <div>
                <label style={label}>Categoría</label>
                <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Estado</label>
                <select style={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Email</label>
                <input style={input} value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="email@ejemplo.com" />
              </div>
              <div>
                <label style={label}>Teléfono</label>
                <input style={input} value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+598 99 123 456" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Avatar URL</label>
                <input style={input} value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Notas internas</label>
                <textarea style={{ ...input, minHeight: '4rem', resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre el afiliado..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={btn("var(--admin-panel2)", "var(--admin-muted)")}>Cancelar</button>
              <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{editing ? 'save' : 'person_add'}</span>
                {editing ? 'Guardar' : 'Crear Afiliado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
