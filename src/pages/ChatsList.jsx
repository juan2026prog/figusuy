import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'

import { supabase } from '../lib/supabase'

export default function ChatsListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { chats, fetchChats } = useAppStore()
  const [showBlocked, setShowBlocked] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true)
    const { data: blocks } = await supabase.from('user_blocks').select('*').eq('blocker_id', profile.id)
    if (blocks && blocks.length > 0) {
      const blockedIds = blocks.map(b => b.blocked_id)
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', blockedIds)
      
      const combined = blocks.map(b => ({
        ...b,
        profile: profiles?.find(p => p.id === b.blocked_id)
      }))
      setBlockedUsers(combined)
    } else {
      setBlockedUsers([])
    }
    setLoadingBlocked(false)
  }

  useEffect(() => {
    if (showBlocked && profile?.id) {
      loadBlockedUsers()
    }
  }, [showBlocked, profile?.id])

  const handleUnblock = async (blockId) => {
    await supabase.from('user_blocks').delete().eq('id', blockId)
    setBlockedUsers(prev => prev.filter(b => b.id !== blockId))
  }

  useEffect(() => {
    if (profile?.id) fetchChats(profile.id)
  }, [profile?.id])

  const formatTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0 && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
      return 'Ayer'
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }

  const getOtherUser = (chat) => {
    return chat.user_1 === profile?.id ? chat.profile2 : chat.profile1
  }

  return (
    <div className="chats-list-container">
      <style>{`
        .chats-list-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 64px); /* Subtract BottomNav height */
          max-width: 48rem;
          margin: 0 auto;
          background-color: #020617; /* slate-950 */
          color: white;
          border-left: 1px solid #1e293b;
          border-right: 1px solid #1e293b;
        }

        .chats-list-header {
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid #1e293b;
        }

        .chats-list-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.025em;
          margin: 0;
        }

        .chats-list-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        .chats-search-container {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #1e293b;
        }

        .chats-search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
        }

        .chats-search-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
        }

        .chats-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .chat-card {
          width: 100%;
          text-align: left;
          padding: 1rem;
          border-radius: 1.25rem;
          background-color: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .chat-card:hover {
          background-color: rgba(30, 41, 59, 0.5);
          border-color: #1e293b;
        }

        .chat-card-active {
          background-color: rgba(249, 115, 22, 0.1);
          border-color: rgba(249, 115, 22, 0.3);
        }

        .chat-avatar {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 1rem;
          background-color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: white;
          flex-shrink: 0;
          overflow: hidden;
        }

        .chat-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chat-info {
          flex: 1;
          min-width: 0;
        }

        .chat-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.125rem;
        }

        .chat-name {
          font-weight: 900;
          font-size: 0.9375rem;
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-time {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748b;
          flex-shrink: 0;
        }

        .chat-last-msg {
          font-size: 0.75rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }

        .chat-match-indicator {
          font-size: 0.6875rem;
          font-weight: 900;
          color: #f97316;
          margin-top: 0.25rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          font-weight: 900;
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .empty-desc {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .btn-matches {
          padding: 0.75rem 1.5rem;
          border-radius: 1rem;
          background-color: #f97316;
          color: white;
          font-weight: 900;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
        }
      `}</style>

      <div className="chats-list-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="chats-list-title">Chats</h1>
            <p className="chats-list-subtitle">Intercambios activos</p>
          </div>
          <button 
            onClick={() => setShowBlocked(!showBlocked)}
            style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showBlocked ? 'Volver a chats' : 'Usuarios bloqueados'}
          </button>
        </div>
      </div>

      {!showBlocked && (
        <div className="chats-search-container">
          <input type="text" placeholder="Buscar chat..." className="chats-search-input" />
        </div>
      )}

      <div className="chats-scroll-area">
        {showBlocked ? (
          loadingBlocked ? (
            <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '2rem'}}>Cargando...</p>
          ) : blockedUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛡️</div>
              <p className="empty-title">Sin bloqueados</p>
              <p className="empty-desc">No tenés usuarios bloqueados.</p>
            </div>
          ) : (
            blockedUsers.map(block => (
              <div key={block.id} className="chat-card" style={{ cursor: 'default' }}>
                <div className="chat-avatar">
                  {block.profile?.avatar_url ? (
                    <img src={block.profile.avatar_url} alt="" />
                  ) : (
                    (block.profile?.name || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="chat-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="chat-name">{block.profile?.name || 'Usuario'}</h3>
                    <p className="chat-last-msg">Bloqueado</p>
                  </div>
                  <button 
                    onClick={() => handleUnblock(block.id)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#334155', color: 'white', border: 'none', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Desbloquear
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          chats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p className="empty-title">Sin conversaciones</p>
              <p className="empty-desc">Contactá a un match para iniciar un chat.</p>
              <button className="btn-matches" onClick={() => navigate('/matches')}>Ver intercambios</button>
            </div>
          ) : (
            chats.map(chat => {
              const other = getOtherUser(chat)
              return (
                <button 
                  key={chat.id} 
                  className="chat-card"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div className="chat-avatar">
                    {other?.avatar_url ? (
                      <img src={other.avatar_url} alt="" />
                    ) : (
                      (other?.name || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name-row">
                      <h3 className="chat-name">{other?.name || 'Usuario'}</h3>
                      <span className="chat-time">{formatTime(chat.last_message_at || chat.created_at)}</span>
                    </div>
                    <p className="chat-last-msg">{chat.last_message_preview || 'Toca para ver la conversación'}</p>
                    <p className="chat-match-indicator">Ir al chat</p>
                  </div>
                </button>
              )
            })
          )
        )}
      </div>
    </div>
  )
}
