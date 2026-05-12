import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { syncSession } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const processAuth = async () => {
      try {
        // Supabase client automatically parses the hash if present
        // Calling getSession() reads it and creates the session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (session) {
          // Sync it globally
          await syncSession(session)
          
          // Clear the hash from the URL
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search)

          // Redirect to the AuthRedirector via /home to route to the correct profile/dashboard
          if (mounted) navigate('/home', { replace: true })
        } else {
          // No session found in URL
          if (mounted) navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('AuthCallback error:', err)
        if (mounted) navigate('/login', { replace: true })
      }
    }

    processAuth()

    return () => {
      mounted = false
    }
  }, [navigate, syncSession])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--color-bg, #080808)',
      color: 'var(--color-text, #f5f5f5)',
    }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: '0.75rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--color-primary, #ff5a00)' }}>sync</span>
        <strong style={{ fontSize: '1rem', letterSpacing: '0.04em' }}>Completando acceso...</strong>
      </div>
    </div>
  )
}
