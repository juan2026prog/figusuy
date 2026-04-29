import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }
const badge = (bg, color) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', background: bg, color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' })

export default function AdminNotifications() {
  const { notificationCampaigns, fetchNotificationCampaigns, createNotificationCampaign, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('history')
  const [form, setForm] = useState({ title: '', body: '', type: 'info', channel: 'push', segment: 'all' })
  const [sending, setSending] = useState(false)

  useEffect(() => { fetchNotificationCampaigns() }, [])

  const handleSend = async () => {
    if (!form.title || !form.body) return
    setSending(true)
    const error = await createNotificationCampaign(form, user.id)
    if (!error) {
      setForm({ title: '', body: '', type: 'info', channel: 'push', segment: 'all' })
      setTab('history')
    }
    setSending(false)
  }

  const statusColors = { sent: { bg: '#ecfdf5', color: '#10b981' }, draft: { bg: '#f1f5f9', color: '#64748b' }, sending: { bg: '#fff7ed', color: '#f59e0b' }, failed: { bg: '#fef2f2', color: '#ef4444' } }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>notifications</span>
          Notificaciones & CRM
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Envía notificaciones y revisa el historial de campañas.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[{ key: 'history', label: 'Historial', icon: 'history' }, { key: 'new', label: 'Nueva Campaña', icon: 'add_circle' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: tab === t.key ? '#ea580c' : '#fff', color: tab === t.key ? 'white' : '#64748b',
            border: tab === t.key ? '1px solid #ea580c' : '1px solid #e2e8f0'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <div style={card}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>campaign</span>
            Campañas Enviadas ({notificationCampaigns.length})
          </h3>
          {notificationCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hay campañas registradas aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '0.75rem' }}>Título</th>
                  <th style={{ padding: '0.75rem' }}>Canal</th>
                  <th style={{ padding: '0.75rem' }}>Segmento</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem' }}>Enviados</th>
                  <th style={{ padding: '0.75rem' }}>Enviado por</th>
                  <th style={{ padding: '0.75rem' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {notificationCampaigns.map(c => {
                  const sc = statusColors[c.status] || statusColors.draft
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <p style={{ fontWeight: 700, margin: 0 }}>{c.title}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, maxWidth: '20rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.body}</p>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>{c.channel}</td>
                      <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.segment}</td>
                      <td style={{ padding: '0.75rem' }}><span style={badge(sc.bg, sc.color)}>{c.status}</span></td>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>{c.sent_count || '—'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8125rem' }}>{c.sender?.name || '—'}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8125rem' }}>
                        {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ ...card, maxWidth: '40rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Crear Nueva Campaña</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Título</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título de la notificación"
                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Mensaje</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Cuerpo del mensaje"
                style={{ width: '100%', minHeight: '5rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <option value="info">Info</option>
                  <option value="promo">Promo</option>
                  <option value="alert">Alerta</option>
                  <option value="update">Update</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Canal</label>
                <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <option value="push">Push</option>
                  <option value="email">Email</option>
                  <option value="in_app">In-App</option>
                  <option value="all">Todos</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Segmento</label>
                <select value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <option value="all">Todos</option>
                  <option value="premium">Premium</option>
                  <option value="free">Gratis</option>
                  <option value="inactive">Inactivos</option>
                  <option value="business">Negocios</option>
                </select>
              </div>
            </div>
            <button onClick={handleSend} disabled={sending || !form.title || !form.body} style={{
              padding: '0.75rem', borderRadius: '0.5rem', background: '#ea580c', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              opacity: (sending || !form.title || !form.body) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              <span className="material-symbols-outlined">{sending ? 'sync' : 'send'}</span>
              {sending ? 'Enviando...' : 'Enviar Campaña'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
