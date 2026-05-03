import React, { useEffect } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { stats, fetchStats, analyticsData, fetchAnalytics, loading } = useAdminStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
    fetchAnalytics()
  }, [])

  const ad = analyticsData || {}
  const metrics = stats ? [
    { label: 'Usuarios totales', value: stats.totalUsers, icon: 'group', tone: 'orange' },
    { label: 'Activos hoy', value: stats.activeToday, icon: 'bolt', tone: 'green' },
    { label: 'Chats reportados', value: stats.reportedChatCount, icon: 'forum', tone: 'blue' },
    { label: 'Cruces totales', value: stats.totalTrades, icon: 'swap_horiz', tone: 'orange' },
    { label: 'Reportes pendientes', value: stats.pendingReports, icon: 'report', tone: 'red' },
    { label: 'Locales activos', value: stats.totalLocations || 0, icon: 'storefront', tone: 'blue' },
    { label: 'Solicitudes locales', value: stats.pendingLocationRequests, icon: 'how_to_reg', tone: 'yellow' },
    { label: 'Premium users', value: stats.premiumUsers, icon: 'workspace_premium', tone: 'orange' },
  ] : []

  const quickActions = [
    { label: 'Revisar reportes', path: '/admin/reports', icon: 'gavel', tone: 'red' },
    { label: 'Aprobar locales', path: '/admin/location-requests', icon: 'fact_check', tone: 'yellow' },
    { label: 'Crear promo', path: '/admin/promos', icon: 'add_alert', tone: 'orange' },
    { label: 'Nuevo album', path: '/admin/albums', icon: 'library_add', tone: 'blue' },
    { label: 'Enviar push', path: '/admin/notifications', icon: 'send', tone: 'blue' },
    { label: 'Gestionar afiliados', path: '/admin/affiliates', icon: 'campaign', tone: 'orange' },
    { label: 'Ajustar algoritmo', path: '/admin/algorithm', icon: 'tune', tone: 'yellow' },
  ]

  const systemHealth = [
    { label: 'Supabase', status: 'Conectado', icon: 'database', tone: 'green' },
    { label: 'Reportes pendientes', status: `${stats?.pendingReports || 0}`, icon: 'report', tone: (stats?.pendingReports || 0) > 5 ? 'red' : 'green' },
    { label: 'Usuarios bloqueados', status: `${stats?.blockedUsers || 0}`, icon: 'block', tone: 'orange' },
    { label: 'Promos activas', status: `${ad.active_promos || 0}`, icon: 'campaign', tone: 'orange' },
    { label: 'Chats expirados', status: `${ad.expired_chats || 0}`, icon: 'timer_off', tone: (ad.expired_chats || 0) > 20 ? 'yellow' : 'green' },
    { label: 'Solicitudes locales', status: `${stats?.pendingLocationRequests || 0}`, icon: 'pending_actions', tone: (stats?.pendingLocationRequests || 0) > 0 ? 'yellow' : 'green' },
  ]

  return (
    <div className="admin-dashboard">
      <style>{`
        .admin-dashboard {
          padding-bottom: 2rem;
        }

        .ad-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .ad-hero-main,
        .ad-hero-side,
        .ad-section,
        .ad-kpi,
        .ad-action-card,
        .ad-health-card {
          border: 1px solid var(--admin-line);
          background: var(--admin-panel);
        }

        .ad-hero-main {
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          background:
            linear-gradient(135deg, rgba(255,90,0,.14) 0%, rgba(255,90,0,.04) 26%, transparent 48%),
            linear-gradient(180deg, #171717 0%, #111111 100%);
        }

        .ad-hero-main::before {
          content: 'CONTROL';
          position: absolute;
          right: 1rem;
          top: -.2rem;
          font: italic 900 clamp(4rem, 9vw, 7rem) 'Barlow Condensed';
          line-height: .82;
          color: rgba(255,255,255,.04);
          pointer-events: none;
        }

        .ad-hero-main h1 {
          margin: .55rem 0 0;
          font: italic 900 clamp(2.9rem, 6vw, 4.8rem) 'Barlow Condensed';
          line-height: .84;
          text-transform: uppercase;
        }

        .ad-hero-main h1 span {
          color: var(--admin-orange);
        }

        .ad-hero-main p,
        .ad-hero-side p,
        .ad-section-copy {
          color: var(--admin-muted);
          line-height: 1.58;
        }

        .ad-badges {
          display: flex;
          flex-wrap: wrap;
          gap: .55rem;
          margin-top: 1rem;
        }

        .ad-badge {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          padding: .42rem .62rem;
          border: 1px solid var(--admin-line2);
          background: #0d0d0d;
          font: 900 .7rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .ad-badge.orange {
          color: var(--admin-orange);
          border-color: rgba(255,90,0,.32);
          background: rgba(255,90,0,.08);
        }

        .ad-badge.green {
          color: var(--admin-green);
          border-color: rgba(34,197,94,.32);
          background: rgba(34,197,94,.08);
        }

        .ad-badge.blue {
          color: var(--admin-blue);
          border-color: rgba(56,189,248,.32);
          background: rgba(56,189,248,.08);
        }

        .ad-hero-side {
          padding: 1.4rem;
          background: var(--admin-panel2);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
        }

        .ad-hero-side h2,
        .ad-section h2 {
          margin: .5rem 0 0;
          font: italic 900 2.25rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .ad-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .ad-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .45rem;
          padding: .82rem 1rem;
          border: 1px solid var(--admin-line2);
          background: transparent;
          color: #fff;
          font: 900 .82rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .ad-refresh:hover {
          border-color: var(--admin-orange);
          color: var(--admin-orange);
        }

        .ad-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .ad-action-card {
          padding: 1.1rem;
          cursor: pointer;
          transition: border-color .18s, transform .18s;
        }

        .ad-action-card:hover {
          border-color: rgba(255,90,0,.32);
          transform: translateY(-2px);
        }

        .ad-action-icon,
        .ad-kpi-icon,
        .ad-health-icon {
          width: 2.85rem;
          height: 2.85rem;
          display: grid;
          place-items: center;
          border: 1px solid var(--admin-line2);
          background: #0d0d0d;
          margin-bottom: .8rem;
        }

        .ad-action-card strong,
        .ad-health-card strong {
          display: block;
          color: #fff;
          font: italic 900 1.35rem 'Barlow Condensed';
          line-height: .92;
          text-transform: uppercase;
        }

        .ad-action-card p,
        .ad-health-card p {
          margin-top: .5rem;
          color: var(--admin-muted);
          font-size: .88rem;
          line-height: 1.5;
        }

        .ad-kpi-grid,
        .ad-bottom-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .ad-kpi {
          padding: 1.1rem;
          background: #0d0d0d;
        }

        .ad-kpi-label {
          color: var(--admin-muted2);
          font: 900 .68rem 'Barlow Condensed';
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .ad-kpi-value {
          display: block;
          margin-top: .45rem;
          color: #fff;
          font: italic 900 2.25rem 'Barlow Condensed';
          line-height: .88;
          text-transform: uppercase;
        }

        .ad-section {
          padding: 1.35rem;
          margin-top: 1.5rem;
        }

        .ad-bottom-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ad-health-card {
          padding: 1.2rem;
        }

        .ad-health-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: .8rem 0;
          border-top: 1px solid var(--admin-line);
        }

        .ad-health-row:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .ad-health-left {
          display: flex;
          align-items: center;
          gap: .75rem;
        }

        .ad-health-status {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font: 900 .76rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .tone-orange { color: var(--admin-orange); border-color: rgba(255,90,0,.32); background: rgba(255,90,0,.08); }
        .tone-green { color: var(--admin-green); border-color: rgba(34,197,94,.32); background: rgba(34,197,94,.08); }
        .tone-blue { color: var(--admin-blue); border-color: rgba(56,189,248,.32); background: rgba(56,189,248,.08); }
        .tone-yellow { color: var(--admin-yellow); border-color: rgba(250,204,21,.32); background: rgba(250,204,21,.08); }
        .tone-red { color: var(--admin-red); border-color: rgba(239,68,68,.32); background: rgba(239,68,68,.08); }

        .ad-loading {
          padding: 3rem;
          border: 1px solid var(--admin-line);
          background: var(--admin-panel);
          text-align: center;
          color: var(--admin-muted);
        }

        @media (max-width: 1180px) {
          .ad-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 980px) {
          .ad-hero,
          .ad-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .ad-kpi-grid,
          .ad-actions {
            grid-template-columns: 1fr;
          }

          .ad-toolbar {
            display: block;
          }

          .ad-refresh {
            width: 100%;
            margin-top: .85rem;
          }
        }
      `}</style>

      <section className="ad-hero">
        <div className="ad-hero-main">
          <div className="admin-kicker">/ god admin center</div>
          <h1>Controla producto, <span>revenue y riesgo.</span></h1>
          <p>Este panel concentra el estado operativo de FigusUY: usuarios, cruces, monetizacion, moderacion, negocios y decisiones de crecimiento.</p>
          <div className="ad-badges">
            <span className="ad-badge orange">Panel central</span>
            <span className="ad-badge green">Datos reales</span>
            <span className="ad-badge blue">Operacion activa</span>
          </div>
        </div>

        <aside className="ad-hero-side">
          <div>
            <div className="admin-kicker">/ lectura rapida</div>
            <h2>Lo importante primero</h2>
            <p>Revisa alertas, refresca metricas y entra directo a los modulos que mas impacto tienen hoy.</p>
          </div>
          <button className="ad-refresh" onClick={() => fetchStats()}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
            Actualizar tablero
          </button>
        </aside>
      </section>

      {loading && !stats ? (
        <div className="ad-loading">
          <span className="material-symbols-outlined" style={{ fontSize: '2.4rem', color: 'var(--admin-orange)' }}>sync</span>
          <p style={{ marginTop: '.75rem' }}>Sincronizando operaciones...</p>
        </div>
      ) : (
        <>
          <div className="ad-toolbar">
            <div>
              <div className="admin-kicker">/ acciones</div>
              <h2 style={{ margin: '.45rem 0 0', font: "italic 900 2.5rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Movete rapido</h2>
              <p className="ad-section-copy" style={{ marginTop: '.55rem' }}>Accesos directos a los puntos que suelen cortar friccion o resolver urgencias.</p>
            </div>
          </div>

          <section className="ad-actions">
            {quickActions.map((action) => (
              <article key={action.label} className="ad-action-card" onClick={() => navigate(action.path)}>
                <div className={`ad-action-icon tone-${action.tone}`}>
                  <span className="material-symbols-outlined">{action.icon}</span>
                </div>
                <strong>{action.label}</strong>
                <p>Entrar al modulo y trabajar directo sobre esa capa operativa.</p>
              </article>
            ))}
          </section>

          <section className="ad-section">
            <div className="admin-kicker">/ pulse</div>
            <h2>Metricas clave</h2>
            <p className="ad-section-copy" style={{ marginTop: '.55rem', marginBottom: '1rem' }}>Lectura compacta del sistema, con foco en crecimiento, riesgo y actividad.</p>
            <div className="ad-kpi-grid">
              {metrics.map((metric) => (
                <article key={metric.label} className="ad-kpi">
                  <div className={`ad-kpi-icon tone-${metric.tone}`}>
                    <span className="material-symbols-outlined">{metric.icon}</span>
                  </div>
                  <span className="ad-kpi-label">{metric.label}</span>
                  <strong className="ad-kpi-value">{metric.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="ad-bottom-grid" style={{ marginTop: '1.5rem' }}>
            <article className="ad-health-card">
              <div className="admin-kicker">/ revenue</div>
              <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2.2rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Dinero real</h2>

              <div className="ad-health-row">
                <div className="ad-health-left">
                  <div className="ad-health-icon tone-green"><span className="material-symbols-outlined">payments</span></div>
                  <div>
                    <strong>Pagos totales</strong>
                    <p>Ingresos historicos completados.</p>
                  </div>
                </div>
                <div className="ad-health-status tone-green">${(ad.total_payments || 0).toLocaleString()}</div>
              </div>

              <div className="ad-health-row">
                <div className="ad-health-left">
                  <div className="ad-health-icon tone-orange"><span className="material-symbols-outlined">calendar_month</span></div>
                  <div>
                    <strong>Revenue 30 dias</strong>
                    <p>Ingreso capturado en el ultimo mes.</p>
                  </div>
                </div>
                <div className="ad-health-status tone-orange">${(ad.payments_30d || 0).toLocaleString()}</div>
              </div>

              <div className="ad-health-row">
                <div className="ad-health-left">
                  <div className="ad-health-icon tone-blue"><span className="material-symbols-outlined">card_membership</span></div>
                  <div>
                    <strong>Suscripciones activas</strong>
                    <p>{ad.active_subscriptions || 0} usuarios + {ad.active_business_subs || 0} negocios.</p>
                  </div>
                </div>
                <div className="ad-health-status tone-blue">{(ad.active_subscriptions || 0) + (ad.active_business_subs || 0)}</div>
              </div>

              <div className="ad-health-row">
                <div className="ad-health-left">
                  <div className="ad-health-icon tone-yellow"><span className="material-symbols-outlined">campaign</span></div>
                  <div>
                    <strong>Promos activas</strong>
                    <p>Empujes comerciales funcionando ahora.</p>
                  </div>
                </div>
                <div className="ad-health-status tone-yellow">{ad.active_promos || 0}</div>
              </div>
            </article>

            <article className="ad-health-card">
              <div className="admin-kicker">/ health</div>
              <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2.2rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Estado del sistema</h2>

              {systemHealth.map((item) => (
                <div key={item.label} className="ad-health-row">
                  <div className="ad-health-left">
                    <div className={`ad-health-icon tone-${item.tone}`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <strong>{item.label}</strong>
                      <p>Lectura operativa actualizada.</p>
                    </div>
                  </div>
                  <div className={`ad-health-status tone-${item.tone}`}>{item.status}</div>
                </div>
              ))}
            </article>
          </section>
        </>
      )}
    </div>
  )
}
