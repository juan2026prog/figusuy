"use client"

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const dynamic = "force-dynamic"
import { useAuthStore } from '../stores/authStore'
import { useLogoutStore } from '../stores/logoutStore'
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
import GamificationIcon from '../components/gamification/icons/GamificationIcon'
import AccountDeletionModal from '../components/AccountDeletionModal'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, user, signOut, updateProfile } = useAuthStore()
  const { favorites, fetchFavorites } = useFavoritesStore()
  const { isPremium, planName } = usePremiumAccess()
  const { progress, reputation, badges, initialize: initGamification } = useGamificationStore()
  const toast = useToast()

  const { openConfirm } = useLogoutStore()
  const [locationName, setLocationName] = useState(profile?.city || '')
  const [displayName, setDisplayName] = useState(profile?.name || '')
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAlphaModal, setShowAlphaModal] = useState(false)
  const initial = profile?.name?.[0]?.toUpperCase() || '?'
  const name = profile?.name || 'Usuario'

  const { albums, fetchAlbums, selectAlbum, fetchUserAlbums, userAlbums, missingStickers, duplicateStickers, ownedStickers, matches, selectedAlbum } = useAppStore()
  const [username, setUsername] = useState(profile?.username || '')
  const [profileVisibility, setProfileVisibility] = useState(profile?.profile_visibility || 'public')
  const [showAlbumPicker, setShowAlbumPicker] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [addingAlbum, setAddingAlbum] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [editingAlbumPrivacy, setEditingAlbumPrivacy] = useState(null)
  const [showDeletionModal, setShowDeletionModal] = useState(false)

  useEffect(() => {
    // Only set initial values once or if they are empty
    if (profile) {
      if (!displayName) setDisplayName(profile.name || '');
      if (!locationName) setLocationName(profile.city || '');
      if (!username) setUsername(profile.username || '');
      if (!profileVisibility) setProfileVisibility(profile.profile_visibility || 'public');
      
      // Check if user has admin role — usar profile.role del authStore (ya fue cargado)
      const adminRoles = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']
      if (profile.role && adminRoles.includes(profile.role)) setIsAdmin(true)
      fetchFavorites(profile.id)
      fetchUserAlbums(profile.id)
      fetchAlbums() // Fetch all available albums
      initGamification(profile.id)
    }
  }, [profile?.id]) // Depend on ID to re-run only when user changes

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      await updateProfile({ city: locationName, name: displayName, username, profile_visibility: profileVisibility })
      toast.success('Perfil actualizado correctamente')
    } catch (err) { toast.error('Error al guardar: ' + err.message) }
    setSaving(false)
  }

  const handleAddAlbum = async () => {
    if (!selectedAlbumId) {
      toast.error('Selecciona un álbum primero')
      return
    }
    const albumToAdd = albums.find(a => a.id === selectedAlbumId)
    if (!albumToAdd) return

    setAddingAlbum(true)
    try {
      const { error } = await selectAlbum(albumToAdd, profile.id)
      if (error) throw error
      toast.success('́lbum agregado correctamente')
      setShowAlbumPicker(false)
      setSelectedAlbumId(null)
    } catch (err) {
      toast.error('Error al agregar álbum: ' + err.message)
    } finally {
      setAddingAlbum(false)
    }
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

  const handleSignOut = () => openConfirm()

  const handleSavePrivacy = async () => {
    if (!editingAlbumPrivacy) return
    setSaving(true)
    try {
      const { error } = await supabase.from('user_albums').update({
        visibility: editingAlbumPrivacy.visibility,
        show_progress: editingAlbumPrivacy.show_progress,
        show_missing: editingAlbumPrivacy.show_missing,
        show_repeated: editingAlbumPrivacy.show_repeated
      }).eq('user_id', profile.id).eq('album_id', editingAlbumPrivacy.album_id)
      
      if (error) throw error
      toast.success('Privacidad del álbum guardada')
      setShowPrivacyModal(false)
      fetchUserAlbums(profile.id)
    } catch (err) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Find the selected album in userAlbums, or fallback to the first one
  const mainAlbumData = userAlbums.find(ua => ua.album_id === selectedAlbum?.id) || userAlbums[0]
  const mainAlbum = mainAlbumData?.album
  const isSelected = mainAlbumData?.album_id === selectedAlbum?.id
  
  const missingCount = isSelected ? missingStickers.length : (mainAlbumData?.missingCount || 0)
  const duplicateCount = isSelected ? duplicateStickers.length : (mainAlbumData?.duplicateCount || 0)
  const ownedCount = isSelected ? ownedStickers.length : (mainAlbumData?.ownedCount || 0)
  const progressPercent = mainAlbum?.total_stickers && mainAlbum.total_stickers > 0 
    ? Math.round((ownedCount / mainAlbum.total_stickers) * 100) 
    : 0
  return (
    <div className="profile-final-root">

      <header className="topbar">
        <div>
          <div className="top-kicker">{user?.role === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}</div>
          <div className="top-title">Mi perfil</div>
        </div>
        <div className="top-actions">
          <button className="btn desktop-only" onClick={() => navigate('/album')}>Cambiar álbum</button>
          <button className="btn orange desktop-only" onClick={() => navigate('/matches')}>Ver cruces</button>
          <button className="btn red logout-btn-top" onClick={() => openConfirm()}>SALIR</button>
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
              {/* Founding Badge */}
              {badges?.some(b => b.badge_key === 'desde_el_comienzo') && (
                <span className="badge" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'linear-gradient(135deg, rgba(255,180,60,0.15), rgba(255,120,30,0.08))',
                  border: '1px solid rgba(255,160,50,0.3)',
                  color: '#ffb74d',
                  padding: '3px 8px 3px 4px',
                }}>
                  <img src="/assets/badge-desde-el-comienzo.png" alt="Desde el comienzo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  Desde el comienzo
                </span>
              )}
            </div>
            {profile?.username && (
              <div style={{ marginBottom: '12px' }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/u/${profile.username}`)}>
                  <span className="material-symbols-outlined">public</span>
                  Ver Perfil Público
                </button>
              </div>
            )}
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {LEVELS[progress.level]?.iconKey ? <GamificationIcon icon={LEVELS[progress.level].iconKey} size="sm" /> : LEVELS[progress.level]?.icon} {LEVELS[progress.level]?.name || progress.level}
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
            <div className="plan-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
              <b style={{ fontSize: '1.8rem', lineHeight: '1.1' }}>{isPremium ? (planName === 'gratis' ? 'PLUS' : planName.toUpperCase()) : 'GRATIS'}</b>
              <span style={{ fontWeight: 'bold' }}>Plan activo</span>
              
              <p className="muted" style={{ margin: '16px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                {isPremium ? `Disfrutás de todos los beneficios de ${planName === 'gratis' ? 'Plus' : planName}.` : 'Subí a Premium para ver intercambios ilimitados y chatear sin restricciones.'}
              </p>
              <button className="btn" style={{ background: '#fff', color: '#ff5a00', width: '100%', marginTop: 'auto', fontWeight: 'bold' }} onClick={() => navigate('/premium')}>
                {isPremium ? 'GESTIONAR SUSCRIPCIÓN' : 'MEJORAR A PRO'}
              </button>
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
                    <div className="album-actions" style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <button className="btn orange" onClick={async () => {
                        await useAppStore.getState().selectAlbum(ua.album, profile?.id);
                        navigate('/album');
                      }}>Abrir álbum</button>
                      <button className="btn" onClick={() => {
                        setEditingAlbumPrivacy(ua)
                        setShowPrivacyModal(true)
                      }}>Privacidad</button>
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
                    <button className="btn" onClick={() => setShowAlbumPicker(true)}>Agregar</button>
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
              <div className="mini-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <ProfileGamification />
              </div>
            </div>
          </div>

          <aside className="side-stack">


            <section className="side-card">
              <div className="side-title">Reputación</div>
              <div style={{ marginBottom: '14px' }}>
                <ReputationStars stars={reputation?.star_rating || 1} size="lg" showLabel />
              </div>
              <div className="trust-row"><span>Intercambios</span><b>{progress?.completed_exchanges || profile?.completed_exchanges || 0} confirmados</b></div>
              <div className="trust-row"><span>Tasa de cierre</span><b>{Math.round(progress?.completion_rate || profile?.completion_rate || 0)}%</b></div>
              <div className="trust-row"><span>Confiabilidad</span><b>{Math.round(progress?.reliability_score || profile?.reliability_score || 0)}/100</b></div>
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
              
              <label className="kicker" style={{ display: 'block', marginTop: '12px' }}>Nombre de usuario (público)</label>
              <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Ej: juanperez123" />

              <label className="kicker" style={{ display: 'block', marginTop: '12px' }}>Visibilidad del perfil</label>
              <select className="input" value={profileVisibility} onChange={e => setProfileVisibility(e.target.value)}>
                <option value="public">Público (Todos)</option>
                <option value="matches">Solo Matches (Quienes cruzan conmigo)</option>
                <option value="private">Privado (Nadie)</option>
              </select>
              
              <div className="settings-row" style={{ marginTop: '16px' }}>
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
              <div className="side-title">Programa de Referidos</div>
              <p className="muted" style={{ marginBottom: '12px' }}>Invitá a tus amigos y ganá días Premium gratis.</p>
              <div className="business-box">
                <button className="btn block" style={{ background: '#10b981', color: 'white', fontWeight: 'bold' }} onClick={() => navigate('/referidos')}>
                  <span className="material-symbols-outlined">group_add</span>
                  Invitar amigos
                </button>
              </div>
            </section>

            <section className="side-card danger-zone-card">
              <div className="side-title" style={{ color: '#ff4444' }}>Zona de Peligro</div>
              <p className="muted" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
                Acciones irreversibles sobre tu cuenta. Tené cuidado.
              </p>
              <button 
                className="btn red-ghost block" 
                style={{ 
                  borderColor: 'rgba(255,68,68,0.2)', 
                  color: '#ff4444',
                  fontSize: '0.8rem'
                }} 
                onClick={() => setShowDeletionModal(true)}
              >
                Eliminar mi cuenta
              </button>
            </section>

            {(isAdmin || canAccessBusinessDashboard(profile)) && (
              <section className="side-card">
                <div className="side-title">Accesos Rápidos</div>
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
              </section>
            )}
          </aside>
        </section>
      </main>

      {/* Album Picker Modal */}
      {showAlbumPicker && (
        <div className="album-modal-overlay" onClick={() => setShowAlbumPicker(false)}>
          <div className="album-modal" onClick={e => e.stopPropagation()}>
            <div className="album-modal-header">
              <div className="kicker">Colecciones disponibles</div>
              <h2 style={{ fontSize: '1.8rem' }}>Elegir álbum</h2>
            </div>
            <div className="album-modal-body">
              {albums.filter(a => !userAlbums.some(ua => ua.album_id === a.id)).length === 0 ? (
                <p className="muted">No hay más álbumes disponibles para agregar.</p>
              ) : (
                albums.filter(a => !userAlbums.some(ua => ua.album_id === a.id)).map(a => (
                  <div 
                    key={a.id} 
                    className={`album-option ${selectedAlbumId === a.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAlbumId(a.id)}
                  >
                    <div className="album-option-cover">
                      {(a.cover_url || a.images?.[0]) && <img src={a.cover_url || a.images?.[0]} alt={a.name} />}
                    </div>
                    <div className="album-option-info">
                      <div className="album-option-title">{a.name}</div>
                      <div className="album-option-sub">{a.editorial} · {a.year}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="album-modal-footer">
              <button className="btn" onClick={() => { setShowAlbumPicker(false); setSelectedAlbumId(null); }}>Cerrar</button>
              <button 
                className="btn orange" 
                disabled={!selectedAlbumId || addingAlbum}
                onClick={handleAddAlbum}
              >
                {addingAlbum ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlphaModal && (
        <AlphaWelcomeModal
          forceOpen={true}
          onClose={() => setShowAlphaModal(false)}
        />
      )}

      {/* Album Privacy Modal */}
      {showPrivacyModal && editingAlbumPrivacy && (
        <div className="album-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="album-modal" onClick={e => e.stopPropagation()}>
            <div className="album-modal-header">
              <div className="kicker">Privacidad de la Colección</div>
              <h2 style={{ fontSize: '1.5rem' }}>{editingAlbumPrivacy.album.name}</h2>
            </div>
            <div className="album-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="kicker" style={{ display: 'block', marginBottom: '8px' }}>Visibilidad</label>
                <select className="input" value={editingAlbumPrivacy.visibility || 'public'} onChange={e => setEditingAlbumPrivacy({...editingAlbumPrivacy, visibility: e.target.value})}>
                  <option value="public">Público (Todos)</option>
                  <option value="matches">Solo Matches</option>
                  <option value="private">Privado</option>
                </select>
              </div>
              
              <div className="settings-row" style={{ padding: '0.5rem 0' }}>
                <span>Mostrar Faltantes</span>
                <div className={`switch ${editingAlbumPrivacy.show_missing ? '' : 'off'}`} onClick={() => setEditingAlbumPrivacy({...editingAlbumPrivacy, show_missing: !editingAlbumPrivacy.show_missing})}></div>
              </div>
              
              <div className="settings-row" style={{ padding: '0.5rem 0' }}>
                <span>Mostrar Repetidas</span>
                <div className={`switch ${editingAlbumPrivacy.show_repeated ? '' : 'off'}`} onClick={() => setEditingAlbumPrivacy({...editingAlbumPrivacy, show_repeated: !editingAlbumPrivacy.show_repeated})}></div>
              </div>

              <div className="settings-row" style={{ padding: '0.5rem 0' }}>
                <span>Mostrar Progreso</span>
                <div className={`switch ${editingAlbumPrivacy.show_progress ? '' : 'off'}`} onClick={() => setEditingAlbumPrivacy({...editingAlbumPrivacy, show_progress: !editingAlbumPrivacy.show_progress})}></div>
              </div>
            </div>
            <div className="album-modal-footer">
              <button className="btn" onClick={() => setShowPrivacyModal(false)}>Cancelar</button>
              <button className="btn orange" onClick={handleSavePrivacy} disabled={saving}>Guardar Privacidad</button>
            </div>
          </div>
        </div>
      )}

      <AccountDeletionModal 
        isOpen={showDeletionModal} 
        onClose={() => setShowDeletionModal(false)} 
      />
    </div>
  )
}
