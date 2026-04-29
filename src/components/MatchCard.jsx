import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useThemeStore } from '../stores/themeStore'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { getCompatibilityLevel } from '../lib/matching'
import { getAvatarGradient } from '../lib/avatarColors'
import FavoriteButton from './FavoriteButton'

const r = { md: '0.75rem', lg: '1rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.75rem', full: '9999px' }

export default function MatchCard({ match, isLocked = false, isTopMatch = false }) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createOrGetChat, selectedAlbum } = useAppStore()
  const { isDark } = useThemeStore()
  const [contactLoading, setContactLoading] = useState(false)
  const { permission, requestPermission } = usePushNotifications()

  const canGive = match.theyCanGiveMe || []
  const canReceive = match.iCanGiveThem || []
  const totalExchange = canGive.length + canReceive.length

  const handleContact = async () => {
    if (!profile?.id || !match.userId || contactLoading || isLocked) return
    setContactLoading(true)

    // Solicitar permiso de notificaciones contextualmente al abrir el primer chat
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

  // Boceto specific styling
  const baseBg = isDark ? '#0f172a' : 'white'
  const borderColor = isTopMatch ? '#ea580c' : (isDark ? '#1e293b' : '#e2e8f0')
  const borderStyle = isTopMatch ? `2px solid ${borderColor}` : `1px solid ${borderColor}`

  // Green / Emerald palette for "Te da"
  const emeraldText = isDark ? '#6ee7b7' : '#047857'
  const emeraldBadgeBg = isDark ? 'rgba(2, 44, 34, 0.3)' : '#ecfdf5'
  const emeraldBadgeBorder = isDark ? '#064e3b' : '#a7f3d0'

  // Orange palette for "Le das"
  const orangeText = isDark ? '#fdba74' : '#c2410c'
  const orangeBadgeBg = isDark ? 'rgba(67, 20, 7, 0.3)' : '#fff7ed'
  const orangeBadgeBorder = isDark ? '#7c2d12' : '#fed7aa'

  return (
    <article style={{
      borderRadius: r['3xl'], background: baseBg, border: borderStyle,
      padding: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      position: 'relative', overflow: 'hidden',
      opacity: isLocked ? 0.6 : 1, transition: 'all 0.2s ease-in-out'
    }}>
      
      {isLocked && (
        <div style={{
          position: 'absolute', inset: 0, 
          background: isDark ? 'rgba(2, 6, 23, 0.55)' : 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '1rem',
          zIndex: 10
        }}>
          <button style={{
            padding: '0.5rem 1rem', borderRadius: r.xl, background: '#ea580c',
            color: 'white', fontWeight: 900, fontSize: '0.875rem', border: 'none', cursor: 'pointer'
          }}>
            Desbloquear
          </button>
        </div>
      )}

      {/* Grid container mirroring the xl:grid-cols-[260px_1fr_1fr_180px] */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', alignItems: 'center'
      }} className="match-grid-container">
        
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: r['2xl'], 
            background: isTopMatch ? '#ea580c' : (isDark ? 'white' : '#0f172a'),
            color: isTopMatch ? 'white' : (isDark ? '#020617' : 'white'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.125rem', flexShrink: 0
          }}>
            {match.profile?.name?.[0]?.toUpperCase() || match.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h3 style={{ fontWeight: 900, fontSize: '1.125rem', margin: 0, color: isDark ? 'white' : '#0f172a' }}>
                {match.profile?.name || match.name || 'Usuario'}
              </h3>
              <FavoriteButton targetUserId={match.userId || match.profile?.id} />
              {match.isMutual && (
                <span style={{
                  padding: '0.25rem 0.5rem', borderRadius: r.full,
                  background: isDark ? '#431407' : '#ffedd5',
                  color: isDark ? '#fdba74' : '#c2410c',
                  fontSize: '0.625rem', fontWeight: 900
                }}>Mutuo</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {locationStr} · {distanceStr} · {lastActive || 'Recientemente'}
            </p>
          </div>
        </div>

        {/* Te da (Green) */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 900, color: emeraldText, marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
            Te da ({canGive.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {canGive.slice(0, 4).map(n => (
              <span key={n} style={{
                padding: '0.375rem 0.625rem', borderRadius: r.xl,
                background: emeraldBadgeBg, border: `1px solid ${emeraldBadgeBorder}`,
                fontSize: '0.875rem', fontWeight: 900, color: isDark ? '#d1fae5' : '#064e3b'
              }}>{n}</span>
            ))}
            {canGive.length > 4 && (
              <span style={{
                padding: '0.375rem 0.625rem', borderRadius: r.xl,
                background: emeraldBadgeBg, border: `1px solid ${emeraldBadgeBorder}`,
                fontSize: '0.875rem', fontWeight: 900, color: isDark ? '#d1fae5' : '#064e3b'
              }}>+{canGive.length - 4}</span>
            )}
            {canGive.length === 0 && <span style={{ fontSize: '0.875rem', color: isDark ? '#64748b' : '#94a3b8' }}>Ninguna</span>}
          </div>
        </div>

        {/* Le das (Orange) */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 900, color: orangeText, marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
            Le das ({canReceive.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {canReceive.slice(0, 4).map(n => (
              <span key={n} style={{
                padding: '0.375rem 0.625rem', borderRadius: r.xl,
                background: orangeBadgeBg, border: `1px solid ${orangeBadgeBorder}`,
                fontSize: '0.875rem', fontWeight: 900, color: isDark ? '#ffedd5' : '#7c2d12'
              }}>{n}</span>
            ))}
            {canReceive.length > 4 && (
              <span style={{
                padding: '0.375rem 0.625rem', borderRadius: r.xl,
                background: orangeBadgeBg, border: `1px solid ${orangeBadgeBorder}`,
                fontSize: '0.875rem', fontWeight: 900, color: isDark ? '#ffedd5' : '#7c2d12'
              }}>+{canReceive.length - 4}</span>
            )}
            {canReceive.length === 0 && <span style={{ fontSize: '0.875rem', color: isDark ? '#64748b' : '#94a3b8' }}>Ninguna</span>}
          </div>
        </div>

        {/* Actions & Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: isTopMatch ? '#ea580c' : (isDark ? 'white' : '#0f172a'), lineHeight: 1 }}>
              {match.score || 0}
            </p>
            <p style={{ fontSize: '0.6875rem', color: isDark ? '#64748b' : '#64748b', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
              Cerrás {Math.min(canGive.length, canReceive.length) || (canGive.length > 0 ? canGive.length : canReceive.length) || 0}
            </p>
          </div>
          <button onClick={handleContact} disabled={contactLoading} style={{
            padding: '0.75rem 1.25rem', borderRadius: r['2xl'],
            background: isTopMatch ? '#ea580c' : (isDark ? 'white' : '#0f172a'),
            color: isTopMatch ? 'white' : (isDark ? '#020617' : 'white'),
            fontWeight: 900, fontSize: '0.875rem', border: 'none', cursor: contactLoading ? 'not-allowed' : 'pointer',
            opacity: contactLoading ? 0.7 : 1
          }}>
            {contactLoading ? '...' : 'Contactar'}
          </button>
        </div>
      </div>
      
      {/* Media query style to handle the xl breakpoint from boceto cleanly without creating external css class */}
      <style>{`
        @media (min-width: 1280px) {
          .match-grid-container {
            grid-template-columns: 260px 1fr 1fr 180px !important;
          }
        }
      `}</style>
    </article>
  )
}
