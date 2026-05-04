import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import MatchCard from '../components/MatchCard'
import { useFavoritesStore } from '../stores/favoritesStore'
import { usePremiumAccess } from '../hooks/usePremiumAccess'
import LocationSelector from '../components/LocationSelector'

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
      <style>{`
        .matches-page {
          --bg: #0b0b0b;
          --panel: #121212;
          --panel2: #181818;
          --panel3: #202020;
          --line: rgba(255,255,255,.08);
          --line2: rgba(255,255,255,.14);
          --text: #f5f5f5;
          --muted: rgba(245,245,245,.54);
          --muted2: rgba(245,245,245,.34);
          --orange: #ff5a00;
          --orange2: #cc4800;
          --green: #22c55e;
          --blue: #38bdf8;
          --yellow: #facc15;
          --red: #ef4444;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Barlow', sans-serif;
        }
        .page.matches-page {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
        }
        .matches-page button, .matches-page input { font-family: inherit; }
        
        .topbar { min-height: 82px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 22px; border-bottom: 1px solid var(--line); background: #0b0b0b; position: sticky; top: 0; z-index: 30; }
        .top-kicker { font: 900 .72rem 'Barlow Condensed'; letter-spacing: .16em; text-transform: uppercase; color: var(--orange); }
        .top-title { font: italic 900 2.45rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin-top: 3px; }
        .top-actions { display: flex; gap: 10px; align-items: center; }
        .btn { border: 1px solid var(--line2); background: transparent; color: #fff; padding: .85rem 1.15rem; font: 900 .88rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .btn:hover:not(:disabled) { border-color: var(--orange); color: var(--orange); }
        .btn.orange { background: var(--orange); border-color: var(--orange); color: #fff; }
        .btn.orange:hover:not(:disabled) { background: var(--orange2); border-color: var(--orange2); }
        .btn.block { width: 100%; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .wrap { max-width: 1320px; margin: 0 auto; padding: 28px 22px 76px; }
        .hero { display: grid; grid-template-columns: 1fr; gap: 22px; margin-bottom: 22px; }
        .hero.has-top-match { grid-template-columns: 1.1fr .9fr; }
        .hero-main { position: relative; overflow: hidden; background: linear-gradient(135deg, #181818 0%, #101010 52%, rgba(255,90,0,.2) 100%); border: 1px solid var(--line); padding: 32px; min-height: 320px; display: flex; flex-direction: column; justify-content: space-between; }
        .hero-main:before { content: 'MATCHES'; position: absolute; right: 20px; top: -20px; font: italic 900 8.8rem 'Barlow Condensed'; color: rgba(255,255,255,.035); line-height: 1; pointer-events: none; }
        .kicker { font: 900 .72rem 'Barlow Condensed'; letter-spacing: .16em; text-transform: uppercase; color: var(--orange); }
        .hero-title { font: italic 900 clamp(2.5rem, 4.5vw, 5rem) 'Barlow Condensed'; line-height: .84; text-transform: uppercase; margin-top: 8px; position: relative; z-index: 1; max-width: 820px; }
        .hero-title span { color: var(--orange); }
        .hero-sub { color: var(--muted); font-size: 1rem; line-height: 1.6; max-width: 640px; margin-top: 14px; position: relative; z-index: 1; }
        .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); margin-top: 28px; position: relative; z-index: 1; }
        .hero-stat { background: rgba(18,18,18,.92); padding: 17px; }
        .hero-stat b { display: block; font: italic 900 2.4rem 'Barlow Condensed'; line-height: .9; }
        .hero-stat span { font: 900 .68rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: var(--muted2); }
        .hero-stat.orange b { color: var(--orange); }
        .hero-stat.green b { color: var(--green); }
        .hero-stat.blue b { color: var(--blue); }
        .hero-stat.yellow b { color: var(--yellow); }

        .top-match { background: var(--panel); border: 1px solid rgba(255,90,0,.32); box-shadow: 0 24px 54px rgba(255,90,0,.1); padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 320px; position: relative; overflow: hidden; }
        .top-match:before { content: 'TOP'; position: absolute; right: 12px; top: -12px; font: italic 900 5.8rem 'Barlow Condensed'; color: rgba(255,90,0,.09); line-height: 1; pointer-events: none; }
        .top-match-head { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; position: relative; z-index: 1; }
        .rank-badge { background: var(--orange); color: #fff; padding: 6px 10px; font: 900 .72rem 'Barlow Condensed'; letter-spacing: .1em; text-transform: uppercase; }
        .score { font: italic 900 4rem 'Barlow Condensed'; line-height: .78; color: var(--orange); text-align: right; }
        .score-label { font: 900 .65rem 'Barlow Condensed'; letter-spacing: .12em; text-transform: uppercase; color: var(--muted2); text-align: right; margin-top: 4px; }
        .top-user { display: flex; gap: 14px; align-items: center; margin: 18px 0; position: relative; z-index: 1; }
        .avatar { width: 68px; height: 68px; background: var(--panel3); display: grid; place-items: center; font: italic 900 2rem 'Barlow Condensed'; overflow: hidden; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .top-user h2 { font: italic 900 2.35rem 'Barlow Condensed'; line-height: .86; text-transform: uppercase; margin: 0; }
        .top-user p { color: var(--muted); font-size: .9rem; margin-top: 5px; }
        .score-bars { display: grid; gap: 8px; margin-top: 14px; position: relative; z-index: 1; }
        .score-row { display: grid; grid-template-columns: 88px 1fr 34px; gap: 8px; align-items: center; }
        .score-row span { font: 900 .68rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: var(--muted2); }
        .mini-bar { height: 8px; background: #090909; border: 1px solid var(--line); overflow: hidden; }
        .mini-bar div { height: 100%; background: var(--orange); }
        .score-row b { font: 900 .8rem 'Barlow Condensed'; text-align: right; }
        .top-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px; position: relative; z-index: 1; }

        .controls { background: var(--panel); border: 1px solid var(--line); margin-bottom: 22px; overflow: hidden; }
        .controls-top { display: grid; grid-template-columns: 1fr auto; gap: 1px; background: var(--line); border-bottom: 1px solid var(--line); }
        .search-box { background: var(--panel2); padding: 14px; }
        .search-box label { display: block; font: 900 .65rem 'Barlow Condensed'; letter-spacing: .14em; text-transform: uppercase; color: var(--orange); margin-bottom: 7px; }
        .search-line { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
        .search-box input { width: 100%; height: 42px; background: #0d0d0d; border: 1px solid var(--line2); color: #fff; padding: 0 12px; font-weight: 700; outline: none; }
        .search-box input:focus { border-color: var(--orange); }
        .refresh-box { background: var(--panel2); padding: 14px; display: flex; align-items: end; }
        .tabs { display: flex; gap: 1px; background: var(--line); overflow: auto; }
        .tab { border: 0; background: var(--panel); color: var(--muted); padding: 13px 18px; font: 900 .82rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; cursor: pointer; transition: all 0.2s; }
        .tab.active { background: var(--orange); color: #fff; }
        .tab:hover:not(.active) { color: #fff; background: var(--panel2); }
        .count { background: rgba(255,255,255,.1); padding: 1px 6px; margin-left: 5px; }

        .premium-notice { display: flex; justify-content: space-between; align-items: center; gap: 16px; background: rgba(250,204,21,.08); border: 1px solid rgba(250,204,21,.24); padding: 15px 18px; margin-bottom: 22px; }
        .premium-notice p { color: #fde68a; font-size: .9rem; font-weight: 800; line-height: 1.4; margin: 0; }
        .premium-notice .btn { background: var(--yellow); border-color: var(--yellow); color: #422006; flex-shrink: 0; }

        .layout { display: grid; grid-template-columns: 1fr 350px; gap: 22px; align-items: start; }
        .main-stack { display: grid; gap: 14px; }
        .side-stack { display: grid; gap: 14px; position: sticky; top: 104px; }
        .section-title { display: flex; justify-content: space-between; align-items: end; gap: 14px; margin-bottom: 10px; }
        .section-title h2 { font: italic 900 2.45rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin: 0; }
        .section-title p { color: var(--muted); font-size: .92rem; margin: 5px 0 0 0; }
        .count-pill { border: 1px solid var(--line2); padding: 7px 10px; font: 900 .75rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }

        .match-card { background: var(--panel); border: 1px solid var(--line); display: grid; grid-template-columns: 88px 1fr 170px; position: relative; overflow: hidden; transition: .18s; }
        .match-card:hover { border-color: rgba(255,90,0,.5); transform: translateY(-2px); }
        .match-card.top { border: 2px solid var(--orange); box-shadow: 0 18px 44px rgba(255,90,0,.12); }
        .match-rank { background: #0d0d0d; border-right: 1px solid var(--line); display: grid; place-items: center; text-align: center; }
        .match-rank b { font: italic 900 2.8rem 'Barlow Condensed'; line-height: .8; color: var(--orange); }
        .match-rank span { display: block; font: 900 .62rem 'Barlow Condensed'; letter-spacing: .1em; text-transform: uppercase; color: var(--muted2); margin-top: 5px; }
        .match-body { padding: 16px 18px; }
        .match-head { display: flex; justify-content: space-between; gap: 12px; }
        .profile-mini { display: flex; gap: 12px; align-items: center; }
        .profile-mini .avatar { width: 50px; height: 50px; font-size: 1.45rem; background: var(--panel3); display: grid; place-items: center; overflow: hidden; }
        .profile-mini .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .match-name { font: italic 900 1.7rem 'Barlow Condensed'; line-height: .88; text-transform: uppercase; }
        .match-meta { color: var(--muted); font-size: .84rem; margin-top: 5px; }
        .match-score-mobile { display: none; }
        .badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 11px; }
        .badge { border: 1px solid var(--line2); background: #0b0b0b; padding: 5px 8px; font: 900 .62rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .badge.orange { color: var(--orange); border-color: rgba(255,90,0,.35); background: rgba(255,90,0,.08); }
        .badge.green { color: var(--green); border-color: rgba(34,197,94,.35); background: rgba(34,197,94,.07); }
        .badge.blue { color: var(--blue); border-color: rgba(56,189,248,.35); background: rgba(56,189,248,.08); }
        
        .sticker-exchange { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
        .sticker-box { background: #0d0d0d; border: 1px solid var(--line); padding: 10px; }
        .sticker-box h4 { font: 900 .68rem 'Barlow Condensed'; letter-spacing: .11em; text-transform: uppercase; margin: 0 0 8px 0; }
        .sticker-box.give h4 { color: var(--green); }
        .sticker-box.take h4 { color: var(--orange); }
        .chips { display: flex; gap: 5px; flex-wrap: wrap; }
        .chip { border: 1px solid var(--line2); background: #090909; padding: 5px 7px; font: 900 .72rem 'Barlow Condensed'; }
        .chip.green { color: var(--green); border-color: rgba(34,197,94,.35); }
        .chip.orange { color: var(--orange); border-color: rgba(255,90,0,.35); }
        
        .match-action { background: var(--panel2); border-left: 1px solid var(--line); display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 14px; }
        .match-action .score-big { font: italic 900 3.2rem 'Barlow Condensed'; line-height: .8; text-align: center; color: var(--orange); margin: 0; }
        .match-action small { text-align: center; color: var(--muted2); font: 900 .62rem 'Barlow Condensed'; letter-spacing: .1em; text-transform: uppercase; }
        .match-action .btn { width: 100%; padding: .72rem .8rem; }

        .side-card { background: var(--panel); border: 1px solid var(--line); padding: 18px; }
        .side-card h3 { font: italic 900 1.9rem 'Barlow Condensed'; line-height: .9; text-transform: uppercase; margin: 0 0 10px 0; }
        .side-card p { color: var(--muted); font-size: .9rem; line-height: 1.5; margin: 0; }
        .side-cta { background: var(--orange); border-color: var(--orange2); color: #fff; }
        .side-cta p { color: rgba(255,255,255,.82); }
        .side-cta .btn { background: #0b0b0b; border-color: #0b0b0b; width: 100%; margin-top: 14px; }
        .side-row { display: flex; justify-content: space-between; border-bottom: 1px solid var(--line); padding: 11px 0; align-items: center; }
        .side-row:last-child { border-bottom: 0; }
        .side-row span { color: var(--muted); font-size: .86rem; }
        .side-row b { font: 900 1rem 'Barlow Condensed'; text-transform: uppercase; }
        .location-warning { background: rgba(250,204,21,.08); border: 1px solid rgba(250,204,21,.24); color: #fde68a; }
        .location-warning p { color: #fde68a; }
        
        .empty { background: var(--panel); border: 1px solid var(--line); padding: 52px 24px; text-align: center; }
        .empty-icon { font-size: 3rem; margin-bottom: 14px; }
        .empty h3 { font: italic 900 2.35rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin: 0; }
        .empty p { color: var(--muted); max-width: 420px; margin: 10px auto 20px; line-height: 1.5; }

        @media(max-width: 1180px) {
          .hero, .layout { grid-template-columns: 1fr; }
          .side-stack { position: static; }
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width: 760px) {
          .wrap { padding: 16px 12px 64px; }
          .topbar { align-items: flex-start; }
          .top-actions { display: none; }
          .top-title { font-size: 2rem; }
          .hero-main { padding: 22px; }
          .hero-title { font-size: 3.3rem; }
          .top-match { min-height: auto; }
          .controls-top { grid-template-columns: 1fr; }
          .refresh-box { display: none; }
          .premium-notice { display: block; }
          .premium-notice .btn { width: 100%; margin-top: 12px; }
          .section-title { display: block; }
          .count-pill { display: inline-block; margin-top: 10px; }
          .match-card { grid-template-columns: 1fr; }
          .match-rank { display: none; }
          .match-action { border-left: 0; border-top: 1px solid var(--line); }
          .match-action .score-big, .match-action small { display: none; }
          .match-score-mobile { display: block; font: italic 900 2rem 'Barlow Condensed'; color: var(--orange); }
          .sticker-exchange { grid-template-columns: 1fr; }
          .top-actions-grid { grid-template-columns: 1fr; }
          .hero-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="topbar">
        <div>
          <div className="top-kicker">Álbum activo · {selectedAlbum?.name || 'Álbum'}</div>
          <div className="top-title">Intercambios</div>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={() => navigate('/album')}>Ir al álbum</button>
          <button className="btn orange" onClick={handleRefresh} disabled={matchesLoading}>
            {matchesLoading ? '⏳' : 'Actualizar'}
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
              <div className="hero-stat orange"><b>{matches.length}</b><span>Matches</span></div>
              <div className="hero-stat green"><b>{matches.filter(m => m.isMutual).length}</b><span>Mutuos</span></div>
              <div className="hero-stat blue"><b>{matches.filter(m => m.distance !== null).length}</b><span>Cerca</span></div>
              <div className="hero-stat yellow">
                <b>{matches.length > 0 && matches[0]._scoreBreakdown?.compatibility ? Math.round(matches[0]._scoreBreakdown.compatibility) : '-'}</b>
                <span>Top score</span>
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
                      {topMatch.distance != null ? ` · ${topMatch.distance < 1 ? Math.round(topMatch.distance * 1000) + 'm' : topMatch.distance.toFixed(1) + ' km'}` : ''}
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
              <button className="btn orange" onClick={handleRefresh} disabled={matchesLoading}>🔄 Actualizar</button>
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
            {planRules?.match_depth === 'advanced' && '🚀 Cruces avanzados con mejores oportunidades primero.'}
            {planRules?.match_depth === 'optimized' && '✨ Cruces optimizados por cercanía, actividad y reciprocidad.'}
            {(!planRules?.match_depth || planRules?.match_depth === 'basic') && '👀 Estás viendo cruces básicos. Plus desbloquea más profundidad de búsqueda y mejores alertas.'}
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
                  <div className="empty-icon">⏳</div>
                  <h3>Buscando...</h3>
                  <p>Encontrando las mejores oportunidades para tu álbum.</p>
                </div>
              ) : !selectedAlbum ? (
                <div className="empty">
                  <div className="empty-icon">📖</div>
                  <h3>Seleccioná un álbum</h3>
                  <p>Necesitas un álbum activo para buscar intercambios.</p>
                  <button className="btn orange" onClick={() => navigate('/album')}>Ir al Álbum</button>
                </div>
              ) : missingStickers.length === 0 && duplicateStickers.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🏷️</div>
                  <h3>No tenés figuritas marcadas</h3>
                  <p>Marcá tus faltantes y repetidas para encontrar intercambios.</p>
                  <button className="btn orange" onClick={() => navigate('/album')}>Ir al Álbum</button>
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🔍</div>
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
