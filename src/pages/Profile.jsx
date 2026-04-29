import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { useFavoritesStore } from '../stores/favoritesStore'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { userAlbums, missingStickers, duplicateStickers, matches } = useAppStore()
  const { favorites, fetchFavorites } = useFavoritesStore()
  const toast = useToast()

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [locationName, setLocationName] = useState(profile?.city || '')
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const isPremium = profile?.is_premium === true || (profile?.plan_name && profile.plan_name !== 'gratis')
  const initial = profile?.name?.[0]?.toUpperCase() || '?'
  const name = profile?.name || 'Usuario'

  useEffect(() => {
    setLocationName(profile?.city || '')
    // Check if user has admin role
    if (profile?.id) {
      supabase.from('user_roles').select('role').eq('user_id', profile.id).maybeSingle()
        .then(({ data }) => {
          if (data?.role && data.role !== 'user') setIsAdmin(true)
        })
      fetchFavorites(profile.id)
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ city: locationName }).eq('id', profile.id)
      if (error) throw error
      toast.success('Perfil actualizado correctamente')
    } catch (err) { toast.error('Error al guardar: ' + err.message) }
    setSaving(false)
  }

  const handleGeoUpdate = () => {
    if (!navigator.geolocation) { toast.error('Tu navegador no soporta geolocalización'); return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { error } = await supabase.from('profiles').update({ lat: pos.coords.latitude, lng: pos.coords.longitude }).eq('id', profile.id)
          if (error) throw error
          toast.success('Ubicación actualizada')
        } catch (err) { toast.error('Error al actualizar ubicación') }
        setGeoLoading(false)
      },
      () => { toast.error('No se pudo obtener la ubicación'); setGeoLoading(false) }
    )
  }

  const handleSignOut = async () => { setShowSignOutConfirm(false); await signOut(); navigate('/login') }

  const missingCount = missingStickers?.length || 0
  const duplicateCount = duplicateStickers?.length || 0
  const mainAlbum = userAlbums[0]?.album
  const progressPercent = mainAlbum?.total_stickers ? Math.round(((mainAlbum.total_stickers - missingCount) / mainAlbum.total_stickers) * 100) : 0

  return (
    <div className="profile-page-root">
      <style>{`
        .profile-page-root {
          background-color: #020617; /* slate-950 */
          min-height: 100vh;
          color: white;
          padding: 1.5rem 1.25rem 7rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        .hero-card {
          position: relative;
          overflow: hidden;
          border-radius: 2rem;
          background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
          border: 1px solid #1e293b;
          padding: 2rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .hero-glow {
          position: absolute;
          right: -4rem;
          top: -4rem;
          width: 16rem;
          height: 16rem;
          background: rgba(234, 88, 12, 0.15);
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }

        .profile-info {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .avatar-container {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .avatar-circle {
          width: 6rem;
          height: 6rem;
          border-radius: 2rem;
          background-color: #ea580c;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 900;
          box-shadow: 0 10px 25px rgba(234, 88, 12, 0.3);
          flex-shrink: 0;
        }

        .profile-text h1 {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          margin: 0 0 0.5rem 0;
          color: white;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .badge-premium {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: #1e293b;
          border: 1px solid #334155;
          font-size: 0.75rem;
          font-weight: 900;
          color: #f97316;
        }

        .badge-trust {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          font-size: 0.75rem;
          font-weight: 900;
          color: #4ade80;
        }

        .profile-subtitle {
          color: #94a3b8;
          font-size: 0.9375rem;
          margin: 0;
        }

        .action-btns {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn-outline {
          padding: 0.75rem 1.25rem;
          border-radius: 1.25rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          font-weight: 900;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background-color: #1e293b;
        }

        .btn-brand {
          padding: 0.75rem 1.5rem;
          border-radius: 1.25rem;
          background-color: #ea580c;
          color: white;
          border: none;
          font-weight: 900;
          font-size: 0.875rem;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(234, 88, 12, 0.3);
          transition: all 0.2s;
        }

        .btn-brand:hover {
          background-color: #f97316;
          transform: translateY(-2px);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .profile-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        .card {
          background-color: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 1.75rem;
          padding: 1.5rem;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 900;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .card-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #ea580c;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .card-desc {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .progress-container {
          margin-bottom: 1.5rem;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.75rem;
        }

        .progress-percent {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1;
        }

        .progress-bar-bg {
          height: 1rem;
          background-color: #1e293b;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: #ea580c;
          border-radius: 9999px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }

        .stat-box {
          padding: 1.25rem;
          border-radius: 1.5rem;
          background-color: #020617;
          border: 1px solid #1e293b;
        }

        .stat-val {
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
        }

        .stat-box-red {
          background-color: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2);
        }
        .stat-box-red .stat-val { color: #f87171; }

        .stat-box-green {
          background-color: rgba(34, 197, 94, 0.05);
          border-color: rgba(34, 197, 94, 0.2);
        }
        .stat-box-green .stat-val { color: #4ade80; }

        .premium-card {
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          border: none;
          color: white;
        }

        .btn-white {
          background-color: white;
          color: #ea580c;
          border: none;
          padding: 0.75rem;
          border-radius: 1.25rem;
          font-weight: 900;
          font-size: 0.875rem;
          width: 100%;
          cursor: pointer;
        }

        .trust-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #1e293b;
        }
        .trust-row:last-child { border-bottom: none; }

        .trust-label { color: #94a3b8; font-size: 0.875rem; }
        .trust-val { font-weight: 900; }

        .settings-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 1.25rem;
          background-color: #020617;
          border: 1px solid #1e293b;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
        }

        .btn-settings {
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          background-color: #1e293b;
          color: white;
          border: none;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .logout-btn {
          color: #f87171;
          background: none;
          border: none;
          font-weight: 900;
          font-size: 0.875rem;
          padding: 1rem;
          width: 100%;
          text-align: left;
          cursor: pointer;
          border-radius: 1rem;
        }
        .logout-btn:hover { background-color: rgba(239, 68, 68, 0.1); }
      `}</style>

      {/* Hero Section */}
      <section className="hero-card animate-fade-in-up">
        <div className="hero-glow"></div>
        <div className="profile-info">
          <div className="avatar-container">
            <div className="avatar-circle">{initial}</div>
            <div className="profile-text">
              <div className="badge-row">
                {isPremium && <span className="badge-premium">💎 {profile?.plan_name || 'Premium'}</span>}
                {profile?.is_verified && <span className="badge-trust">✓ Usuario confiable</span>}
              </div>
              <h1>{name}</h1>
              <p className="profile-subtitle">{locationName || profile?.department || 'Sin ubicación'} · Activo hoy</p>
            </div>
          </div>
          <div className="action-btns">
            <button className="btn-outline" onClick={handleGeoUpdate} disabled={geoLoading}>
              {geoLoading ? 'Cargando...' : 'Actualizar ubicación'}
            </button>
            <button className="btn-brand" onClick={() => navigate('/matches')}>Ver mis intercambios</button>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Album Progress */}
          <div className="card">
            <p className="card-label">Álbum principal</p>
            <div className="progress-text">
              <div>
                <h2 className="card-title">{mainAlbum?.name || 'Sin álbum activo'}</h2>
                <p className="card-desc" style={{ marginBottom: 0 }}>Faltan pocas para completar. ¡Seguí así!</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="progress-percent">{progressPercent}%</span>
                <p className="stat-label">completado</p>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-box stat-box-red">
                <p className="stat-val">{missingCount}</p>
                <p className="stat-label">faltantes</p>
              </div>
              <div className="stat-box stat-box-green">
                <p className="stat-val">{duplicateCount}</p>
                <p className="stat-label">repetidas</p>
              </div>
              <div className="stat-box">
                <p className="stat-val">{matches?.length || 0}</p>
                <p className="stat-label">intercambios</p>
              </div>
            </div>
          </div>

          {/* Active Albums */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Mis Álbumes</h2>
              <button className="btn-settings" onClick={() => navigate('/album')}>Gestionar</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {userAlbums.map((ua, i) => {
                const coverImg = ua.album.cover_url || (ua.album.images?.[0]);
                return (
                  <div key={ua.album_id} className="stat-box" style={{ padding: '1rem' }}>
                    <div style={{ height: '6rem', background: coverImg ? 'transparent' : 'linear-gradient(135deg, #ea580c, #c2410c)', borderRadius: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden' }}>
                      {coverImg ? <img src={coverImg} alt={ua.album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚽'}
                    </div>
                    <p style={{ fontWeight: 900, fontSize: '0.875rem', margin: 0 }}>{ua.album.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Activo</p>
                  </div>
                )
              })}
              {userAlbums.length < 3 && (
                <div className="stat-box" style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'pointer' }} onClick={() => navigate('/album')}>
                  <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>+</span>
                  <p style={{ fontWeight: 900, fontSize: '0.875rem', margin: 0 }}>Agregar</p>
                </div>
              )}
            </div>
          </div>

          {/* Favorites */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>Favoritos</h2>
                <p className="card-desc" style={{ marginBottom: 0, marginTop: '0.25rem' }}>Favoritos guardados: {favorites.length}</p>
              </div>
              <button className="btn-settings" onClick={() => navigate('/favorites')}>Ver favoritos</button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Subscription Card */}
          <div className="card premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{isPremium ? (profile?.plan_name || 'Premium') : 'Plan Gratuito'}</h2>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'white', color: '#ea580c', fontSize: '0.625rem', fontWeight: 900 }}>ACTIVO</span>
            </div>
            <p style={{ fontSize: '0.8125rem', marginBottom: '1.5rem', opacity: 0.9 }}>
              {isPremium ? `Disfrutás de todos los beneficios de ${profile?.plan_name || 'Premium'}.` : 'Subí a Premium para ver intercambios ilimitados y chatear sin restricciones.'}
            </p>
            <button className="btn-white" onClick={() => navigate('/premium')}>
              {isPremium ? 'Gestionar suscripción' : 'Mejorar a Pro'}
            </button>
          </div>

          {/* Trust Metrics */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem', margin: '0 0 1rem 0' }}>Reputación</h2>
            <div className="trust-row">
              <span className="trust-label">Calificación</span>
              <span className="trust-val">⭐ {Number(profile?.rating || 5).toFixed(1)}</span>
            </div>
            <div className="trust-row">
              <span className="trust-label">Intercambios</span>
              <span className="trust-val">{profile?.total_trades || 0} exitosos</span>
            </div>
            <div className="trust-row">
              <span className="trust-label">Miembro desde</span>
              <span className="trust-val">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>Configuración</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Mi Zona</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  className="settings-input" 
                  value={locationName} 
                  onChange={e => setLocationName(e.target.value)} 
                  placeholder="Ej: Pocitos, Montevideo"
                />
                <button className="btn-settings" onClick={handleSave} disabled={saving}>{saving ? '...' : 'OK'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notificaciones</span>
              <div 
                style={{ width: '3rem', height: '1.5rem', background: notifEnabled ? '#ea580c' : '#1e293b', borderRadius: '1rem', position: 'relative', cursor: 'pointer', transition: '0.2s' }}
                onClick={() => setNotifEnabled(!notifEnabled)}
              >
                <div style={{ width: '1.125rem', height: '1.125rem', background: 'white', borderRadius: '50%', position: 'absolute', top: '0.1875rem', left: notifEnabled ? 'calc(100% - 1.3125rem)' : '0.1875rem', transition: '0.2s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #1e293b', paddingTop: '0.5rem' }}>
              <button className="logout-btn" style={{ color: '#10b981' }} onClick={() => navigate('/business')}>
                🏪 FigusUY Negocios (Mi local)
              </button>
              {isAdmin && (
                <button className="logout-btn" style={{ color: '#ea580c' }} onClick={() => navigate('/admin')}>
                  🔐 Panel de Administración
                </button>
              )}
              <button className="logout-btn" onClick={() => setShowSignOutConfirm(true)}>
                ↩ Cerrar sesión
              </button>
            </div>
          </div>

        </div>
      </div>

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
    </div>
  )
}
