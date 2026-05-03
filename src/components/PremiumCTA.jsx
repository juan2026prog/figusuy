import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { usePremiumAccess } from '../hooks/usePremiumAccess'

export default function PremiumCTA({ variant = 'inline' }) {
  const navigate = useNavigate()
  const { matches } = useAppStore()
  const { profile } = useAuthStore()
  const { isPremium } = usePremiumAccess()
  const [userCount, setUserCount] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count) setUserCount(count)
    })
  }, [])

  if (isPremium) return null

  if (variant === 'banner') {
    return (
      <div className="card-premium animate-fade-in-up" style={{ padding: '1.5rem' }}>
        <div className="deco-circle deco-circle-orange-sm" style={{ right: '-1rem', top: '-1rem', width: '5rem', height: '5rem' }} />
        <div className="deco-circle deco-circle-amber-sm" style={{ right: '2rem', bottom: '-0.5rem', width: '3rem', height: '3rem' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="block text-3xl mb-sm">🚀</span>
          <h3 className="text-lg font-bold mb-xs">
            Acelerá tu búsqueda
          </h3>
          <p className="text-sm mb-lg leading-relaxed" style={{ opacity: 0.85 }}>
            Usá filtros de distancia, detectá si leen tus mensajes y encontrá figuritas más rápido con Plus.
          </p>

          {/* Social proof */}
          {userCount && (
            <p className="text-xs mb-lg" style={{ opacity: 0.7 }}>
              +{userCount.toLocaleString()} usuarios ya confían en FigusUy
            </p>
          )}

          <button className="btn btn-premium w-full" onClick={() => navigate('/premium')}>
            ⭐ Desbloquear Premium
          </button>
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className="animate-fade-in card-interactive"
      onClick={() => navigate('/premium')}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '1px solid #fcd34d',
      }}>
      <span className="text-xl">🚀</span>
      <div style={{ flex: 1 }}>
        <p className="text-sm font-bold" style={{ color: '#92400e' }}>
          Acelerá tu búsqueda
        </p>
        <p className="text-xs" style={{ color: '#a16207' }}>
          Filtros de distancia y más →
        </p>
      </div>
    </div>
  )
}
