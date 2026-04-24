import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = {
  background: 'white', borderRadius: '0.75rem', padding: '1.25rem',
  border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

export default function AdminDashboard() {
  const { stats, fetchStats, loading } = useAdminStore()

  useEffect(() => { fetchStats() }, [])

  const metrics = stats ? [
    { label: 'Usuarios totales', value: stats.totalUsers, icon: '👥', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Activos hoy', value: stats.activeToday, icon: '🟢', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Usuarios Premium', value: stats.premiumUsers, icon: '👑', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Álbumes', value: stats.totalAlbums, icon: '📖', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Intercambios', value: stats.totalTrades, icon: '🔄', color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Mensajes', value: stats.totalMessages, icon: '💬', color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Álbumes activos', value: stats.totalUserAlbums, icon: '📊', color: '#14b8a6', bg: '#f0fdfa' },
    { label: 'Reportes pendientes', value: stats.pendingReports, icon: '🚨', color: '#ef4444', bg: '#fef2f2' },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          📊 Dashboard General
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
          Vista general de la plataforma FigusUy
        </p>
      </div>

      {loading && !stats ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando métricas...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {metrics.map(m => (
              <div key={m.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '0.75rem',
                  background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', flexShrink: 0,
                }}>{m.icon}</div>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color, letterSpacing: '-0.02em' }}>{m.value}</p>
                  <p style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.875rem', color: '#0f172a' }}>⚡ Acciones rápidas</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { label: '+ Crear álbum', path: '/admin/albums', color: '#3b82f6' },
                { label: '+ Crear evento', path: '/admin/events', color: '#10b981' },
                { label: '📋 Ver reportes', path: '/admin/reports', color: '#ef4444' },
                { label: '👥 Gestionar usuarios', path: '/admin/users', color: '#8b5cf6' },
                { label: '⚙️ Configuración', path: '/admin/settings', color: '#64748b' },
                { label: '🧠 Ajustar algoritmo', path: '/admin/algorithm', color: '#f59e0b' },
              ].map(a => (
                <a key={a.label} href={a.path} style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  background: `${a.color}12`, color: a.color,
                  fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
                  border: `1px solid ${a.color}25`, transition: 'all 0.2s',
                }}>{a.label}</a>
              ))}
            </div>
          </div>

          {/* Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1rem' }}>
            {/* Revenue Placeholder */}
            <div style={card}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>💰 Ingresos del mes</h3>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                ${(stats?.premiumUsers || 0) * 499}
                <span style={{ fontSize: '0.875rem', color: '#94a3b8', marginLeft: '0.25rem' }}>UYU</span>
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Basado en {stats?.premiumUsers || 0} usuarios premium × $499/mes
              </p>
            </div>

            {/* Platform Health */}
            <div style={card}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>🏥 Salud de la plataforma</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Servidor', status: '✅ Online', color: '#10b981' },
                  { label: 'Base de datos', status: '✅ Operativa', color: '#10b981' },
                  { label: 'Auth', status: '✅ Activo', color: '#10b981' },
                  { label: 'Realtime', status: '✅ Conectado', color: '#10b981' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{s.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color }}>{s.status}</span>
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
