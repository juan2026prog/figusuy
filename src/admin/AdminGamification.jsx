import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LEVELS, LEVEL_ORDER, ACHIEVEMENTS, BADGES, REWARD_TYPES } from '../lib/gamification'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function AdminGamification() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const toast = useToast()
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  useEffect(() => { loadData() }, [filterLevel])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        supabase.rpc('admin_get_gamification_stats'),
        supabase.rpc('admin_list_gamification_users', {
          p_level: filterLevel || null,
          p_limit: 50,
          p_offset: 0,
        }),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data || [])
    } catch (err) {
      console.error('Admin gamification load error:', err)
    }
    setLoading(false)
  }

  const loadUserDetail = async (userId) => {
    setDetailLoading(true)
    setSelectedUser(userId)
    try {
      const { data } = await supabase.rpc('get_user_gamification', { p_user_id: userId })
      setUserDetail(data)
    } catch (err) { console.error(err) }
    setDetailLoading(false)
  }

  const overrideLevel = async (userId, newLevel) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cambiar Nivel',
      message: `¿Cambiar nivel a ${newLevel}?`,
      onConfirm: async () => {
        await supabase.from('user_progress').update({ level: newLevel, updated_at: new Date().toISOString() }).eq('user_id', userId)
        loadData()
        if (selectedUser === userId) loadUserDetail(userId)
        toast.success('Nivel actualizado')
      }
    })
  }

  const grantManualReward = async (userId, type, value, hours) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Otorgar Reward',
      message: `¿Otorgar ${type} (${value}) a este usuario?`,
      onConfirm: async () => {
        await supabase.rpc('grant_gamification_reward', {
          p_user_id: userId,
          p_reward_type: type,
          p_reward_value: value,
          p_source: 'admin_manual',
          p_duration_hours: hours || 24,
        })
        loadUserDetail(userId)
        toast.success('Reward otorgado')
      }
    })
  }

  const s = (styles) => styles

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: "#f5f5f5" }}>Gamificación</h1>
        <p style={{ fontSize: '0.875rem', color: "var(--admin-muted)", margin: 0 }}>Niveles, hitos, rewards y progreso de usuarios</p>
      </div>

      {loading && !stats ? (
        <p style={{ color: "var(--admin-muted)" }}>Cargando...</p>
      ) : (
        <>
          {/* Stats Overview */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Usuarios', val: stats.total_users || 0, color: 'var(--color-primary)' },
                { label: 'Hitos completados', val: stats.total_achievements_completed || 0, color: '#22c55e' },
                { label: 'Rewards entregados', val: stats.total_rewards_granted || 0, color: '#8b5cf6' },
                { label: 'Rewards activos', val: stats.active_rewards || 0, color: '#3b82f6' },
                { label: 'Racha promedio', val: stats.avg_streak || 0, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ padding: '1rem', borderRadius: '0.75rem', background: "var(--admin-panel2)", border: "1px solid var(--admin-line)", textAlign: 'center' }}>
                  <p style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, margin: 0 }}>{s.val}</p>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", margin: '0.25rem 0 0', textTransform: 'uppercase' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Level Distribution */}
          {stats?.by_level && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {LEVEL_ORDER.map(lk => {
                const l = LEVELS[lk]
                const count = stats.by_level[lk] || 0
                return (
                  <div key={lk} style={{ flex: 1, minWidth: '100px', padding: '0.75rem', borderRadius: '0.75rem', background: l.gradient, color: 'white', textAlign: 'center', cursor: 'pointer', border: filterLevel === lk ? '2px solid white' : '2px solid transparent' }}
                    onClick={() => setFilterLevel(filterLevel === lk ? '' : lk)}
                  >
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{count}</p>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 700, margin: '0.125rem 0 0', opacity: 0.8 }}>{l.name}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Users Table */}
          <div style={{ background: "var(--admin-panel2)", borderRadius: '0.75rem', border: "1px solid var(--admin-line)", overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Usuarios ({users.length})</h3>
              {filterLevel && (
                <button onClick={() => setFilterLevel('')} style={{ fontSize: '0.75rem', background: '#f5f5f4', border: "1px solid var(--admin-line)", borderRadius: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  Limpiar filtro ✕
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: "var(--admin-panel2)", color: "var(--admin-muted)", fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase' }}>
                    <th style={th}>Usuario</th>
                    <th style={th}>Nivel</th>
                    <th style={th}>Racha</th>
                    <th style={th}>Días</th>
                    <th style={th}>Cruces</th>
                    <th style={th}>Hitos</th>
                    <th style={th}>Rewards</th>
                    <th style={th}>Plan</th>
                    <th style={th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const l = LEVELS[u.level] || LEVELS.explorador
                    return (
                      <tr key={u.user_id} style={{ borderBottom: '1px solid #f5f5f4', cursor: 'pointer' }}
                        onClick={() => loadUserDetail(u.user_id)}
                      >
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 900 }}>
                                {u.name?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div>
                              <p style={{ margin: 0, fontWeight: 700 }}>{u.name || 'Sin nombre'}</p>
                              <p style={{ margin: 0, fontSize: '0.625rem', color: '#a8a29e' }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.375rem', background: `${l.color}15`, color: l.color, fontWeight: 700, fontSize: '0.6875rem' }}>
                            {l.icon} {l.name}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: 800 }}>{u.streak_days}d</td>
                        <td style={td}>{u.days_active}</td>
                        <td style={td}>{u.total_trades}</td>
                        <td style={td}>{u.achievements_done || 0}</td>
                        <td style={td}>{u.rewards_total || 0}</td>
                        <td style={td}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: u.plan_name === 'pro' ? '#8b5cf6' : u.plan_name === 'plus' ? '#3b82f6' : '#a8a29e' }}>
                            {u.plan_name || 'gratis'}
                          </span>
                        </td>
                        <td style={td}>
                          <select
                            onChange={(e) => { e.stopPropagation(); overrideLevel(u.user_id, e.target.value) }}
                            value={u.level}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: '0.6875rem', padding: '0.25rem', borderRadius: '0.375rem', border: "1px solid var(--admin-line)", cursor: 'pointer' }}
                          >
                            {LEVEL_ORDER.map(lk => (
                              <option key={lk} value={lk}>{LEVELS[lk].name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Detail Modal */}
          {selectedUser && userDetail && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}
              onClick={() => { setSelectedUser(null); setUserDetail(null) }}
            >
              <div style={{ background: "var(--admin-panel2)", borderRadius: '1rem', maxWidth: '40rem', width: '100%', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                {detailLoading ? <p>Cargando...</p> : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Detalle de usuario</h2>
                      <button onClick={() => { setSelectedUser(null); setUserDetail(null) }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                      {[
                        { l: 'Nivel', v: LEVELS[userDetail.progress?.level]?.name || '?' },
                        { l: 'Racha', v: `${userDetail.progress?.streak_days || 0}d` },
                        { l: 'Días activos', v: userDetail.progress?.days_active || 0 },
                        { l: 'Cruces', v: userDetail.progress?.total_trades || 0 },
                        { l: 'Favoritos', v: userDetail.progress?.total_favorites || 0 },
                        { l: 'Álbumes', v: userDetail.progress?.total_albums || 0 },
                      ].map(s => (
                        <div key={s.l} style={{ padding: '0.625rem', borderRadius: '0.5rem', background: "var(--admin-panel2)", border: "1px solid var(--admin-line)", textAlign: 'center' }}>
                          <p style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>{s.v}</p>
                          <p style={{ fontSize: '0.625rem', fontWeight: 600, color: "var(--admin-muted)", margin: '0.125rem 0 0' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Achievements */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Hitos ({(userDetail.achievements || []).filter(a => a.completed).length}/{(userDetail.achievements || []).length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
                      {(userDetail.achievements || []).map(a => {
                        const def = ACHIEVEMENTS[a.key] || { icon: '?', name: a.key }
                        return (
                          <span key={a.key} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 700, background: a.completed ? '#dcfce7' : '#f5f5f4', color: a.completed ? '#166534' : "var(--admin-muted)", border: `1px solid ${a.completed ? '#bbf7d0' : "var(--admin-line)"}` }} title={`${a.progress}/${a.target}`}>
                            {def.icon} {def.name} {a.completed ? '✓' : `${a.progress}/${a.target}`}
                          </span>
                        )
                      })}
                    </div>

                    {/* Rewards */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Rewards</h3>
                    {(userDetail.rewards || []).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                        {(userDetail.rewards || []).map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: "var(--admin-panel2)", border: "1px solid var(--admin-line)", fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 700 }}>{r.type} ({r.value})</span>
                            <span style={{ color: "var(--admin-muted)" }}>{r.source}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: '0.75rem', color: '#a8a29e', marginBottom: '1rem' }}>Sin rewards</p>}

                    {/* Manual Reward Grant */}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Otorgar reward manual</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {[
                        { type: 'plus_days', value: '1 día', hours: 24, label: '+1 día Plus' },
                        { type: 'plus_days', value: '3 días', hours: 72, label: '+3 días Plus' },
                        { type: 'pro_days', value: '1 día', hours: 24, label: '+1 día Pro' },
                        { type: 'boost_visibility', value: '24h', hours: 24, label: 'Boost 24h' },
                        { type: 'extra_favorites', value: '48h', hours: 48, label: 'Favs extra 48h' },
                      ].map(r => (
                        <button key={r.label}
                          onClick={() => grantManualReward(selectedUser, r.type, r.value, r.hours)}
                          style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Top Streaks */}
          {stats?.top_streaks && stats.top_streaks.length > 0 && (
            <div style={{ background: "var(--admin-panel2)", borderRadius: '0.75rem', border: "1px solid var(--admin-line)", padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800 }}>🔥 Top rachas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {stats.top_streaks.map((ts, i) => (
                  <div key={ts.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: i < 3 ? '#fffbeb' : "var(--admin-panel2)" }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {ts.name || 'Sin nombre'}
                    </span>
                    <span style={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.875rem' }}>{ts.streak}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm()
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null })
        }}
        onCancel={() => setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  )
}

const th = { padding: '0.625rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }
const td = { padding: '0.625rem 0.75rem', whiteSpace: 'nowrap' }
