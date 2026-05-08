import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfluencerStore } from '../stores/influencerStore'
import { useAuthStore } from '../stores/authStore'


export default function InfluencerJoin() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { claimInfluencer, loading } = useInfluencerStore()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleClaim = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    setError(null)
    const { data, error: err } = await claimInfluencer(code, user.id)
    
    if (err) {
      setError(typeof err === 'string' ? err : err.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="influencer-join-container">
        <div className="influencer-join-card">
          <span className="material-symbols-outlined influencer-join-icon" style={{ color: '#16a34a', WebkitTextFillColor: '#16a34a' }}>check_circle</span>
          <h1 className="influencer-join-title">¡Bienvenido a bordo!</h1>
          <p className="influencer-join-text">
            Tu cuenta ha sido vinculada correctamente. Ahora eres un Influencer oficial de FigusUY.
          </p>
          <button onClick={() => navigate('/profile')} className="influencer-join-btn-primary">
            Ir a mi Perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="influencer-join-container">
      <div className="influencer-join-card">
        <span className="material-symbols-outlined influencer-join-icon">workspace_premium</span>
        <h1 className="influencer-join-title">Invitación Especial</h1>
        <p className="influencer-join-text">
          Has sido invitado a unirte como Influencer oficial de FigusUY. 
          Al aceptar, podrás gestionar tus campañas, medir tu rendimiento y recibir comisiones por tus referidos.
        </p>

        {error && <div className="influencer-join-error">{error}</div>}

        <button 
          onClick={handleClaim} 
          disabled={loading}
          className="influencer-join-btn-primary"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Procesando...' : 'Aceptar Invitación'}
        </button>
        
        <button onClick={() => navigate('/')} className="influencer-join-btn-secondary">
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
