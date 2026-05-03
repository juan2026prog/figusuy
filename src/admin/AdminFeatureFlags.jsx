import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFeatureFlagStore } from '../stores/featureFlagStore'
import { useToast } from '../components/Toast'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const badge = (color, bg) => ({ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.375rem', color, background: bg, textTransform: 'uppercase', letterSpacing: '0.03em' })

const SCOPE_COLORS = { module: { c: '#0369a1', bg: '#e0f2fe' }, subfeature: { c: '#7c3aed', bg: '#ede9fe' }, experimental: { c: '#c2410c', bg: '#fff7ed' }, global: { c: '#166534', bg: '#dcfce7' } }
const PLAN_OPTIONS = ['free', 'premium', 'pro', 'business']
const ROLE_OPTIONS = ['user', 'admin', 'god_admin', 'moderator', 'support', 'comercial', 'analista']

function Toggle({ checked, onChange, color = 'var(--color-primary)', disabled }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!checked)} style={{
      width: '2.75rem', height: '1.5rem', borderRadius: '1rem', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: checked ? color : "var(--admin-muted)", transition: 'all 0.2s', position: 'relative', opacity: disabled ? 0.5 : 1, flexShrink: 0
    }}>
      <div style={{ width: '1.1rem', height: '1.1rem', background: "var(--admin-panel2)", borderRadius: '50%', position: 'absolute', top: '0.2rem', left: checked ? '1.45rem' : '0.2rem', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function RolloutSlider({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
      <input type="range" min="0" max="100" value={value} onChange={e => onChange(parseInt(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--color-primary)', height: '4px' }} />
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: "#f5f5f5", minWidth: '2.5rem', textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

function MultiSelect({ options, selected, onChange, label }) {
  return (
    <div>
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {options.map(opt => {
          const active = (selected || []).includes(opt)
          return (
            <button key={opt} onClick={() => {
              const next = active ? (selected || []).filter(s => s !== opt) : [...(selected || []), opt]
              onChange(next)
            }} style={{
              fontSize: '0.6875rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: '1px solid',
              borderColor: active ? 'var(--color-primary)' : "var(--admin-line)", background: active ? '#fff7ed' : "var(--admin-panel2)",
              color: active ? 'var(--color-primary)' : "var(--admin-muted2)", cursor: 'pointer', transition: 'all 0.15s'
            }}>{opt}</button>
          )
        })}
      </div>
    </div>
  )
}

function FlagCard({ flag, onToggle, onKillSwitch, onUpdate, parentFlag }) {
  const [expanded, setExpanded] = useState(false)
  const [rollout, setRollout] = useState(flag.rollout_percentage)
  const [betaOnly, setBetaOnly] = useState(flag.beta_only)
  const [plans, setPlans] = useState(flag.allowed_plans || [])
  const [roles, setRoles] = useState(flag.allowed_roles || [])
  const [dirty, setDirty] = useState(false)

  const isKilled = flag.kill_switch
  const isDisabled = !flag.is_enabled
  const parentDisabled = parentFlag && (!parentFlag.is_enabled || parentFlag.kill_switch)

  const statusColor = isKilled ? '#dc2626' : parentDisabled ? '#9ca3af' : isDisabled ? "var(--admin-muted2)" : '#16a34a'
  const statusLabel = isKilled ? 'KILLED' : parentDisabled ? 'PARENT OFF' : isDisabled ? 'OFF' : rollout < 100 ? `${rollout}%` : 'ON'
  const sc = SCOPE_COLORS[flag.scope] || SCOPE_COLORS.global

  const handleSave = () => {
    onUpdate(flag.feature_key, { rollout_percentage: rollout, beta_only: betaOnly, allowed_plans: plans, allowed_roles: roles })
    setDirty(false)
  }

  return (
    <div style={{ ...card, padding: '1rem 1.25rem', opacity: isKilled ? 0.6 : 1, borderLeft: `4px solid ${statusColor}`, transition: 'all 0.2s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: "#f5f5f5" }}>{flag.name}</span>
              <span style={badge(sc.c, sc.bg)}>{flag.scope}</span>
              {flag.beta_only && <span style={badge('#b45309', '#fef3c7')}>β Beta</span>}
              {flag.kill_switch && <span style={badge('#dc2626', '#fef2f2')}>🚨 Kill</span>}
              <span style={{ ...badge(statusColor, statusColor + '15'), fontWeight: 800 }}>{statusLabel}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: "var(--admin-muted)", fontFamily: 'monospace' }}>{flag.feature_key}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <Toggle checked={flag.is_enabled} onChange={v => onToggle(flag.feature_key, v)} disabled={isKilled} />
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: "var(--admin-muted2)", display: 'flex', alignItems: 'center', padding: '0.25rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
          </button>
        </div>
      </div>

      {flag.description && <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", margin: '0.5rem 0 0' }}>{flag.description}</p>}

      {/* Expanded Config */}
      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Rollout */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted2)", marginBottom: '0.375rem', textTransform: 'uppercase' }}>Rollout</p>
            <RolloutSlider value={rollout} onChange={v => { setRollout(v); setDirty(true) }} />
          </div>

          {/* Beta only */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: "#f5f5f5" }}>Solo Beta Testers</p>
              <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)" }}>Solo visible para usuarios con is_beta_tester = true</p>
            </div>
            <Toggle checked={betaOnly} onChange={v => { setBetaOnly(v); setDirty(true) }} color="#b45309" />
          </div>

          {/* Plans */}
          <MultiSelect options={PLAN_OPTIONS} selected={plans} onChange={v => { setPlans(v); setDirty(true) }} label="Planes permitidos (vacío = todos)" />

          {/* Roles */}
          <MultiSelect options={ROLE_OPTIONS} selected={roles} onChange={v => { setRoles(v); setDirty(true) }} label="Roles permitidos (vacío = todos)" />

          {/* Kill Switch */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: isKilled ? '#fef2f2' : "var(--admin-panel2)", borderRadius: '0.75rem', border: `1px solid ${isKilled ? '#fecaca' : "var(--admin-line)"}` }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: isKilled ? '#dc2626' : "#f5f5f5" }}>🚨 Kill Switch</p>
              <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)" }}>Apaga la feature inmediatamente, ignorando todo</p>
            </div>
            <Toggle checked={isKilled} onChange={v => onKillSwitch(flag.feature_key, v)} color="#dc2626" />
          </div>

          {/* Meta info */}
          <div style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {flag.parent_feature_key && <span>Parent: <strong>{flag.parent_feature_key}</strong></span>}
            <span>Creado: {new Date(flag.created_at).toLocaleDateString('es-UY')}</span>
            <span>Actualizado: {new Date(flag.updated_at).toLocaleDateString('es-UY')}</span>
          </div>

          {/* Save button */}
          {dirty && (
            <button onClick={handleSave} style={{
              background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.625rem',
              fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', alignSelf: 'flex-end', transition: 'all 0.2s'
            }}>Guardar Cambios</button>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminFeatureFlags() {
  const { profile } = useAuthStore()
  const { 
    flags, auditLog, loading, fetchFlags, fetchAuditLog, 
    toggleFlag, toggleKillSwitch, updateFlag, emergencyKillAll, restoreAll 
  } = useFeatureFlagStore()
  const toast = useToast()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('flags') // flags | audit
  const [confirmKillAll, setConfirmKillAll] = useState(false)

  useEffect(() => { 
    fetchFlags()
    fetchAuditLog() 
  }, [])

  const handleToggle = async (key, enabled) => {
    const err = await toggleFlag(key, enabled, profile?.id)
    if (err) toast.error('Error al cambiar estado: ' + err.message)
    else toast.success(`Feature ${enabled ? 'activada' : 'desactivada'}`)
    fetchAuditLog()
  }

  const handleKillSwitch = async (key, killed) => {
    const err = await toggleKillSwitch(key, killed, profile?.id)
    if (err) toast.error('Error en Kill Switch: ' + err.message)
    else toast.success(killed ? '🚨 Feature desactivada (Kill)' : '✅ Feature restaurada')
    fetchAuditLog()
  }

  const handleUpdate = async (key, updates) => {
    const err = await updateFlag(key, updates, profile?.id)
    if (err) toast.error('Error al actualizar: ' + err.message)
    else toast.success('Configuración guardada')
    fetchAuditLog()
  }

  const handleEmergencyKillAll = async () => {
    try {
      const err = await emergencyKillAll()
      if (err) throw err
      toast.success('🚨 EMERGENCIA: Todas las funciones apagadas')
    } catch (err) {
      toast.error('Fallo al activar emergencia: ' + err.message)
    }
    setConfirmKillAll(false)
    fetchAuditLog()
  }

  const handleRestoreAll = async () => {
    try {
      const err = await restoreAll()
      if (err) throw err
      toast.success('✅ Sistema restaurado correctamente')
    } catch (err) {
      toast.error('Fallo al restaurar: ' + err.message)
    }
    fetchAuditLog()
  }

  const modules = flags.filter(f => f.scope === 'module')
  const subfeatures = flags.filter(f => f.scope === 'subfeature')
  const killed = flags.filter(f => f.kill_switch)
  const disabled = flags.filter(f => !f.is_enabled && !f.kill_switch)

  const filteredFlags = flags.filter(f => {
    if (filter === 'modules') return f.scope === 'module'
    if (filter === 'subfeatures') return f.scope === 'subfeature'
    if (filter === 'enabled') return f.is_enabled && !f.kill_switch
    if (filter === 'disabled') return !f.is_enabled || f.kill_switch
    if (filter === 'beta') return f.beta_only
    return true
  }).filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.name.toLowerCase().includes(q) || f.feature_key.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
  })

  const actionColors = { enable: '#16a34a', disable: "var(--admin-muted2)", update: '#0369a1', kill_switch_on: '#dc2626', kill_switch_off: '#f59e0b', rollout_change: '#7c3aed' }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>toggle_on</span>
          Release Control / Feature Flags
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem' }}>
          Controla módulos, subfeatures, rollout, beta access y kill switches sin deploy.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Módulos', value: modules.length, icon: 'grid_view', color: '#0369a1' },
          { label: 'Subfeatures', value: subfeatures.length, icon: 'tune', color: '#7c3aed' },
          { label: 'Activas', value: flags.filter(f => f.is_enabled && !f.kill_switch).length, icon: 'check_circle', color: '#16a34a' },
          { label: 'Desactivadas', value: disabled.length, icon: 'cancel', color: "var(--admin-muted2)" },
          { label: 'Kill Switch', value: killed.length, icon: 'dangerous', color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: s.color, fontSize: '1.5rem' }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{s.value}</p>
              <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", fontWeight: 600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Controls */}
      <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1.5rem', background: killed.length > 0 ? '#fef2f2' : "var(--admin-panel2)", border: killed.length > 0 ? '1px solid #fecaca' : '1px solid #e7e5e4' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '1.5rem' }}>emergency</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.9375rem', color: "#f5f5f5" }}>Emergency Controls</p>
              <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)" }}>Kill switch global — apaga todo inmediatamente</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!confirmKillAll ? (
              <button onClick={() => setConfirmKillAll(true)} style={{
                background: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>power_settings_new</span> KILL ALL
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>¿CONFIRMAR?</span>
                <button onClick={handleEmergencyKillAll} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.6875rem', cursor: 'pointer' }}>SÍ, MATAR TODO</button>
                <button onClick={() => setConfirmKillAll(false)} style={{ background: "var(--admin-line)", color: "var(--admin-muted)", border: 'none', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.6875rem', cursor: 'pointer' }}>Cancelar</button>
              </div>
            )}
            {killed.length > 0 && (
              <button onClick={handleRestoreAll} style={{
                background: '#16a34a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>restore</span> RESTORE ALL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: "var(--admin-panel2)", borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
        {[{ key: 'flags', label: 'Feature Flags', icon: 'toggle_on' }, { key: 'audit', label: 'Audit Log', icon: 'receipt_long' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none',
            fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s',
            background: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? "#f5f5f5" : "var(--admin-muted2)",
            boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === 'flags' && (
        <>
          {/* Filter + Search */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 16rem' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: "var(--admin-muted)", fontSize: '1.125rem' }}>search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar feature..." style={{
                width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', borderRadius: '0.625rem', border: "1px solid var(--admin-line)",
                fontSize: '0.8125rem', background: "var(--admin-panel2)", outline: 'none', boxSizing: 'border-box'
              }} />
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Todas' },
                { key: 'modules', label: 'Módulos' },
                { key: 'subfeatures', label: 'Sub' },
                { key: 'enabled', label: 'Activas' },
                { key: 'disabled', label: 'Off' },
                { key: 'beta', label: 'Beta' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  borderColor: filter === f.key ? 'var(--color-primary)' : "var(--admin-line)", background: filter === f.key ? '#fff7ed' : 'white', color: filter === f.key ? 'var(--color-primary)' : "var(--admin-muted2)"
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Flag Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>Cargando flags...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredFlags.length === 0 && <p style={{ textAlign: 'center', color: "var(--admin-muted)", padding: '2rem' }}>No se encontraron feature flags.</p>}
              {filteredFlags.map(flag => (
                <FlagCard key={flag.id} flag={flag} parentFlag={flag.parent_feature_key ? flags.find(f => f.feature_key === flag.parent_feature_key) : null}
                  onToggle={handleToggle} onKillSwitch={handleKillSwitch} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'audit' && (
        <div style={card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>receipt_long</span> Historial de Cambios
          </h3>
          {auditLog.length === 0 ? (
            <p style={{ color: "var(--admin-muted)", fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>Sin cambios registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {auditLog.map(entry => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: "var(--admin-panel2)", borderRadius: '0.625rem', fontSize: '0.8125rem' }}>
                  <span style={{ ...badge(actionColors[entry.action] || "var(--admin-muted2)", (actionColors[entry.action] || "var(--admin-muted2)") + '18'), minWidth: '5rem', textAlign: 'center' }}>
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontWeight: 700, color: "#f5f5f5", fontFamily: 'monospace', fontSize: '0.75rem' }}>{entry.feature_key}</span>
                  <span style={{ color: "var(--admin-muted)", flex: 1 }}>{entry.reason || ''}</span>
                  <span style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", whiteSpace: 'nowrap' }}>
                    {entry.changer?.name || 'System'} · {new Date(entry.created_at).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
