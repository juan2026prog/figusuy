import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import AlbumCard from '../components/AlbumCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

export default function HomePage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { albums, selectedAlbum, fetchAlbums, fetchUserAlbums, selectAlbum, missingStickers } = useAppStore()
  const [greeting, setGreeting] = useState('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const toast = useToast()

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
      <style>{`
        .home-panini-wrapper {
          --bg:#0b0b0b; --panel:#121212; --panel2:#181818; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
          --text:#f5f5f5; --muted:rgba(245,245,245,.58); --muted2:rgba(245,245,245,.36); --orange:#ff5a00; --orange2:#cc4800;
          --green:#22c55e; --blue:#3b82f6; --red:#ef4444;
          min-height:100vh; color:var(--text); font-family:'Barlow',sans-serif;
          background:radial-gradient(circle at top right, rgba(255,90,0,.08), transparent 40%), var(--bg);
          padding-bottom: 80px;
        }
        .home-panini-wrapper * { box-sizing:border-box; }
        .wrap { width:min(100%, 1200px); margin:0 auto; padding:28px 22px; }
        
        .kicker { font: 900 .72rem 'Barlow Condensed'; letter-spacing: .16em; text-transform: uppercase; color: var(--orange); margin-bottom: 8px; display: block; }
        .hero-title { font: italic 900 3.2rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin: 0 0 12px 0; }
        .hero-title span { color: var(--orange); }
        .hero-desc { color: var(--muted); font-size: 1.05rem; line-height: 1.5; max-width: 600px; margin-bottom: 24px; }
        
        .btn {
          border: 1px solid var(--line2); background: transparent; color: #fff; padding: .9rem 1.15rem; 
          font: 900 .88rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; 
          cursor: pointer; display: inline-flex; align-items: center; justify-content: center; 
          gap: 8px; transition: .2s ease; text-decoration: none; white-space: nowrap;
        }
        .btn:hover { border-color: var(--orange); color: var(--orange); }
        .btn.orange { background: var(--orange); border-color: var(--orange); color: #fff; }
        .btn.orange:hover { background: var(--orange2); border-color: var(--orange2); color: #fff; }
        .btn.block { width: 100%; padding: 1.15rem; font-size: 1.05rem; }

        .stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 32px; }
        .stat-card {
          background: var(--panel); border: 1px solid var(--line); padding: 18px 16px; text-align: center;
          position: relative; overflow: hidden;
        }
        .stat-card:before { content:''; position:absolute; inset:auto 0 0 0; height:3px; background:var(--orange); opacity: 0; transition: .2s; }
        .stat-card:hover:before { opacity: 1; }
        .stat-icon { display: block; font: 900 .8rem 'Barlow Condensed'; letter-spacing: .1em; color: var(--muted2); margin-bottom: 6px; }
        .stat-value { font: italic 900 2.2rem 'Barlow Condensed'; line-height: 1; margin-bottom: 4px; }
        .stat-label { font: 900 .7rem 'Barlow Condensed'; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }

        .section-head { margin: 40px 0 20px; }
        .section-head h2 { font: italic 900 2.2rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin: 0; }
        
        .album-list { display: grid; gap: 14px; }

        .how-it-works {
          margin-top: 40px; background: linear-gradient(180deg, var(--panel) 0%, var(--panel2) 100%);
          border: 1px solid var(--line); padding: 32px;
        }
        .how-title { font: italic 900 2rem 'Barlow Condensed'; text-transform: uppercase; margin: 0 0 24px 0; }
        .steps { display: grid; gap: 20px; }
        .step { display: flex; gap: 16px; align-items: flex-start; }
        .step-num {
          width: 32px; height: 32px; flex-shrink: 0; background: rgba(255,90,0,.1); border: 1px solid rgba(255,90,0,.3);
          color: var(--orange); display: flex; align-items: center; justify-content: center; font: italic 900 1.2rem 'Barlow Condensed';
        }
        .step-content strong { display: block; font: 900 1.1rem 'Barlow Condensed'; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 4px; color: #fff; }
        .step-content p { margin: 0; color: var(--muted); font-size: .95rem; line-height: 1.5; }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.8rem; }
          .stat-grid { gap: 8px; }
          .stat-card { padding: 14px 10px; }
          .stat-value { font-size: 1.8rem; }
          .how-it-works { padding: 24px 20px; }
        }
      `}</style>

      <main className="wrap">
        <header style={{ marginBottom: '32px' }}>
          <span className="kicker">// {greeting}, {profile?.name || 'coleccionista'}</span>
          <h1 className="hero-title">Completá tu álbum <span>hoy</span></h1>
          <p className="hero-desc">
            Encontrá usuarios cerca tuyo con las figuritas que te faltan e intercambiá al instante. Sin comisiones, solo comunidad.
          </p>
          <button className="btn orange block" onClick={() => navigate('/matches')}>
            Buscar Intercambios
          </button>
        </header>

        {selectedAlbum && (
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-icon material-symbols-outlined">sentiment_dissatisfied</span>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{missingStickers.length}</div>
              <div className="stat-label">Faltantes</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon material-symbols-outlined">library_add</span>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{useAppStore.getState().duplicateStickers.length}</div>
              <div className="stat-label">Repetidas</div>
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

        <section>
          <div className="section-head">
            <span className="kicker">// colecciones</span>
            <h2>Álbumes Disponibles</h2>
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
