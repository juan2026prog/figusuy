import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useInfluencerStore } from '../stores/influencerStore'

function AccessState({ title, copy, icon = 'lock' }) {
  return (
    <div className="status-page">
      <div className="status-card status-card--compact">
        <span className="material-symbols-outlined status-icon">{icon}</span>
        <h1 className="status-title" style={{ fontSize: '2rem' }}>{title}</h1>
        <p className="status-copy">{copy}</p>
      </div>
    </div>
  )
}

export default function InfluencerAccessGuard({ children }) {
  const { user, profile, loading: authLoading } = useAuthStore()
  const checkInfluencerAccess = useInfluencerStore(state => state.checkInfluencerAccess)
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({ checking: true, allowed: false, status: 'none', bypass: false })
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    // Safety timeout: Si la verificación tarda >8s, mostrar error (NO otorgar acceso)
    const timeout = setTimeout(() => {
      if (active && (state.checking || authLoading)) {
        console.warn('InfluencerAccessGuard: Verificación tardó demasiado.');
        setState(prev => ({ ...prev, checking: false, allowed: false, status: 'timeout', bypass: false }));
      }
    }, 8000);

    const verify = async () => {
      if (!user?.id || !profile?.id) {
        // Solo si authLoading ya terminó
        if (!authLoading && active) setState({ checking: false, allowed: false, status: 'none', bypass: false })
        return
      }

      try {
        const { data, error } = await checkInfluencerAccess({
          userId: user.id,
          affiliateId: searchParams.get('affiliate'),
          role: profile.role,
        })

        if (!active) return

        if (data?.allowed) {
          clearTimeout(timeout);
          setState({ checking: false, allowed: true, status: 'activo', bypass: false })
          return
        }

        // Si no está permitido, buscamos si tiene una solicitud pendiente
        const { data: app } = await supabase
          .from('influencer_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!active) return
        clearTimeout(timeout);
        setState({
          checking: false,
          allowed: false,
          status: app?.status || 'none',
          bypass: false
        })
      } catch (err) {
        console.error('InfluencerAccessGuard Error:', err);
        clearTimeout(timeout);
        // SEGURIDAD: En caso de error, DENEGAR acceso (no otorgar)
        setState({ checking: false, allowed: false, status: 'error', bypass: false });
      }
    }

    if (!authLoading) verify()
    
    return () => { 
      active = false;
      clearTimeout(timeout);
    }
  }, [user?.id, profile?.id, profile?.role, authLoading, searchParams, checkInfluencerAccess])

  // Mostrar loading mientras se verifica
  if (authLoading || state.checking) {
    return <AccessState title="Verificando acceso" copy="Comprobando tu perfil de influencer y el alcance de lectura." icon="hourglass_top" />
  }

  if (!user) return <Navigate to="/login" replace />
  
  // Si hubo timeout o error, mostrar mensaje (no bypass)
  if (state.status === 'timeout' || state.status === 'error') {
    return <AccessState title="Error de verificación" copy="No pudimos verificar tu acceso. Recarga la página o intenta más tarde." icon="error" />
  }

  if (!state.allowed) {
    // ... resto de la lógica de restringido (se mantiene igual)
    if (state.status === 'pending') {
      return (
        <div className="status-page">
          <div className="status-card">
            <span className="material-symbols-outlined status-icon status-icon--animated">hourglass_empty</span>
            <h1 className="status-title">Solicitud en Revisión</h1>
            <p className="status-copy">
              Tu postulación como Influencer está siendo revisada por nuestro equipo de Growth. 
              Recibirás una notificación y un email en cuanto tu código sea activado.
            </p>
            <div className="status-actions">
              <button className="status-btn status-btn--ghost" onClick={() => navigate('/profile')}>
                VOLVER A MI PERFIL
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="status-page">
        <div className="status-card">
          <span className="material-symbols-outlined status-icon">lock_person</span>
          <h1 className="status-title">Acceso Restringido</h1>
          <p className="status-copy">
            Este panel es exclusivo para Influencers oficiales de FigusUY. 
            Si crees que deberías tener acceso o quieres postularte, visita nuestro programa.
          </p>
          <div className="status-actions">
            <button className="status-btn status-btn--primary" onClick={() => navigate('/influencers')}>
              VER PROGRAMA DE INFLUENCERS
            </button>
            <button className="status-btn status-btn--ghost" onClick={() => navigate('/profile')}>
              VOLVER A MI PERFIL
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
