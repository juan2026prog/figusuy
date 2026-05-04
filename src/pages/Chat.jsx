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

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useAppStore()
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState(null)
  const [otherStars, setOtherStars] = useState(1)
  const [exchangeData, setExchangeData] = useState({ theyCanGiveMe: [], iCanGiveThem: [], loading: true, albumName: '' })
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const bottomRef = useRef(null)
  const toast = useToast()

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

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(chatId, profile.id, text.trim())
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
  const locationText = otherUser ? `${otherUser.city || otherUser.department || 'Sin ubicacion'} · ${exchangeData.albumName}` : 'Cargando...'
  const incomingCount = exchangeData.theyCanGiveMe.length
  const outgoingCount = exchangeData.iCanGiveThem.length
  const totalMoves = incomingCount + outgoingCount

  return (
    <div className="chat-page-root">
      <style>{`
        .chat-page-root {
          --bg:#0b0b0b; --panel:#121212; --panel2:#181818; --panel3:#202020; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
          --text:#f5f5f5; --muted:rgba(245,245,245,.56); --muted2:rgba(245,245,245,.34); --orange:#ff5a00; --orange2:#cc4800; --green:#22c55e; --red:#ef4444; --yellow:#facc15; --blue:#38bdf8;
          min-height:100vh; background:var(--bg); color:var(--text); font-family:'Barlow',sans-serif;
        }
        .chat-page-root * { box-sizing:border-box; }
        .chat-layout { min-height:100vh; display:grid; grid-template-columns:minmax(0,1fr) 320px; }
        .chat-main { min-height:100vh; display:flex; flex-direction:column; background:radial-gradient(circle at 18% 0%, rgba(255,90,0,.06), transparent 24%), var(--bg); border-right:1px solid var(--line); }
        .chat-header { position:sticky; top:0; z-index:20; display:flex; justify-content:space-between; align-items:center; gap:18px; min-height:90px; padding:16px 18px; border-bottom:1px solid var(--line); background:rgba(11,11,11,.96); backdrop-filter:blur(8px); }
        .header-left { display:flex; gap:12px; align-items:center; min-width:0; }
        .chat-back-btn,.ghost-btn,.danger-btn,.send-btn,.cta-btn { font-family:inherit; cursor:pointer; }
        .chat-back-btn { width:42px; height:42px; border:1px solid var(--line2); background:var(--panel); color:#fff; font:900 1.15rem 'Barlow Condensed'; }
        .chat-avatar { width:54px; height:54px; overflow:hidden; display:grid; place-items:center; background:var(--orange); font:italic 900 1.7rem 'Barlow Condensed'; flex-shrink:0; }
        .chat-avatar img { width:100%; height:100%; object-fit:cover; }
        .header-copy { min-width:0; }
        .header-kicker,.summary-label,.side-label { font:900 .7rem 'Barlow Condensed'; letter-spacing:.16em; text-transform:uppercase; color:var(--orange); }
        .chat-name-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .chat-header-name { margin:0; font:italic 900 clamp(1.5rem,3vw,2rem) 'Barlow Condensed'; line-height:.88; text-transform:uppercase; }
        .chat-header-loc { margin:.25rem 0 0; color:var(--muted); font-size:.84rem; }
        .status-pill,.mini-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border:1px solid var(--line2); background:#0d0d0d; font:900 .63rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .status-pill.green,.mini-pill.green { color:var(--green); border-color:rgba(34,197,94,.35); background:rgba(34,197,94,.07); }
        .status-pill.orange,.mini-pill.orange { color:var(--orange); border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); }
        .status-pill.blue,.mini-pill.blue { color:var(--blue); border-color:rgba(56,189,248,.35); background:rgba(56,189,248,.08); }
        .header-actions { display:flex; gap:8px; align-items:center; }
        .ghost-btn,.danger-btn,.cta-btn { border:1px solid var(--line2); background:transparent; color:#fff; padding:.72rem .95rem; font:900 .76rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .ghost-btn:hover,.cta-btn:hover { border-color:var(--orange); color:var(--orange); }
        .danger-btn { color:#fca5a5; border-color:rgba(239,68,68,.35); background:rgba(239,68,68,.08); }
        .hero-strip { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(240px,.85fr); gap:1px; background:var(--line); border-bottom:1px solid var(--line); }
        .hero-main,.hero-side { padding:16px 18px; background:var(--panel); }
        .hero-main { background:linear-gradient(135deg, rgba(255,90,0,.12) 0%, rgba(255,90,0,.03) 30%, transparent 50%), var(--panel); }
        .hero-title { margin:8px 0 0; font:italic 900 clamp(2.2rem,4.2vw,3.4rem) 'Barlow Condensed'; line-height:.88; text-transform:uppercase; }
        .hero-title span { color:var(--orange); }
        .hero-copy { margin-top:8px; color:var(--muted); font-size:.92rem; line-height:1.55; max-width:52rem; }
        .hero-stats { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
        .hero-stat { min-width:110px; padding:10px 12px; border:1px solid var(--line); background:#0d0d0d; }
        .hero-stat b { display:block; font:italic 900 1.7rem 'Barlow Condensed'; line-height:.9; }
        .hero-stat span { font:900 .7rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; color:var(--muted2); }
        .hero-side { display:flex; flex-direction:column; justify-content:space-between; gap:12px; background:linear-gradient(180deg, rgba(255,90,0,.08) 0%, rgba(255,90,0,0) 100%), var(--panel2); }
        .hero-side-title { font:italic 900 1.75rem 'Barlow Condensed'; line-height:.9; text-transform:uppercase; }
        .hero-side p { color:var(--muted); font-size:.9rem; line-height:1.5; margin:8px 0 0; }
        .exchange-strip { padding:14px 18px; border-bottom:1px solid var(--line); background:var(--panel); }
        .exchange-grid { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); border:1px solid var(--line); }
        .exchange-box { background:#0d0d0d; padding:14px; }
        .exchange-title { margin-bottom:10px; font:900 .72rem 'Barlow Condensed'; letter-spacing:.12em; text-transform:uppercase; }
        .exchange-title.green { color:var(--green); }
        .exchange-title.orange { color:var(--orange); }
        .chips { display:flex; flex-wrap:wrap; gap:6px; }
        .chip { border:1px solid var(--line2); padding:6px 9px; background:#090909; font:900 .78rem 'Barlow Condensed'; }
        .chip.green { color:var(--green); border-color:rgba(34,197,94,.34); background:rgba(34,197,94,.07); }
        .chip.orange { color:var(--orange); border-color:rgba(255,90,0,.34); background:rgba(255,90,0,.08); }
        .safety-strip { padding:10px 18px; border-bottom:1px solid rgba(250,204,21,.2); background:rgba(250,204,21,.06); color:#fde68a; font-size:.78rem; font-weight:700; }
        .chat-messages { flex:1; overflow:auto; padding:22px 18px 24px; display:flex; flex-direction:column; gap:14px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }
        .empty-chat { padding:48px 20px; text-align:center; color:var(--muted2); }
        .empty-chat b { display:block; margin-bottom:8px; font:italic 900 2rem 'Barlow Condensed'; text-transform:uppercase; color:#fff; }
        .empty-chat span { font-size:.9rem; }
        .msg-row { display:flex; width:100%; }
        .msg-left { justify-content:flex-start; }
        .msg-right { justify-content:flex-end; }
        .bubble { max-width:min(82%,560px); padding:12px 14px; border:1px solid var(--line); }
        .bubble-other { background:var(--panel); color:var(--text); }
        .bubble-own { background:var(--orange); border-color:var(--orange); color:#fff; }
        .msg-text { margin:0; font-size:.92rem; line-height:1.45; white-space:pre-wrap; }
        .msg-time { margin:.45rem 0 0; text-align:right; font:800 .6rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; opacity:.58; }
        .chat-footer { border-top:1px solid var(--line); background:#0b0b0b; padding:14px 18px 16px; padding-bottom:max(16px, env(safe-area-inset-bottom)); }
        .input-row { display:grid; grid-template-columns:1fr auto; gap:10px; align-items:end; }
        .input-wrap { padding:11px 13px; border:1px solid var(--line2); background:var(--panel); }
        .input-wrap:focus-within { border-color:var(--orange); }
        .chat-input { width:100%; min-height:24px; max-height:120px; resize:none; border:0; outline:0; background:transparent; color:#fff; font-size:.92rem; }
        .chat-input::placeholder { color:var(--muted2); }
        .send-btn { height:48px; padding:0 20px; border:1px solid var(--orange); background:var(--orange); color:#fff; font:900 .88rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .send-btn:disabled { opacity:.45; cursor:not-allowed; }
        .premium-note { margin-top:8px; color:var(--muted2); font-size:.72rem; }
        .expired-box { padding:14px; border:1px solid rgba(239,68,68,.3); background:rgba(239,68,68,.08); text-align:center; color:#fca5a5; font-weight:800; }
        .expired-box .cta-btn { margin-top:10px; background:var(--orange); border-color:var(--orange); color:#fff; }
        .chat-side { padding:18px; display:flex; flex-direction:column; gap:14px; background:var(--panel); overflow:auto; }
        .side-card { padding:16px; border:1px solid var(--line); background:#0d0d0d; }
        .side-title { margin:10px 0 0; font:italic 900 1.8rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .side-card p { margin:8px 0 0; color:var(--muted); font-size:.88rem; line-height:1.5; }
        .side-user { display:flex; gap:12px; align-items:center; }
        .side-user .chat-avatar { width:48px; height:48px; font-size:1.4rem; }
        .side-user strong { display:block; font:italic 900 1.2rem 'Barlow Condensed'; line-height:.9; text-transform:uppercase; }
        .side-user span { display:block; margin-top:4px; color:var(--muted); font-size:.82rem; }
        .side-row { display:flex; justify-content:space-between; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); }
        .side-row:last-child { border-bottom:0; }
        .side-row span { color:var(--muted); font-size:.84rem; }
        .side-row b { font:900 1rem 'Barlow Condensed'; text-transform:uppercase; }
        .side-cta { background:linear-gradient(180deg, rgba(255,90,0,.1) 0%, rgba(255,90,0,0) 100%), var(--panel2); }
        .cta-btn { width:100%; margin-top:14px; background:#0b0b0b; border-color:#0b0b0b; color:#fff; }
        @media (max-width:1024px) {
          .chat-layout { grid-template-columns:1fr; }
          .chat-side { display:none; }
          .chat-main { border-right:0; }
        }
        @media (max-width:760px) {
          .chat-header { min-height:78px; padding:12px; }
          .header-actions { display:none; }
          .hero-strip { grid-template-columns:1fr; }
          .exchange-grid { grid-template-columns:1fr; }
          .chat-messages { padding:16px 12px; }
          .exchange-strip,.safety-strip,.chat-footer,.hero-main,.hero-side { padding-left:12px; padding-right:12px; }
          .bubble { max-width:88%; }
          .hero-title { font-size:2.2rem; }
        }
        
        .report-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(11,11,11,0.85); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .report-card { background: #181818; border: 1px solid rgba(255,255,255,0.08); width: 100%; max-width: 480px; padding: 24px; position: relative; animation: cd-scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .report-card:before { content:''; position:absolute; inset:auto 0 0 0; height:3px; background: #ef4444; }
        .report-actions { display: flex; gap: 12px; margin-top: 16px; }
        @media (max-width: 480px) {
          .report-actions { flex-direction: column-reverse; gap: 8px; }
          .report-actions button { width: 100%; padding: 14px; }
        }
      `}</style>

      <div className="chat-layout">
        <main className="chat-main">
          <header className="chat-header">
            <div className="header-left">
              <button className="chat-back-btn" onClick={() => navigate('/chats')}>&larr;</button>
              <div className="chat-avatar">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherName} />
                ) : (
                  otherInitial
                )}
              </div>
              <div className="header-copy">
                <div className="chat-name-row">
                  <h2 className="chat-header-name">{otherName}</h2>
                  <ReputationStars stars={otherStars} size="sm" inline />
                  {otherUser?.id && <FavoriteButton targetUserId={otherUser.id} size="sm" showLabel />}
                  <span className="status-pill green">En linea</span>
                  <span className="status-pill orange">Intercambio fuerte</span>
                </div>
                <p className="chat-header-loc">{locationText}</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="ghost-btn" onClick={() => setShowBlockConfirm(true)}>Bloquear</button>
              <button className="danger-btn" onClick={() => setShowReportModal(true)}>Reportar</button>
            </div>
          </header>

          <section className="hero-strip">
            <div className="hero-main">
              <div className="header-kicker">// intercambio activo</div>
              <h1 className="hero-title">Cerra el <span>cruce</span> sin vueltas.</h1>
              <p className="hero-copy">Usa el chat para confirmar figuritas, ordenar el intercambio y cerrar un encuentro con menos friccion.</p>
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
                <div className="summary-label">Siguiente accion</div>
                <div className="hero-side-title">Coordina punto, horario y canje.</div>
                <p>Si el cruce esta claro, avancen a una confirmacion simple en un lugar publico.</p>
              </div>
              <div className="hero-stats">
                <span className="mini-pill blue">{exchangeData.albumName || 'Album'}</span>
                <span className="mini-pill green">Chat activo</span>
              </div>
            </aside>
          </section>

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
          <section className="side-card">
            <div className="side-label">Usuario</div>
            <div className="side-title">Perfil del cruce</div>
            <div className="side-user">
              <div className="chat-avatar">
                {otherUser?.avatar_url ? <img src={otherUser.avatar_url} alt={otherName} /> : otherInitial}
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
            <p>Si ya validaron las figuritas, el siguiente paso es acordar horario y punto de encuentro publico.</p>
            <button className="cta-btn" onClick={() => navigate('/matches')}>Ver mas matches</button>
          </section>

          <section className="side-card">
            <div className="side-label">Resumen</div>
            <div className="side-title">Lectura rapida</div>
            <div className="side-row"><span>Te da</span><b>{incomingCount} figus</b></div>
            <div className="side-row"><span>Le das</span><b>{outgoingCount} figus</b></div>
            <div className="side-row"><span>Album</span><b>{exchangeData.albumName || 'Album'}</b></div>
            <div className="side-row"><span>Estado</span><b>Activo</b></div>
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
