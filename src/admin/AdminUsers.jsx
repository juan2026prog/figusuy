import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { formatScore, getScoreColor, buildScoreBreakdown } from '../lib/ranking'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const input = { width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--admin-line)", fontSize: "0.875rem", outline: "none", background: "#0d0d0d", color: "#fff" }
const badgeStyle = (bg, color) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', background: bg, color, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' })
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })

export default function AdminUsers() {
  const { users, fetchUsers, toggleUserBlock, toggleUserPremium, toggleUserVerified, setUserRole, calculateUserRanking, getUserRanking } = useAdminStore()
  const { user: adminUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedUser, setExpandedUser] = useState(null)
  const [userScores, setUserScores] = useState({})
  const [scoringUser, setScoringUser] = useState(null)

  const loadUserScore = async (userId) => {
    const data = await getUserRanking(userId)
    if (data) setUserScores(prev => ({ ...prev, [userId]: data }))
  }

  const recalcUser = async (userId) => {
    setScoringUser(userId)
    const result = await calculateUserRanking(userId, adminUser?.id)
    if (result) {
      const data = await getUserRanking(userId)
      if (data) setUserScores(prev => ({ ...prev, [userId]: data }))
    }
    setScoringUser(null)
  }

  useEffect(() => {
    if (expandedUser && !userScores[expandedUser]) loadUserScore(expandedUser)
  }, [expandedUser])

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
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Gestión de Usuarios</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Administración completa de la base de usuarios ({users.length} en total)</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btn("var(--admin-panel2)", "var(--admin-muted)")} onClick={fetchUsers}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>refresh</span>
            Actualizar
          </button></div>
      </div>
      </section>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 20rem', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: "var(--admin-muted)" }}>search</span>
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
              background: filter === f.key ? 'var(--color-primary)' : "var(--admin-panel)", 
              color: filter === f.key ? 'white' : "var(--admin-muted)", 
              border: filter === f.key ? '1px solid var(--color-primary)' : '1px solid var(--color-text-secondary)',
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
            <thead style={{ background: "var(--admin-panel2)", borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                {['Usuario', 'Email', 'Rol', 'Estado', 'Actividad', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: h ? 'left' : 'center', padding: '1rem', fontWeight: 800, color: "var(--admin-muted)", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <React.Fragment key={user.id}>
                  <tr
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', background: expandedUser === user.id ? "var(--admin-panel2)" : 'transparent' }}
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    onMouseEnter={e => { if (expandedUser !== user.id) e.currentTarget.style.background = "var(--admin-panel2)" }}
                    onMouseLeave={e => { if (expandedUser !== user.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                          background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : "var(--admin-line)",
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: "var(--admin-muted)", fontSize: '1rem', fontWeight: 800, flexShrink: 0,
                        }}>{!user.avatar_url && (user.name?.[0]?.toUpperCase() || '?')}</div>
                        <div>
                          <span style={{ fontWeight: 800, color: "#f5f5f5", display: 'block' }}>{user.name || 'Sin nombre'}</span>
                          <span style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#f59e0b' }}>star</span>
                            {user.rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: "var(--admin-muted)", fontWeight: 500 }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                        background: user.user_roles?.[0]?.role === 'god_admin' ? '#fef2f2' : (user.user_roles?.[0]?.role && user.user_roles?.[0]?.role !== 'user' ? '#eff6ff' : "var(--admin-panel2)"), 
                        color: user.user_roles?.[0]?.role === 'god_admin' ? '#ef4444' : (user.user_roles?.[0]?.role && user.user_roles?.[0]?.role !== 'user' ? '#3b82f6' : "var(--admin-muted2)"), 
                        border: '1px solid',
                        borderColor: user.user_roles?.[0]?.role === 'god_admin' ? '#fecaca' : (user.user_roles?.[0]?.role && user.user_roles?.[0]?.role !== 'user' ? '#bfdbfe' : "var(--admin-line)")
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
                            {!user.is_premium && !user.is_verified && <span style={badgeStyle("var(--admin-panel2)", "var(--admin-muted2)")}>Estándar</span>}
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: "var(--admin-muted2)" }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 500 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: "var(--admin-muted)" }}>schedule</span>
                        {timeAgo(user.last_active)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: "var(--admin-muted)" }}>
                      <span className="material-symbols-outlined" style={{ transition: 'transform 0.2s', transform: expandedUser === user.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                        expand_more
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedUser === user.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0', background: "var(--admin-panel2)", borderBottom: '2px solid #e2e8f0' }}>
                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.5rem' }}>
                          
                          {/* Info */}
                          <div style={{ background: "var(--admin-panel)", padding: '1rem', borderRadius: '0.75rem', border: "1px solid var(--admin-line)" }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>info</span> Detalles
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", display: 'flex', justifyContent: 'space-between' }}>
                                <span>ID:</span> <span style={{ fontFamily: 'monospace', color: "#f5f5f5", fontWeight: 600 }}>{user.id.substring(0, 8)}...</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ciudad:</span> <span style={{ color: "#f5f5f5", fontWeight: 600 }}>{user.city || '—'}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", display: 'flex', justifyContent: 'space-between' }}>
                                <span>GPS:</span> <span style={{ color: "#f5f5f5", fontWeight: 600 }}>{user.lat ? `${user.lat.toFixed(4)}, ${user.lng?.toFixed(4)}` : 'Sin ub.'}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", display: 'flex', justifyContent: 'space-between' }}>
                                <span>Registro:</span> <span style={{ color: "#f5f5f5", fontWeight: 600 }}>{new Date(user.created_at).toLocaleDateString()}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tipo de Cuenta:</span> <span style={{ color: "#f5f5f5", fontWeight: 600, textTransform: 'capitalize' }}>{user.account_type || 'user'}</span>
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", display: 'flex', justifyContent: 'space-between' }}>
                                <span>Estado Negocio:</span> <span style={{ color: "#f5f5f5", fontWeight: 600, textTransform: 'capitalize' }}>{user.business_status || 'none'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ background: "var(--admin-panel)", padding: '1rem', borderRadius: '0.75rem', border: "1px solid var(--admin-line)" }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>bolt</span> Estados Rápidos
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <button onClick={() => toggleUserPremium(user.id, !user.is_premium)} style={user.is_premium ? btn('#fffbeb', '#d97706') : btn("var(--admin-panel2)", "var(--admin-muted2)")}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>workspace_premium</span>
                                Premium
                              </button>
                              <button onClick={() => toggleUserVerified(user.id, !user.is_verified)} style={user.is_verified ? btn('#ecfdf5', '#10b981') : btn("var(--admin-panel2)", "var(--admin-muted2)")}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>verified</span>
                                Verificado
                              </button>
                              <button onClick={() => toggleUserBlock(user.id, !user.is_blocked)} style={{ ...btn(user.is_blocked ? '#fef2f2' : "var(--admin-panel2)", user.is_blocked ? '#ef4444' : "var(--admin-muted2)"), gridColumn: '1 / -1' }}>
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
                                style={{ ...btn(user.business_access ? '#eff6ff' : "var(--admin-panel2)", user.business_access ? '#3b82f6' : "var(--admin-muted2)"), gridColumn: '1 / -1' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>storefront</span>
                                {user.business_access ? 'Revocar Acceso a Negocios' : 'Habilitar Acceso a Negocios'}
                              </button>
                            </div>
                          </div>

                          {/* Role Management */}
                          <div style={{ background: "var(--admin-panel)", padding: '1rem', borderRadius: '0.75rem', border: "1px solid var(--admin-line)" }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>shield_person</span> Permisos y Rol
                            </p>
                            <select style={{ ...input, fontWeight: 600, color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} value={user.user_roles?.[0]?.role || 'user'} onChange={e => setUserRole(user.id, e.target.value)}>
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
                               <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                 <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>security</span> Seguridad
                               </p>
                               <div style={{ display: 'flex', gap: '0.5rem' }}>
                                 <span style={{ ...badgeStyle("var(--admin-panel2)", "var(--admin-muted)"), flex: 1, justifyContent: 'center' }}>0 Strikes</span>
                                 <button style={{ ...btn('#fef2f2', '#ef4444'), flex: 1, padding: '0.25rem' }}>Sancionar</button>
                               </div>
                            </div>
                          </div>

                          {/* Extended Stats */}
                          <div style={{ background: "var(--admin-panel)", padding: '1rem', borderRadius: '0.75rem', border: "1px solid var(--admin-line)", gridColumn: '1 / -1' }}>
                             <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Resumen de Actividad</p>
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem' }}>
                                <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{user.user_albums_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Álbumes Activos</p>
                                </div>
                                <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{user.trades_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Matches Exitosos</p>
                                </div>
                                <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{user.favorites_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Puntos Favoritos</p>
                                </div>
                                <div style={{ background: "var(--admin-panel2)", padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{user.sticker_count ?? '—'}</p>
                                   <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted2)", textTransform: 'uppercase' }}>Figuritas en Colección</p>
                                </div>
                             </div>
                          </div>

                          {/* Ranking Score */}
                          <div style={{ background: "var(--admin-panel)", padding: '1rem', borderRadius: '0.75rem', border: "1px solid var(--admin-line)", gridColumn: '1 / -1' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                               <p style={{ fontSize: '0.75rem', fontWeight: 800, color: "var(--admin-muted)", textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                 <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>leaderboard</span> Ranking Score
                               </p>
                               <button onClick={() => recalcUser(user.id)} disabled={scoringUser === user.id} style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', background: "rgba(249, 115, 22, 0.1)", color: 'var(--color-primary)', border: '1px solid #fed7aa', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', opacity: scoringUser === user.id ? 0.5 : 1 }}>
                                 {scoringUser === user.id ? '⏳ ...' : '🔄 Recalcular'}
                               </button>
                             </div>
                             {userScores[user.id] ? (() => {
                               const sc = userScores[user.id]
                               const breakdown = buildScoreBreakdown(sc, 'user')
                               return (
                                 <>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                     <p style={{ fontSize: '2rem', fontWeight: 900, color: getScoreColor(sc.final_user_rank), margin: 0 }}>{formatScore(sc.final_user_rank)}</p>
                                     {sc.premium_boost_applied > 0 && <span style={{ fontSize: '0.6875rem', background: "rgba(245, 158, 11, 0.1)", color: '#d97706', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: 700, border: '1px solid #fcd34d' }}>Boost {sc.premium_boost_applied}x</span>}
                                     {sc.badges?.map(b => <span key={b} style={{ fontSize: '0.625rem', background: "rgba(59, 130, 246, 0.1)", color: '#3b82f6', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: 700 }}>{b}</span>)}
                                   </div>
                                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                     {breakdown.map(b => (
                                       <div key={b.label} style={{ fontSize: '0.75rem' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.125rem' }}>
                                           <span style={{ color: "var(--admin-muted)" }}>{b.label}</span>
                                           <span style={{ color: getScoreColor(b.value) }}>{formatScore(b.value)}</span>
                                         </div>
                                         <div style={{ height: '4px', background: "var(--admin-panel2)", borderRadius: '2px' }}>
                                           <div style={{ height: '100%', width: `${Math.min(b.value || 0, 100)}%`, background: getScoreColor(b.value), borderRadius: '2px' }} />
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                   {sc.penalties && Object.keys(sc.penalties).length > 0 && (
                                     <p style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '0.5rem', fontWeight: 600 }}>⚠️ Penalizaciones: {JSON.stringify(sc.penalties)}</p>
                                   )}
                                   <p style={{ fontSize: '0.5625rem', color: "var(--admin-muted)", marginTop: '0.375rem' }}>Último cálculo: {sc.last_scored_at ? new Date(sc.last_scored_at).toLocaleString() : '—'}</p>
                                 </>
                               )
                             })() : (
                               <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted)" }}>Sin score calculado. Presioná "Recalcular" para generar.</p>
                             )}
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
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: "var(--admin-muted)", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>search_off</span>
              <p style={{ fontWeight: 600 }}>No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
