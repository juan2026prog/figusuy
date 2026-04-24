import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }
const input = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none' }
const badgeStyle = (bg, color) => ({ padding: '0.125rem 0.5rem', borderRadius: '1rem', background: bg, color, fontSize: '0.6875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' })

export default function AdminUsers() {
  const { users, fetchUsers, toggleUserBlock, toggleUserPremium, toggleUserVerified, setUserRole } = useAdminStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedUser, setExpandedUser] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'premium') return matchSearch && u.is_premium
    if (filter === 'blocked') return matchSearch && u.is_blocked
    if (filter === 'verified') return matchSearch && u.is_verified
    return matchSearch
  })

  const timeAgo = (date) => {
    if (!date) return 'Nunca'
    const d = new Date(date)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'Ahora'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>👥 Gestión de Usuarios</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{users.length} usuarios registrados</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input style={{ ...input, maxWidth: '20rem' }} placeholder="🔍 Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'premium', label: '👑 Premium' },
            { key: 'verified', label: '✅ Verificados' },
            { key: 'blocked', label: '🚫 Bloqueados' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              background: filter === f.key ? '#3b82f6' : '#f1f5f9', color: filter === f.key ? 'white' : '#64748b', border: 'none',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div style={{ ...card, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Usuario', 'Email', 'Estado', 'Rol', 'Rating', 'Último activo', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0.625rem 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <React.Fragment key={user.id}>
                <tr
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.625rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      }}>{!user.avatar_url && (user.name?.[0] || '?')}</div>
                      <span style={{ fontWeight: 600 }}>{user.name || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', color: '#64748b', fontSize: '0.75rem' }}>{user.email}</td>
                  <td style={{ padding: '0.625rem 0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {user.is_premium && <span style={badgeStyle('#fef3c7', '#d97706')}>👑 Premium</span>}
                      {user.is_verified && <span style={badgeStyle('#dcfce7', '#16a34a')}>✅ Verificado</span>}
                      {user.is_blocked && <span style={badgeStyle('#fecaca', '#dc2626')}>🚫 Bloqueado</span>}
                      {!user.is_premium && !user.is_blocked && !user.is_verified && <span style={badgeStyle('#f1f5f9', '#94a3b8')}>Normal</span>}
                    </div>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>
                    {user.user_roles?.[0]?.role || 'user'}
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem' }}>⭐ {user.rating?.toFixed(1) || '0.0'}</td>
                  <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>{timeAgo(user.last_active)}</td>
                  <td style={{ padding: '0.625rem 0.5rem', fontSize: '1rem' }}>{expandedUser === user.id ? '▲' : '▼'}</td>
                </tr>

                {/* Expanded Row */}
                {expandedUser === user.id && (
                  <tr>
                    <td colSpan={7} style={{ padding: '1rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '0.75rem' }}>
                        {/* Info */}
                        <div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Información</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: <span style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>{user.id}</span></p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Ciudad: {user.city || '—'}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Ubicación: {user.lat ? `${user.lat.toFixed(4)}, ${user.lng?.toFixed(4)}` : 'Sin ubicación'}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Registrado: {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Actions */}
                        <div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Acciones</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <button onClick={() => toggleUserPremium(user.id, !user.is_premium)} style={{
                              padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: user.is_premium ? '#fef3c7' : '#eff6ff', color: user.is_premium ? '#d97706' : '#3b82f6', border: 'none',
                            }}>{user.is_premium ? '❌ Quitar Premium' : '👑 Dar Premium'}</button>

                            <button onClick={() => toggleUserVerified(user.id, !user.is_verified)} style={{
                              padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: '#ecfdf5', color: '#16a34a', border: 'none',
                            }}>{user.is_verified ? '❌ Quitar verificación' : '✅ Verificar'}</button>

                            <button onClick={() => toggleUserBlock(user.id, !user.is_blocked)} style={{
                              padding: '0.375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: user.is_blocked ? '#dcfce7' : '#fef2f2', color: user.is_blocked ? '#16a34a' : '#dc2626', border: 'none',
                            }}>{user.is_blocked ? '✅ Desbloquear' : '🚫 Bloquear'}</button>
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Cambiar Rol</p>
                          <select style={input} value={user.user_roles?.[0]?.role || 'user'} onChange={e => setUserRole(user.id, e.target.value)}>
                            {['user', 'god_admin', 'admin', 'moderator', 'support', 'album_creator', 'commercial', 'analyst'].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No se encontraron usuarios</p>}
      </div>
    </div>
  )
}
