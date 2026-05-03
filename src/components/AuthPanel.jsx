import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useAffiliateStore } from '../stores/affiliateStore'

export default function AuthPanel({ initialType = null, mode = 'page', onClose = null }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore()
  const { checkAndProcessReferral } = useAffiliateStore()

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

  useEffect(() => {
    if (showForgot) setForgotEmail(email)
  }, [showForgot, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const data = await signUpWithEmail(email, password, name)
        if (data?.user) {
          await checkAndProcessReferral(data.user.id)
        }
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion')
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

  const handleMagicLink = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Ingresa tu email primero para usar Magic Link')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      alert('Magic Link enviado. Revisa tu correo y la carpeta de spam.')
    } catch (err) {
      setError(err.message || 'Error al enviar Magic Link')
    }
    setLoading(false)
  }

  return (
    <div className={`auth-shell ${mode === 'modal' ? 'modal' : 'page'}`}>
      <style>{`
        .auth-shell {
          --auth-bg: #0b0b0b;
          --auth-panel: #121212;
          --auth-panel2: #181818;
          --auth-line: rgba(255,255,255,.08);
          --auth-line2: rgba(255,255,255,.14);
          --auth-text: #f5f5f5;
          --auth-muted: rgba(245,245,245,.6);
          --auth-muted2: rgba(245,245,245,.38);
          --auth-orange: #ff5a00;
          --auth-orange2: #cc4800;
          --auth-green: #22c55e;
          min-height: 100%;
          color: var(--auth-text);
          font-family: 'Barlow', sans-serif;
        }

        .auth-shell * {
          box-sizing: border-box;
        }

        .auth-wrap {
          position: relative;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, .92fr);
          border: 1px solid var(--auth-line);
          background: var(--auth-panel);
          overflow: hidden;
        }

        .auth-hero {
          position: relative;
          padding: 2rem;
          background:
            linear-gradient(135deg, rgba(255,90,0,.18) 0%, rgba(255,90,0,.04) 28%, transparent 48%),
            linear-gradient(180deg, #161616 0%, #0d0d0d 100%);
          border-right: 1px solid var(--auth-line);
        }

        .auth-hero:before {
          content: 'LOGIN';
          position: absolute;
          right: 1rem;
          top: -.2rem;
          font: italic 900 clamp(4rem, 10vw, 7rem) 'Barlow Condensed';
          line-height: .82;
          color: rgba(255,255,255,.04);
          pointer-events: none;
        }

        .auth-hero:after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 4px;
          background: linear-gradient(90deg, var(--auth-orange) 0%, rgba(255,90,0,0) 72%);
        }

        .auth-kicker {
          position: relative;
          z-index: 1;
          font: 900 .72rem 'Barlow Condensed';
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--auth-orange);
        }

        .auth-hero h1 {
          position: relative;
          z-index: 1;
          margin: .7rem 0 0;
          font: italic 900 clamp(2.6rem, 5vw, 4.6rem) 'Barlow Condensed';
          line-height: .84;
          text-transform: uppercase;
        }

        .auth-hero h1 span {
          color: var(--auth-orange);
        }

        .auth-hero p {
          position: relative;
          z-index: 1;
          max-width: 30rem;
          margin-top: 1rem;
          color: var(--auth-muted);
          line-height: 1.6;
        }

        .auth-badges {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: .6rem;
          margin-top: 1.1rem;
        }

        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          padding: .48rem .68rem;
          border: 1px solid var(--auth-line2);
          background: rgba(255,255,255,.03);
          font: 900 .7rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .auth-badge.green {
          color: var(--auth-green);
          border-color: rgba(34,197,94,.32);
          background: rgba(34,197,94,.08);
        }

        .auth-badge.orange {
          color: var(--auth-orange);
          border-color: rgba(255,90,0,.32);
          background: rgba(255,90,0,.08);
        }

        .auth-points {
          position: relative;
          z-index: 1;
          display: grid;
          gap: .8rem;
          margin-top: 1.5rem;
        }

        .auth-point {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: .8rem;
          padding: .9rem;
          border: 1px solid var(--auth-line);
          background: rgba(255,255,255,.03);
        }

        .auth-point-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,90,0,.28);
          background: rgba(255,90,0,.08);
          color: var(--auth-orange);
        }

        .auth-point strong {
          display: block;
          font: italic 900 1.2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .92;
        }

        .auth-point p {
          margin: .25rem 0 0;
          color: var(--auth-muted);
          font-size: .88rem;
          line-height: 1.5;
        }

        .auth-form-panel {
          position: relative;
          padding: 1.6rem;
          background: var(--auth-panel);
        }

        .auth-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 1px solid var(--auth-line2);
          background: transparent;
          color: #fff;
          cursor: pointer;
        }

        .auth-close:hover {
          border-color: var(--auth-orange);
          color: var(--auth-orange);
        }

        .auth-form-head h2 {
          margin: 0;
          font: italic 900 2.2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .auth-form-head p {
          margin-top: .55rem;
          color: var(--auth-muted);
          line-height: 1.55;
        }

        .auth-context-card {
          margin-top: 1rem;
          padding: .9rem 1rem;
          border: 1px solid rgba(255,90,0,.22);
          background: rgba(255,90,0,.08);
        }

        .auth-context-card strong {
          display: block;
          font: 900 .82rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--auth-orange);
        }

        .auth-context-card span {
          display: block;
          margin-top: .35rem;
          color: rgba(245,245,245,.78);
          font-size: .84rem;
          line-height: 1.45;
        }

        .auth-google {
          width: 100%;
          margin-top: 1.1rem;
          padding: .92rem 1rem;
          border: 1px solid var(--auth-line2);
          background: #fff;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .7rem;
          font: 800 .88rem 'Barlow';
          cursor: pointer;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: .75rem;
          margin: 1rem 0;
          color: var(--auth-muted2);
          font-size: .8rem;
          text-transform: uppercase;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--auth-line);
        }

        .auth-form {
          display: grid;
          gap: .9rem;
        }

        .auth-field label {
          display: block;
          margin-bottom: .42rem;
          font: 900 .68rem 'Barlow Condensed';
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--auth-muted2);
        }

        .auth-input {
          width: 100%;
          padding: .85rem .95rem;
          border: 1px solid var(--auth-line2);
          background: #0d0d0d;
          color: #fff;
          font: 700 .92rem 'Barlow';
          outline: none;
        }

        .auth-input:focus {
          border-color: var(--auth-orange);
        }

        .auth-password-wrap {
          position: relative;
        }

        .auth-password-toggle {
          position: absolute;
          right: .75rem;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--auth-muted);
          cursor: pointer;
          font-size: 1rem;
        }

        .auth-inline-link {
          border: 0;
          background: none;
          color: var(--auth-orange);
          cursor: pointer;
          padding: 0;
          font: 700 .82rem 'Barlow';
        }

        .auth-error {
          padding: .85rem .95rem;
          border: 1px solid rgba(239,68,68,.25);
          background: rgba(239,68,68,.08);
          color: #fca5a5;
          font-size: .86rem;
          line-height: 1.45;
        }

        .auth-actions {
          display: grid;
          gap: .7rem;
        }

        .auth-btn-primary,
        .auth-btn-secondary {
          width: 100%;
          padding: .92rem 1rem;
          border: 1px solid var(--auth-line2);
          font: 900 .86rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .auth-btn-primary {
          background: var(--auth-orange);
          border-color: var(--auth-orange);
          color: #fff;
        }

        .auth-btn-primary:hover {
          background: var(--auth-orange2);
          border-color: var(--auth-orange2);
        }

        .auth-btn-secondary {
          background: transparent;
          color: #fff;
        }

        .auth-btn-secondary:hover {
          border-color: var(--auth-orange);
          color: var(--auth-orange);
        }

        .auth-btn-primary:disabled,
        .auth-btn-secondary:disabled,
        .auth-google:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 1rem;
          color: var(--auth-muted);
          text-align: center;
          font-size: .88rem;
        }

        .auth-legal {
          margin-top: 1rem;
          color: var(--auth-muted2);
          text-align: center;
          font-size: .75rem;
          line-height: 1.5;
        }

        .auth-legal a {
          color: var(--auth-orange);
          text-decoration: none;
        }

        .auth-success {
          display: grid;
          gap: .8rem;
          text-align: center;
        }

        @media (max-width: 920px) {
          .auth-wrap {
            grid-template-columns: 1fr;
          }

          .auth-hero {
            border-right: 0;
            border-bottom: 1px solid var(--auth-line);
          }
        }

        @media (max-width: 640px) {
          .auth-hero,
          .auth-form-panel {
            padding: 1.2rem;
          }

          .auth-hero h1 {
            font-size: 2.5rem;
          }
        }
      `}</style>

      <div className="auth-wrap">
        <section className="auth-hero">
          <div className="auth-kicker">/ acceso figusuy</div>
          <h1>Entrar para <span>cerrar mejores cruces.</span></h1>
          <p>Accede a tu album, activa matches reales, sigue conversaciones y desbloquea un flujo mucho mas claro para completar sin perder tiempo.</p>

          <div className="auth-badges">
            <span className="auth-badge green">Acceso gratis</span>
            <span className="auth-badge orange">Cruces mas claros</span>
            <span className="auth-badge">Chats y albumes</span>
          </div>

          <div className="auth-points">
            <div className="auth-point">
              <div className="auth-point-icon">
                <span className="material-symbols-outlined">collections_bookmark</span>
              </div>
              <div>
                <strong>Carga tu album</strong>
                <p>Marca lo que tienes, lo que te falta y lo que puedes cambiar desde una sola vista.</p>
              </div>
            </div>
            <div className="auth-point">
              <div className="auth-point-icon">
                <span className="material-symbols-outlined">swap_horiz</span>
              </div>
              <div>
                <strong>Encuentra cruces utiles</strong>
                <p>Priorizamos coincidencias reales para que hables con quien si tiene valor para tu progreso.</p>
              </div>
            </div>
            <div className="auth-point">
              <div className="auth-point-icon">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div>
                <strong>Activa premium cuando quieras</strong>
                <p>Empieza gratis y escala solo si quieres mas alcance, mas alertas y mas velocidad.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          {mode === 'modal' && onClose && (
            <button className="auth-close" onClick={onClose} aria-label="Cerrar acceso">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}

          {showForgot ? (
            <>
              <div className="auth-form-head">
                <div className="auth-kicker">/ recuperar acceso</div>
                <h2>Recuperar contrasena</h2>
                <p>Te enviamos un email para resetear tu clave y volver a entrar a tu cuenta.</p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                {forgotSent ? (
                  <div className="auth-success">
                    <span style={{ fontSize: '2.5rem' }}>📧</span>
                    <strong style={{ font: "italic 900 1.9rem 'Barlow Condensed'", textTransform: 'uppercase' }}>Email enviado</strong>
                    <p style={{ color: 'var(--auth-muted)', lineHeight: 1.55 }}>Revisa tu bandeja de entrada en <b>{forgotEmail}</b>.</p>
                    <button className="auth-btn-primary" onClick={() => { setShowForgot(false); setForgotSent(false) }}>
                      Volver al login
                    </button>
                  </div>
                ) : (
                  <form className="auth-form" onSubmit={handleForgotPassword}>
                    <div className="auth-field">
                      <label htmlFor="forgot-email">Email</label>
                      <input
                        id="forgot-email"
                        className="auth-input"
                        type="email"
                        placeholder="tu@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="auth-actions">
                      <button className="auth-btn-primary" type="submit" disabled={forgotLoading}>
                        {forgotLoading ? 'Enviando...' : 'Enviar email de recuperacion'}
                      </button>
                      <button
                        className="auth-btn-secondary"
                        type="button"
                        onClick={() => { setShowForgot(false); setError('') }}
                      >
                        Volver
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="auth-form-head">
                <div className="auth-kicker">/ {isSignUp ? 'crear cuenta' : 'iniciar sesion'}</div>
                <h2>{isSignUp ? 'Abre tu cuenta' : 'Entra a tu cuenta'}</h2>
                <p>{isSignUp ? 'Empieza a cargar albumes, repetidas y faltantes con el nuevo sistema visual.' : 'Retoma tus albumes, tus chats y tus cruces sin perder el hilo.'}</p>
              </div>

              {initialType === 'business' && (
                <div className="auth-context-card">
                  <strong>Acceso negocios</strong>
                  <span>Entra para gestionar tu local, tus promos y tu visibilidad comercial dentro de FigusUY.</span>
                </div>
              )}

              <button onClick={signInWithGoogle} className="auth-google">
                <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <div className="auth-divider">o con email</div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="auth-field">
                    <label htmlFor="signup-name">Nombre</label>
                    <input
                      id="signup-name"
                      className="auth-input"
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    className="auth-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="login-password">Contrasena</label>
                  <div className="auth-password-wrap">
                    <input
                      id="login-password"
                      className="auth-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{ paddingRight: '2.8rem' }}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="auth-inline-link"
                      onClick={() => { setShowForgot(true); setError('') }}
                    >
                      Olvidaste tu contrasena?
                    </button>
                  </div>
                )}

                {error && <div className="auth-error">{error}</div>}

                <div className="auth-actions">
                  <button className="auth-btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Procesando...' : isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}
                  </button>

                  {!isSignUp && (
                    <button className="auth-btn-secondary" type="button" onClick={handleMagicLink} disabled={loading}>
                      Ingresar con Magic Link
                    </button>
                  )}
                </div>
              </form>

              <div className="auth-footer">
                {isSignUp ? 'Ya tienes cuenta? ' : 'No tienes cuenta? '}
                <button
                  className="auth-inline-link"
                  onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                >
                  {isSignUp ? 'Inicia sesion' : 'Crea una'}
                </button>
              </div>

              <div className="auth-legal">
                Al continuar aceptas nuestros <a href="#">Terminos</a> y <a href="#">Privacidad</a>.
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
