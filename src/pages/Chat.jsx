import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import FavoriteButton from '../components/FavoriteButton'
import ReputationStars from '../components/ReputationStars'
import { useFavoritesStore } from '../stores/favoritesStore'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { useExchangeStore } from '../stores/exchangeStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { EXCHANGE_RESPONSE_LABELS, formatPercent, getExchangePromptVisibility, getExchangeStatusMeta, getMyExchangeResponse } from '../lib/exchangeCompletion'
import { LiveFeed } from '../components/LiveMomentum'
import { useLiveMomentum } from '../hooks/useLiveMomentum'
import { getPresenceLabel } from '../lib/liveMomentum'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useAppStore()
  const completion = useExchangeStore((state) => state.completions[chatId] || null)
  const trigger = useExchangeStore((state) => state.triggers[chatId] || null)
  const fetchCompletionState = useExchangeStore((state) => state.fetchCompletionState)
  const submitExchangeResponse = useExchangeStore((state) => state.submitResponse)
  const exchangeLoading = useExchangeStore((state) => state.loading)
  const refreshGamification = useGamificationStore((state) => state.fetchGamification)
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [otherStars, setOtherStars] = useState(1)
  const [exchangeData, setExchangeData] = useState({ theyCanGiveMe: [], iCanGiveThem: [], loading: true, albumName: '' })
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSummaryDetails, setShowSummaryDetails] = useState(false)
  const bottomRef = useRef(null)
  const toast = useToast()
  const { summary, feed } = useLiveMomentum()

  useEffect(() => {
    if (chatId && profile?.id) {
      fetchMessages(chatId)
      fetchCompletionState(chatId)
      const unsub = subscribeToMessages(chatId)

      const loadChatData = async () => {
        const { data: chat } = await supabase.from('chats')
          .select('*, profile1:profiles!chats_user_1_fkey(id,name,avatar_url,city,department,is_premium,plan_name,is_verified,account_type), profile2:profiles!chats_user_2_fkey(id,name,avatar_url,city,department,is_premium,plan_name,is_verified,account_type), album:albums(*)')
          .eq('id', chatId).single()

        if (chat) {
          const other = chat.user_1 === profile.id ? chat.profile2 : chat.profile1
          setOtherUser(other)

          // Fetch other user's star rating
          supabase.rpc('get_user_stars', { p_user_id: other.id })
            .then(({ data }) => setOtherStars(data || 1))
            .catch(() => setOtherStars(1))

          const [myMissingRes, myDupRes, theirMissingRes, theirDupRes] = await Promise.all([
            supabase.from('stickers_missing').select('sticker_number').eq('user_id', profile.id).eq('album_id', chat.album_id),
            supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', profile.id).eq('album_id', chat.album_id),
            supabase.from('stickers_missing').select('sticker_number').eq('user_id', other.id).eq('album_id', chat.album_id),
            supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', other.id).eq('album_id', chat.album_id)
          ])

          const myMissing = new Set((myMissingRes.data || []).map(s => String(s.sticker_number)))
          const myDup = new Set((myDupRes.data || []).map(s => String(s.sticker_number)))
          const theirMissing = new Set((theirMissingRes.data || []).map(s => String(s.sticker_number)))
          const theirDup = (theirDupRes.data || []).map(s => String(s.sticker_number))

          const theyCanGiveMe = theirDup.filter(num => myMissing.has(num))
          const iCanGiveThem = [...myDup].filter(num => theirMissing.has(num))

          setExchangeData({ theyCanGiveMe, iCanGiveThem, loading: false, albumName: chat.album?.name || 'Album' })
        }
      }

      loadChatData()
      return unsub
    }
  }, [chatId, profile?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    await sendMessage(chatId, profile.id, text.trim())
    fetchCompletionState(chatId)
    setText('')
  }

  const { removeFavorite } = useFavoritesStore()

  const handleBlock = async () => {
    if (!otherUser) return

    await supabase.from('user_blocks').insert({
      blocker_id: profile.id,
      blocked_id: otherUser.id,
      reason: 'Bloqueado desde chat'
    })

    await removeFavorite(profile.id, otherUser.id)
    setShowBlockConfirm(false)
    toast.success('Usuario bloqueado')
    navigate('/chats')
  }

  const handleReport = async () => {
    if (!otherUser) return
    if (!reportReason.trim()) {
      toast.error('Escribe un motivo para enviar el reporte')
      return
    }

    setReporting(true)
    await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_user_id: otherUser.id,
      reported_chat_id: chatId,
      type: 'chat_report',
      reason: reportReason.trim(),
      status: 'pending'
    })
    setReporting(false)
    setReportReason('')
    setShowReportModal(false)
    toast.success('Reporte enviado. Un administrador lo revisara a la brevedad.')
  }

  const formatMessageTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const otherName = otherUser?.name || 'Cargando...'
  const otherInitial = otherName[0]?.toUpperCase() || '?'
  const presenceLabel = getPresenceLabel(otherUser?.last_active)
  const locationText = otherUser ? `${otherUser.city || otherUser.department || 'Sin ubicacion'} · ${exchangeData.albumName}` : 'Cargando...'
  const incomingCount = exchangeData.theyCanGiveMe.length
  const outgoingCount = exchangeData.iCanGiveThem.length
  const totalMoves = incomingCount + outgoingCount
  const promptVisibility = getExchangePromptVisibility(completion, trigger, profile?.id)
  const myExchangeResponse = getMyExchangeResponse(completion, profile?.id)
  const statusMeta = getExchangeStatusMeta(completion?.status || (trigger?.should_prompt ? 'pending_confirmation' : 'pending'))
  const triggerScore = Math.round(Number(trigger?.score || completion?.trigger_score || 0))

  const handleExchangeResponse = async (response) => {
    const result = await submitExchangeResponse(chatId, profile?.id, response)
    if (!result) {
      toast.error('No se pudo registrar la confirmacion')
      return
    }

    await refreshGamification(profile?.id)

    if (response === 'yes') toast.success('Confirmacion registrada')
    if (response === 'no') toast.success('Marcaste este intercambio como no concretado')
    if (response === 'not_yet') toast.success('Seguimos pendiente de cierre')
  }

  return (
    <div className="chat-page-root">
      <div className="chat-layout">
        <main className="chat-main">
          <header className="chat-header">
            <div className="header-left">
              <button className="chat-back-btn" onClick={() => navigate('/chats')}>&larr;</button>
              <div 
                className="chat-avatar" 
                style={{ cursor: otherUser?.username ? 'pointer' : 'default' }}
                onClick={() => {
                  if (otherUser?.username) navigate(`/u/${otherUser.username}`)
                }}
              >
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherName} />
                ) : (
                  <img 
                    src={otherUser?.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'} 
                    alt={otherName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div className="header-copy">
                <div className="chat-name-row">
                  <h2 
                    className="chat-header-name" 
                    style={{ cursor: otherUser?.username ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (otherUser?.username) navigate(`/u/${otherUser.username}`)
                    }}
                  >
                    {otherName}
                  </h2>
                  <ReputationStars stars={otherStars} size="sm" inline />
                  <span className="status-pill green">{presenceLabel}</span>
                </div>
                <p className="chat-header-loc">{locationText}</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="header-actions desktop-only">
              {otherUser?.id && <FavoriteButton targetUserId={otherUser.id} size="sm" showLabel />}
              <button className="ghost-btn" onClick={() => setShowBlockConfirm(true)}>Bloquear</button>
              <button className="danger-btn" onClick={() => setShowReportModal(true)}>Reportar</button>
            </div>

            {/* Mobile Kebab Menu */}
            <div className="chat-mobile-menu-container" style={{ position: 'relative' }}>
              <button 
                className="chat-kebab-btn"
                aria-label="Opciones del chat"
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main, #fff)',
                  fontSize: '1.4rem',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                ⋮
              </button>

              {showMenu && (
                <div 
                  className="chat-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 100,
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    minWidth: '180px',
                    padding: '6px 0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {(otherUser?.username || otherUser?.id) && (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        navigate(otherUser?.username ? `/u/${otherUser.username}` : `/u/${otherUser.id}`)
                      }}
                      style={{
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                      Ver perfil
                    </button>
                  )}
                  {otherUser?.id && (
                    <div style={{ padding: '8px 14px' }}>
                      <FavoriteButton targetUserId={otherUser.id} size="sm" showLabel />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowBlockConfirm(true)
                    }}
                    style={{
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ffaa00',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>block</span>
                    Bloquear usuario
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowReportModal(true)
                    }}
                    style={{
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ff4444',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>flag</span>
                    Reportar
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Compact summary bar with expand toggle */}
          <section className="chat-summary-strip" style={{
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 12px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="mini-pill blue" style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(37,99,235,0.2)', color: '#60a5fa', fontWeight: 'bold' }}>
                {exchangeData.albumName || 'Album'}
              </span>
              <span>
                Te da: <b style={{ color: '#10b981' }}>{incomingCount}</b> · Le das: <b style={{ color: '#ff5a00' }}>{outgoingCount}</b>
              </span>
            </div>
            <button 
              onClick={() => setShowSummaryDetails(!showSummaryDetails)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--orange, #ff5a00)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                padding: '4px 8px'
              }}
            >
              {showSummaryDetails ? 'Ocultar detalles ▲' : 'Ver figuritas ▼'}
            </button>
          </section>

          {/* Expandable exchange details (or desktop hero) */}
          {(showSummaryDetails || window.innerWidth >= 1024) && (
            <section className="hero-strip">
              <div className="hero-main">
                <div className="header-kicker">// intercambio activo</div>
                <h1 className="hero-title">Todavía podés cerrar este <span>cruce hoy</span>.</h1>
                <p className="hero-copy">Usá el chat para confirmar figuritas, fijar lugar y convertir esta ventana activa en intercambio real.</p>
                <div className="hero-stats">
                  <div className="hero-stat">
                    <b>{incomingCount}</b>
                    <span>Te puede dar</span>
                  </div>
                  <div className="hero-stat">
                    <b>{outgoingCount}</b>
                    <span>Vos le das</span>
                  </div>
                  <div className="hero-stat">
                    <b>{totalMoves}</b>
                    <span>Figus en juego</span>
                  </div>
                </div>
              </div>
              <aside className="hero-side">
                <div>
                  <div className="summary-label">Siguiente acción</div>
                  <div className="hero-side-title">Coordina punto, horario y canje.</div>
                  <p>Si el cruce está claro, avanzá ahora a una confirmación concreta en un lugar público.</p>
                </div>
                <div className="hero-stats">
                  <span className="mini-pill blue">{exchangeData.albumName || 'Album'}</span>
                  <span className="mini-pill green">{presenceLabel}</span>
                  <span className="mini-pill orange">{summary.exchangesToday} cierres hoy</span>
                </div>
              </aside>
            </section>
          )}

          {promptVisibility.visible && (
            <section className="completion-card">
              <div className="completion-top">
                <div>
                  <div className="header-kicker">// exchange completion</div>
                  <h3 className="completion-title">¿Se concreto el intercambio?</h3>
                  <p className="completion-copy">
                    {completion?.status === 'completed' && 'Quedo confirmado por ambas partes. Este cierre ya impacta reputacion, ranking y progreso.'}
                    {completion?.status === 'pending_confirmation' && 'Una de las partes ya respondio. Falta la otra confirmacion para cerrar el resultado real.'}
                    {completion?.status === 'disputed' && 'Las respuestas no coinciden. Queda registrado como inconsistente y puede revisarse desde admin.'}
                    {completion?.status === 'not_completed' && 'Quedo registrado como intento no concretado. No cuenta como intercambio cerrado.'}
                    {completion?.status === 'expired' && 'La ventana de confirmacion vencio. El sistema lo toma como expirado hasta nueva revision.'}
                    {!completion?.status && trigger?.should_prompt && 'Hay señales reales de coordinacion en este chat. Cerralo en un toque cuando ya haya pasado.'}
                    {completion?.status === 'pending' && 'Todavia no esta cerrado. Cuando lo hagan, confirmalo aca para que cuente como intercambio real.'}
                  </p>
                </div>
                <span className="status-pill" style={{ color: statusMeta.tone, borderColor: `${statusMeta.tone}55`, background: `${statusMeta.tone}12` }}>
                  {statusMeta.label}
                </span>
              </div>

              {(completion?.status === 'pending' || completion?.status === 'pending_confirmation' || (!completion && trigger?.should_prompt)) && (
                <div className="completion-actions">
                  <button className="primary" disabled={exchangeLoading || myExchangeResponse === 'yes'} onClick={() => handleExchangeResponse('yes')}>
                    {exchangeLoading && myExchangeResponse !== 'yes' ? 'Guardando...' : EXCHANGE_RESPONSE_LABELS.yes}
                  </button>
                  <button className="warn" disabled={exchangeLoading || myExchangeResponse === 'not_yet'} onClick={() => handleExchangeResponse('not_yet')}>
                    {EXCHANGE_RESPONSE_LABELS.not_yet}
                  </button>
                  <button className="danger" disabled={exchangeLoading || myExchangeResponse === 'no'} onClick={() => handleExchangeResponse('no')}>
                    {EXCHANGE_RESPONSE_LABELS.no}
                  </button>
                </div>
              )}

              <div className="completion-grid">
                <div className="completion-stat">
                  <b>{triggerScore}</b>
                  <span>Intent score</span>
                </div>
                <div className="completion-stat">
                  <b>{completion?.user_1_response || completion?.user_2_response ? '1+' : '0'}</b>
                  <span>Confirmaciones</span>
                </div>
                <div className="completion-stat">
                  <b>{trigger?.message_count || 0}</b>
                  <span>Mensajes</span>
                </div>
                <div className="completion-stat">
                  <b>{completion?.is_suspicious ? 'Rev.' : 'OK'}</b>
                  <span>Anti abuso</span>
                </div>
              </div>
            </section>
          )}

          {!exchangeData.loading && (incomingCount > 0 || outgoingCount > 0) && (
            <section className="exchange-strip">
              <div className="exchange-grid">
                {incomingCount > 0 && (
                  <div className="exchange-box">
                    <div className="exchange-title green">{otherName} te puede dar</div>
                    <div className="chips">
                      {exchangeData.theyCanGiveMe.map(num => (
                        <span key={`they-${num}`} className="chip green">{num}</span>
                      ))}
                    </div>
                  </div>
                )}
                {outgoingCount > 0 && (
                  <div className="exchange-box">
                    <div className="exchange-title orange">Vos le podes dar</div>
                    <div className="chips">
                      {exchangeData.iCanGiveThem.map(num => (
                        <span key={`me-${num}`} className="chip orange">{num}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="safety-strip">Coordin a en lugares publicos. No compartas datos sensibles ni pagos por fuera.</div>

          <section className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-chat">
                <b>Empeza la conversacion</b>
                <span>Da el primer paso para cerrar este intercambio.</span>
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
          </section>

          <footer className="chat-footer">
            <div className="input-row">
              <div className="input-wrap">
                <textarea
                  rows="1"
                  placeholder="Escribi un mensaje..."
                  className="chat-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                />
              </div>
              <button className="send-btn" onClick={handleSend} disabled={!text.trim()}>Enviar</button>
            </div>
            <p className="premium-note">¿Querés saber si leyó tu mensaje? Activa el <a href="/premium" style={{color: 'var(--orange)', textDecoration: 'none'}}>doble check azul con Plus</a>.</p>
          </footer>
        </main>

        <aside className="chat-side">
          <LiveFeed title="Ahora en FigusUY" items={feed} refreshedAt={summary.refreshedAt} />
          <section className="side-card">
            <div className="side-label">Usuario</div>
            <div className="side-title">Perfil del cruce</div>
            <div className="side-user">
              <div className="chat-avatar">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherName} />
                ) : (
                  <img 
                    src={otherUser?.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'} 
                    alt={otherName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div>
                <strong>{otherName}</strong>
                <span>{otherUser?.city || otherUser?.department || 'Sin ubicacion'}{otherUser?.is_verified ? ' · Verificada' : ''}</span>
                <div style={{ marginTop: '6px' }}>
                  <ReputationStars stars={otherStars} size="sm" showLabel />
                </div>
              </div>
            </div>
          </section>

          <section className="side-card side-cta">
            <div className="side-label">Cerrar cruce</div>
            <div className="side-title">Confirma el intercambio</div>
            <p>Si ya paso el canje real, registralo aca. Esta señal alimenta confianza, ranking y logros.</p>
            <button className="cta-btn" onClick={() => promptVisibility.visible ? handleExchangeResponse('yes') : navigate('/matches')}>
              {promptVisibility.visible ? 'Marcar como hecho' : 'Ver mas matches'}
            </button>
          </section>

          <section className="side-card">
            <div className="side-label">Resumen</div>
            <div className="side-title">Lectura rapida</div>
            <div className="side-row"><span>Te da</span><b>{incomingCount} figus</b></div>
            <div className="side-row"><span>Le das</span><b>{outgoingCount} figus</b></div>
            <div className="side-row"><span>Album</span><b>{exchangeData.albumName || 'Album'}</b></div>
            <div className="side-row"><span>Estado</span><b>{statusMeta.label}</b></div>
          </section>

          <section className="side-card">
            <div className="side-label">Consejo</div>
            <div className="side-title">Antes del encuentro</div>
            <p>Confirma por mensaje las figuritas exactas para evitar confusiones y coordina siempre en un punto visible.</p>
          </section>
        </aside>
      </div>
      <ConfirmDialog
        isOpen={showBlockConfirm}
        title="Bloquear usuario"
        message={`Ya no podras interactuar con ${otherUser?.name || 'este usuario'} ni verlo en tus favoritos.`}
        confirmText="Bloquear"
        cancelText="Cancelar"
        onConfirm={handleBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />
      {showReportModal && (
        <div className="report-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-card" onClick={(e) => e.stopPropagation()}>
            <div className="header-kicker" style={{ marginBottom: '0.75rem' }}>Reporte</div>
            <h3 style={{ margin: 0, font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>
              Reportar a {otherUser?.name || 'usuario'}
            </h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: '0.85rem' }}>
              Explica brevemente por que estas reportando esta conversacion. El equipo lo revisara manualmente.
            </p>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="Describe el motivo del reporte"
              style={{
                width: '100%',
                minHeight: '110px',
                marginTop: '1rem',
                padding: '0.9rem',
                border: '1px solid var(--line2)',
                background: 'var(--panel)',
                color: '#fff',
                resize: 'vertical'
              }}
            />
            <div className="report-actions">
              <button className="ghost-btn" onClick={() => setShowReportModal(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="danger-btn" onClick={handleReport} disabled={reporting} style={{ flex: 1 }}>
                {reporting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
