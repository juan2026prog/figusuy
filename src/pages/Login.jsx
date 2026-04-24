import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%)',
    }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '24rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '4rem', height: '4rem', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.75rem', fontWeight: 900, color: 'white',
          }}>F</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">FigusUy</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Intercambiá figuritas fácil y rápido
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)',
          padding: '1.5rem', boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border-light)',
        }}>
          {/* Google Sign In */}
          <button onClick={signInWithGoogle} className="btn btn-secondary btn-lg" style={{
            width: '100%', marginBottom: '1rem', fontWeight: 600,
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span>o</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <input className="input" type="text" placeholder="Nombre" value={name}
                onChange={e => setName(e.target.value)} style={{ marginBottom: '0.75rem' }} required />
            )}
            <input className="input" type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} style={{ marginBottom: '0.75rem' }} required />
            <input className="input" type="password" placeholder="Contraseña" value={password}
              onChange={e => setPassword(e.target.value)} style={{ marginBottom: '0.75rem' }} required minLength={6} />

            {error && <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>{error}</p>}

            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : (isSignUp ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
            {isSignUp ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
              {isSignUp ? 'Iniciá sesión' : 'Creá una'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
