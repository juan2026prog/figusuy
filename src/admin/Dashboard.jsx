import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useNavigate } from 'react-router-dom'

const card = {
  background: '#ffffff', borderRadius: '1rem', padding: '1.25rem',
  border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
}

export default function AdminDashboard() {
  const { stats, fetchStats, analyticsData, fetchAnalytics, loading } = useAdminStore()
  const navigate = useNavigate()

  useEffect(() => { fetchStats(); fetchAnalytics() }, [])

  // Real analytics data
  const ad = analyticsData || {}

  const metrics = stats ? [
    { label: 'Usuarios totales', value: stats.totalUsers, icon: 'group', color: '#ea580c', bg: '#fff7ed' },
    { label: 'Activos hoy', value: stats.activeToday, icon: 'bolt', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Chats Reportados', value: stats.reportedChatCount, icon: 'forum', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Cruces totales', value: stats.totalTrades, icon: 'swap_horiz', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Reportes pendientes', value: stats.pendingReports, icon: 'report', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Locales activos', value: stats.totalLocations || 0, icon: 'storefront', color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Solicitudes locales', value: stats.pendingLocationRequests, icon: 'how_to_reg', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: 'workspace_premium', color: '#ec4899', bg: '#fdf2f8' },
  ] : []

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>dashboard</span>
            God Admin Center
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Centro operativo total de FigusUY
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => fetchStats()} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>sync</span>
          <span style={{ fontWeight: 600 }}>Sincronizando operaciones...</span>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div style={{ ...card, marginBottom: '2rem', background: '#020617', color: 'white', borderColor: '#1e293b' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#eab308' }}>bolt</span>
              Acciones Rápidas
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {[
                { label: 'Revisar reportes', path: '/admin/reports', color: '#ef4444', icon: 'gavel' },
                { label: 'Aprobar locales', path: '/admin/location-requests', color: '#f59e0b', icon: 'fact_check' },
                { label: 'Crear promo', path: '/admin/promos', color: '#ec4899', icon: 'add_alert' },
                { label: 'Nuevo álbum', path: '/admin/albums', color: '#ea580c', icon: 'library_add' },
                { label: 'Enviar Push', path: '/admin/notifications', color: '#3b82f6', icon: 'send' },
                { label: 'Ajustar algoritmo', path: '/admin/algorithm', color: '#8b5cf6', icon: 'tune' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)} style={{
                  padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
                  background: `${a.color}20`, color: a.color, cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none',
                  border: `1px solid ${a.color}40`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {metrics.map(m => (
              <div key={m.label} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem' }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '0.75rem',
                  background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: m.color, flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.value}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue & Health */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '1.5rem' }}>
            
            {/* Revenue Block */}
            <div style={card}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981' }}>payments</span>
                Revenue Real
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Pagos Totales</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ingresos históricos completados</p>
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    ${(ad.total_payments || 0).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Revenue (30 días)</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Último mes</p>
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    ${(ad.payments_30d || 0).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Suscripciones Activas</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ad.active_subscriptions || 0} usuarios + {ad.active_business_subs || 0} negocios</p>
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    {(ad.active_subscriptions || 0) + (ad.active_business_subs || 0)}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Promos Activas</p>
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>
                    {ad.active_promos || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Health Block */}
            <div style={card}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>monitor_heart</span>
                Estado del Sistema
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'Supabase', status: 'Conectado', color: '#10b981', icon: 'database' },
                  { label: 'Reportes Pendientes', status: `${stats?.pendingReports || 0}`, color: (stats?.pendingReports || 0) > 5 ? '#ef4444' : '#10b981', icon: 'report' },
                  { label: 'Usuarios Bloqueados', status: `${stats?.blockedUsers || 0}`, color: '#64748b', icon: 'block' },
                  { label: 'Promos Activas', status: `${ad.active_promos || 0}`, color: '#ea580c', icon: 'campaign' },
                  { label: 'Chats Expirados', status: `${ad.expired_chats || 0}`, color: (ad.expired_chats || 0) > 20 ? '#f59e0b' : '#10b981', icon: 'timer_off' },
                  { label: 'Solicitudes Locales Pend.', status: `${stats?.pendingLocationRequests || 0}`, color: (stats?.pendingLocationRequests || 0) > 0 ? '#f59e0b' : '#10b981', icon: 'pending_actions' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#64748b' }}>{s.icon}</span>
                      <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: s.color }} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
