import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useFavoritesStore } from '../stores/favoritesStore'
import { useAppStore } from '../stores/appStore'
import FavoriteUserCard from '../components/FavoriteUserCard'
import FavoritesEmptyState from '../components/FavoritesEmptyState'

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'recent', label: 'Recientes' }
]

export default function Favorites() {
  const { profile } = useAuthStore()
  const { favorites, loading, fetchFavorites } = useFavoritesStore()
  const [tab, setTab] = useState('all')

  useEffect(() => {
    if (profile?.id) {
      fetchFavorites(profile.id)
    }
  }, [profile?.id])

  const filteredFavorites = (() => {
    let list = [...favorites]
    switch (tab) {
      case 'recent':
        // ya viene ordenado por created_at desc desde supabase
        break
      default:
        break
    }
    return list
  })()

  return (
    <div className="favorites-page-root">
      <style>{`
        .favorites-page-root {
          --bg: #0b0b0b;
          --panel: #121212;
          --panel2: #181818;
          --line: rgba(255, 255, 255, .08);
          --line2: rgba(255, 255, 255, .14);
          --text: #f5f5f5;
          --muted: rgba(245, 245, 245, .58);
          --muted2: rgba(245, 245, 245, .36);
          --orange: #ff5a00;
          --orange2: #cc4800;
          --green: #22c55e;

          min-height: 100vh;
          max-width: 86rem;
          margin: 0 auto;
          padding: 1.5rem 1.25rem 7rem;
          color: var(--text);
          font-family: 'Barlow', sans-serif;
          background:
            radial-gradient(circle at top right, rgba(255, 90, 0, .12), transparent 26%),
            linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
        }

        .favorites-page-root * { box-sizing: border-box; }
        .favorites-shell { display: grid; gap: 1.25rem; }

        .favorites-header {
          position: relative;
          overflow: hidden;
          padding: 1.75rem;
          border: 1px solid var(--line);
          background:
            linear-gradient(135deg, rgba(255, 90, 0, .16) 0%, rgba(255, 90, 0, .04) 24%, transparent 48%),
            linear-gradient(180deg, #181818 0%, #111111 100%);
        }

        .favorites-header::before {
          content: 'FAVORITES';
          position: absolute;
          right: .9rem;
          top: -.35rem;
          font: italic 900 clamp(3.8rem, 10vw, 7rem) 'Barlow Condensed';
          line-height: .82;
          color: rgba(255, 255, 255, .04);
          pointer-events: none;
        }

        .favorites-header::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 4px;
          background: linear-gradient(90deg, var(--orange) 0%, rgba(255, 90, 0, 0) 70%);
        }

        .header-copy {
          position: relative;
          z-index: 1;
          max-width: 48rem;
        }

        .page-kicker,
        .controls-label {
          font: 900 .74rem 'Barlow Condensed';
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .page-kicker { color: var(--orange); }
        .controls-label { color: var(--muted2); }

        .favorites-title {
          margin: .45rem 0 0;
          font: italic 900 clamp(3rem, 7vw, 5.4rem) 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .84;
        }

        .page-subtitle,
        .favorites-list-note {
          color: var(--muted);
          line-height: 1.6;
        }

        .page-subtitle {
          margin-top: .9rem;
          font-size: .98rem;
        }

        .header-meta {
          display: flex;
          flex-wrap: wrap;
          gap: .65rem;
          margin-top: 1.35rem;
        }

        .meta-chip,
        .tab-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .45rem;
          border: 1px solid var(--line2);
          background: #0d0d0d;
          font: 900 .78rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .meta-chip {
          padding: .5rem .7rem;
          color: var(--text);
        }

        .meta-chip.orange {
          color: var(--orange);
          border-color: rgba(255, 90, 0, .35);
          background: rgba(255, 90, 0, .08);
        }

        .meta-chip.green {
          color: var(--green);
          border-color: rgba(34, 197, 94, .35);
          background: rgba(34, 197, 94, .08);
        }

        .controls-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 1px;
          border: 1px solid var(--line);
          background: var(--line);
        }

        .controls-card {
          padding: 1.1rem 1rem;
          background: var(--panel);
        }

        .controls-card.secondary {
          min-width: 13rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: .35rem;
          background:
            linear-gradient(180deg, rgba(255, 90, 0, .08) 0%, rgba(255, 90, 0, 0) 100%),
            var(--panel2);
        }

        .controls-value {
          font: italic 900 2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .88;
        }

        .tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: .65rem;
          margin-top: .8rem;
        }

        .tab-btn {
          padding: .75rem 1rem;
          cursor: pointer;
          color: var(--muted);
          transition: .2s ease;
        }

        .tab-btn:hover {
          color: var(--text);
          border-color: var(--orange);
        }

        .tab-btn-active {
          background: var(--orange);
          border-color: var(--orange);
          color: #fff;
        }

        .favorites-list-shell {
          padding: 1.1rem;
          border: 1px solid var(--line);
          background: var(--panel);
        }

        .favorites-list-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--line);
        }

        .favorites-list-title {
          margin: .35rem 0 0;
          font: italic 900 2.2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .88;
        }

        .favorites-list-note {
          max-width: 38rem;
          font-size: .92rem;
        }

        .favorites-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .loading-state {
          padding: 3.2rem 1rem;
          border: 1px solid var(--line);
          background: #0d0d0d;
          text-align: center;
          color: var(--muted);
          font: 900 1rem 'Barlow Condensed';
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        @media (max-width: 820px) {
          .controls-shell { grid-template-columns: 1fr; }
          .controls-card.secondary { min-width: 0; }
          .favorites-list-head { display: block; }
          .favorites-list-note { margin-top: .65rem; }
        }

        @media (max-width: 640px) {
          .favorites-page-root { padding: 1rem .75rem 6rem; }
          .favorites-header,
          .controls-card,
          .favorites-list-shell { padding: 1rem; }
          .favorites-title { font-size: 3rem; }
          .favorites-list-title { font-size: 1.9rem; }
          .tab-btn { width: 100%; }
        }
      `}</style>

      <div className="favorites-shell">
        <header className="favorites-header">
          <div className="header-copy">
            <div className="page-kicker">/ favoritos</div>
            <h1 className="favorites-title">Volve mas rapido a tus mejores cruces</h1>
            <p className="page-subtitle">Usuarios guardados para retomar intercambios con menos friccion, mas contexto y una lectura mas clara de tus contactos importantes.</p>
            <div className="header-meta">
              <span className="meta-chip green">Guardados: {favorites.length}</span>
              <span className="meta-chip orange">{tab === 'recent' ? 'Orden: recientes' : 'Vista completa'}</span>
            </div>
          </div>
        </header>

        {favorites.length > 0 && (
          <div className="controls-shell">
            <div className="controls-card">
              <div className="controls-label">Filtrar lista</div>
              <div className="tabs-row">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="controls-card secondary">
              <div className="controls-label">Resultados</div>
              <div className="controls-value">{filteredFavorites.length}</div>
            </div>
          </div>
        )}

        <div className="favorites-list-shell">
          <div className="favorites-list-head">
            <div>
              <div className="page-kicker">/ lista</div>
              <h2 className="favorites-list-title">Tus usuarios guardados</h2>
            </div>
            <div className="favorites-list-note">Mantene a mano a quienes ya te sirvieron o pueden cerrar futuros intercambios sin volver a buscarlos desde cero.</div>
          </div>

          <div className="favorites-grid">
            {loading ? (
              <div className="loading-state">Cargando favoritos...</div>
            ) : filteredFavorites.length === 0 ? (
              <FavoritesEmptyState />
            ) : (
              filteredFavorites.map(fav => (
                <FavoriteUserCard key={fav.favorite_user_id} favorite={fav} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
