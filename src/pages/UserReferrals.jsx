import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useGrowthStore } from '../stores/growthStore'
import { REFERRAL_REWARDS } from '../lib/growthEngine'
import { useToast } from '../components/Toast'

export default function UserReferrals() {
  const { profile } = useAuthStore()
  const { openShareModal } = useGrowthStore()
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const referralLink = `${window.location.origin}/r/${profile?.id || 'invitado'}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Enlace de invitación copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Error al copiar el enlace')
    }
  }

  const handleShare = () => {
    useGrowthStore.setState({ shareModal: { open: true, type: 'invite', data: {} } })
  }

  return (
    <div className="page" style={{ paddingBottom: '6rem' }}>
      <header className="topbar">
        <div>
          <div className="top-kicker">GROWTH ENGINE</div>
          <div className="top-title" style={{ color: '#fff' }}>Invitar Amigos</div>
        </div>
      </header>

      <div className="card-premium" style={{ marginBottom: '1.5rem', marginTop: '1rem', background: 'linear-gradient(135deg, var(--color-brand-600), #9a3412)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 900, fontStyle: 'italic', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
          Trae a tus amigos, ganá Premium
        </h2>
        <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Compartí tu enlace de invitación único. Invitando a un amigo y completando un intercambio, ¡obtienen 3 días gratis de plan Plus cada uno!
        </p>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />
          <button 
            onClick={handleCopy}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <button className="btn" style={{ background: '#fff', color: '#ea580c', width: '100%', padding: '1rem', fontSize: '1rem' }} onClick={handleShare}>
          <span className="material-symbols-outlined">share</span>
          Compartir ahora
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 900, fontStyle: 'italic', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
          Recompensas del circuito
        </h3>
        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          Ganá experiencia (XP) y beneficios a medida que tu red crece.
        </p>

        <div className="flex-col gap-md">
          {Object.entries(REFERRAL_REWARDS).map(([key, reward]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                +{reward.xp}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{reward.label}</div>
                {reward.reward_type && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-500)', marginTop: '2px', fontWeight: 600 }}>
                    Recompensa: {reward.reward_type === 'boost_visibility' ? 'Mayor visibilidad' : 'Días Premium'} ({reward.reward_hours}h)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'block' }}>group_add</span>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 900, fontStyle: 'italic', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
          Tu Red de Referidos
        </h3>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Aún no tienes referidos activos. Compartí tu enlace para empezar a construir tu red y ganar beneficios.
        </p>
      </div>
    </div>
  )
}
