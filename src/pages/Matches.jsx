import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import Header from '../components/Header'
import MatchCard from '../components/MatchCard'
import PremiumCTA from '../components/PremiumCTA'

export default function MatchesPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { selectedAlbum, matches, matchesLoading, findMatches, createOrGetChat } = useAppStore()
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (profile?.id && selectedAlbum?.id) {
      findMatches(profile.id, selectedAlbum.id, profile)
    }
  }, [profile?.id, selectedAlbum?.id])

  const handleContact = async (match) => {
    try {
      const chat = await createOrGetChat(profile.id, match.userId, selectedAlbum.id)
      navigate(`/chats/${chat.id}`)
    } catch (err) {
      console.error('Error creating chat:', err)
    }
  }

  if (!selectedAlbum) {
    return (
      <div className="page">
        <Header title="Matches" subtitle="Intercambios" />
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border-light)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Seleccioná un álbum primero</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Necesitás elegir un álbum y cargar tus figuritas.</p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>Elegir álbum</button>
        </div>
      </div>
    )
  }

  let filteredMatches = [...matches]
  if (filter === 'mutual') filteredMatches = filteredMatches.filter(m => m.isMutual)
  else if (filter === 'nearby') filteredMatches = filteredMatches.filter(m => m.distance < 10)

  const isPremium = profile?.is_premium
  const maxFree = 3
  const visible = isPremium ? filteredMatches : filteredMatches.slice(0, maxFree)
  const hidden = isPremium ? 0 : Math.max(0, filteredMatches.length - maxFree)

  return (
    <div className="page">
      <Header title="Matches" subtitle={selectedAlbum.name} rightAction={
        <button className="btn btn-sm btn-secondary" onClick={() => findMatches(profile.id, selectedAlbum.id, profile)}>🔄</button>
      } />

      <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
        <button className={`tab-item ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
        <button className={`tab-item ${filter === 'mutual' ? 'active' : ''}`} onClick={() => setFilter('mutual')}>🔄 Mutuos</button>
        <button className={`tab-item ${filter === 'nearby' ? 'active' : ''}`} onClick={() => setFilter('nearby')}>📍 Cercanos</button>
      </div>

      {matchesLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (<div key={i} className="skeleton" style={{ height: '12rem', borderRadius: 'var(--radius-2xl)' }} />))}
        </div>
      )}

      {!matchesLoading && filteredMatches.length === 0 && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border-light)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>😔</span>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No hay matches todavía</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Cargá tus figuritas faltantes y repetidas.</p>
          <button className="btn btn-primary" onClick={() => navigate('/album')}>Cargar figuritas</button>
        </div>
      )}

      {!matchesLoading && filteredMatches.length > 0 && (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {filteredMatches.length} resultado{filteredMatches.length !== 1 ? 's' : ''}{!isPremium && hidden > 0 ? ` (${hidden} ocultos)` : ''}
          </p>
          {visible.map(match => (<MatchCard key={match.userId} match={match} onContact={handleContact} />))}
          {!isPremium && hidden > 0 && (
            <>
              {filteredMatches.slice(maxFree, maxFree + 2).map(match => (<MatchCard key={match.userId} match={match} blurred={true} />))}
              <PremiumCTA variant="banner" />
            </>
          )}
        </div>
      )}
    </div>
  )
}
