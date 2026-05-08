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
      

      <div className="favorites-shell">
        <header className="favorites-header">
          <div className="header-copy">
            <div className="page-kicker">/ favoritos</div>
            <h1 className="favorites-title">Volvé más rápido a tus mejores cruces</h1>
            <p className="page-subtitle">Usuarios guardados para retomar intercambios con menos fricción, más contexto y una lectura más clara de tus contactos importantes.</p>
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
            <div className="favorites-list-note">Mantené a mano a quienes ya te sirvieron o pueden cerrar futuros intercambios sin volver a buscarlos desde cero.</div>
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
