import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', background: '#fafaf9',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '24rem' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>😵</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1c1917' }}>
              Algo salió mal
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#78716c', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Ocurrió un error inesperado. Intentá recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 2rem', borderRadius: '0.75rem',
                background: '#ea580c',
                color: 'white', fontWeight: 700, fontSize: '0.9375rem',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(234,88,12,0.3)',
              }}>
              🔄 Recargar página
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#a8a29e' }}>Detalles del error</summary>
                <pre style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '0.5rem', overflow: 'auto', maxHeight: '10rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '0.5rem' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
