import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import AlbumCard from '../components/AlbumCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { LiveBadge, LiveFeed } from '../components/LiveMomentum'
import { useLiveMomentum } from '../hooks/useLiveMomentum'
import MatchCard from '../components/MatchCard'

export default function HomePage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    albums, 
    selectedAlbum, 
    userAlbums,
    fetchAlbums, 
    fetchUserAlbums, 
    selectAlbum, 
    missingStickers, 
    duplicateStickers, 
    ownedStickers,
    matches, 
    chats,
    findMatches 
  } = useAppStore()
  const [greeting, setGreeting] = useState('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const toast = useToast()

  const { summary, feed } = useLiveMomentum({
    matches,
    chats,
    missingCount: missingStickers.length,
    duplicateCount: duplicateStickers.length,
  })

  useEffect(() => {
    fetchAlbums()
    if (profile?.id) {
      fetchUserAlbums(profile.id)
    }
  }, [profile?.id, fetchAlbums, fetchUserAlbums])

  useEffect(() => {
    if (profile?.id && selectedAlbum?.id && matches.length === 0) {
      findMatches(profile.id, selectedAlbum.id, profile)
    }
  }, [profile?.id, selectedAlbum?.id])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Buenos días')
    else if (h < 19) setGreeting('Buenas tardes')
    else setGreeting('Buenas noches')
  }, [])

  const handleSelectAlbum = async (album) => {
    const res = await selectAlbum(album, profile?.id)
    if (res?.error) {
      if (res.error.message.toLowerCase().includes('álbumes activos')) {
        setShowUpgradePrompt(true)
      } else {
        toast.error(res.error.message)
      }
      return
    }
    navigate('/album')
  }

  const unreadChats = chats?.filter(c => c.has_unread)?.length || 0
  const totalStickers = selectedAlbum?.total_stickers || 0
  const ownedCount = ownedStickers.length
  const progressPercent = totalStickers > 0 
    ? Math.min(100, Math.round((ownedCount / totalStickers) * 100)) 
    : 0

  const topMatches = matches.slice(0, 3)

  return (
    <div className="home-panini-wrapper page-content-mobile">
      <main className="wrap">
        {/* 1. Saludo / Perfil Rápido + Álbum Activo */}
        <header className="home-hero-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <span className="kicker" style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem' }}>
                // {greeting}, {profile?.name ? profile.name.split(' ')[0] : 'Coleccionista'}
              </span>
              <h1 className="hero-title" style={{ fontSize: '1.75rem', lineHeight: 1.15, margin: 0 }}>
                {selectedAlbum ? selectedAlbum.name : 'Tu Colección Activa'}
              </h1>
            </div>
            
            <button 
              onClick={() => navigate('/profile')}
              aria-label="Ver mi perfil"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-brand-500)' }} 
                />
              ) : (
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'var(--color-surface-hover)', 
                    border: '2px solid var(--color-border)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: 'var(--color-brand-500)'
                  }}
                >
                  {(profile?.name || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>
          </div>

          <div className="momentum-strip" style={{ marginTop: '0.75rem' }}>
            <LiveBadge tone="orange" pulse>{summary.activeNow} activos ahora</LiveBadge>
            <LiveBadge tone="green">{summary.exchangesToday} cambios hoy</LiveBadge>
          </div>

          {/* Barra de Progreso del Álbum Activo */}
          {selectedAlbum && (
            <div 
              className="active-album-progress-bar" 
              style={{ 
                marginTop: '1rem', 
                background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '12px', 
                padding: '0.875rem 1rem' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Progreso del álbum</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--color-brand-500)' }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
        </header>

        {/* 2. Acciones Rápidas (Touch-First) */}
        <section style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '0.75rem' 
            }}
          >
            <button 
              className="btn" 
              onClick={() => navigate('/album')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                gap: '0.35rem', 
                padding: '0.875rem', 
                minHeight: '64px',
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-500)', fontSize: '1.4rem' }}>menu_book</span>
              <strong style={{ fontSize: '0.85rem' }}>Cargar Álbum</strong>
            </button>

            <button 
              className="btn" 
              onClick={() => navigate('/matches')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                gap: '0.35rem', 
                padding: '0.875rem', 
                minHeight: '64px',
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '1.4rem' }}>swap_horiz</span>
              <strong style={{ fontSize: '0.85rem' }}>Intercambios ({matches.length})</strong>
            </button>

            <button 
              className="btn" 
              onClick={() => navigate('/chats')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                gap: '0.35rem', 
                padding: '0.875rem', 
                minHeight: '64px',
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '1.4rem' }}>chat</span>
                {unreadChats > 0 && <span className="nav-badge" style={{ position: 'static' }}>{unreadChats}</span>}
              </div>
              <strong style={{ fontSize: '0.85rem' }}>Mis Chats</strong>
            </button>

            <button 
              className="btn" 
              onClick={() => navigate('/stores')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                gap: '0.35rem', 
                padding: '0.875rem', 
                minHeight: '64px',
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#eab308', fontSize: '1.4rem' }}>location_on</span>
              <strong style={{ fontSize: '0.85rem' }}>Lugares Cerca</strong>
            </button>
          </div>
        </section>

        {/* 3. Estado del Álbum */}
        {selectedAlbum && (
          <section style={{ marginBottom: '1.5rem' }}>
            <div className="section-head" style={{ marginBottom: '0.5rem' }}>
              <span className="kicker" style={{ fontSize: '0.75rem' }}>// estado de tu colección</span>
            </div>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.5rem', 
                textAlign: 'center' 
              }}
            >
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-brand-500)' }}>{ownedCount}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Tengo</div>
              </div>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-danger, #dc2626)' }}>{missingStickers.length}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Faltan</div>
              </div>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-success, #16a34a)' }}>{duplicateStickers.length}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Repetidas</div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Mejores Oportunidades (Top 2-3 Matches) */}
        {topMatches.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span className="kicker" style={{ fontSize: '0.75rem' }}>// sugerencias para hoy</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Mejores Oportunidades</h2>
              </div>
              <button 
                className="btn btn-sm" 
                onClick={() => navigate('/matches')}
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
              >
                Ver todas ({matches.length})
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topMatches.map((m, idx) => (
                <MatchCard key={m.userId || m.profile?.id || idx} match={m} idx={idx} isTopMatch={idx === 0} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Actividad en Vivo */}
        <section style={{ marginBottom: '2rem' }}>
          <LiveFeed items={feed} refreshedAt={summary.refreshedAt} />
        </section>

        {/* 6. Colecciones Disponibles (Secundario) */}
        <section style={{ marginBottom: '2rem' }}>
          <div className="section-head" style={{ marginBottom: '0.75rem' }}>
            <span className="kicker" style={{ fontSize: '0.75rem' }}>// otras colecciones</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Álbumes Disponibles</h2>
          </div>
          <div className="album-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {albums.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                progress={0}
                isSelected={selectedAlbum?.id === album.id}
                onClick={() => handleSelectAlbum(album)}
              />
            ))}
          </div>
        </section>

        {/* 7. Cómo Funciona (Final de página) */}
        <section className="how-it-works" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h2 className="how-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Cómo Funciona FigusUY</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-content">
                <strong>Elegí un álbum</strong>
                <p>Seleccioná la colección que querés completar.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-content">
                <strong>Cargá tus figuritas</strong>
                <p>Marcá cuáles te faltan y cuáles tenés repetidas.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-content">
                <strong>Encontrá matches</strong>
                <p>El sistema cruza tus faltantes con las repetidas de usuarios cercanos.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-content">
                <strong>Intercambiá</strong>
                <p>Hablá por el chat interno y coordiná un punto de canje seguro.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ConfirmDialog
        isOpen={showUpgradePrompt}
        title="Llegaste al límite"
        message="Tu plan actual tiene un límite de álbumes activos. Si querés seguir sumando colecciones, podés mejorar tu plan ahora."
        confirmText="Ver planes"
        cancelText="Ahora no"
        variant="info"
        onConfirm={() => {
          setShowUpgradePrompt(false)
          navigate('/premium')
        }}
        onCancel={() => setShowUpgradePrompt(false)}
      />
    </div>
  )
}
