import React from 'react'

const pages = {
  matches: {
    icon: 'swap_horiz',
    title: 'Gestion de cruces',
    desc: 'Monitoreo del motor de intercambios y de la calidad del matching.',
    features: ['Ver intercambios generados', 'Filtrar por album o ciudad', 'Revisar score de compatibilidad', 'Entender distancia', 'Detectar intercambios malos', 'Medir tasa de contacto']
  },
  trades: {
    icon: 'sync_alt',
    title: 'Intercambios completados',
    desc: 'Seguimiento de cierres, cancelaciones y disputas activas.',
    features: ['Intercambios completados', 'Intercambios cancelados', 'Disputas activas', 'Resolver reclamos', 'Revisar calificaciones', 'Marcar usuario problematico']
  },
  moderation: {
    icon: 'gpp_good',
    title: 'Moderacion y seguridad',
    desc: 'Proteccion de comunidad, riesgo y escalado de incidencias.',
    features: ['Reportes de usuarios', 'Reportes de chats', 'Palabras prohibidas', 'Perfiles sospechosos', 'Bloqueo automatico', 'Mensajes de seguridad', 'Puntos seguros']
  },
  locations: {
    icon: 'storefront',
    title: 'Gestion de puntos',
    desc: 'Cobertura geografica, puntos aliados y visibilidad comercial.',
    features: ['Paises activos', 'Departamentos', 'Ciudades y barrios', 'Puntos seguros sugeridos', 'Kioscos aliados', 'Gestionar planes', 'Ver metricas por local']
  },
  events: {
    icon: 'celebration',
    title: 'Eventos de intercambio',
    desc: 'Ferias, encuentros y activaciones especiales del ecosistema.',
    features: ['Crear evento', 'Fecha y ubicacion', 'Albumes permitidos', 'Cupos e inscripcion', 'Sponsor', 'Lista de asistentes', 'Intercambios dentro del evento']
  },
  cms: {
    icon: 'article',
    title: 'Contenido',
    desc: 'Textos, tutoriales, banners y piezas que hacen crecer el producto.',
    features: ['Textos de home', 'Banners', 'FAQ', 'Terminos y condiciones', 'Politica de privacidad', 'Tutoriales', 'Landing por album']
  },
  notifications: {
    icon: 'notifications',
    title: 'Notificaciones',
    desc: 'Control de mensajes, alertas y empujes de activacion.',
    features: ['Nuevo intercambio', 'Alguien tiene tu figurita', 'Nuevo album disponible', 'Evento cercano', 'Promo premium', 'Alerta de seguridad', 'Email o push']
  },
  payments: {
    icon: 'payments',
    title: 'Pagos',
    desc: 'Flujo de pagos, suscripciones y control operativo de revenue.',
    features: ['Ver pagos', 'Pagos fallidos', 'Premium activos', 'Vencimientos', 'Renovaciones', 'Reembolsos', 'Mercado Pago y tarjetas']
  },
  roles: {
    icon: 'admin_panel_settings',
    title: 'Roles y permisos',
    desc: 'Control granular de acceso y niveles de operacion.',
    features: ['God Admin', 'Admin', 'Moderador', 'Soporte', 'Creador de albumes', 'Comercial', 'Analista']
  },
}

export default function AdminPage({ section }) {
  const page = pages[section]

  if (!page) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--admin-line)', background: 'var(--admin-panel)' }}>
        <div className="admin-kicker">/ modulo</div>
        <h2 style={{ margin: '.45rem 0 0', font: "italic 900 2.3rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Seccion no encontrada</h2>
        <p style={{ marginTop: '.7rem', color: 'var(--admin-muted)' }}>El modulo solicitado no esta definido dentro del panel generico.</p>
      </div>
    )
  }

  return (
    <div className="admin-generic-page">
      <style>{`
        .admin-generic-page {
          display: grid;
          gap: 1.25rem;
        }

        .ag-hero,
        .ag-card,
        .ag-feature {
          border: 1px solid var(--admin-line);
          background: var(--admin-panel);
        }

        .ag-hero {
          position: relative;
          overflow: hidden;
          padding: 1.4rem;
          background:
            linear-gradient(135deg, rgba(255,90,0,.14) 0%, rgba(255,90,0,.04) 24%, transparent 44%),
            linear-gradient(180deg, #171717 0%, #101010 100%);
        }

        .ag-hero::before {
          content: 'MODULO';
          position: absolute;
          right: 1rem;
          top: -.1rem;
          font: italic 900 clamp(3.2rem, 8vw, 6rem) 'Barlow Condensed';
          line-height: .84;
          color: rgba(255,255,255,.04);
          pointer-events: none;
        }

        .ag-hero-row {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 1rem;
        }

        .ag-title {
          margin: .5rem 0 0;
          font: italic 900 clamp(2.4rem, 5vw, 4rem) 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .86;
        }

        .ag-desc,
        .ag-card p,
        .ag-feature p {
          color: var(--admin-muted);
          line-height: 1.58;
        }

        .ag-icon-box {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,90,0,.32);
          background: rgba(255,90,0,.08);
          color: var(--admin-orange);
          flex-shrink: 0;
        }

        .ag-icon-box .material-symbols-outlined {
          font-size: 2rem;
        }

        .ag-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, .7fr);
          gap: 1.25rem;
        }

        .ag-card {
          padding: 1.3rem;
        }

        .ag-card h3 {
          margin: .45rem 0 0;
          font: italic 900 2rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .ag-status {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          padding: .46rem .64rem;
          border: 1px solid rgba(34,197,94,.28);
          background: rgba(34,197,94,.08);
          color: var(--admin-green);
          font: 900 .72rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .ag-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .ag-feature {
          padding: 1rem;
          background: #0d0d0d;
        }

        .ag-feature-head {
          display: flex;
          align-items: center;
          gap: .55rem;
          color: var(--admin-orange);
          font: 900 .76rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .ag-feature-head .material-symbols-outlined {
          font-size: 1rem;
        }

        .ag-feature p {
          margin-top: .6rem;
          font-size: .9rem;
        }

        @media (max-width: 980px) {
          .ag-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="ag-hero">
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">{page.title}</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>{page.desc}</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">{page.icon}</span>
          </div>
        </div>
      </section>

      <section className="ag-grid">
        <article className="ag-card">
          <div className="admin-kicker">/ estado</div>
          <h3>Base lista para operar</h3>
          <p style={{ marginTop: '.7rem' }}>La estructura del modulo ya existe y el panel quedo alineado al nuevo sistema visual. Desde aqui puedes seguir bajando integracion o afinando las capas de lectura y accion.</p>
          <div style={{ marginTop: '1rem' }}>
            <span className="ag-status">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
              Modulo preparado
            </span>
          </div>
        </article>

        <aside className="ag-card">
          <div className="admin-kicker">/ criterio</div>
          <h3>Lo que deberia resolver</h3>
          <p style={{ marginTop: '.7rem' }}>Este espacio tiene que ayudar a leer rapido, decidir mejor y ejecutar sin friccion sobre la capa correspondiente del negocio.</p>
        </aside>
      </section>

      <section className="ag-card">
        <div className="admin-kicker">/ capacidades</div>
        <h3>Funciones del modulo</h3>
        <div className="ag-features" style={{ marginTop: '1rem' }}>
          {page.features.map((feature, index) => (
            <article key={feature} className="ag-feature">
              <div className="ag-feature-head">
                <span className="material-symbols-outlined">task_alt</span>
                Punto {String(index + 1).padStart(2, '0')}
              </div>
              <p>{feature}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

