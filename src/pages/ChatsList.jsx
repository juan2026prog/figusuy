import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import Header from '../components/Header'

export default function ChatsListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { chats, fetchChats } = useAppStore()

  useEffect(() => {
    if (profile?.id) fetchChats(profile.id)
  }, [profile?.id])

  const getOtherUser = (chat) => {
    return chat.user_1 === profile?.id ? chat.profile2 : chat.profile1
  }

  return (
    <div className="page">
      <Header title="Mensajes" subtitle="Chats" />

      {chats.length === 0 && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border-light)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💬</span>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Sin conversaciones</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Contactá a un match para iniciar un chat.</p>
          <button className="btn btn-primary" onClick={() => navigate('/matches')}>Ver matches</button>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {chats.map(chat => {
          const other = getOtherUser(chat)
          return (
            <button key={chat.id} onClick={() => navigate(`/chats/${chat.id}`)}
              className="animate-fade-in-up"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem', background: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-light)',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0,
              }}>
                {other?.avatar_url ? (
                  <img src={other.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', objectFit: 'cover' }} />
                ) : (other?.name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{other?.name || 'Usuario'}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Toca para ver la conversación
                </p>
              </div>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
