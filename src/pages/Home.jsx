import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import AlbumCard from '../components/AlbumCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { LiveBadge, LiveFeed, LiveStat } from '../components/LiveMomentum'
import { useLiveMomentum } from '../hooks/useLiveMomentum'

export default function HomePage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { albums, selectedAlbum, fetchAlbums, fetchUserAlbums, selectAlbum, missingStickers, duplicateStickers, matches, chats } = useAppStore()
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
    if (profile?.id) fetchUserAlbums(profile.id)
  }, [profile?.id, fetchAlbums, fetchUserAlbums])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Buenos días')
    else if (h < 19) setGreeting('Buenas tardes')
    else setGreeting('Buenas noches')
  }, [])

  const handleSelectAlbum = async (album) => {
    const res = await selectAlbum(album, profile?.id)
    if (res?.error) {
      if (res.error.message.toLowerCase().includes('albumes activos')) {
        setShowUpgradePrompt(true)
      } else {
        toast.error(res.error.message)
      }
      return
    }
    navigate('/album')
  }

  const getProgress = () => 0

  return (
    <div className="home-panini-wrapper">
      

      <main className="wrap">
        <header style={{ marginBottom: '32px' }}>
          <span className="kicker">// {greeting}, {profile?.name || 'coleccionista'}</span>
          <div className="momentum-strip">
            <LiveBadge tone="orange" pulse>{summary.activeNow} activos ahora</LiveBadge>
            <LiveBadge tone="green">{summary.exchangesToday} cambios cerrados hoy</LiveBadge>
            <LiveBadge tone="blue">{summary.activePromos} promos activas hoy</LiveBadge>
          </div>
          <h1 className="hero-title">Completá tu álbum <span>hoy</span></h1>
          <p className="hero-desc">
            Encontrá usuarios cerca tuyo con las figuritas que te faltan e intercambiá al instante. Sin comisiones, solo comunidad.
          </p>
          <button className="btn orange block" onClick={() => navigate('/matches')}>
            Ver oportunidades activas
          </button>
        </header>

        <div className="live-stat-grid">
          <LiveStat value={summary.activeNow} label="Personas activas ahora" tone="orange" detail="La red se está moviendo en este momento" />
          <LiveStat value={summary.exchangesToday} label="Intercambios confirmados hoy" tone="green" detail="Cierres reales registrados hoy" />
          <LiveStat value={summary.completedAlbumsToday} label="ÃƒÂlbumes cerrados hoy" tone="blue" detail="Coleccionistas completando ahora" />
        </div>

        {selectedAlbum && (
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-icon material-symbols-outlined">sentiment_dissatisfied</span>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{missingStickers.length}</div>
              <div className="stat-label">Faltantes</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon material-symbols-outlined">library_add</span>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{duplicateStickers.length}</div>
              <div className="stat-label">Repetidas listas hoy</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon material-symbols-outlined">donut_large</span>
              <div className="stat-value" style={{ color: 'var(--orange)' }}>
                {selectedAlbum.total_stickers > 0 ? Math.round(((selectedAlbum.total_stickers - missingStickers.length) / selectedAlbum.total_stickers) * 100) : 0}%
              </div>
              <div className="stat-label">Progreso</div>
            </div>
          </div>
        )}

        <LiveFeed items={feed} refreshedAt={summary.refreshedAt} />

        <section>
          <div className="section-head">
            <span className="kicker">// colecciones</span>
            <h2>Ãlbumes Disponibles</h2>
          </div>
          <div className="album-list">
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
        </section>

        <section className="how-it-works">
          <h2 className="how-title">Cómo Funciona</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-content">
                <strong>Elegí un álbum</strong>
                <p>Seleccioná la colección que querés completar de la lista de arriba.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-content">
                <strong>Cargá tus figuritas</strong>
                <p>Marcá cuáles te faltan y cuáles tenés repetidas para cambiar.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-content">
                <strong>Encontrá matches</strong>
                <p>El sistema cruzará tu lista con la de usuarios cercanos a vos.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-content">
                <strong>Intercambiá</strong>
                <p>Hablá por el chat interno y coordiná un lugar seguro para cambiar.</p>
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
