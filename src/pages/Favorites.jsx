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
          background-color: #020617;
          min-height: 100vh;
          color: white;
          padding: 1.5rem 1.25rem 7rem;
          max-width: 80rem;
          margin: 0 auto;
        }
        .favorites-header { margin-bottom: 2rem; }
        .page-subtitle {
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
          margin-top: 0.5rem;
        }
        .favorites-title {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin: 0;
        }
        .controls-card {
          background-color: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 1.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tab-btn {
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          font-size: 0.8125rem;
          font-weight: 900;
          border: none;
          cursor: pointer;
          background-color: #1e293b;
          color: #94a3b8;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: white; }
        .tab-btn-active {
          background-color: white;
          color: #020617;
        }
        .favorites-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>

      <header className="favorites-header">
        <h1 className="favorites-title">Favoritos</h1>
        <p className="page-subtitle">Usuarios guardados para volver a intercambiar más rápido.</p>
      </header>

      {favorites.length > 0 && (
        <div className="controls-card">
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
      )}

      <div className="favorites-grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>⏳ Cargando favoritos...</div>
        ) : filteredFavorites.length === 0 ? (
          <FavoritesEmptyState />
        ) : (
          filteredFavorites.map(fav => (
            <FavoriteUserCard key={fav.favorite_user_id} favorite={fav} />
          ))
        )}
      </div>
    </div>
  )
}
