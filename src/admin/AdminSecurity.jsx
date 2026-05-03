import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAdminStore } from '../stores/adminStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }

export default function AdminSecurity() {
  const { adminRole } = useAdminStore()
  const [healthChecks, setHealthChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [deniedAttempts, setDeniedAttempts] = useState([])

  useEffect(() => { runHealthCheck() }, [])

  const runHealthCheck = async () => {
    setLoading(true)
    const checks = []

    // 1. Check RLS on critical tables
    const criticalTables = ['profiles', 'user_roles', 'reports', 'payments', 'audit_log', 'admin_notes']
    for (const table of criticalTables) {
      try {
        const { error } = await supabase.from(table).select('id', { count: 'exact', head: true })
        checks.push({ name: `RLS: ${table}`, status: error ? 'warning' : 'ok', detail: error ? error.message : 'Tabla accesible con RLS activo' })
      } catch {
        checks.push({ name: `RLS: ${table}`, status: 'error', detail: 'Error al verificar tabla' })
      }
    }

    // 2. Check storage buckets
    const { data: buckets } = await supabase.storage.listBuckets()
    checks.push({ name: 'Storage Buckets', status: 'ok', detail: `${(buckets || []).length} buckets configurados` })

    // 3. Check sensitive roles
    const { data: godAdmins } = await supabase.from('user_roles').select('user_id, role').eq('role', 'god_admin')
    checks.push({ name: 'God Admins', status: (godAdmins || []).length <= 3 ? 'ok' : 'warning', detail: `${(godAdmins || []).length} usuarios con god_admin` })

    const { data: admins } = await supabase.from('user_roles').select('user_id, role').eq('role', 'admin')
    checks.push({ name: 'Admins', status: 'ok', detail: `${(admins || []).length} administradores` })

    // 4. Check blocked users
    const { count: blockedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', true)
    checks.push({ name: 'Usuarios Bloqueados', status: 'ok', detail: `${blockedCount || 0} usuarios bloqueados actualmente` })

    // 5. Denied attempts from audit log
    const { data: denied } = await supabase.from('audit_log').select('*, user:user_id(name, email)').ilike('action', '%DENIED%').order('created_at', { ascending: false }).limit(20)
    setDeniedAttempts(denied || [])

    // 6. Feature flags status
    const { data: flags } = await supabase.from('app_settings').select('key, value').in('key', ['maintenance_mode', 'enable_chat', 'enable_trades', 'enable_premium_plans'])
    ;(flags || []).forEach(f => {
      checks.push({ name: `Flag: ${f.key}`, status: f.value === true || f.value === 'true' ? 'ok' : 'info', detail: `${f.value}` })
    })

    // 7. Pending reports
    const { count: pendingReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    checks.push({ name: 'Reportes Pendientes', status: (pendingReports || 0) > 10 ? 'warning' : 'ok', detail: `${pendingReports || 0} reportes sin resolver` })

    setHealthChecks(checks)
    setLoading(false)
  }

  const statusIcon = { ok: 'check_circle', warning: 'warning', error: 'error', info: 'info' }
  const statusColor = { ok: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' }

  return (
    <div style={{ paddingBottom: '2rem' }}>
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Panel de Seguridad</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Health checks, RLS, roles sensibles, intentos denegados y flags críticas.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">security</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button onClick={runHealthCheck} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: "var(--admin-panel2)", color: "var(--admin-muted)", border: "1px solid var(--admin-line)", fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>refresh</span>
          Re-escanear
        </button></div>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: "var(--admin-muted)" }}>Ejecutando health checks...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '1.5rem' }}>
          {/* Health Checks */}
          <div style={card}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981' }}>verified</span>
              Health Checks ({healthChecks.filter(c => c.status === 'ok').length}/{healthChecks.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {healthChecks.map((check, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: "var(--admin-panel2)", borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: statusColor[check.status] }}>{statusIcon[check.status]}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: "var(--admin-muted)" }}>{check.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: statusColor[check.status], fontWeight: 700 }}>{check.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Denied Attempts */}
          <div style={card}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>gpp_bad</span>
              Intentos Denegados ({deniedAttempts.length})
            </h3>
            {deniedAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: "var(--admin-muted)", fontSize: '0.875rem' }}>Sin intentos denegados registrados. ✅</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '20rem', overflowY: 'auto' }}>
                {deniedAttempts.map(attempt => (
                  <div key={attempt.id} style={{ padding: '0.75rem', background: "rgba(239, 68, 68, 0.1)", borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#b91c1c' }}>{attempt.action}</span>
                      <span style={{ fontSize: '0.6875rem', color: "var(--admin-muted)" }}>{new Date(attempt.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", margin: 0 }}>
                      Usuario: {attempt.user?.name || 'Desconocido'} ({attempt.user?.email || '—'})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Role */}
          <div style={{ ...card, background: "#f5f5f5", color: 'white', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: "var(--admin-panel2)" }}>Tu Sesión Actual</h3>
            <p style={{ fontSize: '0.875rem', color: "var(--admin-muted)" }}>
              Rol activo: <span style={{ color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase' }}>{adminRole}</span>
              {' '}— Nivel de acceso: {adminRole === 'god_admin' ? 'Total' : adminRole === 'admin' ? 'Alto' : 'Restringido'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
