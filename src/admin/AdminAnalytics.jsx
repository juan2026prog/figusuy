import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminAnalytics() {
  const { analyticsData, dailyActivity, fetchAnalytics, loading } = useAdminStore()

  useEffect(() => { fetchAnalytics() }, [])

  const d = analyticsData || {}

  const kpis = [
    { label: 'DAU', value: d.dau, icon: 'bolt', color: '#ea580c', bg: '#fff7ed' },
    { label: 'WAU', value: d.wau, icon: 'date_range', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'MAU', value: d.mau, icon: 'calendar_month', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Total Usuarios', value: d.total_users, icon: 'group', color: '#0f172a', bg: '#f8fafc' },
    { label: 'Premium', value: d.premium_users, icon: 'workspace_premium', color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Registros (7d)', value: d.registrations_7d, icon: 'person_add', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Registros (30d)', value: d.registrations_30d, icon: 'groups', color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Álbumes Activos', value: d.active_albums, icon: 'menu_book', color: '#ea580c', bg: '#fff7ed' },
    { label: 'Cruces Totales', value: d.total_trades, icon: 'swap_horiz', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Cruces (7d)', value: d.trades_7d, icon: 'trending_up', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Chats Totales', value: d.total_chats, icon: 'forum', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Chats (7d)', value: d.chats_7d, icon: 'chat_bubble', color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Chats Expirados', value: d.expired_chats, icon: 'timer_off', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Locales Activos', value: d.active_locations, icon: 'storefront', color: '#ea580c', bg: '#fff7ed' },
    { label: 'Favoritos', value: d.total_favorites, icon: 'favorite', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Reportes Pend.', value: d.pending_reports, icon: 'report', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Revenue Total', value: `$${(d.total_payments || 0).toLocaleString()}`, icon: 'payments', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Revenue (30d)', value: `$${(d.payments_30d || 0).toLocaleString()}`, icon: 'trending_up', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Promos Activas', value: d.active_promos, icon: 'campaign', color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Impresiones (7d)', value: d.promo_impressions_7d, icon: 'visibility', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Clicks Promos (7d)', value: d.promo_clicks_7d, icon: 'ads_click', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'CTR Promos', value: d.promo_impressions_7d > 0 ? `${((d.promo_clicks_7d / d.promo_impressions_7d) * 100).toFixed(2)}%` : '0%', icon: 'percent', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Suscripciones Usr', value: d.active_subscriptions, icon: 'card_membership', color: '#ea580c', bg: '#fff7ed' },
    { label: 'Suscripciones Neg.', value: d.active_business_subs, icon: 'store', color: '#0f172a', bg: '#f8fafc' },
  ]

  const maxDaily = Math.max(...(dailyActivity || []).map(d => d.active_users || 0), 1)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>analytics</span>
            Analytics & Business Intelligence
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
            Métricas reales del sistema — datos de Supabase en tiempo real.
          </p>
        </div>
        <button onClick={fetchAnalytics} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>refresh</span>
          Actualizar
        </button>
      </div>

      {loading && !analyticsData ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Cargando analytics...</div>
      ) : (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {kpis.map(k => (
              <div key={k.label} style={{ ...card, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{k.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, margin: 0 }}>{k.value ?? '—'}</p>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.25rem 0 0' }}>{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Activity Chart */}
          <div style={{ ...card, marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>show_chart</span>
              Actividad Diaria (Últimos 14 días)
            </h3>
            {dailyActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Sin datos de actividad diaria disponibles.</div>
            ) : (
              <>
                <div style={{ height: '12rem', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  {dailyActivity.map((day, i) => {
                    const h = Math.max(((day.active_users || 0) / maxDaily) * 100, 4)
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#64748b' }}>{day.active_users || 0}</span>
                        <div style={{ width: '100%', background: '#ea580c', height: `${h}%`, borderRadius: '0.25rem 0.25rem 0 0', minHeight: '4px', transition: 'height 0.3s' }} />
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.5625rem', fontWeight: 600 }}>
                  {dailyActivity.map((day, i) => (
                    <span key={i} style={{ flex: 1, textAlign: 'center' }}>{day.date ? new Date(day.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }) : ''}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Revenue & Trades daily breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={card}>
              <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Revenue Diario (14d)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dailyActivity.slice(-7).map((day, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#475569' }}>{day.date ? new Date(day.date).toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit' }) : ''}</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>${(day.payments || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Cruces Diarios (7d)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dailyActivity.slice(-7).map((day, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#475569' }}>{day.date ? new Date(day.date).toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit' }) : ''}</span>
                    <span style={{ fontWeight: 800, color: '#8b5cf6' }}>{day.trades || 0}</span>
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
