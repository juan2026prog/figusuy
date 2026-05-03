import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const badge = (bg, color) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, background: bg, color, textTransform: 'uppercase' })

export default function AdminBlocks() {
  const { userBlocks, fetchUserBlocks, unblockUser, blockUser, users, fetchUsers, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('active')
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({ userId: '', reason: '', blockType: 'permanent', expiresAt: '' })
  const [unblockId, setUnblockId] = useState(null)
  const [unblockReason, setUnblockReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchUserBlocks(); fetchUsers() }, [])

  const filtered = userBlocks.filter(b => {
    if (filter === 'active') return b.is_active
    if (filter === 'inactive') return !b.is_active
    return true
  })

  const handleBlock = () => {
    if (!blockForm.userId || !blockForm.reason) return
    blockUser(blockForm.userId, blockForm.reason, blockForm.blockType, user.id, blockForm.expiresAt || null)
    setShowBlockModal(false)
    setBlockForm({ userId: '', reason: '', blockType: 'permanent', expiresAt: '' })
  }

  const handleUnblock = () => {
    if (!unblockReason.trim()) return
    const block = userBlocks.find(b => b.id === unblockId)
    unblockUser(unblockId, block?.user_id, unblockReason, user.id)
    setUnblockId(null)
    setUnblockReason('')
  }

  const matchedUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10)

  return (
    <div style={{ paddingBottom: '2rem' }}>
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Gestión de Bloqueos</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Bloqueos activos, historial y desbloqueos con auditoría.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">block</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button onClick={() => setShowBlockModal(true)} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>person_off</span>
          Nuevo Bloqueo
        </button></div>
      </section>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ ...card, borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5" }}>{userBlocks.filter(b => b.is_active).length}</p>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Bloqueos Activos</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5" }}>{userBlocks.filter(b => b.is_active && b.block_type === 'temporary').length}</p>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Temporales</p>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: "#f5f5f5" }}>{userBlocks.filter(b => !b.is_active).length}</p>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Desbloqueados</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[{ key: 'active', label: 'Activos' }, { key: 'inactive', label: 'Historial' }, { key: 'all', label: 'Todos' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            background: filter === f.key ? '#ef4444' : '#fff', color: filter === f.key ? 'white' : "var(--admin-muted2)",
            border: filter === f.key ? '1px solid #ef4444' : '1px solid #e2e8f0'
          }}>{f.label}</button>
        ))}
      </div>

      {/* List */}
      <div style={card}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>No hay bloqueos en esta categoría.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(block => (
              <div key={block.id} style={{ padding: '1rem', background: block.is_active ? '#fef2f2' : "var(--admin-panel2)", borderRadius: '0.75rem', border: `1px solid ${block.is_active ? '#fecaca' : "var(--admin-panel2)"}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 800, color: "#f5f5f5", margin: 0 }}>{block.user?.name || 'Usuario'}</p>
                    <p style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", margin: '0.25rem 0' }}>{block.user?.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={badge(block.is_active ? '#fef2f2' : '#ecfdf5', block.is_active ? '#ef4444' : '#10b981')}>
                      {block.is_active ? 'Bloqueado' : 'Desbloqueado'}
                    </span>
                    <span style={badge("var(--admin-panel2)", "var(--admin-muted2)")}>{block.block_type}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted)", margin: '0.75rem 0 0.5rem' }}>
                  <strong>Motivo:</strong> {block.reason}
                </p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: "var(--admin-muted)", flexWrap: 'wrap' }}>
                  <span>Bloqueó: {block.blocker?.name || 'Sistema'}</span>
                  <span>{new Date(block.created_at).toLocaleDateString()}</span>
                  {block.expires_at && <span>Expira: {new Date(block.expires_at).toLocaleDateString()}</span>}
                  {!block.is_active && <span>Desbloqueó: {block.unblocker?.name} — "{block.unblock_reason}"</span>}
                </div>
                {block.is_active && (
                  <button onClick={() => setUnblockId(block.id)} style={{ marginTop: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: "rgba(16, 185, 129, 0.1)", color: '#10b981', border: '1px solid #a7f3d0', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>
                    Desbloquear
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '28rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', color: '#ef4444' }}>Nuevo Bloqueo de Usuario</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Buscar Usuario</label>
              <input type="text" placeholder="Nombre o email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", marginBottom: '0.5rem' }} />
              {searchTerm && matchedUsers.length > 0 && (
                <div style={{ border: "1px solid var(--admin-line)", borderRadius: '0.5rem', maxHeight: '8rem', overflowY: 'auto' }}>
                  {matchedUsers.map(u => (
                    <div key={u.id} onClick={() => { setBlockForm({ ...blockForm, userId: u.id }); setSearchTerm(u.name + ' — ' + u.email) }}
                      style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9' }}>
                      {u.name} — <span style={{ color: "var(--admin-muted)" }}>{u.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Tipo</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['permanent', 'temporary'].map(t => (
                  <button key={t} type="button" onClick={() => setBlockForm({ ...blockForm, blockType: t })} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                    border: blockForm.blockType === t ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    background: blockForm.blockType === t ? '#fef2f2' : 'white', color: blockForm.blockType === t ? '#ef4444' : "var(--admin-muted2)"
                  }}>{t === 'permanent' ? 'Permanente' : 'Temporal'}</button>
                ))}
              </div>
            </div>
            {blockForm.blockType === 'temporary' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Expira</label>
                <input type="datetime-local" value={blockForm.expiresAt} onChange={e => setBlockForm({ ...blockForm, expiresAt: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }} />
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Motivo</label>
              <textarea placeholder="Explica el motivo del bloqueo..." value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                style={{ width: '100%', minHeight: '5rem', padding: '0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowBlockModal(false)} style={{ background: 'none', border: 'none', color: "var(--admin-muted2)", fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleBlock} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Confirmar Bloqueo</button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Modal */}
      {unblockId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '28rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>Desbloquear Usuario</h3>
            <textarea placeholder="Motivo del desbloqueo..." value={unblockReason} onChange={e => setUnblockReason(e.target.value)}
              style={{ width: '100%', minHeight: '5rem', padding: '0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontFamily: 'inherit', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setUnblockId(null)} style={{ background: 'none', border: 'none', color: "var(--admin-muted2)", fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleUnblock} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Confirmar Desbloqueo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
