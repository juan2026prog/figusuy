import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import FavoriteButton from '../components/FavoriteButton'
import { useFavoritesStore } from '../stores/favoritesStore'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useAppStore()
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [exchangeData, setExchangeData] = useState({ theyCanGiveMe: [], iCanGiveThem: [], loading: true, albumName: '' })
  const bottomRef = useRef(null)

  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (chatId && profile?.id) {
      fetchMessages(chatId)
      const unsub = subscribeToMessages(chatId)

      const loadChatData = async () => {
        const { data: chat } = await supabase.from('chats')
          .select('*, profile1:profiles!chats_user_1_fkey(id,name,avatar_url,city,department,is_premium,plan_name,is_verified), profile2:profiles!chats_user_2_fkey(id,name,avatar_url,city,department,is_premium,plan_name,is_verified), album:albums(*)')
          .eq('id', chatId).single()

        if (chat) {
          const other = chat.user_1 === profile.id ? chat.profile2 : chat.profile1
          setOtherUser(other)

          const [myMissingRes, myDupRes, theirMissingRes, theirDupRes, expirationRes] = await Promise.all([
            supabase.from('stickers_missing').select('sticker_number').eq('user_id', profile.id).eq('album_id', chat.album_id),
            supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', profile.id).eq('album_id', chat.album_id),
            supabase.from('stickers_missing').select('sticker_number').eq('user_id', other.id).eq('album_id', chat.album_id),
            supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', other.id).eq('album_id', chat.album_id),
            supabase.rpc('get_chat_expiration_state', { p_chat_id: chatId, p_user_id: profile.id })
          ])

          if (expirationRes.data?.is_expired) {
            setIsExpired(true)
          }

          const myMissing = new Set((myMissingRes.data || []).map(s => String(s.sticker_number)))
          const myDup = new Set((myDupRes.data || []).map(s => String(s.sticker_number)))
          const theirMissing = new Set((theirMissingRes.data || []).map(s => String(s.sticker_number)))
          const theirDup = (theirDupRes.data || []).map(s => String(s.sticker_number))

          const theyCanGiveMe = theirDup.filter(num => myMissing.has(num))
          const iCanGiveThem = [...myDup].filter(num => theirMissing.has(num))

          setExchangeData({ theyCanGiveMe, iCanGiveThem, loading: false, albumName: chat.album?.name || 'Álbum' })
        }
      }

      loadChatData()
      return unsub
    }
  }, [chatId, profile?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim() || isExpired) return
    sendMessage(chatId, profile.id, text.trim())
    setText('')
  }

  const { removeFavorite } = useFavoritesStore()

  const handleBlock = async () => {
    if (!otherUser) return
    const confirm = window.confirm(`¿Estás seguro de que querés bloquear a ${otherUser.name}? Ya no podrás interactuar con este usuario.`)
    if (!confirm) return
    
    await supabase.from('user_blocks').insert({
      blocker_id: profile.id,
      blocked_id: otherUser.id,
      reason: 'Bloqueado desde chat'
    })
    
    await removeFavorite(profile.id, otherUser.id)
    
    alert('Usuario bloqueado')
    navigate('/chats')
  }

  const handleReport = async () => {
    if (!otherUser) return
    const reason = window.prompt(`¿Por qué estás reportando a ${otherUser.name}?`)
    if (!reason) return
    
    await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_user_id: otherUser.id,
      reported_chat_id: chatId,
      type: 'chat_report',
      reason: reason,
      status: 'pending'
    })
    alert('Reporte enviado. Un administrador lo revisará a la brevedad.')
  }

  const formatMessageTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const otherName = otherUser?.name || 'Cargando...'
  const otherInitial = otherName[0]?.toUpperCase() || '?'
  const locationText = otherUser ? `${otherUser.city || otherUser.department || 'Sin ubicación'} · ${exchangeData.albumName}` : 'Cargando...'

  return (
    <div className="chat-page-root">
      <style>{`
        .chat-page-root {
          background-color: #020617; /* slate-950 */
          height: 100vh;
          color: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-container {
          max-width: 48rem;
          width: 100%;
          margin: 0 auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #020617;
          border-left: 1px solid #1e293b;
          border-right: 1px solid #1e293b;
          position: relative;
          overflow: hidden;
        }

        .chat-header {
          height: 5rem;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1e293b;
          background-color: #020617;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .chat-back-btn {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 1rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .chat-header-avatar {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 1rem;
          background-color: #ea580c; /* brand-600 */
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
        }

        .chat-header-info {
          min-width: 0;
        }

        .chat-header-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .chat-header-name {
          font-weight: 900;
          font-size: 1.125rem;
          margin: 0;
          color: white;
        }

        .badge-online {
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          background-color: rgba(6, 78, 59, 0.4);
          color: #6ee7b7;
          font-size: 10px;
          font-weight: 900;
        }

        .badge-match {
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          background-color: rgba(124, 45, 18, 0.4);
          color: #fdba74;
          font-size: 10px;
          font-weight: 900;
        }

        .chat-header-loc {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.125rem 0 0 0;
        }

        .chat-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn-report {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          background-color: rgba(127, 29, 29, 0.3);
          border: 1px solid rgba(127, 29, 29, 0.5);
          color: #fca5a5;
          font-size: 0.75rem;
          font-weight: 900;
          cursor: pointer;
        }

        .action-btn-block {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          background-color: #0f172a;
          border: 1px solid #334155;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 900;
          cursor: pointer;
        }

        .exchange-summary {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #1e293b;
        }

        .exchange-card {
          border-radius: 1.5rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          padding: 1rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .exchange-card {
            grid-template-columns: 1fr 1fr;
          }
        }

        .exchange-title {
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 0.5rem;
        }

        .text-emerald { color: #6ee7b7; }
        .text-orange { color: #fdba74; }

        .exchange-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .chip {
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.8125rem;
          font-weight: 900;
          border-width: 1px;
          border-style: solid;
        }

        .chip-emerald {
          background-color: rgba(6, 78, 59, 0.3);
          border-color: rgba(6, 78, 59, 0.6);
          color: #6ee7b7;
        }

        .chip-orange {
          background-color: rgba(124, 45, 18, 0.3);
          border-color: rgba(124, 45, 18, 0.6);
          color: #fdba74;
        }

        .safety-note {
          padding: 0.75rem 1.25rem;
          background-color: rgba(120, 53, 15, 0.2);
          border-bottom: 1px solid rgba(120, 53, 15, 0.4);
        }

        .safety-note p {
          font-size: 0.75rem;
          font-weight: 700;
          color: #fef3c7;
          margin: 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .msg-row {
          display: flex;
          width: 100%;
        }

        .msg-left { justify-content: flex-start; }
        .msg-right { justify-content: flex-end; }

        .bubble {
          max-width: 82%;
          padding: 0.75rem 1rem;
          border-radius: 1.5rem;
          position: relative;
        }

        .bubble-other {
          background-color: #0f172a;
          border: 1px solid #1e293b;
          color: white;
          border-bottom-left-radius: 0.25rem;
        }

        .bubble-own {
          background-color: #ea580c;
          color: white;
          border-bottom-right-radius: 0.25rem;
        }

        .msg-text {
          font-size: 0.875rem;
          margin: 0;
        }

        .msg-time {
          font-size: 10px;
          margin-top: 0.375rem;
          font-weight: 700;
          opacity: 0.6;
        }

        .chat-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid #1e293b;
          background-color: #020617;
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        .input-row {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
        }

        .chat-input-wrapper {
          flex: 1;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 1.5rem;
          padding: 0.75rem 1rem;
        }

        .chat-input {
          width: 100%;
          background: transparent;
          border: none;
          resize: none;
          outline: none;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
        }

        .chat-input::placeholder {
          color: #94a3b8;
        }

        .chat-send-btn {
          height: 3rem;
          padding: 0 1.25rem;
          border-radius: 1rem;
          background-color: #f97316;
          color: white;
          font-weight: 900;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .premium-note {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 0.5rem;
        }
      `}</style>

      <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <button className="chat-back-btn" onClick={() => navigate('/chats')}>
              ←
            </button>
            <div className="chat-header-avatar">
              {otherInitial}
            </div>
            <div className="chat-header-info">
              <div className="chat-header-name-row">
                <h2 className="chat-header-name">{otherName}</h2>
                {otherUser?.id && <FavoriteButton targetUserId={otherUser.id} size="sm" showLabel />}
                <span className="badge-online">En línea</span>
                <span className="badge-match">Intercambio fuerte</span>
              </div>
              <p className="chat-header-loc">{locationText}</p>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="action-btn-block" onClick={handleBlock}>Bloquear</button>
            <button className="action-btn-report" onClick={handleReport}>Reportar</button>
          </div>
        </header>

        {/* Exchange summary */}
        {!exchangeData.loading && (exchangeData.theyCanGiveMe.length > 0 || exchangeData.iCanGiveThem.length > 0) && (
          <div className="exchange-summary">
            <div className="exchange-card">
              {exchangeData.theyCanGiveMe.length > 0 && (
                <div style={{ marginBottom: exchangeData.iCanGiveThem.length > 0 ? '1rem' : '0' }}>
                  <p className="exchange-title text-emerald">{otherName} te puede dar</p>
                  <div className="exchange-chips">
                    {exchangeData.theyCanGiveMe.map(num => (
                      <span key={`they-${num}`} className="chip chip-emerald">{num}</span>
                    ))}
                  </div>
                </div>
              )}
              {exchangeData.iCanGiveThem.length > 0 && (
                <div>
                  <p className="exchange-title text-orange">Vos le podés dar</p>
                  <div className="exchange-chips">
                    {exchangeData.iCanGiveThem.map(num => (
                      <span key={`me-${num}`} className="chip chip-orange">{num}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Safety Note */}
        <div className="safety-note">
          <p>🛡️ Recomendamos coordinar intercambios en lugares públicos. Si sos menor, usá la app acompañado por un adulto responsable.</p>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <p style={{ fontSize: '0.875rem' }}>Empezá la conversación 👋</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`msg-row ${msg.sender_id === profile?.id ? 'msg-right' : 'msg-left'}`}>
              <div className={`bubble ${msg.sender_id === profile?.id ? 'bubble-own' : 'bubble-other'}`}>
                <p className="msg-text">{msg.text}</p>
                <p className="msg-time">{formatMessageTime(msg.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <footer className="chat-footer">
          {isExpired ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>Este chat venció en tu plan actual.</p>
              <button 
                onClick={() => navigate('/premium')}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', background: '#f97316', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer' }}
              >
                Reactivar con Plus
              </button>
            </div>
          ) : (
            <>
              <div className="input-row">
                <div className="chat-input-wrapper">
                  <textarea 
                    rows="1" 
                    placeholder="Escribí un mensaje..." 
                    className="chat-input"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                </div>
                <button 
                  className="chat-send-btn" 
                  onClick={handleSend}
                  disabled={!text.trim()}
                >
                  Enviar
                </button>
              </div>
              <p className="premium-note">En plan Gratis, el chat dura 3 días. Premium tiene chat ilimitado.</p>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
