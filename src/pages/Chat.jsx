import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useAppStore()
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId)
      const unsub = subscribeToMessages(chatId)
      // Fetch chat details for other user name
      supabase.from('chats')
        .select('*, profile1:profiles!chats_user_1_fkey(*), profile2:profiles!chats_user_2_fkey(*)')
        .eq('id', chatId).single()
        .then(({ data }) => {
          if (data) {
            setOtherUser(data.user_1 === profile?.id ? data.profile2 : data.profile1)
          }
        })
      return unsub
    }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(chatId, profile.id, text.trim())
    setText('')
  }

  const quickMessages = ['¡Hola! Quiero cambiar', '¿Cuándo podés?', '¡Dale, arreglamos!']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '32rem', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass" style={{
        padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderBottom: '1px solid var(--color-border-light)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate('/chats')} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{
          width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)',
        }}>
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', objectFit: 'cover' }} />
          ) : (otherUser?.name || '?')[0].toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{otherUser?.name || 'Chat'}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '0.875rem' }}>Empezá la conversación 👋</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.sender_id === profile?.id ? 'chat-bubble-own' : 'chat-bubble-other'}`}>
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={{ padding: '0 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {quickMessages.map(qm => (
          <button key={qm} className="btn btn-sm btn-secondary" style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.75rem' }}
            onClick={() => { sendMessage(chatId, profile.id, qm) }}>
            {qm}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border-light)', background: 'var(--color-surface)', display: 'flex', gap: '0.5rem', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Escribí un mensaje..."
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleSend} disabled={!text.trim()}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  )
}
