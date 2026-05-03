import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { validateAlgorithmConfigValue, formatScore, getScoreColor, buildScoreBreakdown } from '../lib/ranking'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' })

const categoryLabels = {
  matching: { icon: 'distance', label: 'Matching y Proximidad', color: '#3b82f6' },
  ranking: { icon: 'trending_up', label: 'Ranking y Visibilidad', color: 'var(--color-primary)' },
  penalties: { icon: 'gavel', label: 'Penalizaciones', color: '#ef4444' },
  limits: { icon: 'tune', label: 'Límites y Restricciones', color: '#f59e0b' },
  business: { icon: 'store', label: 'Negocios', color: '#8b5cf6' },
  general: { icon: 'settings', label: 'General', color: "var(--admin-muted2)" },
}

const TABS = [
  { id: 'config', label: 'Configuración', icon: 'tune' },
  { id: 'users', label: 'Ranking Usuarios', icon: 'group' },
  { id: 'business', label: 'Ranking Negocios', icon: 'storefront' },
  { id: 'explain', label: 'Explicación', icon: 'info' },
]

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        <span style={{ color: "var(--admin-muted)" }}>{label}</span>
        <span style={{ color }}>{formatScore(value)}</span>
      </div>
      <div style={{ height: '6px', background: "var(--admin-panel2)", borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(value || 0, 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

export default function AdminAlgorithm() {
  const { algorithmConfig, fetchAlgorithmConfig, updateAlgorithmConfig, userRankings, businessRankings, fetchUserRankings, fetchBusinessRankings, recalculateAllRankings, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('config')
  const [warning, setWarning] = useState('')
  const [recalcResult, setRecalcResult] = useState(null)

  useEffect(() => { fetchAlgorithmConfig() }, [])
  useEffect(() => { if (tab === 'users') fetchUserRankings(); if (tab === 'business') fetchBusinessRankings() }, [tab])

  const grouped = algorithmConfig.reduce((acc, c) => { acc[c.category] = acc[c.category] || []; acc[c.category].push(c); return acc }, {})

  const handleSave = async (key) => {
    setSaving(true)
    setWarning('')
    let val = editValue
    try { val = JSON.parse(editValue) } catch {}
    const check = validateAlgorithmConfigValue(key, val)
    if (!check.valid) {
      setWarning(check.warning)
      val = check.value
    }
    await updateAlgorithmConfig(key, val, user.id)
    setEditingKey(null)
    setSaving(false)
  }

  const handleRecalculate = async () => {
    const result = await recalculateAllRankings(user.id)
    setRecalcResult(result)
    setTimeout(() => setRecalcResult(null), 5000)
  }

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>psychology</span>
          Motor de Ranking y Algoritmo
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem', fontWeight: 500 }}>
          Controla pesos, boosts, penalizaciones y visualiza scores de usuarios y negocios.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap',
            background: tab === t.id ? 'var(--color-primary)' : '#fff', color: tab === t.id ? 'white' : "var(--admin-muted2)",
            border: tab === t.id ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button onClick={handleRecalculate} disabled={loading} style={{ ...btn("#f5f5f5", 'white'), marginLeft: 'auto', opacity: loading ? 0.5 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>sync</span>
          {loading ? 'Recalculando...' : 'Recalcular Todo'}
        </button>
      </div>

      {recalcResult && (
        <div style={{ ...card, marginBottom: '1rem', background: "rgba(16, 185, 129, 0.1)", border: '1px solid #a7f3d0' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#047857', margin: 0 }}>
            ✅ Recalculación completa — {recalcResult.users_scored} usuarios, {recalcResult.businesses_scored} negocios actualizados.
          </p>
        </div>
      )}

      {warning && (
        <div style={{ ...card, marginBottom: '1rem', background: "rgba(245, 158, 11, 0.1)", border: '1px solid #fcd34d' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400e', margin: 0 }}>⚠️ {warning}</p>
        </div>
      )}

      {/* TAB: CONFIG */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {algorithmConfig.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: "var(--admin-muted)" }}>Cargando configuración del algoritmo...</div>
          ) : Object.entries(grouped).map(([cat, items]) => {
            const meta = categoryLabels[cat] || categoryLabels.general
            return (
              <div key={cat} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span className="material-symbols-outlined" style={{ color: meta.color }}>{meta.icon}</span>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>{meta.label}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {items.map(config => {
                    const isEditing = editingKey === config.config_key
                    const rawValue = typeof config.config_value === 'string' ? config.config_value : JSON.stringify(config.config_value)
                    return (
                      <div key={config.config_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: "var(--admin-panel2)", borderRadius: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '12rem' }}>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: "#f5f5f5", margin: 0 }}>{config.config_key.replace(/_/g, ' ')}</p>
                          {config.description && <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", margin: '0.125rem 0 0' }}>{config.description}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isEditing ? (
                            <>
                              <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave(config.config_key)}
                                style={{ width: '8rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-text-secondary)', fontSize: '0.8125rem', fontWeight: 700 }} />
                              <button onClick={() => handleSave(config.config_key)} disabled={saving} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                {saving ? '...' : '✓'}
                              </button>
                              <button onClick={() => setEditingKey(null)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: "var(--admin-panel2)", color: "var(--admin-muted2)", border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✕</button>
                            </>
                          ) : (
                            <>
                              <code style={{ fontSize: '0.875rem', fontWeight: 800, color: meta.color, background: "var(--admin-panel2)", padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: "1px solid var(--admin-line)" }}>
                                {rawValue.replace(/"/g, '')}
                              </code>
                              <button onClick={() => { setEditingKey(config.config_key); setEditValue(rawValue.replace(/"/g, '')); setWarning('') }}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: "rgba(249, 115, 22, 0.1)", color: 'var(--color-primary)', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}>✏️</button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB: USER RANKINGS */}
      {tab === 'users' && (
        <div style={card}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>leaderboard</span>
            Ranking de Usuarios ({userRankings.length})
          </h3>
          {userRankings.length === 0 ? (
            <p style={{ color: "var(--admin-muted)", textAlign: 'center', padding: '2rem' }}>Sin datos. Ejecutá "Recalcular Todo" para generar scores.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {userRankings.slice(0, 50).map((r, i) => {
                const breakdown = buildScoreBreakdown(r, 'user')
                const scoreColor = getScoreColor(r.final_user_rank)
                return (
                  <div key={r.id} style={{ padding: '1rem', background: "var(--admin-panel2)", borderRadius: '0.75rem', border: "1px solid var(--admin-line)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: "var(--admin-muted)", width: '1.5rem' }}>#{i + 1}</span>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0 }}>{r.user?.name || 'Sin nombre'}</p>
                          <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted2)", margin: 0 }}>{r.user?.email} · {r.user?.plan_name || 'gratis'}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: scoreColor, margin: 0, lineHeight: 1 }}>{formatScore(r.final_user_rank)}</p>
                        {r.premium_boost_applied > 0 && <p style={{ fontSize: '0.625rem', color: '#f59e0b', margin: '0.125rem 0 0', fontWeight: 700 }}>boost {r.premium_boost_applied}x</p>}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                      {breakdown.map(b => <ScoreBar key={b.label} label={`${b.label} (${(b.weight * 100).toFixed(0)}%)`} value={b.value} color={getScoreColor(b.value)} />)}
                    </div>
                    {r.badges?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {r.badges.map(b => <span key={b} style={{ fontSize: '0.625rem', fontWeight: 700, background: "rgba(59, 130, 246, 0.1)", color: '#3b82f6', padding: '0.125rem 0.5rem', borderRadius: '1rem' }}>{b}</span>)}
                      </div>
                    )}
                    {r.penalties && Object.keys(r.penalties).length > 0 && (
                      <p style={{ fontSize: '0.625rem', color: '#ef4444', marginTop: '0.375rem', fontWeight: 600 }}>⚠️ Penalizaciones: {Object.keys(r.penalties).join(', ')}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: BUSINESS RANKINGS */}
      {tab === 'business' && (
        <div style={card}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#8b5cf6' }}>leaderboard</span>
            Ranking de Negocios ({businessRankings.length})
          </h3>
          {businessRankings.length === 0 ? (
            <p style={{ color: "var(--admin-muted)", textAlign: 'center', padding: '2rem' }}>Sin datos. Ejecutá "Recalcular Todo" para generar scores.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {businessRankings.slice(0, 50).map((r, i) => {
                const breakdown = buildScoreBreakdown(r, 'business')
                const scoreColor = getScoreColor(r.final_business_rank)
                return (
                  <div key={r.id} style={{ padding: '1rem', background: "var(--admin-panel2)", borderRadius: '0.75rem', border: "1px solid var(--admin-line)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: "var(--admin-muted)", width: '1.5rem' }}>#{i + 1}</span>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0 }}>{r.location?.name || '—'}</p>
                          <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted2)", margin: 0 }}>{r.location?.business_plan || 'gratis'} · {r.location?.type}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: scoreColor, margin: 0, lineHeight: 1 }}>{formatScore(r.final_business_rank)}</p>
                        {r.plan_boost_applied > 0 && <p style={{ fontSize: '0.625rem', color: '#8b5cf6', margin: '0.125rem 0 0', fontWeight: 700 }}>plan {r.plan_boost_applied}x</p>}
                        {r.sponsor_boost_applied > 0 && <p style={{ fontSize: '0.625rem', color: 'var(--color-primary)', margin: 0, fontWeight: 700 }}>sponsor {r.sponsor_boost_applied}x</p>}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                      {breakdown.map(b => <ScoreBar key={b.label} label={`${b.label} (${(b.weight * 100).toFixed(0)}%)`} value={b.value} color={getScoreColor(b.value)} />)}
                    </div>
                    {r.badges?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {r.badges.map(b => <span key={b} style={{ fontSize: '0.625rem', fontWeight: 700, background: '#f5f3ff', color: '#8b5cf6', padding: '0.125rem 0.5rem', borderRadius: '1rem' }}>{b}</span>)}
                      </div>
                    )}
                    {r.penalties && Object.keys(r.penalties).length > 0 && (
                      <p style={{ fontSize: '0.625rem', color: '#ef4444', marginTop: '0.375rem', fontWeight: 600 }}>⚠️ Penalizaciones: {Object.keys(r.penalties).join(', ')}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: EXPLANATION */}
      {tab === 'explain' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ ...card, borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ fontWeight: 800, color: '#9a3412', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined">shield</span> Regla Crítica Global
            </h4>
            <p style={{ fontSize: '0.9375rem', color: "#f5f5f5", fontWeight: 700, lineHeight: 1.8, margin: 0 }}>
              relevancia {'>'} contexto {'>'} cercanía {'>'} calidad {'>'} actividad {'>'} boost
            </p>
            <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", marginTop: '0.5rem', lineHeight: 1.6 }}>
              Premium, Pro, Turbo, Dominio y Sponsor <strong>NO pueden comprar el primer lugar</strong>.
              Los boosts solo actúan como desempate o mejora leve. Nunca pueden superar una relevancia fuerte.
            </p>
          </div>
          <div style={card}>
            <h4 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>📊 Fórmula de Usuario</h4>
            <code style={{ display: 'block', background: "var(--admin-panel2)", padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', lineHeight: 2, color: "#f5f5f5" }}>
              final_user_rank = (relevance × 0.40) + (trust × 0.20) + (activity × 0.15) + (quality × 0.15) + (profile × 0.10) × limited_boost
            </code>
          </div>
          <div style={card}>
            <h4 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>🏪 Fórmula de Negocio</h4>
            <code style={{ display: 'block', background: "var(--admin-panel2)", padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', lineHeight: 2, color: "#f5f5f5" }}>
              final_business_rank = (relevance × 0.35) + (engagement × 0.20) + (trust × 0.20) + (profile × 0.15) + (activity × 0.05) × limited_plan_boost
            </code>
          </div>
          <div style={{ ...card, background: "rgba(249, 115, 22, 0.1)", border: '1px solid #ffedd5' }}>
            <h4 style={{ fontWeight: 800, color: '#9a3412', marginBottom: '0.5rem' }}>⚠️ Límites de Boost</h4>
            <ul style={{ fontSize: '0.875rem', color: '#c2410c', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
              <li><strong>premium_boost</strong> no puede superar <strong>1.20x</strong></li>
              <li><strong>sponsor_boost</strong> no puede superar <strong>1.15x</strong></li>
              <li>Penalizaciones por reportes se aplican automáticamente</li>
              <li>Todos los cambios quedan registrados en auditoría</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
