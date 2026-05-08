import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../components/Toast'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })
const input = { width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--admin-line)", fontSize: "0.875rem", outline: "none", background: "#0d0d0d", color: "#fff" }

export default function AdminInfluencerApplications() {
  const { influencerApplications, fetchInfluencerApplications, updateInfluencerApplication, loading } = useAdminStore()
  const { user: adminUser } = useAuthStore()
  const toast = useToast()
  
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchInfluencerApplications()
  }, [])

  const handleAction = async (id, status) => {
    const res = await updateInfluencerApplication(id, status, notes, adminUser?.id)
    if (res?.error) {
      toast.error('Error: ' + (res.error.message || res.error))
    } else {
      toast.success(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}`)
      setShowModal(false)
      setNotes('')
    }
  }

  const filtered = influencerApplications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = 
      app.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      app.instagram_url?.toLowerCase().includes(search.toLowerCase()) ||
      app.tiktok_url?.toLowerCase().includes(search.toLowerCase()) ||
      app.email?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const statusColors = {
    pending: { bg: '#fffbeb', color: '#d97706', label: 'Pendiente' },
    approved: { bg: '#ecfdf5', color: '#10b981', label: 'Aprobado' },
    rejected: { bg: '#fef2f2', color: '#ef4444', label: 'Rechazado' },
    archived: { bg: '#f4f4f5', color: '#71717a', label: 'Archivado' }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ reclutamiento de creadores</div>
            <h1 className="ag-title">Solicitudes de Influencers</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>
              Gestioná las postulaciones al programa de afiliados. Revisá redes sociales y propuesta antes de aprobar.
            </p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">person_search</span>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 20rem', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: "var(--admin-muted)" }}>search</span>
          <input style={{ ...input, paddingLeft: '2.5rem' }} placeholder="Buscar por nombre, email o @handle..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Todas' },
            { key: 'pending', label: 'Pendientes', icon: 'pending' },
            { key: 'approved', label: 'Aprobadas', icon: 'check_circle' },
            { key: 'rejected', label: 'Rechazadas', icon: 'cancel' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '0.5rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: filter === f.key ? 'var(--color-primary)' : "var(--admin-panel)", 
              color: filter === f.key ? 'white' : "var(--admin-muted)", 
              border: filter === f.key ? '1px solid var(--color-primary)' : '1px solid var(--admin-line)',
              transition: 'all 0.2s'
            }}>
              {f.icon && <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{f.icon}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: "var(--admin-panel2)", borderBottom: '2px solid var(--admin-line)' }}>
              <tr>
                {['Postulante', 'Redes', 'Enfoque', 'Estado', 'Fecha', 'Acciones'].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '1rem', fontWeight: 800, color: "var(--admin-muted)", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => {
                const status = statusColors[app.status] || statusColors.pending
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--admin-line)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: "var(--admin-line)", display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {app.profile?.avatar_url ? <img src={app.profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span className="material-symbols-outlined">person</span>}
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, color: "#f5f5f5", margin: 0 }}>{app.full_name}</p>
                          <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {app.instagram_url && <a href={app.instagram_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} title="Instagram"><span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>photo_camera</span></a>}
                        {app.tiktok_url && <a href={app.tiktok_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} title="TikTok"><span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>video_library</span></a>}
                        {app.youtube_url && <a href={app.youtube_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} title="YouTube"><span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>play_circle</span></a>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: "var(--admin-muted)", textTransform: 'uppercase', marginTop: '0.2rem' }}>{app.content_type}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ccc' }}>
                        {app.message}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: status.bg, color: status.color, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: "var(--admin-muted)", fontSize: '0.8rem' }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => { setSelectedApp(app); setShowModal(true); setNotes(app.admin_notes || '') }}
                        style={btn("var(--admin-panel2)", "var(--admin-muted)")}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>visibility</span>
                        Revisar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: "var(--admin-muted)" }}>
                    {loading ? 'Cargando solicitudes...' : 'No se encontraron solicitudes.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '40rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase' }}>Revisar Solicitud</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h4 style={{ color: 'var(--admin-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Información Personal</h4>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{selectedApp.full_name}</p>
                <p style={{ margin: '0.2rem 0', color: '#aaa' }}>{selectedApp.email}</p>
                <p style={{ margin: 0, color: '#aaa' }}>WhatsApp: {selectedApp.whatsapp}</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--admin-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Redes y Perfil</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedApp.instagram_url && <div style={{ color: '#eee', fontSize: '0.9rem' }}><b>IG:</b> {selectedApp.instagram_url}</div>}
                  {selectedApp.tiktok_url && <div style={{ color: '#eee', fontSize: '0.9rem' }}><b>TK:</b> {selectedApp.tiktok_url}</div>}
                  {selectedApp.youtube_url && <div style={{ color: '#eee', fontSize: '0.9rem' }}><b>YT:</b> {selectedApp.youtube_url}</div>}
                </div>
                <p style={{ margin: '0.5rem 0', color: '#aaa' }}>Tipo: {selectedApp.content_type}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ color: 'var(--admin-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Propuesta de Contenido</h4>
                <div style={{ background: '#050505', padding: '1rem', borderRadius: '4px', border: '1px solid #222', color: '#eee', lineHeight: '1.6', fontSize: '0.9rem' }}>
                  {selectedApp.message}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ color: 'var(--admin-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Notas Internas (Admin)</h4>
                <textarea 
                  style={{ ...input, minHeight: '6rem', resize: 'vertical' }} 
                  placeholder="Agregar comentarios, evaluación de redes, etc."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              {selectedApp.status === 'pending' && (
                <>
                  <button onClick={() => handleAction(selectedApp.id, 'rejected')} style={btn('#450a0a', '#f87171')}>Rechazar</button>
                  <button onClick={() => handleAction(selectedApp.id, 'approved')} style={btn('var(--color-primary)', 'white')}>Aprobar Influencer</button>
                </>
              )}
              {selectedApp.status !== 'pending' && (
                <button onClick={() => handleAction(selectedApp.id, 'pending')} style={btn('var(--admin-panel2)', 'var(--admin-muted)')}>Mover a Pendiente</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
