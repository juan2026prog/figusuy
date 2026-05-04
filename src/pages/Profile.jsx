import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { useFavoritesStore } from '../stores/favoritesStore'
import AlphaWelcomeModal from '../components/AlphaWelcomeModal'
import { usePremiumAccess } from '../hooks/usePremiumAccess'
import { canAccessBusinessDashboard } from '../helpers/businessAccess'
import LocationSelector from '../components/LocationSelector'
import ProfileGamification from '../components/ProfileGamification'
import ReputationStars from '../components/ReputationStars'
import { LEVELS } from '../lib/gamification'
import { getStarLevel } from '../lib/reputation'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, user, signOut, updateProfile } = useAuthStore()
  const { userAlbums, missingStickers, duplicateStickers, matches } = useAppStore()
  const { favorites, fetchFavorites } = useFavoritesStore()
  const { isPremium, planName } = usePremiumAccess()
  const { progress, reputation, initialize: initGamification } = useGamificationStore()
  const toast = useToast()

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [locationName, setLocationName] = useState(profile?.city || '')
  const [displayName, setDisplayName] = useState(profile?.name || '')
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAlphaModal, setShowAlphaModal] = useState(false)
  const initial = profile?.name?.[0]?.toUpperCase() || '?'
  const name = profile?.name || 'Usuario'

  useEffect(() => {
    // Only set initial values once or if they are empty
    if (profile) {
      if (!displayName) setDisplayName(profile.name || '');
      if (!locationName) setLocationName(profile.city || '');
      
      // Check if user has admin role
      supabase.from('user_roles').select('role').eq('user_id', profile.id).maybeSingle()
        .then(({ data }) => {
          if (data?.role && data.role !== 'user') setIsAdmin(true)
        })
      fetchFavorites(profile.id)
      useAppStore.getState().fetchUserAlbums(profile.id)
      initGamification(profile.id)
    }
  }, [profile?.id]) // Depend on ID to re-run only when user changes

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      await updateProfile({ city: locationName, name: displayName })
      toast.success('Perfil actualizado correctamente')
    } catch (err) { toast.error('Error al guardar: ' + err.message) }
    setSaving(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    
    try {
      const uploadPromise = useAuthStore.getState().uploadProfileAvatar(file)
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('La subida tardó demasiado tiempo (timeout)')), 15000))
      
      await Promise.race([uploadPromise, timeoutPromise])
      toast.success('Foto de perfil actualizada')
    } catch (err) {
      toast.error('Error al subir: ' + err.message)
    } finally {
      setUploadingAvatar(false)
      e.target.value = null
    }
  }

  const handleSignOut = async () => { setShowSignOutConfirm(false); await signOut(); navigate('/login') }

  const mainAlbumData = userAlbums[0]
  const mainAlbum = mainAlbumData?.album
  const missingCount = mainAlbumData?.missingCount || 0
  const duplicateCount = mainAlbumData?.duplicateCount || 0
  const ownedCount = mainAlbumData?.ownedCount || 0
  const progressPercent = mainAlbum?.total_stickers && mainAlbum.total_stickers > 0 
    ? Math.round((ownedCount / mainAlbum.total_stickers) * 100) 
    : 0

  return (
    <div className="profile-final-root">
      <style>{`
        .profile-final-root {
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
          --red: #ef4444;
          --gold: #facc15;
          
          font-family: 'Barlow', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        .profile-final-root * { box-sizing: border-box; }
        .profile-final-root button, .profile-final-root input { font-family: inherit; }

        .profile-final-root .topbar {
          min-height: 82px; display: flex; align-items: center; justify-content: space-between;
          gap: 18px; padding: 14px 22px; border-bottom: 1px solid var(--line);
          background: #0b0b0b; position: sticky; top: 0; z-index: 20;
        }
        .profile-final-root .top-kicker { font: 900 .72rem 'Barlow Condensed'; letter-spacing: .16em; text-transform: uppercase; color: var(--orange); }
        .profile-final-root .top-title { font: italic 900 2.45rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin-top: 3px; }
        .profile-final-root .top-actions { display: flex; gap: 10px; align-items: center; }
        .profile-final-root .btn { border: 1px solid var(--line2); background: transparent; color: #fff; padding: .85rem 1.15rem; font: 900 .88rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
        .profile-final-root .btn:hover { border-color: var(--orange); color: var(--orange); }
        .profile-final-root .btn.orange { background: var(--orange); border-color: var(--orange); color: #fff; }
        .profile-final-root .btn.orange:hover { background: var(--orange2); border-color: var(--orange2); }
        .profile-final-root .btn.block { width: 100%; }

        .profile-final-root .wrap { max-width: 1480px; margin: 0 auto; padding: 28px 22px 72px; }

        .profile-final-root .profile-grid { display: grid; grid-template-columns: 380px 1fr; gap: 22px; align-items: start; }

        .profile-final-root .card { background: var(--panel); border: 1px solid var(--line); position: relative; overflow: hidden; }
        .profile-final-root .card-head { padding: 22px 24px; border-bottom: 1px solid var(--line); background: var(--panel2); }
        .profile-final-root .kicker { font: 900 .7rem 'Barlow Condensed'; letter-spacing: .16em; text-transform: uppercase; color: var(--orange); }
        .profile-final-root h2 { font: italic 900 2.35rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin-top: 5px; margin-bottom: 0; }
        .profile-final-root .muted { color: var(--muted); font-size: .95rem; line-height: 1.55; }

        .profile-final-root .identity-card { padding: 24px; }
        .profile-final-root .avatar-box { width: 108px; height: 108px; background: var(--orange); display: grid; place-items: center; font: 900 3rem 'Barlow Condensed'; margin-bottom: 22px; position: relative; overflow: hidden; }
        .profile-final-root .avatar-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .profile-final-root .avatar-edit { position: absolute; right: 0; bottom: 0; background: #0b0b0b; color: #fff; border: 1px solid var(--line2); width: 34px; height: 34px; display: grid; place-items: center; font-size: 15px; cursor: pointer; }
        .profile-final-root .avatar-edit input { display: none; }
        .profile-final-root .profile-name { font: italic 900 2.6rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin-bottom: 8px; }
        .profile-final-root .profile-meta { color: var(--muted); font-size: 1rem; margin-bottom: 16px; }
        .profile-final-root .badges { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 22px; }
        .profile-final-root .badge { border: 1px solid var(--line2); padding: 6px 9px; font: 900 .72rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: #fff; background: #0d0d0d; }
        .profile-final-root .badge.green { border-color: rgba(34,197,94,.35); color: var(--green); background: rgba(34,197,94,.07); }
        .profile-final-root .badge.orange { border-color: rgba(255,90,0,.4); color: var(--orange); background: rgba(255,90,0,.09); }

        .profile-final-root .main-stack { display: grid; gap: 22px; }
        .profile-final-root .progress-card { display: grid; grid-template-columns: 1fr 260px; gap: 0; }
        .profile-final-root .progress-main { padding: 28px; border-right: 1px solid var(--line); }
        .profile-final-root .progress-row { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 24px; }
        .profile-final-root .level-title { font: italic 900 3.2rem 'Barlow Condensed'; line-height: .88; text-transform: uppercase; margin: 0; }
        .profile-final-root .level-desc { color: var(--muted); margin-top: 8px; font-size: 1rem; }
        .profile-final-root .big-percent { font: italic 900 2.8rem 'Barlow Condensed'; color: var(--orange); line-height: 1; }
        .profile-final-root .bar { height: 22px; background: #090909; border: 1px solid var(--line2); position: relative; overflow: hidden; }
        .profile-final-root .bar-fill { height: 100%; background: var(--orange); width: 0%; transition: width 0.3s ease; }
        .profile-final-root .bar:before, .profile-final-root .bar:after { content: ""; position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,.42); }
        .profile-final-root .bar:before { left: 50%; } .profile-final-root .bar:after { left: 75%; }
        .profile-final-root .profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); margin-top: 26px; }
        .profile-final-root .pstat { background: var(--panel); padding: 22px; }
        .profile-final-root .pstat b { display: block; font: italic 900 2.7rem 'Barlow Condensed'; line-height: .9; }
        .profile-final-root .pstat span { font: 900 .78rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: var(--muted2); }
        .profile-final-root .pstat.green b { color: var(--green); }
        .profile-final-root .plan-block { background: var(--orange); display: flex; flex-direction: column; justify-content: center; padding: 28px; color: #fff; }
        .profile-final-root .plan-block b { font: italic 900 3.25rem 'Barlow Condensed'; line-height: .85; text-transform: uppercase; margin: 0; }
        .profile-final-root .plan-block span { font: 900 .85rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.62); margin-top: 8px; }

        .profile-final-root .album-section .card-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
        .profile-final-root .album-row { display: grid; grid-template-columns: 150px 1fr auto; gap: 24px; align-items: center; padding: 28px 28px; background: #0f0f0f; border-bottom: 1px solid var(--line); }
        .profile-final-root .album-cover { aspect-ratio: 3/4; background: linear-gradient(135deg, #222, #111); border: 1px solid var(--line2); display: grid; place-items: center; text-align: center; min-height: 190px; overflow: hidden; }
        .profile-final-root .album-cover img { width: 100%; height: 100%; object-fit: cover; }
        .profile-final-root .album-cover b { font: italic 900 2.7rem 'Barlow Condensed'; color: var(--orange); }
        .profile-final-root .album-cover span { font: 900 .56rem 'Barlow Condensed'; letter-spacing: .12em; text-transform: uppercase; color: var(--muted2); display: block; }
        .profile-final-root .album-title { font: 900 2.35rem 'Barlow Condensed'; line-height: .95; text-transform: uppercase; }
        .profile-final-root .album-sub { color: var(--muted); font-size: 1rem; margin-top: 5px; }
        .profile-final-root .album-progress-meta { display: flex; justify-content: space-between; font: 900 .78rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; color: var(--muted2); margin: 20px 0 8px; }
        .profile-final-root .album-progress-meta b { color: var(--orange); }
        .profile-final-root .album-actions { display: grid; gap: 9px; min-width: 170px; }

        .profile-final-root .content-grid { display: grid; grid-template-columns: 1fr 330px; gap: 22px; margin-top: 22px; }
        .profile-final-root .side-stack { display: grid; gap: 22px; }
        .profile-final-root .side-card { padding: 22px; background: var(--panel); border: 1px solid var(--line); }
        .profile-final-root .side-title { font: italic 900 1.75rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin-bottom: 12px; margin-top: 0; }
        .profile-final-root .premium-card { background: var(--orange); border-color: var(--orange2); color: #fff; }
        .profile-final-root .premium-card .muted { color: rgba(255,255,255,.78); }
        .profile-final-root .premium-card .btn { background: #fff; color: var(--orange); border-color: #fff; margin-top: 18px; }
        .profile-final-root .premium-card .btn:hover { background: #0b0b0b; color: #fff; border-color: #0b0b0b; }
        .profile-final-root .trust-row, .profile-final-root .settings-row, .profile-final-root .quick-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); gap: 12px; }
        .profile-final-root .trust-row:last-child, .profile-final-root .quick-row:last-child { border-bottom: 0; }
        .profile-final-root .trust-row span, .profile-final-root .settings-row span, .profile-final-root .quick-row span, .profile-final-root .quick-row button { color: var(--muted); font-size: .9rem; }
        .profile-final-root .trust-row b, .profile-final-root .quick-row b { font: 900 1rem 'Barlow Condensed'; letter-spacing: .04em; }
        .profile-final-root .business-box { border: 1px solid rgba(255,90,0,.25); background: rgba(255,90,0,.07); padding: 15px; margin-top: 12px; }
        .profile-final-root .input { width: 100%; height: 42px; border: 1px solid var(--line2); background: #0b0b0b; color: #fff; padding: 0 12px; font-weight: 700; outline: none; margin-top: 8px; }
        .profile-final-root .input:focus { border-color: var(--orange); }
        .profile-final-root .switch { width: 48px; height: 24px; background: var(--orange); position: relative; cursor: pointer; border-radius: 12px; }
        .profile-final-root .switch.off { background: var(--line2); }
        .profile-final-root .switch:after { content: ""; position: absolute; right: 4px; top: 4px; width: 16px; height: 16px; background: #fff; transition: 0.2s; border-radius: 50%; }
        .profile-final-root .switch.off:after { right: 28px; }
        .profile-final-root .danger { color: #f87171!important; } .profile-final-root .admin { color: var(--orange)!important; } .profile-final-root .business { color: var(--green)!important; }
        
        .profile-final-root .quick-row button {
          background: none; border: none; font: inherit; cursor: pointer; padding: 0; text-align: left; width: 100%; display: block; font-weight: 700;
        }

        .profile-final-root .favorites-gamification { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 22px; }
        .profile-final-root .mini-card { padding: 22px; background: var(--panel); border: 1px solid var(--line); }
        .profile-final-root .mini-card h3 { font: italic 900 1.75rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin-bottom: 0; margin-top: 0; }
        .profile-final-root .mini-card p { color: var(--muted); margin-top: 8px; font-size: .92rem; }
        .profile-final-root .avatar-loading-overlay { position: absolute; inset: 0; background: rgba(11,11,11,0.7); display: grid; place-items: center; z-index: 10; }
        .profile-final-root .material-symbols-outlined.animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        @media(max-width: 1100px) {
          .profile-final-root .profile-grid, .profile-final-root .content-grid { grid-template-columns: 1fr; }
          .profile-final-root .progress-card { grid-template-columns: 1fr; }
          .profile-final-root .plan-block { min-height: 150px; }
          .profile-final-root .progress-main { border-right: 0; border-bottom: 1px solid var(--line); }
          .profile-final-root .album-row { grid-template-columns: 110px 1fr; }
          .profile-final-root .album-actions { grid-column: 1/-1; grid-template-columns: 1fr 1fr; }
          .profile-final-root .top-actions { display: none; }
        }
        @media(max-width: 700px) {
          .profile-final-root .wrap { padding: 16px 12px 64px; }
          .profile-final-root .topbar { align-items: flex-start; }
          .profile-final-root .top-title { font-size: 2rem; }
          .profile-final-root .profile-grid { gap: 14px; }
          .profile-final-root .profile-stats { grid-template-columns: 1fr; }
          .profile-final-root .album-row { grid-template-columns: 1fr; }
          .profile-final-root .album-cover { width: 130px; min-height: auto; }
          .profile-final-root .favorites-gamification { grid-template-columns: 1fr; }
          .profile-final-root .progress-row { display: block; }
          .profile-final-root .big-percent { margin-top: 14px; }
          .profile-final-root .album-actions { grid-template-columns: 1fr; }
          .profile-final-root .btn { width: 100%; }
        }
      `}</style>

      <header className="topbar">
        <div>
          <div className="top-kicker">Usuario</div>
          <div className="top-title">Mi perfil</div>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={() => navigate('/album')}>Cambiar álbum</button>
          <button className="btn orange" onClick={() => navigate('/matches')}>Ver cruces</button>
        </div>
      </header>

      <main className="wrap">
        <section className="profile-grid">
          <aside className="identity-card card">
            <div className="avatar-box">
              {uploadingAvatar && (
                <div className="avatar-loading-overlay">
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '2rem' }}>sync</span>
                </div>
              )}
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={name} />
              ) : (
                initial
              )}
              <label className="avatar-edit">
                📷
                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div className="profile-name">{name}</div>
            <div className="profile-meta">{locationName || profile?.department || 'Sin ubicación'} · Activo hoy</div>
            <div className="badges">
              {isPremium && <span className="badge orange">💎 {planName === 'gratis' ? 'Premium' : planName}</span>}
              {profile?.is_verified && <span className="badge green">Confiable</span>}
              {mainAlbum && <span className="badge">{mainAlbum.name}</span>}
            </div>
            <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ReputationStars stars={reputation?.star_rating || 1} size="md" showLabel />
              {progress?.level && (
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: LEVELS[progress.level]?.color || 'var(--muted)',
                  border: `1px solid ${LEVELS[progress.level]?.color || 'var(--line)'}40`,
                  background: `${LEVELS[progress.level]?.color || '#fff'}10`,
                  padding: '4px 8px',
                }}>
                  {LEVELS[progress.level]?.icon} {LEVELS[progress.level]?.name || progress.level}
                </span>
              )}
            </div>
            <button className="btn orange block" onClick={() => document.querySelector('.avatar-edit input').click()}>Cambiar foto</button>
          </aside>

          <section className="progress-card card">
            <div className="progress-main">
              <div className="progress-row">
                <div>
                  <div className="kicker">Progreso</div>
                  <h3 className="level-title">Coleccionista</h3>
                  <div className="level-desc">Seguí intercambiando para subir de nivel.</div>
                </div>
                <div className="big-percent">{progressPercent}%</div>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${progressPercent}%` }}></div></div>
              <div className="profile-stats">
                <div className="pstat"><b>{missingCount}</b><span>Faltantes</span></div>
                <div className="pstat green"><b>{duplicateCount}</b><span>Repetidas</span></div>
                <div className="pstat"><b>{matches?.length || 0}</b><span>Cruces</span></div>
              </div>
            </div>
            <div className="plan-block">
              <b>{isPremium ? (planName === 'gratis' ? 'Premium' : planName) : 'Gratis'}</b>
              <span>Plan activo</span>
            </div>
          </section>
        </section>

        <section className="content-grid">
          <div>
            <section className="album-section card">
              <div className="card-head">
                <div>
                  <div className="kicker">Colecciones activas</div>
                  <h2>Mis álbumes</h2>
                  <p className="muted" style={{ marginBottom: 0 }}>Tus álbumes, progreso y próximos cruces.</p>
                </div>
              </div>

              {userAlbums.map((ua, i) => {
                const coverImg = ua.album.cover_url || (ua.album.images?.[0]);
                const progress = ua.album.total_stickers && ua.album.total_stickers > 0 
                  ? Math.round((ua.ownedCount / ua.album.total_stickers) * 100) 
                  : 0;

                return (
                  <article key={ua.album_id} className="album-row">
                    <div className="album-cover">
                      {coverImg ? (
                        <img src={coverImg} alt={ua.album.name} />
                      ) : (
                        <div><b>+</b><span>{ua.album.name.substring(0, 4)}</span></div>
                      )}
                    </div>
                    <div>
                      <div className="album-title">{ua.album.name}</div>
                      <div className="album-sub">{ua.album.description || 'Sticker Collection'}</div>
                      <div className="album-progress-meta">
                        <span>{ua.ownedCount} / {ua.album.total_stickers || '?'} figuritas</span>
                        <b>{progress}%</b>
                      </div>
                      <div className="bar"><div className="bar-fill" style={{ width: `${progress}%` }}></div></div>
                    </div>
                    <div className="album-actions">
                      <button className="btn orange" onClick={() => navigate(`/album/${ua.album_id}`)}>Abrir álbum</button>
                    </div>
                  </article>
                )
              })}

              {userAlbums.length < 3 && (
                <article className="album-row">
                  <div className="album-cover">
                    <div><b>+</b><span>Nuevo</span></div>
                  </div>
                  <div>
                    <div className="album-title">Agregar álbum</div>
                    <div className="album-sub">Sumá otra colección para seguir intercambiando.</div>
                  </div>
                  <div className="album-actions">
                    <button className="btn" onClick={() => navigate('/album')}>Agregar</button>
                  </div>
                </article>
              )}
            </section>

            <div className="favorites-gamification">
              <div className="mini-card">
                <h3>Favoritos</h3>
                <p>Favoritos guardados: {favorites.length}</p>
                {favorites.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--orange)', marginTop: '4px' }}>Guardá los perfiles que te sirvan.</p>}
                <button className="btn" style={{ marginTop: '16px' }} onClick={() => navigate('/favorites')}>Ver favoritos</button>
              </div>
              <div className="mini-card" style={{ padding: '22px' }}>
                <ProfileGamification />
              </div>
            </div>
          </div>

          <aside className="side-stack">
            <section className="side-card premium-card">
              <div className="side-title">{isPremium ? (planName === 'gratis' ? 'Premium' : planName) : 'Plan Gratuito'}</div>
              <p className="muted">
                {isPremium ? `Disfrutás de todos los beneficios de ${planName === 'gratis' ? 'Premium' : planName}.` : 'Subí a Premium para ver intercambios ilimitados y chatear sin restricciones.'}
              </p>
              <button className="btn block" onClick={() => navigate('/premium')}>
                {isPremium ? 'Gestionar suscripción' : 'Mejorar a Pro'}
              </button>
            </section>

            <section className="side-card">
              <div className="side-title">Reputación</div>
              <div style={{ marginBottom: '14px' }}>
                <ReputationStars stars={reputation?.star_rating || 1} size="lg" showLabel />
              </div>
              <div className="trust-row"><span>Intercambios</span><b>{profile?.total_trades || 0} exitosos</b></div>
              <div className="trust-row"><span>Miembro desde</span><b>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' }) : '—'}</b></div>
              <div className="trust-row"><span>Nivel de confianza</span><b style={{ color: getStarLevel(reputation?.star_rating || 1).color }}>{getStarLevel(reputation?.star_rating || 1).label}</b></div>
            </section>

            <section className="side-card">
              <div className="side-title">Negocios</div>
              {profile?.business_status === 'approved' ? (
                <>
                  <p className="muted" style={{ marginBottom: '12px' }}>Gestioná tu local y revisá tus estadísticas.</p>
                  <div className="business-box">
                    <button className="btn orange block" onClick={() => navigate('/business')}>Mi local</button>
                  </div>
                </>
              ) : profile?.business_status === 'pending' ? (
                <>
                  <p className="muted" style={{ marginBottom: '12px' }}>Tu solicitud está en revisión. Te avisaremos cuando esté aprobada.</p>
                  <div className="business-box">
                    <button className="btn block" onClick={() => navigate('/business/pending')}>Ver estado</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="muted" style={{ marginBottom: '12px' }}>¿Tenés un local, kiosco o espacio y querés aparecer en FigusUY?</p>
                  <div className="business-box">
                    <button className="btn orange block" onClick={() => navigate('/business/apply')}>Registrar mi local</button>
                  </div>
                </>
              )}
            </section>

            <section className="side-card">
              <div className="side-title">Configuración</div>
              <label className="kicker" style={{ display: 'block', marginTop: '12px' }}>Nombre</label>
              <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ej: Juan Pérez" />
              
              <div className="settings-row">
                <span>Notificaciones</span>
                <div className={`switch ${notifEnabled ? '' : 'off'}`} onClick={() => setNotifEnabled(!notifEnabled)}></div>
              </div>

              <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                <LocationSelector onLocationSaved={() => toast.success('Ubicación guardada.')} />
              </div>

              <button className="btn orange block" style={{ marginTop: '14px' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </section>

            <section className="side-card">
              {isAdmin && (
                <div className="quick-row">
                  <button className="admin" onClick={() => navigate('/admin')}>🔐 Panel de Administración</button>
                </div>
              )}
              {canAccessBusinessDashboard(profile) && (
                <div className="quick-row">
                  <button className="business" onClick={() => navigate('/business')}>🏪 FigusUY Negocios</button>
                </div>
              )}
              <div className="quick-row">
                <button onClick={() => setShowAlphaModal(true)}>🧪 Ver aviso Alpha</button>
              </div>
              <div className="quick-row">
                <button className="danger" onClick={() => setShowSignOutConfirm(true)}>↩ Cerrar sesión</button>
              </div>
            </section>
          </aside>
        </section>
      </main>

      <ConfirmDialog 
        isOpen={showSignOutConfirm} 
        title="Cerrar sesión" 
        message="¿Seguro que querés salir? No te pierdas los nuevos intercambios." 
        confirmText="Salir" 
        cancelText="Cancelar" 
        onConfirm={handleSignOut} 
        onCancel={() => setShowSignOutConfirm(false)} 
        variant="danger" 
      />

      {showAlphaModal && (
        <AlphaWelcomeModal
          forceOpen={true}
          onClose={() => setShowAlphaModal(false)}
        />
      )}
    </div>
  )
}
