import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import MatchCard from '../components/MatchCard'
import { useFavoritesStore } from '../stores/favoritesStore'
import { usePremiumAccess } from '../hooks/usePremiumAccess'
import LocationSelector from '../components/LocationSelector'
import { LiveBadge, LiveFeed } from '../components/LiveMomentum'
import { useLiveMomentum } from '../hooks/useLiveMomentum'

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
  const { matches, matchesLoading, findMatches, selectedAlbum, missingStickers, duplicateStickers, createOrGetChat } = useAppStore()
  const { favoriteIds } = useFavoritesStore()
  const [tab, setTab] = useState('all')
  const { summary, feed, nearMatchesCount, mutualMatchesCount } = useLiveMomentum({
    matches,
    missingCount: missingStickers.length,
    duplicateCount: duplicateStickers.length,
  })

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

  // â”€â”€ Tab Filtering + Sorting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // handled by LocationSelector now
  }

  const handleOpenChat = async (otherUserId) => {
    if (!profile?.id || !selectedAlbum?.id || !otherUserId) return
    try {
      const chat = await createOrGetChat(profile.id, otherUserId, selectedAlbum.id)
      if (chat?.id) navigate(`/chat/${chat.id}`)
    } catch (error) {
      console.error('Error opening chat:', error)
    }
  }

  const topMatch = tab === 'all' && filteredMatches.length > 0 ? filteredMatches[0] : null;

  return (
    <div className="page matches-page">
      

      <header className="topbar">
        <div>
          <div className="top-kicker">Ãlbum activo Â· {selectedAlbum?.name || 'Ãlbum'}</div>
          <div className="top-title">Intercambios</div>
          <div className="top-live">
            <LiveBadge tone="orange" pulse>{summary.activeNow} activos ahora</LiveBadge>
            <LiveBadge tone="blue">{nearMatchesCount} cerca hoy</LiveBadge>
            <LiveBadge tone="green">{mutualMatchesCount} listos para cerrar</LiveBadge>
          </div>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={() => navigate('/album')}>Ir al álbum</button>
          <button className="btn orange" onClick={handleRefresh} disabled={matchesLoading}>
            {matchesLoading ? 'â³' : 'Actualizar'}
          </button>
        </div>
      </header>

      <main className="wrap">
        <section className={`hero ${topMatch ? 'has-top-match' : ''}`}>
          <div className="hero-main">
            <div>
              <div className="kicker">// motor de intercambios</div>
              <h1 className="hero-title">Encontrá el cruce que <span>más te sirve</span> ahora.</h1>
              <p className="hero-sub">Ordenamos tus matches por compatibilidad, cercanía, reciprocidad y actividad para que cierres intercambios reales más rápido.</p>
            </div>
            <div className="hero-stats">
              <div className="hero-stat orange"><b>{matches.length}</b><span>Oportunidades activas</span></div>
              <div className="hero-stat green"><b>{matches.filter(m => m.isMutual).length}</b><span>Cierran más rápido</span></div>
              <div className="hero-stat blue"><b>{matches.filter(m => m.distance !== null).length}</b><span>Con cercanÃƒÂ­a hoy</span></div>
              <div className="hero-stat yellow">
                <b>{matches.length > 0 && matches[0]._scoreBreakdown?.compatibility ? Math.round(matches[0]._scoreBreakdown.compatibility) : '-'}</b>
                <span>Fuerza del mejor cruce</span>
              </div>
            </div>
          </div>

          {topMatch && (
            <aside className="top-match">
              <div>
                <div className="top-match-head">
                  <span className="rank-badge">Mejor match</span>
                  <div>
                    <div className="score">{topMatch.score || 0}</div>
                    <div className="score-label">score</div>
                  </div>
                </div>
                <div className="top-user">
                  <div className="avatar">
                    {topMatch.profile?.avatar_url ? (
                      <img src={topMatch.profile.avatar_url} alt="" />
                    ) : (
                      (topMatch.profile?.name || topMatch.name || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2>{topMatch.profile?.name || topMatch.name || 'Usuario'}</h2>
                    <p>
                      {topMatch.profile?.city || topMatch.profile?.department || 'Uruguay'}
                      {topMatch.distance != null ? ` Â· ${topMatch.distance < 1 ? Math.round(topMatch.distance * 1000) + 'm' : topMatch.distance.toFixed(1) + ' km'}` : ''}
                    </p>
                  </div>
                </div>
                <div className="score-bars">
                  <div className="score-row">
                    <span>Compat.</span>
                    <div className="mini-bar">
                      <div style={{ width: `${topMatch._scoreBreakdown?.compatibility || 0}%` }}></div>
                    </div>
                    <b>{Math.round(topMatch._scoreBreakdown?.compatibility || 0)}</b>
                  </div>
                  <div className="score-row">
                    <span>Cercanía</span>
                    <div className="mini-bar">
                      <div style={{ width: `${topMatch._scoreBreakdown?.distance || 0}%` }}></div>
                    </div>
                    <b>{Math.round(topMatch._scoreBreakdown?.distance || 0)}</b>
                  </div>
                  <div className="score-row">
                    <span>Mutuo</span>
                    <div className="mini-bar">
                      <div style={{ width: `${topMatch.isMutual ? 100 : 0}%` }}></div>
                    </div>
                    <b>{topMatch.isMutual ? 100 : 0}</b>
                  </div>
                </div>
              </div>
              <div className="top-actions-grid">
                <button className="btn orange" onClick={() => handleOpenChat(topMatch.userId || topMatch.profile?.id)}>Abrir chat</button>
                <button className="btn" disabled style={{ opacity: 0.5 }}>Ver perfil</button>
              </div>
            </aside>
          )}
        </section>

        <section className="controls">
          <div className="controls-top">
            <div className="search-box">
              <label>Buscar match</label>
              <div className="search-line">
                <input placeholder="Buscar usuario, figurita o zona..." />
                <button className="btn orange" disabled>Buscar</button>
              </div>
            </div>
            <div className="refresh-box">
              <button className="btn orange" onClick={handleRefresh} disabled={matchesLoading}>ðŸ”„ Actualizar</button>
            </div>
          </div>
          <div className="tabs">
            {TABS.map(t => (
              <button 
                key={t.id} 
                className={`tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label} 
                {t.id === 'all' && matches.length > 0 && <span className="count">{matches.length}</span>}
                {t.id === 'mutual' && <span className="count">{matches.filter(m => m.isMutual).length}</span>}
              </button>
            ))}
          </div>
        </section>

        {tab === 'near' && (
          <div style={{ marginBottom: '22px', minHeight: !hasLocation ? '300px' : 'auto' }}>
            {!hasLocation ? (
              <LocationSelector onLocationSaved={() => handleRefresh()} />
            ) : (
              <div className="side-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel2)' }}>
                <div>
                  <div className="kicker">Ubicación activa</div>
                  <p style={{ margin: 0, fontSize: '.9rem' }}>Viendo cruces cerca de <b>{profile?.city || profile?.department || 'tu zona'}</b></p>
                </div>
                <button className="btn btn-sm location-selector-btn" onClick={() => navigate('/profile')}>Cambiar</button>
              </div>
            )}
          </div>
        )}

        <section className="premium-notice">
          <p>
            {planRules?.match_depth === 'advanced' && 'ðŸš€ Cruces avanzados con mejores oportunidades primero.'}
            {planRules?.match_depth === 'optimized' && 'âœ¨ Cruces optimizados por cercanía, actividad y reciprocidad.'}
            {(!planRules?.match_depth || planRules?.match_depth === 'basic') && 'ðŸ‘€ Estás viendo cruces básicos. Plus desbloquea más profundidad de búsqueda y mejores alertas.'}
          </p>
          {(!planRules?.match_depth || planRules?.match_depth === 'basic') && (
            <button className="btn" onClick={() => navigate('/premium')}>Mejorar a Plus</button>
          )}
        </section>

        <section className="layout">
          <div>
            <div className="section-title">
              <div>
                <div className="kicker">Ranking</div>
                <h2>Mejores oportunidades</h2>
                <p>Priorizá los matches con más valor real para tu álbum.</p>
              </div>
              <span className="count-pill">{filteredMatches.length} resultados</span>
            </div>
            <div className="main-stack">
              {matchesLoading ? (
                <div className="empty">
                  <div className="empty-icon">â³</div>
                  <h3>Buscando...</h3>
                  <p>Encontrando las mejores oportunidades para tu álbum.</p>
                </div>
              ) : !selectedAlbum ? (
                <div className="empty">
                  <div className="empty-icon">ðŸ“–</div>
                  <h3>Seleccioná un álbum</h3>
                  <p>Necesitas un álbum activo para buscar intercambios.</p>
                  <button className="btn orange" onClick={() => navigate('/album')}>Ir al Ãlbum</button>
                </div>
              ) : missingStickers.length === 0 && duplicateStickers.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">ðŸ·ï¸</div>
                  <h3>No tenés figuritas marcadas</h3>
                  <p>Marcá tus faltantes y repetidas para encontrar intercambios.</p>
                  <button className="btn orange" onClick={() => navigate('/album')}>Ir al Ãlbum</button>
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">ðŸ”</div>
                  <h3>No hay resultados</h3>
                  <p>
                    {tab === 'mutual'
                      ? 'No tenés intercambios mutuos todavía.'
                      : tab === 'near'
                      ? 'No se encontraron intercambios cercanos.'
                      : 'No se encontraron intercambios para este álbum.'}
                  </p>
                </div>
              ) : (
                filteredMatches.map((match, idx) => (
                  <MatchCard
                    key={match.userId || match.profile?.id}
                    match={match}
                    idx={idx}
                    isTopMatch={tab === 'all' && idx === 0 && match.isTopMatch}
                  />
                ))
              )}
            </div>
          </div>
          
          <aside className="side-stack">
            <section className="side-card side-cta">
              <h3>Tu mejor jugada</h3>
              <p>Empezá por los matches mutuos: son los que tienen más chances de cerrar rápido.</p>
              <button className="btn" onClick={() => setTab('mutual')}>Ver mutuos</button>
            </section>
            <LiveFeed title="Ahora en FigusUY" items={feed} refreshedAt={summary.refreshedAt} />
            <section className="side-card">
              <h3>Score</h3>
              <div className="side-row"><span>Compatibilidad</span><b>figuritas</b></div>
              <div className="side-row"><span>Cercanía</span><b>zona</b></div>
              <div className="side-row"><span>Reciprocidad</span><b>mutuo</b></div>
              <div className="side-row"><span>Actividad</span><b>respuesta</b></div>
            </section>
            {!hasLocation && (
              <section className="side-card location-warning">
                <h3>Ubicación</h3>
                <p>Activá tu zona para ordenar mejor los matches cercanos. Nunca mostramos tu ubicación exacta.</p>
                <button className="btn location-selector-btn" style={{marginTop: '14px', width: '100%'}} onClick={() => setTab('near')}>Configurar ubicación</button>
              </section>
            )}
            <section className="side-card">
              <h3>Consejo</h3>
              <p>Un match con menos figuritas pero más cerca puede ser mejor que uno grande y difícil de coordinar.</p>
            </section>
          </aside>
        </section>

      </main>
    </div>
  )
}
