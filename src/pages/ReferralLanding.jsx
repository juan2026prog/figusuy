import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAffiliateStore } from '../stores/affiliateStore'
import AuthModal from '../components/AuthModal'

export default function ReferralLanding() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { resolveCode, trackClick } = useAffiliateStore()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const resolve = async () => {
      if (!code) { navigate('/'); return }
      try {
        const { data, error: err } = await resolveCode(code)
        if (err || !data) {
          setError('Código de referido no válido o campaña expirada.')
          setLoading(false)
          return
        }

        // Store attribution
        localStorage.setItem('figus_ref_code', data.code)
        localStorage.setItem('figus_ref_campaign', data.id)
        localStorage.setItem('figus_ref_affiliate', data.affiliate_id)
        localStorage.setItem('figus_ref_ts', Date.now().toString())

        // Track click (fire and forget to avoid hanging)
        trackClick(data.id, data.affiliate_id, 'link').catch(console.error)

        setCampaign(data)
      } catch (err) {
        console.error('Referral resolution error:', err)
        setError('Ocurrió un error al verificar la invitación. Por favor intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    resolve()
  }, [code])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.glowOrb} />
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div className="animate-celebrate" style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
          <p style={{ color: '#a8a29e', fontWeight: 600 }}>Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem', display: 'block' }}>error</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>Link no válido</h2>
            <p style={{ color: '#a8a29e', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={() => navigate('/')} style={styles.btnPrimary}>
              Ir a FigusUY
            </button>
          </div>
        </div>
      </div>
    )
  }

  const aff = Array.isArray(campaign?.affiliates) ? campaign.affiliates[0] : (campaign?.affiliates || {})
  const benefit = (campaign?.affiliate_benefits || []).find(b => b.is_active)

  return (
    <div style={styles.container}>
      <div style={styles.glowOrb} />

      <div style={styles.card}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '1rem', margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '1.5rem',
            boxShadow: '0 0 30px rgba(234,88,12,0.3)'
          }}>F</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>FigusUY</h1>
        </div>

        {/* Influencer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem',
          padding: '0.875rem', marginBottom: '1.25rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '1.125rem', flexShrink: 0
          }}>
            {aff.avatar_url
              ? <img src={aff.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '0.625rem', objectFit: 'cover' }} />
              : (aff.name || 'A')[0]?.toUpperCase()
            }
          </div>
          <div>
            <p style={{ color: '#a8a29e', fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>Te invita</p>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{aff.name || 'Amigo'}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              background: 'rgba(234,88,12,0.15)', color: '#f97316',
              padding: '0.25rem 0.625rem', borderRadius: '2rem',
              fontSize: '0.6875rem', fontWeight: 800, fontFamily: 'monospace',
              border: '1px solid rgba(249,115,22,0.2)'
            }}>{campaign.code}</span>
          </div>
        </div>

        {/* Benefit */}
        {benefit && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(234,88,12,0.12) 0%, rgba(249,115,22,0.06) 100%)',
            borderRadius: '0.875rem', padding: '1.25rem', marginBottom: '1.25rem',
            border: '1px solid rgba(234,88,12,0.2)', textAlign: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#f97316', display: 'block', marginBottom: '0.5rem' }}>redeem</span>
            <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.4, margin: 0 }}>
              {benefit.benefit_label}
            </p>
            <p style={{ color: '#a8a29e', fontSize: '0.75rem', marginTop: '0.5rem', margin: '0.5rem 0 0' }}>
              Usá el código <strong style={{ color: '#f97316' }}>{campaign.code}</strong> al suscribirte
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => setShowAuthModal(true)}
          style={styles.btnPrimary}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>rocket_launch</span>
          Empezar ahora
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#78716c', marginTop: '1rem' }}>
          Al registrarte, tu beneficio se aplica automáticamente.
        </p>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0c0a09',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: '20rem', height: '20rem',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)',
    top: '10%', left: '50%',
    transform: 'translateX(-50%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(28,25,23,0.95)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '1.25rem',
    padding: '2rem',
    width: '100%',
    maxWidth: '24rem',
    position: 'relative',
    zIndex: 1,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.875rem',
    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 15px rgba(234,88,12,0.25)',
  },
}
