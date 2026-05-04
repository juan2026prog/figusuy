import React from 'react'
import { useFavoritesStore } from '../stores/favoritesStore'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { useToast } from './Toast'

export default function FavoriteButton({ targetUserId, size = 'default', showLabel = false, className = '' }) {
  const { profile, planRules } = useAuthStore()
  const { favoriteIds, toggleFavorite } = useFavoritesStore()
  const { isDark } = useThemeStore()
  const toast = useToast()

  if (!profile || profile.id === targetUserId) return null

  const isFav = favoriteIds.has(targetUserId)

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isFav && planRules?.favorite_limit && favoriteIds.size >= planRules.favorite_limit) {
      toast.warning('Llegaste al limite de favoritos de tu plan. Mejora a Plus para guardar mas perfiles.')
      return
    }

    toggleFavorite(profile.id, targetUserId)
  }

  const iconSize = size === 'sm' ? '1rem' : size === 'lg' ? '1.5rem' : '1.25rem'

  return (
    <button
      onClick={handleToggle}
      className={`fav-btn ${className}`}
      title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: showLabel ? '0.25rem 0.5rem' : 0,
        borderRadius: showLabel ? '0.5rem' : '50%',
        color: isFav ? '#ef4444' : (isDark ? 'var(--color-text-secondary)' : 'var(--color-text-muted)'),
        transition: 'all 0.2s ease',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: iconSize,
          fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0",
          transition: 'all 0.2s ease',
          transform: isFav ? 'scale(1.1)' : 'scale(1)'
        }}
      >
        favorite
      </span>
      {showLabel && (
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {isFav ? 'Guardado' : 'Guardar'}
        </span>
      )}
    </button>
  )
}
