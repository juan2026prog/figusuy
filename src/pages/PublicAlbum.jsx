import React, { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePublicProfileStore } from '../stores/publicProfileStore'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'

export default function PublicAlbum() {
  const { username, albumId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { publicAlbum, loading, error, fetchPublicAlbum } = usePublicProfileStore()
  const createOrGetChat = useAppStore(state => state.createOrGetChat)

  useEffect(() => {
    if (username && albumId) {
      fetchPublicAlbum(username, albumId, user?.id)
    }
  }, [username, albumId, user?.id])

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <span className="material-symbols-outlined spinning" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>refresh</span>
      </div>
    )
  }

  if (error || !publicAlbum) {
    return (
      <div className="flex-center flex-col gap-md" style={{ minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--color-danger)' }}>error</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{error || 'Ãlbum no encontrado'}</h2>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Volver</button>
      </div>
    )
  }

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const chat = await createOrGetChat(user.id, publicAlbum.profile.id, albumId)
      navigate(`/chat/${chat.id}`)
    } catch (err) {
      console.error('Error opening chat', err)
      alert('Error al intentar abrir el chat')
    }
  }

  const { name, year, cover_url, show_progress, show_missing, show_repeated, progress, total_stickers, profile, missing, duplicate, matchInfo } = publicAlbum
  const progressPercent = show_progress && total_stickers > 0 ? Math.round((progress / total_stickers) * 100) : null

  return (
    <div className="public-album-page" style={{ padding: '2rem 1rem', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HEADER ALBUM */}
      <div className="glass-panel" style={{ display: 'flex', gap: '1.5rem', padding: '2rem', borderRadius: '24px', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <img src={cover_url} alt={name} style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{name}</h1>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{year}</span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Colección de <Link to={`/u/${username}`} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>@{username}</Link></p>
          
          {show_progress && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                <span>Progreso</span>
                <span style={{ color: 'var(--color-primary)' }}>{progressPercent}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-primary)', width: `${progressPercent}%`, borderRadius: '4px' }}></div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{progress} de {total_stickers} figuritas</p>
            </div>
          )}

          {!profile.is_owner && (
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={handleStartChat}>
              <span className="material-symbols-outlined">chat</span>
              Abrir Chat
            </button>
          )}
        </div>
      </div>

      {/* MATCH SECTION */}
      {!profile.is_owner && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>handshake</span>
            Match Social
          </h2>
          
          {!user ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Creá tu cuenta o iniciá sesión para ver si tienen un match posible.</p>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Entrar</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {matchInfo.canGiveVisitor.length === 0 && matchInfo.visitorCanGive.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>Actualmente no hay figuritas para intercambiar entre ustedes en este álbum.</p>
              ) : (
                <>
                  {matchInfo.canGiveVisitor.length > 0 && (
                    <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-success)' }}>
                      <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-success)' }}>Tiene {matchInfo.canGiveVisitor.length} que te faltan:</p>
                      <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{matchInfo.canGiveVisitor.slice(0, 10).join(', ')}{matchInfo.canGiveVisitor.length > 10 ? '...' : ''}</p>
                    </div>
                  )}
                  {matchInfo.visitorCanGive.length > 0 && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-info)' }}>
                      <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-info)' }}>Vos tenés {matchInfo.visitorCanGive.length} que le sirven:</p>
                      <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{matchInfo.visitorCanGive.slice(0, 10).join(', ')}{matchInfo.visitorCanGive.length > 10 ? '...' : ''}</p>
                    </div>
                  )}
                  {matchInfo.mutual && (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: '#000', padding: '4px 12px', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>verified</span>
                        Match Ideal Posible
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* STICKERS LIST */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {show_repeated && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined">content_copy</span>
              Repetidas ({duplicate.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {duplicate.length > 0 ? duplicate.map(n => (
                <span key={n} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {n}
                </span>
              )) : (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No hay repetidas.</span>
              )}
            </div>
          </div>
        )}

        {show_missing && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined">search</span>
              Faltantes ({missing.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {missing.length > 0 ? missing.map(n => (
                <span key={n} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {n}
                </span>
              )) : (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No hay faltantes.</span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
