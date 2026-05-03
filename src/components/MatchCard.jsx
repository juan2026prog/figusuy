import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { getUserBadges } from '../lib/ranking'
import FavoriteButton from './FavoriteButton'
import ReputationStars from './ReputationStars'

export default function MatchCard({ match, isLocked = false, isTopMatch = false, idx = null }) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createOrGetChat, selectedAlbum } = useAppStore()
  const [contactLoading, setContactLoading] = useState(false)
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

  const formatLastActive = (dateStr) => {
    if (!dateStr) return null
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 3600) return 'Activa ahora'
    if (diff < 86400) return `Activa hace ${Math.floor(diff / 3600)}h`
    if (diff < 172800) return 'Activa ayer'
    return `Activa hace ${Math.floor(diff / 86400)}d`
  }

  const lastActive = formatLastActive(match.profile?.last_active || match.last_login)
  const distanceStr = match.distance != null ? (match.distance < 1 ? `${Math.round(match.distance * 1000)}m` : `${match.distance.toFixed(1)} km`) : 'Distancia desconocida'
  const locationStr = match.profile?.city 
    ? `${match.profile.city}, ${match.profile.department || ''}`
    : (match.profile?.department || 'Uruguay')

  const userName = match.profile?.name || match.name || 'Usuario'
  const avatarLetter = userName[0]?.toUpperCase() || '?'
  const avatarUrl = match.profile?.avatar_url
  
  const rankLabel = isTopMatch ? 'Top' : 'Match'
  const rankNumber = idx !== null ? `#${idx + 1}` : (isTopMatch ? '#1' : '-')

  return (
    <article className={`match-card ${isTopMatch ? 'top' : ''}`} style={isLocked ? { opacity: 0.6 } : {}}>
      {isLocked && (
        <div style={{
          position: 'absolute', inset: 0, 
          background: 'rgba(2, 6, 23, 0.55)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '1rem',
          zIndex: 10
        }}>
          <button className="btn orange" onClick={() => navigate('/premium')}>
            Desbloquear Plus
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
              {avatarUrl ? <img src={avatarUrl} alt={userName} /> : avatarLetter}
            </div>
            <div>
              <div className="match-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {userName}
                <ReputationStars stars={match.profile?.star_rating || match.star_rating || 1} size="xs" inline />
                <div style={{ display: 'inline-flex', verticalAlign: 'middle', transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                  <FavoriteButton targetUserId={match.userId || match.profile?.id} />
                </div>
              </div>
              <div className="match-meta">
                {locationStr} · {distanceStr} · {lastActive || 'Recientemente'}
              </div>
            </div>
          </div>
          <div className="match-score-mobile">{match.score || 0}</div>
        </div>

        <div className="badges">
          {match.isMutual && <span className="badge green">Mutuo</span>}
          {match.distance != null && match.distance <= 5 && <span className="badge blue">Cerca</span>}
          {canGive.length > canReceive.length && canReceive.length > 0 && <span className="badge orange">Fuerte para vos</span>}
          {getUserBadges(match.badges || match.profile?.badges || []).slice(0, 2).map(b => (
            <span key={b.label} className="badge" style={{ color: b.color, borderColor: `${b.color}40`, backgroundColor: `${b.color}15` }}>
              {b.emoji} {b.label}
            </span>
          ))}
        </div>

        <div className="sticker-exchange">
          <div className="sticker-box give">
            <h4>Te puede dar ({canGive.length})</h4>
            <div className="chips">
              {canGive.slice(0, 8).map(n => (
                <span key={n} className="chip green">{n}</span>
              ))}
              {canGive.length > 8 && <span className="chip green">+{canGive.length - 8}</span>}
              {canGive.length === 0 && <span className="chip" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Ninguna</span>}
            </div>
          </div>
          <div className="sticker-box take">
            <h4>Vos le das ({canReceive.length})</h4>
            <div className="chips">
              {canReceive.slice(0, 8).map(n => (
                <span key={n} className="chip orange">{n}</span>
              ))}
              {canReceive.length > 8 && <span className="chip orange">+{canReceive.length - 8}</span>}
              {canReceive.length === 0 && <span className="chip" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Ninguna</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="match-action">
        <div className="score-big">{match.score || 0}</div>
        <small>score</small>
        <button className="btn orange" onClick={handleContact} disabled={contactLoading}>
          {contactLoading ? '...' : 'Abrir chat'}
        </button>
      </div>
    </article>
  )
}
