import React from 'react'

const card = { background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }

const pages = {
  matches: { icon: '🤝', title: 'Gestión de Matches', desc: 'Monitoreo del motor de matching', features: ['Ver matches generados', 'Filtrar por álbum/ciudad', 'Ver score de compatibilidad', 'Ver distancia', 'Detectar matches malos', 'Métricas: tasa contacto/intercambio'] },
  trades: { icon: '🔄', title: 'Gestión de Intercambios', desc: 'Intercambios completados y disputas', features: ['Intercambios completados', 'Intercambios cancelados', 'Disputas activas', 'Resolver reclamos', 'Revisar calificaciones', 'Marcar usuario problemático'] },
  moderation: { icon: '🛡️', title: 'Moderación y Seguridad', desc: 'Protección de la comunidad', features: ['Reportes de usuarios', 'Reportes de chats', 'Palabras prohibidas', 'Perfiles sospechosos', 'Bloqueo automático', 'Mensajes de seguridad', 'Puntos de intercambio seguros'] },
  locations: { icon: '📍', title: 'Gestión de Ubicaciones', desc: 'Países, departamentos, ciudades y puntos seguros', features: ['Países activos', 'Departamentos', 'Ciudades / Barrios', 'Radio máximo de búsqueda', 'Puntos seguros sugeridos', 'Kioscos aliados', 'Ferias de intercambio'] },
  events: { icon: '🎉', title: 'Eventos de Intercambio', desc: 'Ferias y encuentros organizados', features: ['Crear evento', 'Fecha y ubicación', 'Álbumes permitidos', 'Cupos e inscripción', 'Sponsor', 'Lista de asistentes', 'Matches dentro del evento'] },
  cms: { icon: '📝', title: 'Contenido / CMS', desc: 'Gestión de contenido sin código', features: ['Textos de home', 'Banners', 'FAQ', 'Términos y condiciones', 'Política de privacidad', 'Tutoriales', 'Landing por álbum'] },
  notifications: { icon: '🔔', title: 'Notificaciones', desc: 'Control de mensajes y alertas', features: ['Nuevo match', 'Alguien tiene tu figurita', 'Nuevo álbum disponible', 'Evento cercano', 'Promo premium', 'Alerta de seguridad', 'Email / Push / WhatsApp'] },
  payments: { icon: '💳', title: 'Pagos', desc: 'Gestión de pagos y suscripciones', features: ['Ver pagos', 'Pagos fallidos', 'Premium activos', 'Vencimientos', 'Renovaciones', 'Reembolsos', 'Mercado Pago / Tarjetas'] },
  roles: { icon: '🔐', title: 'Roles y Permisos', desc: 'Control de acceso granular', features: ['God Admin', 'Admin', 'Moderador', 'Soporte', 'Creador de álbumes', 'Comercial / sponsors', 'Analista'] },
}

export default function AdminPage({ section }) {
  const page = pages[section]
  if (!page) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Sección no encontrada</div>

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>{page.icon} {page.title}</h1>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>{page.desc}</p>

      {/* Status */}
      <div style={{
        ...card, marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
        borderColor: '#c7d2fe',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '2.5rem' }}>{page.icon}</span>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Módulo preparado</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              La base de datos y APIs están listas. La interfaz completa se activará con la integración de datos en tiempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={card}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.875rem', color: '#0f172a' }}>Funcionalidades del módulo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '0.5rem' }}>
          {page.features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem', borderRadius: '0.5rem',
              background: '#f8fafc', border: '1px solid #e2e8f0',
            }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem' }}>✓</span>
              <span style={{ fontSize: '0.8125rem', color: '#475569' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
