import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }
const input = { width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a' }
const badgeStyle = (bg, color) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', background: bg, color, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' })
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

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
    if (filter === 'staff') return matchSearch && u.user_roles?.length > 0 && u.user_roles[0].role !== 'user'
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
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>group</span>
            Gestión de Usuarios
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Administración completa de la base de usuarios ({users.length} en total)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn('#f1f5f9', '#475569')} onClick={fetchUsers}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 20rem', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
          <input style={{ ...input, paddingLeft: '2.5rem' }} placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'premium', label: 'Premium', icon: 'workspace_premium' },
            { key: 'verified', label: 'Verificados', icon: 'verified' },
            { key: 'staff', label: 'Staff', icon: 'shield_person' },
            { key: 'blocked', label: 'Bloqueados', icon: 'block' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '0.5rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: filter === f.key ? '#ea580c' : '#ffffff', 
              color: filter === f.key ? 'white' : '#475569', 
              border: filter === f.key ? '1px solid #ea580c' : '1px solid #cbd5e1',
              boxShadow: filter === f.key ? '0 1px 2px rgba(234,88,12,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}>
              {f.icon && <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{f.icon}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                {['Usuario', 'Email', 'Rol', 'Estado', 'Actividad', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: h ? 'left' : 'center', padding: '1rem', fontWeight: 800, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <React.Fragment key={user.id}>
                  <tr
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', background: expandedUser === user.id ? '#f8fafc' : 'transparent' }}
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    onMouseEnter={e => { if (expandedUser !== user.id) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (expandedUser !== user.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                          background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : '#e2e8f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#475569', fontSize: '1rem', fontWeight: 800, flexShrink: 0,
                        }}>{!user.avatar_url && (user.name?.[0]?.toUpperCase() || '?')}</div>
                        <div>
                          <span style={{ fontWeight: 800, color: '#0f172a', display: 'block' }}>{user.name || 'Sin nombre'}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#f59e0b' }}>star</span>
                            {user.rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569', fontWeight: 500 }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                        background: user.user_roles?.[0]?.role === 'god_admin' ? '#fef2f2' : (user.user_roles?.[0]?.role && user.user_roles?.[0]?.role !== 'user' ? '#eff6ff' : '#f1f5f9'), 
                        color: user.user_roles?.[0]?.role === 'god_admin' ? '#ef4444' : (user.user_roles?.[0]?.role && user.user_roles?.[0]?.role !== 'user' ? '#3b82f6' : '#64748b'), 
                        border: '1px solid',
                        borderColor: user.user_roles?.[0]?.role === 'god_admin' ? '#fecaca' : (user.user_roles?.[0]?.role && user.user_roles?.[0]?.role !== 'user' ? '#bfdbfe' : '#e2e8f0')
                      }}>
                        {user.user_roles?.[0]?.role?.replace('_', ' ') || 'User'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {user.is_blocked ? (
                          <span style={badgeStyle('#fef2f2', '#ef4444')}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>block</span> Bloqueado</span>
                        ) : (
                          <>
                            {user.is_premium && <span style={badgeStyle('#fffbeb', '#d97706')}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>workspace_premium</span> Premium</span>}
                            {user.is_verified && <span style={badgeStyle('#ecfdf5', '#10b981')}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>verified</span> Verificado</span>}
                            {!user.is_premium && !user.is_verified && <span style={badgeStyle('#f1f5f9', '#64748b')}>Estándar</span>}
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 500 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#94a3b8' }}>schedule</span>
                        {timeAgo(user.last_active)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <span className="material-symbols-outlined" style={{ transition: 'transform 0.2s', transform: expandedUser === user.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                        expand_more
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedUser === user.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.5rem' }}>
                          
                          {/* Info */}
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>info</span> Detalles
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>ID:</span> <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{user.id.substring(0, 8)}...</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ciudad:</span> <span style={{ color: '#0f172a', fontWeight: 600 }}>{user.city || '—'}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>GPS:</span> <span style={{ color: '#0f172a', fontWeight: 600 }}>{user.lat ? `${user.lat.toFixed(4)}, ${user.lng?.toFixed(4)}` : 'Sin ub.'}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Registro:</span> <span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(user.created_at).toLocaleDateString()}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tipo de Cuenta:</span> <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>{user.account_type || 'user'}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Estado Negocio:</span> <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>{user.business_status || 'none'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>bolt</span> Estados Rápidos
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <button onClick={() => toggleUserPremium(user.id, !user.is_premium)} style={user.is_premium ? btn('#fffbeb', '#d97706') : btn('#f8fafc', '#64748b')}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>workspace_premium</span>
                                Premium
                              </button>
                              <button onClick={() => toggleUserVerified(user.id, !user.is_verified)} style={user.is_verified ? btn('#ecfdf5', '#10b981') : btn('#f8fafc', '#64748b')}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>verified</span>
                                Verificado
                              </button>
                              <button onClick={() => toggleUserBlock(user.id, !user.is_blocked)} style={{ ...btn(user.is_blocked ? '#fef2f2' : '#f8fafc', user.is_blocked ? '#ef4444' : '#64748b'), gridColumn: '1 / -1' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>block</span>
                                {user.is_blocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
                              </button>
                              
                              <button 
                                onClick={async () => {
                                  const newVal = !user.business_access;
                                  const updates = { 
                                    business_access: newVal, 
                                    business_status: newVal ? 'approved' : (user.business_status === 'approved' ? 'suspended' : user.business_status),
                                    account_type: newVal ? 'business' : 'user'
                                  };
                                  await useAdminStore.getState().updateUser(user.id, updates);
                                }} 
                                style={{ ...btn(user.business_access ? '#eff6ff' : '#f8fafc', user.business_access ? '#3b82f6' : '#64748b'), gridColumn: '1 / -1' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>storefront</span>
                                {user.business_access ? 'Revocar Acceso a Negocios' : 'Habilitar Acceso a Negocios'}
                              </button>
                            </div>
                          </div>

                          {/* Role Management */}
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>shield_person</span> Permisos y Rol
                            </p>
                            <select style={{ ...input, fontWeight: 600, color: '#ea580c', borderColor: '#ea580c' }} value={user.user_roles?.[0]?.role || 'user'} onChange={e => setUserRole(user.id, e.target.value)}>
                              {[
                                { val: 'user', label: 'Usuario Estándar' },
                                { val: 'album_creator', label: 'Creador de Álbumes' },
                                { val: 'commercial', label: 'Comercial / Ventas' },
                                { val: 'analyst', label: 'Analista de Datos' },
                                { val: 'support', label: 'Soporte Técnico' },
                                { val: 'moderator', label: 'Moderador' },
                                { val: 'admin', label: 'Administrador' },
                                { val: 'god_admin', label: '⚡ God Admin' },
                              ].map(r => (
                                <option key={r.val} value={r.val}>{r.label}</option>
                              ))}
                            </select>
                            <div style={{ marginTop: '1.5rem' }}>
                               <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                 <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>security</span> Seguridad
                               </p>
                               <div style={{ display: 'flex', gap: '0.5rem' }}>
                                 <span style={{ ...badgeStyle('#f1f5f9', '#475569'), flex: 1, justifyContent: 'center' }}>0 Strikes</span>
                                 <button style={{ ...btn('#fef2f2', '#ef4444'), flex: 1, padding: '0.25rem' }}>Sancionar</button>
                               </div>
                            </div>
                          </div>

                          {/* Extended Stats */}
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                             <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Resumen de Actividad</p>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem' }}>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{user.user_albums_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Álbumes Activos</p>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{user.trades_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Matches Exitosos</p>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{user.favorites_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Puntos Favoritos</p>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{user.sticker_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Figuritas en Colección</p>
                                </div>
                             </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>search_off</span>
              <p style={{ fontWeight: 600 }}>No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
