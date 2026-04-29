import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

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

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      setForgotSent(true)
    } catch (err) {
      setError(err.message || 'Error al enviar el email')
    }
    setForgotLoading(false)
  }

  if (showForgot) {
    return (
    <div className="flex-center flex-col" style={{ minHeight: '100vh', padding: '2rem 1rem', background: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-brand-50) 50%, #fffbeb 100%)' }}>
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '24rem' }}>
          <div className="text-center mb-2xl">
            <div className="logo-icon-lg" style={{ margin: '0 auto 1rem' }}>F</div>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="gradient-text">Recuperar contraseña</span>
            </h1>
            <p className="text-base text-secondary mt-xs">Te enviaremos un email para resetear tu contraseña</p>
          </div>

          <div className="card-elevated">
            {forgotSent ? (
              <div className="text-center">
                <span className="block text-4xl mb-lg">📧</span>
                <h3 className="text-lg font-bold mb-sm">¡Email enviado!</h3>
                <p className="text-sm text-muted mb-xl">Revisá tu bandeja de entrada en <strong>{forgotEmail}</strong></p>
                <button className="btn btn-primary w-full" onClick={() => { setShowForgot(false); setForgotSent(false) }}>Volver al login</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">Email</label>
                  <input id="forgot-email" className="input" type="email" placeholder="tu@email.com" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                {error && <p className="form-error mb-md animate-shake">{error}</p>}
                <button className={`btn btn-primary btn-lg w-full ${forgotLoading ? 'btn-loading' : ''}`} type="submit" disabled={forgotLoading}>
                  Enviar email de recuperación
                </button>
                <button type="button" className="btn btn-ghost w-full mt-md" onClick={() => { setShowForgot(false); setError('') }}>
                  ← Volver al login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-center flex-col" style={{ minHeight: '100vh', padding: '2rem 1rem', background: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-brand-50) 50%, #fffbeb 100%)' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '24rem' }}>
        {/* Logo */}
        <div className="text-center mb-2xl">
          <div className="logo-icon-lg" style={{ margin: '0 auto 1rem' }}>F</div>
          <h1 className="text-3xl font-black tracking-tight">
            <span style={{ color: 'var(--color-brand-600)', fontWeight: 900 }}>FigusUY</span>
          </h1>
          <p className="text-base text-secondary mt-xs">Intercambiá figuritas fácil y rápido</p>
        </div>

        {/* Card */}
        <div className="card-elevated">
          {/* Google Sign In */}
          <button onClick={signInWithGoogle} className="btn btn-secondary btn-lg w-full mb-lg font-semibold">
            <svg width={20} height={20} viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex-center gap-md mb-sm text-muted text-sm">
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span>o</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Nombre</label>
                <input id="signup-name" className="input" type="text" placeholder="Tu nombre" value={name}
                  onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input id="login-email" className="input" type="email" placeholder="tu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Contraseña</label>
              <div className="password-wrapper">
                <input id="login-password" className={`input ${error ? 'input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6}
                  style={{ paddingRight: '2.75rem' }} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="mb-md" style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => { setShowForgot(true); setError(''); setForgotEmail(email) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && <p className="form-error mb-md animate-shake">⚠️ {error}</p>}

            <button className={`btn btn-primary btn-lg w-full ${loading ? 'btn-loading' : ''}`} type="submit" disabled={loading}>
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-lg">
            {isSignUp ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
              {isSignUp ? 'Iniciá sesión' : 'Creá una'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-xl">
          Al continuar, aceptás nuestros{' '}
          <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Términos</a> y{' '}
          <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Privacidad</a>
        </p>
      </div>
    </div>
  )
}
