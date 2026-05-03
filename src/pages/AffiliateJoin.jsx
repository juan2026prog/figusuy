import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAffiliateStore } from '../stores/affiliateStore'
import { useAuthStore } from '../stores/authStore'

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d0d0d',
    color: 'white',
    padding: '1.5rem',
    fontFamily: "'Barlow', sans-serif"
  },
  card: {
    width: '100%',
    maxWidth: '28rem',
    background: '#121212',
    border: '1px solid #292524',
    borderRadius: '1.5rem',
    padding: '2.5rem',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
  },
  icon: {
    fontSize: '4rem',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 900,
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em'
  },
  text: {
    color: '#a8a29e',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '2rem'
  },
  btnPrimary: {
    width: '100%',
    padding: '1rem',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  btnSecondary: {
    width: '100%',
    padding: '1rem',
    background: 'transparent',
    color: '#a8a29e',
    border: '1px solid #292524',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.75rem'
  },
  error: {
    color: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    marginBottom: '1.5rem'
  }
}

export default function AffiliateJoin() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { claimAffiliate, loading } = useAffiliateStore()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleClaim = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    setError(null)
    const { data, error: err } = await claimAffiliate(code, user.id)
    
    if (err) {
      setError(typeof err === 'string' ? err : err.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <span className="material-symbols-outlined" style={{ ...styles.icon, color: '#16a34a', WebkitTextFillColor: '#16a34a' }}>check_circle</span>
          <h1 style={styles.title}>¡Bienvenido a bordo!</h1>
          <p style={styles.text}>
            Tu cuenta ha sido vinculada correctamente. Ahora eres un Influencer oficial de FigusUY.
          </p>
          <button onClick={() => navigate('/profile')} style={styles.btnPrimary}>
            Ir a mi Perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <span className="material-symbols-outlined" style={styles.icon}>workspace_premium</span>
        <h1 style={styles.title}>Invitación Especial</h1>
        <p style={styles.text}>
          Has sido invitado a unirte como Influencer / Afiliado de FigusUY. 
          Al aceptar, podrás gestionar tus campañas, medir tu rendimiento y recibir comisiones por tus referidos.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <button 
          onClick={handleClaim} 
          disabled={loading}
          style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Procesando...' : 'Aceptar Invitación'}
        </button>
        
        <button onClick={() => navigate('/')} style={styles.btnSecondary}>
          Ahora no
        </button>

        {!user && (
          <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: '#78716c' }}>
            Deberás iniciar sesión o crear una cuenta para continuar.
          </p>
        )}
      </div>
    </div>
  )
}
