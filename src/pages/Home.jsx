import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import Header from '../components/Header'
import AlbumCard from '../components/AlbumCard'

export default function HomePage() {
  const navigate = useNavigate()
  const { profile, updateLocation } = useAuthStore()
  const { albums, userAlbums, selectedAlbum, fetchAlbums, fetchUserAlbums, selectAlbum, missingStickers } = useAppStore()
  const [greeting, setGreeting] = useState('')
  const [geoStatus, setGeoStatus] = useState(null) // null | 'requesting' | 'done' | 'denied'

  useEffect(() => {
    fetchAlbums()
    if (profile?.id) fetchUserAlbums(profile.id)
  }, [profile?.id])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Buenos días')
    else if (h < 19) setGreeting('Buenas tardes')
    else setGreeting('Buenas noches')
  }, [])

  // Auto-request geolocation on Home page
  useEffect(() => {
    if (profile && !profile.lat && navigator.geolocation) {
      setGeoStatus('requesting')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateLocation(pos.coords.latitude, pos.coords.longitude)
          setGeoStatus('done')
        },
        () => setGeoStatus('denied'),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else if (profile?.lat) {
      setGeoStatus('done')
    }
  }, [profile?.id])

  const handleRequestLocation = () => {
    setGeoStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude)
        setGeoStatus('done')
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSelectAlbum = (album) => {
    selectAlbum(album, profile?.id)
    navigate('/album')
  }

  // Calculate progress for user albums
  const getProgress = (albumId) => {
    const album = albums.find(a => a.id === albumId)
    if (!album) return 0
    return 0
  }

  return (
    <div className="page">
      {/* Hero */}
      <div className="animate-fade-in-up" style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {greeting} 👋
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
          <span className="gradient-text">FigusUy</span>
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Encontrá usuarios cerca tuyo para intercambiar figuritas.
        </p>
      </div>

      {/* Geolocation Banner */}
      {geoStatus === 'denied' && (
        <div className="animate-fade-in" style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: 'var(--radius-xl)', padding: '0.875rem 1rem',
          marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          border: '1px solid #f59e0b33',
        }}>
          <span style={{ fontSize: '1.5rem' }}>📍</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>Ubicación desactivada</p>
            <p style={{ fontSize: '0.75rem', color: '#a16207' }}>Activá la ubicación para encontrar usuarios cerca tuyo.</p>
          </div>
          <button onClick={handleRequestLocation} style={{
            padding: '0.375rem 0.75rem', borderRadius: '0.375rem',
            background: '#f59e0b', color: 'white', border: 'none',
            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
          }}>Activar</button>
        </div>
      )}

      {geoStatus === 'done' && profile?.lat && (
        <div className="animate-fade-in" style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          padding: '0.625rem 0.875rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          border: '1px solid var(--color-border-light)', fontSize: '0.75rem',
        }}>
          <span>📍</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>Ubicación activa</span>
          <span style={{ color: 'var(--color-text-muted)' }}>· {profile.city || profile.department || `${profile.lat.toFixed(2)}, ${profile.lng.toFixed(2)}`}</span>
        </div>
      )}

      {/* CTA Button */}
      <button
        className="btn btn-primary btn-lg animate-fade-in-up"
        onClick={() => navigate('/matches')}
        style={{
          width: '100%',
          marginBottom: '2rem',
          padding: '1rem',
          fontSize: '1.0625rem',
          borderRadius: 'var(--radius-2xl)',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
        }}
      >
        🔍 Buscar intercambios
      </button>

      {/* Quick Stats */}
      {selectedAlbum && (
        <div className="animate-fade-in-up" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <StatCard label="Faltantes" value={missingStickers.length} color="#ef4444" icon="❌" />
          <StatCard label="Repetidas" value={useAppStore.getState().duplicateStickers.length} color="#10b981" icon="🔄" />
          <StatCard
            label="Progreso"
            value={`${selectedAlbum.total_stickers > 0 ? Math.round(((selectedAlbum.total_stickers - missingStickers.length) / selectedAlbum.total_stickers) * 100) : 0}%`}
            color="#3b82f6"
            icon="📊"
          />
        </div>
      )}

      {/* Albums */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
          📖 Álbumes disponibles
        </h2>
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {albums.map(album => (
            <AlbumCard
              key={album.id}
              album={album}
              progress={getProgress(album.id)}
              isSelected={selectedAlbum?.id === album.id}
              onClick={() => handleSelectAlbum(album)}
            />
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="animate-fade-in-up" style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.25rem',
        border: '1px solid var(--color-border-light)',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>
          ⚡ ¿Cómo funciona?
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { step: '1', text: 'Elegí un álbum', desc: 'Seleccioná el álbum que estás completando' },
            { step: '2', text: 'Marcá tus figuritas', desc: 'Indicá cuáles te faltan y cuáles tenés repetidas' },
            { step: '3', text: 'Encontrá matches', desc: 'Te conectamos con usuarios compatibles cerca tuyo' },
            { step: '4', text: '¡Intercambiá!', desc: 'Chateá y coordiná el intercambio' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.text}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-xl)',
      padding: '0.875rem',
      textAlign: 'center',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.25rem' }}>{icon}</span>
      <p style={{ fontSize: '1.375rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
    </div>
  )
}
