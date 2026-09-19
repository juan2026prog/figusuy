import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { getUserBadges } from '../lib/ranking'
import FavoriteButton from './FavoriteButton'
import ReputationStars from './ReputationStars'
import { getPresenceLabel } from '../lib/liveMomentum'
import GamificationIcon from './gamification/icons/GamificationIcon'

export default function MatchCard({ match, isLocked = false, isTopMatch = false, idx = null }) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createOrGetChat, selectedAlbum } = useAppStore()
  const [contactLoading, setContactLoading] = useState(false)
  const [showAllChips, setShowAllChips] = useState(false)
  const { permission, requestPermission } = usePushNotifications()

  const canGive = match.theyCanGiveMe || []
  const canReceive = match.iCanGiveThem || []

  const handleContact = async () => {
    if (!profile?.id || !match.userId || contactLoading || isLocked) return
    setContactLoading(true)

    if (permission === 'default') {
      await requestPermission()
    }

    try {
      const chat = await createOrGetChat(profile.id, match.userId, selectedAlbum?.id)
      if (chat) navigate(`/chat/${chat.id}`)
    } catch (err) {
      console.error('Error creating chat:', err)
    }
    setContactLoading(false)
  }

  const handleViewProfile = () => {
    const targetUsername = match.profile?.username
    if (targetUsername) {
      navigate(`/u/${targetUsername}`)
    } else {
      navigate('/profile')
    }
  }

  const lastActive = getPresenceLabel(match.profile?.last_active || match.last_login)
  const distanceStr = match.distance != null ? (match.distance < 1 ? `${Math.round(match.distance * 1000)}m` : `${match.distance.toFixed(1)} km`) : 'Distancia aprox.'
  const locationStr = match.profile?.city 
    ? `${match.profile.city}, ${match.profile.department || ''}`
    : (match.profile?.department || 'Uruguay')

  const userName = match.profile?.name || match.name || 'Usuario'
  const avatarUrl = match.profile?.avatar_url
  
  const rankLabel = isTopMatch ? 'Top' : 'Match'
  const rankNumber = idx !== null ? `#${idx + 1}` : (isTopMatch ? '#1' : '-')

  const maxVisibleChips = showAllChips ? 50 : 5

  return (
    <article className={`match-card ${isTopMatch ? 'top' : ''}`} style={isLocked ? { opacity: 0.6 } : {}}>
      {isLocked && (
        <div style={{
          position: 'absolute', inset: 0, 
          background: 'rgba(2, 6, 23, 0.65)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          zIndex: 10,
          borderRadius: 'inherit'
        }}>
          <button className="btn orange" onClick={() => navigate('/premium')} style={{ minHeight: '44px' }}>
            Desbloquear con Plus
          </button>
        </div>
      )}

      <div className="match-rank">
        <div>
          <b>{rankNumber}</b>
          <span>{rankLabel}</span>
        </div>
      </div>

      <div className="match-body">
        <div className="match-head">
          <div className="profile-mini">
            <div className="avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} loading="lazy" />
              ) : (
                <img 
                  src={match.profile?.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'} 
                  alt={userName} 
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div>
              <div className="match-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong>{userName}</strong>
                <ReputationStars stars={match.profile?.star_rating || match.star_rating || 1} size="xs" inline />
                <div style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                  <FavoriteButton targetUserId={match.userId || match.profile?.id} />
                </div>
              </div>
              <div className="match-meta" style={{ fontSize: '0.78rem' }}>
                {locationStr} · {distanceStr} · {lastActive || 'Recientemente'}
              </div>
            </div>
          </div>
          <div className="match-score-mobile">{match.score || 0}</div>
        </div>

        <div className="badges" style={{ margin: '0.5rem 0' }}>
          {match.isMutual && <span className="badge green">Cruce mutuo</span>}
          {match.distance != null && match.distance <= 5 && <span className="badge blue">Cerca</span>}
          {canGive.length > canReceive.length && canReceive.length > 0 && <span className="badge orange">Fuerte</span>}
          {getUserBadges(match.badges || match.profile?.badges || []).slice(0, 2).map(b => (
            <span key={b.label} className="badge" style={{ color: b.color, borderColor: `${b.color}40`, backgroundColor: `${b.color}15`, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {b.iconKey ? <GamificationIcon icon={b.iconKey} size="sm" /> : b.emoji} {b.label}
            </span>
          ))}
        </div>

        <div className="sticker-exchange" style={{ marginTop: '0.5rem' }}>
          <div className="sticker-box give">
            <h4 style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Te da ({canGive.length})</h4>
            <div className="chips">
              {canGive.slice(0, maxVisibleChips).map(n => (
                <span key={n} className="chip green">{n}</span>
              ))}
              {!showAllChips && canGive.length > maxVisibleChips && (
                <button 
                  type="button" 
                  className="chip green" 
                  onClick={() => setShowAllChips(true)}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
                  aria-label="Ver más figuritas"
                >
                  +{canGive.length - maxVisibleChips} más
                </button>
              )}
              {canGive.length === 0 && <span className="chip" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Ninguna</span>}
            </div>
          </div>
          <div className="sticker-box take">
            <h4 style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Le das ({canReceive.length})</h4>
            <div className="chips">
              {canReceive.slice(0, maxVisibleChips).map(n => (
                <span key={n} className="chip orange">{n}</span>
              ))}
              {!showAllChips && canReceive.length > maxVisibleChips && (
                <button 
                  type="button" 
                  className="chip orange" 
                  onClick={() => setShowAllChips(true)}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
                  aria-label="Ver más figuritas"
                >
                  +{canReceive.length - maxVisibleChips} más
                </button>
              )}
              {canReceive.length === 0 && <span className="chip" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Ninguna</span>}
            </div>
          </div>
        </div>

        {/* Mobile Action Row */}
        <div className="match-mobile-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-sm" 
            onClick={handleViewProfile}
            style={{ flex: 1, minHeight: '44px', justifyContent: 'center', fontSize: '0.82rem' }}
          >
            Ver perfil
          </button>
          <button 
            type="button" 
            className="btn btn-sm orange" 
            onClick={handleContact} 
            disabled={contactLoading}
            style={{ flex: 1.5, minHeight: '44px', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}
          >
            {contactLoading ? 'Abriendo...' : 'Chatear'}
          </button>
        </div>
      </div>

      <div className="match-action">
        <div className="score-big">{match.score || 0}</div>
        <small>score</small>
        <button className="btn orange" onClick={handleContact} disabled={contactLoading} style={{ minHeight: '44px' }}>
          {contactLoading ? '...' : 'Abrir chat'}
        </button>
        <button className="btn btn-sm" onClick={handleViewProfile} style={{ minHeight: '36px', marginTop: '4px' }}>
          Perfil
        </button>
      </div>
    </article>
  )
}
