import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import ConfirmDialog from '../components/ConfirmDialog'

const card = { background: 'var(--admin-panel)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--admin-line)' }
const badge = (bg, color) => ({ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, background: bg, color, textTransform: 'uppercase' })

export default function AdminSubscriptions() {
  const { subscriptions, fetchSubscriptions, updateSubscription } = useAdminStore()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('all')
  const [extending, setExtending] = useState(null)
  const [extendDays, setExtendDays] = useState(30)
  const [pauseId, setPauseId] = useState(null)

  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  const filtered = subscriptions.filter((s) => filter === 'all' || s.status === filter)
  const statusColors = { active: { bg: '#ecfdf5', color: '#10b981' }, paused: { bg: '#fff7ed', color: '#f59e0b' }, cancelled: { bg: '#fef2f2', color: '#ef4444' }, expired: { bg: 'var(--admin-panel2)', color: 'var(--admin-muted2)' } }

  const handleActivate = (id) => {
    updateSubscription(id, { status: 'active', paused_by: null, paused_at: null }, user.id)
  }

  const handleExtend = (id) => {
    const sub = subscriptions.find((s) => s.id === id)
    const base = sub?.expires_at ? new Date(sub.expires_at) : new Date()
    const newExpiry = new Date(base.getTime() + extendDays * 86400000).toISOString()
    updateSubscription(id, { expires_at: newExpiry, status: 'active' }, user.id)
    setExtending(null)
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#f5f5f5', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>card_membership</span>
          Suscripciones de Usuarios
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--admin-muted2)', marginTop: '0.25rem' }}>
          Gestion de suscripciones premium: activar, pausar y extender con auditoria.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Activas', value: subscriptions.filter((s) => s.status === 'active').length, color: '#10b981' },
          { label: 'Pausadas', value: subscriptions.filter((s) => s.status === 'paused').length, color: '#f59e0b' },
          { label: 'Canceladas', value: subscriptions.filter((s) => s.status === 'cancelled').length, color: '#ef4444' },
          { label: 'Expiradas', value: subscriptions.filter((s) => s.status === 'expired').length, color: 'var(--admin-muted2)' },
        ].map((s) => (
          <div key={s.label} style={{ ...card, borderLeft: `4px solid ${s.color}` }}>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#f5f5f5' }}>{s.value}</p>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color, textTransform: 'uppercase' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'active', 'paused', 'cancelled', 'expired'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            background: filter === f ? 'var(--color-primary)' : '#fff', color: filter === f ? 'white' : 'var(--admin-muted2)',
            border: filter === f ? '1px solid var(--color-primary)' : '1px solid #e2e8f0'
          }}>{f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div style={card}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-muted)' }}>No hay suscripciones en esta categoria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '0.75rem' }}>Usuario</th>
                <th style={{ padding: '0.75rem' }}>Plan</th>
                <th style={{ padding: '0.75rem' }}>Estado</th>
                <th style={{ padding: '0.75rem' }}>Vence</th>
                <th style={{ padding: '0.75rem' }}>Pago</th>
                <th style={{ padding: '0.75rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const sc = statusColors[sub.status] || statusColors.expired
                const isExpiringSoon = sub.expires_at && new Date(sub.expires_at) < new Date(Date.now() + 7 * 86400000)
                return (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{sub.user?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--admin-muted2)', margin: 0 }}>{sub.user?.email}</p>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{sub.plan_name}</td>
                    <td style={{ padding: '0.75rem' }}><span style={badge(sc.bg, sc.color)}>{sub.status}</span></td>
                    <td style={{ padding: '0.75rem', color: isExpiringSoon ? '#ef4444' : 'var(--admin-muted2)', fontWeight: isExpiringSoon ? 700 : 400 }}>
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '∞'}
                      {isExpiringSoon && sub.status === 'active' && <span style={{ fontSize: '0.625rem', color: '#ef4444', display: 'block' }}>Por vencer</span>}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--admin-muted2)' }}>
                      {sub.payment ? `$${sub.payment.amount} ${sub.payment.currency}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {sub.status === 'active' && (
                          <button onClick={() => setPauseId(sub.id)} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(249, 115, 22, 0.1)', color: '#f59e0b', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Pausar</button>
                        )}
                        {(sub.status === 'paused' || sub.status === 'expired') && (
                          <button onClick={() => handleActivate(sub.id)} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Activar</button>
                        )}
                        <button onClick={() => setExtending(sub.id)} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Extender</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {extending && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '24rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem' }}>Extender Suscripcion</h3>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-muted2)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Dias a extender</label>
            <input type="number" value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value))} min={1} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setExtending(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-muted2)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleExtend(extending)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pauseId}
        title="Pausar suscripcion"
        message="La suscripcion quedara pausada hasta que la reactives manualmente."
        confirmText="Pausar"
        cancelText="Cancelar"
        onConfirm={() => {
          updateSubscription(pauseId, { status: 'paused', paused_by: user.id, paused_at: new Date().toISOString() }, user.id)
          setPauseId(null)
        }}
        onCancel={() => setPauseId(null)}
      />
    </div>
  )
}
