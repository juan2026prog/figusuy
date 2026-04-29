import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import MatchCard from '../components/MatchCard'
import { useFavoritesStore } from '../stores/favoritesStore'
import { usePremiumAccess } from '../hooks/usePremiumAccess'

const TABS = [
  { id: 'all',     label: 'Todos' },
  { id: 'mutual',  label: 'Mutuos' },
  { id: 'near',    label: 'Cercanos' },
  { id: 'favorites', label: 'Favoritos' },
  { id: 'best',    label: 'Mejores' },
]

export default function MatchesPage() {
  const navigate   = useNavigate()
  const { profile, planRules } = useAuthStore()
  const { matches, matchesLoading, findMatches, selectedAlbum, missingStickers, duplicateStickers } = useAppStore()
  const { favoriteIds } = useFavoritesStore()
  const [tab, setTab] = useState('all')

  const hasLocation = !!(profile?.lat && profile?.lng)

  const handleRefresh = () => {
    if (profile?.id && selectedAlbum?.id) {
      findMatches(profile.id, selectedAlbum.id, profile)
    }
  }

  useEffect(() => {
    if (
      profile?.id &&
      selectedAlbum?.id &&
      (missingStickers.length > 0 || duplicateStickers.length > 0) &&
      matches.length === 0
    ) {
      handleRefresh()
    }
  }, [profile?.id, selectedAlbum?.id])

  // ── Tab Filtering + Sorting ───────────────────────────────
  const filteredMatches = (() => {
    let list = [...matches]
    switch (tab) {
      case 'mutual':
        list = list.filter(m => m.isMutual)
        break
      case 'favorites':
        list = list.filter(m => favoriteIds.has(m.userId || m.profile?.id))
        break
      case 'near':
        if (!hasLocation) return list  // fallback: score sort
        list = list
          .filter(m => m.distance !== null)
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        break
      case 'best':
        list = list.sort((a, b) => {
          const ca = (b._scoreBreakdown?.compatibility ?? 0)
          const cb = (a._scoreBreakdown?.compatibility ?? 0)
          return ca - cb
        })
        break
      default:
        break // already sorted by score from API
    }
    return list
  })()

  const { isPremium, planName: rawPlanName } = usePremiumAccess()
  const planName = rawPlanName.toLowerCase()
  const isPro      = planName.includes('pro')
  const isPlus     = planName.includes('plus')

  const handleGeoUpdate = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await supabase.from('profiles').update({ lat: pos.coords.latitude, lng: pos.coords.longitude }).eq('id', profile.id)
          // Profile will update via authStore subscription or next reload, but let's refresh matches
          handleRefresh()
        } catch (err) {
          console.error('Error al actualizar ubicación:', err)
        }
      },
      () => {
        alert('No se pudo obtener la ubicación')
      }
    )
  }

  return (
    <div className="matches-page-root">
      <style>{`
        .matches-page-root {
          background-color: #020617;
          min-height: 100vh;
          color: white;
          padding: 1.5rem 1.25rem 7rem;
          max-width: 80rem;
          margin: 0 auto;
        }
        .matches-header { margin-bottom: 2rem; }
        .album-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .matches-title {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin: 0;
        }
        .search-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .matches-search-input {
          flex: 1;
          padding: 0.875rem 1.25rem;
          border-radius: 1.25rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
        }
        .btn-refresh {
          padding: 0 1.25rem;
          border-radius: 1.25rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          font-weight: 900;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-refresh:hover { background-color: #1e293b; }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
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
        .tab-btn-orange {
          background-color: rgba(249, 115, 22, 0.15);
          color: #f97316;
        }
        .no-location-banner {
          background-color: rgba(234, 179, 8, 0.08);
          border: 1px solid rgba(234, 179, 8, 0.25);
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #fde047;
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .premium-notice {
          background-color: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.25);
          border-radius: 1.25rem;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 0.75rem;
        }
        .premium-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: #fde047;
          margin: 0;
        }
        .btn-unlock {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          background-color: #facc15;
          color: #422006;
          font-weight: 900;
          font-size: 0.75rem;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: filter 0.2s;
        }
        .btn-unlock:hover { filter: brightness(1.1); }
        .matches-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #94a3b8;
        }
        .empty-state p { margin: 0.5rem 0; }
        .empty-state .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .empty-cta {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.625rem 1.5rem;
          border-radius: 1rem;
          background: rgba(249, 115, 22, 0.15);
          color: #f97316;
          font-weight: 900;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .empty-cta:hover { background: rgba(249, 115, 22, 0.25); }
        .match-count-badge {
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(255,255,255,0.08);
          border-radius: 9999px;
          padding: 0.1rem 0.5rem;
          margin-left: 0.25rem;
        }
      `}</style>

      <header className="matches-header">
        <p className="album-label">{selectedAlbum?.name || 'Álbum'}</p>
        <h1 className="matches-title">Intercambios</h1>
      </header>

      <div className="search-row">
        <input
          type="text"
          placeholder="Buscar usuario, figurita o zona..."
          className="matches-search-input"
        />
        <button className="btn-refresh" onClick={handleRefresh} disabled={matchesLoading}>
          {matchesLoading ? '⏳' : '🔄 Actualizar'}
        </button>
      </div>

      <div className="controls-card">
        <div className="tabs-row">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${
                tab === t.id
                  ? t.id === 'mutual'
                    ? 'tab-btn-orange'
                    : 'tab-btn-active'
                  : ''
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'all' && matches.length > 0 && (
                <span className="match-count-badge">{matches.length}</span>
              )}
              {t.id === 'mutual' && (
                <span className="match-count-badge">
                  {matches.filter(m => m.isMutual).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'near' && !hasLocation && (
          <div className="no-location-banner">
            <span style={{ flex: 1 }}>📍 Activá tu ubicación para ver intercambios ordenados por distancia.</span>
            <button 
              onClick={handleGeoUpdate}
              style={{
                background: '#fde047',
                color: '#422006',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.75rem',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Activar ahora
            </button>
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="premium-notice" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <p className="premium-text">
              {planRules?.match_depth === 'advanced' && '🚀 Cruces avanzados con mejores oportunidades primero.'}
              {planRules?.match_depth === 'optimized' && '✨ Cruces optimizados por cercanía, actividad y reciprocidad.'}
              {(!planRules?.match_depth || planRules?.match_depth === 'basic') && '👀 Estás viendo cruces básicos. Plus puede ayudarte a encontrar cruces más útiles.'}
            </p>
            {(!planRules?.match_depth || planRules?.match_depth === 'basic') && (
              <button className="btn-unlock" onClick={() => navigate('/premium')}>
                Mejorar a Plus
              </button>
            )}
          </div>
        </div>
      )}

      <div className="matches-grid">
        {matchesLoading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Buscando intercambios...</p>
          </div>
        ) : !selectedAlbum ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <p>Seleccioná un álbum para buscar intercambios.</p>
            <button className="empty-cta" onClick={() => navigate('/album')}>
              Ir al Álbum
            </button>
          </div>
        ) : missingStickers.length === 0 && duplicateStickers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <p style={{ fontWeight: 700, color: 'white' }}>No tenés figuritas marcadas</p>
            <p>Marcá tus faltantes y repetidas para encontrar intercambios.</p>
            <button className="empty-cta" onClick={() => navigate('/album')}>
              Ir al Álbum
            </button>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p style={{ fontWeight: 700, color: 'white' }}>
              {tab === 'mutual'
                ? 'No tenés intercambios mutuos todavía.'
                : tab === 'near'
                ? 'No se encontraron intercambios cercanos.'
                : 'No se encontraron intercambios para este álbum.'}
            </p>
            <p>Intentá marcar más figuritas o actualizar los resultados.</p>
          </div>
        ) : (
          filteredMatches.map((match, idx) => (
            <MatchCard
              key={match.userId || match.profile?.id}
              match={match}
              isTopMatch={tab === 'all' && idx === 0 && match.isTopMatch}
            />
          ))
        )}
      </div>
    </div>
  )
}
