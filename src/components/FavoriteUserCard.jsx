import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useThemeStore } from '../stores/themeStore'
import FavoriteButton from './FavoriteButton'

const r = { md: '0.75rem', lg: '1rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.75rem', full: '9999px' }

export default function FavoriteUserCard({ favorite }) {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuthStore()
  const { createOrGetChat, selectedAlbum } = useAppStore()
  const { isDark } = useThemeStore()
  const [contactLoading, setContactLoading] = useState(false)

  const userProfile = favorite.profile
  if (!userProfile) return null

  const handleContact = async () => {
    if (!currentUser?.id || !userProfile.id || contactLoading) return
    setContactLoading(true)

    try {
      const chat = await createOrGetChat(currentUser.id, userProfile.id, selectedAlbum?.id)
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

  const lastActive = formatLastActive(userProfile.last_active)
  const locationStr = userProfile.city 
    ? `${userProfile.city}, ${userProfile.department || ''}`
    : (userProfile.department || 'Uruguay')

  const baseBg = isDark ? '#0f172a' : 'white'
  const borderColor = isDark ? '#1e293b' : '#e2e8f0'

  return (
    <article style={{
      borderRadius: r['2xl'], background: baseBg, border: `1px solid ${borderColor}`,
      padding: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: r['xl'], 
          background: isDark ? '#1e293b' : '#f1f5f9',
          color: isDark ? 'white' : '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '1.125rem', flexShrink: 0
        }}>
          {userProfile.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ fontWeight: 900, fontSize: '1rem', margin: 0, color: isDark ? 'white' : '#0f172a' }}>
              {userProfile.name || 'Usuario'}
            </h3>
            <span style={{
              padding: '0.125rem 0.375rem', borderRadius: r.full,
              background: isDark ? '#431407' : '#ffedd5',
              color: isDark ? '#fdba74' : '#c2410c',
              fontSize: '0.625rem', fontWeight: 900,
              display: 'flex', alignItems: 'center', gap: '0.125rem'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', fontVariationSettings: "'FILL' 1" }}>favorite</span>
              Favorito
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {locationStr} · {lastActive || 'Recientemente'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
        <FavoriteButton targetUserId={userProfile.id} size="lg" />
        <button onClick={handleContact} disabled={contactLoading} style={{
          padding: '0.5rem 1rem', borderRadius: r.xl,
          background: '#ea580c', color: 'white',
          fontWeight: 900, fontSize: '0.875rem', border: 'none', cursor: contactLoading ? 'not-allowed' : 'pointer',
          opacity: contactLoading ? 0.7 : 1
        }}>
          {contactLoading ? '...' : 'Chatear'}
        </button>
      </div>
    </article>
  )
}
