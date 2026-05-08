import React, { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePublicProfileStore } from '../stores/publicProfileStore'
import { useAuthStore } from '../stores/authStore'
import { useGrowthStore } from '../stores/growthStore'
import { getAvatarColor } from '../lib/avatarColors'
import { LEVELS, BADGES } from '../lib/gamification'
import ReputationStars from '../components/ReputationStars'
import GamificationIcon from '../components/gamification/icons/GamificationIcon'

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { publicProfile, loading, error, fetchPublicProfile } = usePublicProfileStore()
  const trackEvent = useGrowthStore(state => state.trackEvent)

  useEffect(() => {
    if (username) {
      fetchPublicProfile(username, user?.id)
      
      if (user?.id) {
        trackEvent(user.id, 'profile_visit', { visited_username: username })
      }
    }
  }, [username, user?.id])

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <span className="material-symbols-outlined spinning" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>refresh</span>
      </div>
    )
  }

  if (error || !publicProfile) {
    return (
      <div className="flex-center flex-col gap-md" style={{ minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--color-danger)' }}>error</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{error || 'Perfil no encontrado'}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Este perfil podría ser privado o no existir.</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Volver</button>
      </div>
    )
  }

  const { name, avatar_url, city, department, created_at, completed_exchanges, albums, is_owner, progress, reputation, badges } = publicProfile
  
  const avatarStyle = avatar_url
    ? { backgroundImage: `url(${avatar_url})` }
    : { backgroundColor: getAvatarColor(name || username) }

  const joinDate = new Date(created_at).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })

  return (
    <div className="public-profile-page" style={{ padding: '2rem 1rem', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div className="profile-header glass-panel" style={{ display: 'flex', gap: '1.5rem', padding: '2rem', borderRadius: '24px', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="avatar avatar-xl" style={avatarStyle}>
          {!avatar_url && (name || username).charAt(0).toUpperCase()}
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>{name || username}</h1>
          <p style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>@{username}</p>
          
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {reputation && <ReputationStars stars={reputation?.star_rating || 1} size="md" showLabel />}
            {progress?.level && (
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: LEVELS[progress.level]?.color || 'var(--color-text-muted)',
                border: `1px solid ${LEVELS[progress.level]?.color || 'var(--color-border)'}40`,
                background: `${LEVELS[progress.level]?.color || '#ffffff'}10`,
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {LEVELS[progress.level]?.iconKey ? <GamificationIcon icon={LEVELS[progress.level].iconKey} size="sm" /> : LEVELS[progress.level]?.icon} 
                {LEVELS[progress.level]?.name || progress.level}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>location_on</span>
                {city}{department ? `, ${department}` : ''}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>calendar_month</span>
              Miembro desde {joinDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--color-warning)' }}>star</span>
              {completed_exchanges || 0} intercambios
            </span>
          </div>
        </div>
        
        {is_owner && (
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">edit</span>
            Editar Perfil
          </button>
        )}
      </div>

      {/* LOGROS / BADGES */}
      {badges && badges.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Logros Destacados</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {badges.map(b => {
              const bDef = BADGES[b.badge_id] || Object.values(BADGES).find(x => x.name === b.badge_id || x.id === b.badge_id)
              if (!bDef) return null
              return (
                <div key={b.badge_id || b.key || Math.random()} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '1.5rem', display: 'flex' }}>
                    {bDef.iconKey ? <GamificationIcon icon={bDef.iconKey} size="sm" /> : bDef.icon}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{bDef.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{bDef.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* COLLECTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Colecciones Públicas</h2>
      </div>

      {albums.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>collections_bookmark</span>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>No hay colecciones públicas visibles.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {albums.map(album => {
            const progressPercent = album.show_progress && album.total_stickers > 0 
              ? Math.round((album.progress / album.total_stickers) * 100) 
              : null

            return (
              <div key={album.album_id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', borderRadius: '16px', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <img src={album.cover_url} alt={album.name} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{album.name}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{album.year}</p>
                    
                    {album.show_progress && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                          <span>Progreso</span>
                          <span style={{ color: 'var(--color-primary)' }}>{progressPercent}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--color-primary)', width: `${progressPercent}%`, borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <Link to={`/u/${username}/album/${album.album_id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Ver Colección
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
