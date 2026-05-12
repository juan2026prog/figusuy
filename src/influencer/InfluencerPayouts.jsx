import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { formatDate, formatMoney } from '../lib/influencerDashboard'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const payoutLabels = [
  { key: 'pendiente', label: 'Comision pendiente' },
  { key: 'aprobado', label: 'Comision aprobada' },
  { key: 'pagado', label: 'Comision pagada' },
  { key: 'retenido', label: 'Comision retenida' },
]

export default function InfluencerPayouts() {
  const { dashboard } = useOutletContext()
  const { user, profile, updateProfile } = useAuthStore()
  const toast = useToast()
  const [loading, setLoading] = React.useState(false)
  const [payoutLoading, setPayoutLoading] = React.useState(false)
  
  const [frequency, setFrequency] = React.useState(profile?.payout_frequency_days || 7)
  const [paypalEmail, setPaypalEmail] = React.useState(profile?.paypal_email || '')

  const totalAccumulated = Object.values(dashboard.payoutsByStatus || {}).reduce((sum, value) => sum + Number(value || 0), 0)

  const handleUpdateSettings = async () => {
    setLoading(true)
    try {
      // Sincronizar a AMBAS tablas: profiles + payout_accounts
      const [profileResult, payoutResult] = await Promise.all([
        supabase.from('profiles').update({
          payout_frequency_days: frequency,
          paypal_email: paypalEmail
        }).eq('id', user.id),
        // Sincronizar payout_accounts para que el edge function tenga el dato actualizado
        paypalEmail ? supabase.from('payout_accounts').upsert(
          { user_id: user.id, payout_email: paypalEmail, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        ) : Promise.resolve({ error: null })
      ])

      if (profileResult.error) throw profileResult.error
      
      // Sincronizar el store local con los datos actualizados
      const { session, syncSession } = useAuthStore.getState()
      if (session) await syncSession(session)
      toast.success('Configuración de retiro actualizada')
    } catch (err) {
      toast.error('Error al actualizar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!profile?.paypal_email) {
      toast.error('Primero configura tu email de PayPal')
      return
    }

    setPayoutLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al procesar retiro')

      toast.success(`¡Retiro de USD ${data.amount} iniciado con éxito!`)
      // Refrescar sesión para actualizar balance (en vez de hard reload)
      const { session: currentSession, syncSession } = useAuthStore.getState()
      if (currentSession) await syncSession(currentSession)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPayoutLoading(false)
    }
  }

  return (
    <div className="affiliate-content">
      <section className="affiliate-grid-4">
        <article className="affiliate-stat-card">
          <span>Comision acumulada</span>
          <strong>{formatMoney(totalAccumulated)}</strong>
          <p>Historial total del sistema de pagos.</p>
        </article>
        {payoutLabels.map((item) => (
          <article className="affiliate-stat-card" key={item.key}>
            <span>{item.label}</span>
            <strong>{formatMoney(dashboard.payoutsByStatus?.[item.key] || 0)}</strong>
            <p>{dashboard.payoutsByStatus?.[item.key] ? `Estado ${item.key}` : 'Sin movimientos aun'}</p>
          </article>
        ))}
      </section>

      <section className="affiliate-grid-2">
        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Retiro de Saldo</h2>
            <p>Configura cómo y cuándo quieres cobrar tus comisiones.</p>
          </div>
          <div className="affiliate-panel-body">
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="affiliate-mini-note" style={{ display: 'block', marginBottom: '0.5rem' }}>Email de PayPal</label>
              <input 
                type="email" 
                className="affiliate-input" 
                placeholder="tu-paypal@email.com"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="affiliate-mini-note" style={{ display: 'block', marginBottom: '0.5rem' }}>Frecuencia de retiro</label>
              <select 
                className="affiliate-input"
                value={frequency}
                onChange={e => setFrequency(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              >
                <option value={3}>Cada 3 días</option>
                <option value={7}>Cada 7 días (Recomendado)</option>
                <option value={15}>Cada 15 días</option>
              </select>
            </div>

            <button 
              className="affiliate-btn block" 
              onClick={handleUpdateSettings}
              disabled={loading}
              style={{ background: 'var(--color-primary)', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '4px', width: '100%', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem' }}
            >
              {loading ? 'Guardando...' : 'Guardar Preferencias'}
            </button>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed #444' }}>
               <div style={{ marginBottom: '1rem' }}>
                 <span className="affiliate-mini-note">Saldo disponible para retirar</span>
                 <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                   {formatMoney(dashboard.balance || 0)}
                 </div>
               </div>
               <button 
                className="affiliate-btn orange block" 
                onClick={handleRequestPayout}
                disabled={payoutLoading || (dashboard.balance || 0) < 10}
                style={{ width: '100%', padding: '1rem', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase', cursor: (payoutLoading || (dashboard.balance || 0) < 10) ? 'not-allowed' : 'pointer' }}
               >
                 {payoutLoading ? 'Procesando...' : 'Retirar Saldo Ahora'}
               </button>
               {(dashboard.balance || 0) < 10 && (
                 <p className="affiliate-mini-note" style={{ textAlign: 'center', marginTop: '0.5rem' }}>Minimo de retiro: USD 10.00</p>
               )}
            </div>
          </div>
        </article>

        <article className="affiliate-panel">
          <div className="affiliate-panel-head">
            <h2>Estado financiero</h2>
            <p>Foto rapida del circuito de aprobacion.</p>
          </div>
          <div className="affiliate-panel-body affiliate-chip-row">
            {payoutLabels.map((item) => (
              <div className="affiliate-chip" key={item.key} style={{ padding: '0.5rem 1rem', background: '#222', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.label}:</span>
                <strong style={{ color: item.key === 'aprobado' ? 'var(--color-primary)' : 'inherit' }}>{formatMoney(dashboard.payoutsByStatus?.[item.key] || 0)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="affiliate-panel">
        <div className="affiliate-panel-head">
          <h2>Historial de pagos</h2>
          <p>Detalle de payout por periodo.</p>
        </div>
        <div className="affiliate-panel-body affiliate-list">
          {dashboard.payments?.length ? dashboard.payments.map((payment) => (
            <div className="affiliate-list-item" key={payment.id}>
              <strong>{formatMoney(payment.commission_total)}</strong>
              <div className="affiliate-mini-note">Periodo {payment.period_start} al {payment.period_end}</div>
              <div className="affiliate-mini-note">Estado {payment.status} · Conversiones {payment.total_conversions} · Revenue {formatMoney(payment.total_revenue)}</div>
              <div className="affiliate-mini-note">{payment.payment_method || 'Metodo pendiente'} {payment.payment_reference ? `· Ref ${payment.payment_reference}` : ''}</div>
            </div>
          )) : (
            <div className="affiliate-list-item">
              <strong>No hay pagos disponibles aun</strong>
              <div className="affiliate-mini-note">Compartiendo tu link vas a empezar a construir historial.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
