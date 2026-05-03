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
  const [activeTab, setActiveTab] = useState('todos')

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

  const filteredChats = chats.filter((chat, index) => {
    if (activeTab === 'todos') return true
    if (activeTab === 'fuertes') return index < 2 // Simulando matches fuertes
    if (activeTab === 'cerca') {
      const other = getOtherUser(chat)
      return other?.city === profile?.city || other?.department === profile?.department
    }
    if (activeTab === 'sin responder') return !chat.last_message_preview // O sin respuesta tuya
    return true
  })

  return (
    <div className="chats-list-page">
      <style>{`
        .chats-list-page {
          --bg:#0b0b0b; --panel:#121212; --panel2:#181818; --panel3:#202020; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
          --text:#f5f5f5; --muted:rgba(245,245,245,.56); --muted2:rgba(245,245,245,.34); --orange:#ff5a00; --orange2:#cc4800; --green:#22c55e; --red:#ef4444; --yellow:#facc15; --blue:#38bdf8;
          min-height:100vh; color:var(--text); font-family:'Barlow',sans-serif;
          background:radial-gradient(circle at top right, rgba(255,90,0,.12), transparent 26%), linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
        }
        .chats-list-page * { box-sizing:border-box; }
        .topbar { position:sticky; top:0; z-index:20; display:flex; justify-content:space-between; align-items:center; gap:18px; min-height:82px; padding:14px 22px; border-bottom:1px solid var(--line); background:rgba(11,11,11,.96); backdrop-filter:blur(8px); }
        .top-kicker,.kicker,.section-kicker,.side-label { font:900 .72rem 'Barlow Condensed'; letter-spacing:.16em; text-transform:uppercase; color:var(--orange); }
        .top-title { margin-top:3px; font:italic 900 2.45rem 'Barlow Condensed'; text-transform:uppercase; line-height:.9; }
        .btn,.open-btn,.unblock-btn { font-family:inherit; cursor:pointer; }
        .btn { border:1px solid var(--line2); background:transparent; color:#fff; padding:.85rem 1.15rem; font:900 .88rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
        .btn:hover { border-color:var(--orange); color:var(--orange); }
        .btn.orange { background:var(--orange); border-color:var(--orange); color:#fff; }
        .wrap { max-width:1280px; margin:0 auto; padding:28px 22px 76px; }
        .hero { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:22px; margin-bottom:22px; }
        .hero-main,.quick-card,.controls,.chat-card,.empty,.side-card,.blocked-card { border:1px solid var(--line); background:var(--panel); }
        .hero-main { position:relative; overflow:hidden; min-height:290px; padding:30px; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(135deg, #181818 0%, #101010 55%, rgba(255,90,0,.18) 100%); }
        .hero-main:before { content:'CHATS'; position:absolute; right:24px; top:-18px; font:italic 900 8.5rem 'Barlow Condensed'; color:rgba(255,255,255,.035); line-height:1; pointer-events:none; }
        .hero-title { margin-top:8px; max-width:760px; font:italic 900 clamp(3rem,6vw,5.4rem) 'Barlow Condensed'; line-height:.86; text-transform:uppercase; position:relative; z-index:1; }
        .hero-title span { color:var(--orange); }
        .hero-sub,.section-title p,.chat-meta,.last-msg,.side-card p,.empty p,.blocked-user span { color:var(--muted); line-height:1.58; }
        .hero-sub { max-width:620px; margin-top:14px; font-size:1rem; position:relative; z-index:1; }
        .hero-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; margin-top:28px; background:var(--line); position:relative; z-index:1; }
        .hero-stat { padding:17px; background:rgba(18,18,18,.92); }
        .hero-stat b { display:block; font:italic 900 2.35rem 'Barlow Condensed'; line-height:.9; }
        .hero-stat span { font:900 .72rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; color:var(--muted2); }
        .hero-stat.orange b { color:var(--orange); }
        .hero-stat.green b { color:var(--green); }
        .hero-stat.blue b { color:var(--blue); }
        .quick-card { min-height:290px; padding:22px; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(180deg, rgba(255,90,0,.08) 0%, rgba(255,90,0,0) 100%), var(--panel); }
        .quick-card h2,.section-title h2,.side-card h3,.empty h3 { margin-top:10px; font:italic 900 2.35rem 'Barlow Condensed'; text-transform:uppercase; line-height:.88; }
        .quick-card p { margin-top:10px; }
        .controls { margin-bottom:22px; overflow:hidden; }
        .controls-top { display:grid; grid-template-columns:1fr auto; gap:1px; background:var(--line); border-bottom:1px solid var(--line); }
        .search-box,.blocked-toggle { padding:14px; background:var(--panel2); }
        .search-box label { display:block; margin-bottom:7px; font:900 .65rem 'Barlow Condensed'; letter-spacing:.14em; text-transform:uppercase; color:var(--orange); }
        .search-box input { width:100%; height:42px; padding:0 12px; background:#0d0d0d; border:1px solid var(--line2); color:#fff; font-weight:700; outline:none; }
        .search-box input:focus { border-color:var(--orange); }
        .blocked-toggle { display:flex; align-items:end; }
        .blocked-toggle .btn { height:42px; white-space:nowrap; }
        .tabs { display:flex; gap:1px; overflow:auto; background:var(--line); }
        .tab { border:0; background:var(--panel); color:var(--muted); padding:13px 18px; font:900 .82rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; cursor:pointer; }
        .tab.active { background:var(--orange); color:#fff; }
        .layout { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:22px; align-items:start; }
        .main-stack,.side-stack { display:grid; gap:14px; }
        .side-stack { position:sticky; top:104px; }
        .section-title { display:flex; justify-content:space-between; align-items:end; gap:14px; margin-bottom:10px; }
        .section-title p { margin-top:5px; font-size:.92rem; }
        .count-pill { border:1px solid var(--line2); padding:7px 10px; color:var(--muted); font:900 .75rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .chat-card { display:grid; grid-template-columns:72px 1fr auto; position:relative; overflow:hidden; cursor:pointer; transition:.18s; }
        .chat-card:hover { border-color:rgba(255,90,0,.5); transform:translateY(-2px); }
        .chat-card.hot { border-color:rgba(255,90,0,.45); box-shadow:0 18px 44px rgba(255,90,0,.1); }
        .chat-avatar-wrap { display:grid; place-items:center; background:#0d0d0d; border-right:1px solid var(--line); }
        .avatar { width:48px; height:48px; overflow:hidden; display:grid; place-items:center; background:var(--orange); font:italic 900 1.45rem 'Barlow Condensed'; }
        .avatar img { width:100%; height:100%; object-fit:cover; }
        .chat-body { padding:15px 16px; }
        .chat-top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
        .chat-name { margin:0; font:italic 900 1.55rem 'Barlow Condensed'; line-height:.9; text-transform:uppercase; }
        .chat-time { color:var(--muted2); white-space:nowrap; font:900 .7rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .chat-meta { margin-top:5px; font-size:.82rem; }
        .last-msg { margin-top:9px; font-size:.86rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:560px; }
        .chat-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .tag { border:1px solid var(--line2); background:#0b0b0b; padding:4px 7px; color:var(--muted); font:900 .62rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .tag.orange { color:var(--orange); border-color:rgba(255,90,0,.35); background:rgba(255,90,0,.08); }
        .tag.green { color:var(--green); border-color:rgba(34,197,94,.35); background:rgba(34,197,94,.07); }
        .tag.blue { color:var(--blue); border-color:rgba(56,189,248,.35); background:rgba(56,189,248,.08); }
        .chat-action { min-width:128px; padding:14px; display:grid; place-items:center; background:var(--panel2); border-left:1px solid var(--line); }
        .open-btn { width:100%; padding:11px 14px; border:1px solid var(--orange); background:var(--orange); color:#fff; font:900 .76rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .chat-card:not(.hot) .open-btn { background:transparent; border-color:var(--line2); }
        .blocked-card { padding:16px; display:flex; justify-content:space-between; gap:14px; align-items:center; }
        .blocked-user { display:flex; gap:12px; align-items:center; }
        .blocked-user b { display:block; font:italic 900 1.3rem 'Barlow Condensed'; text-transform:uppercase; }
        .unblock-btn { padding:.7rem 1rem; border:1px solid var(--line2); background:#24303d; color:#fff; font:900 .74rem 'Barlow Condensed'; letter-spacing:.08em; text-transform:uppercase; }
        .empty { padding:52px 24px; text-align:center; }
        .empty-icon { margin-bottom:14px; font-size:3rem; }
        .empty p { max-width:420px; margin:10px auto 20px; }
        .side-card { padding:18px; }
        .side-card p { font-size:.9rem; }
        .side-cta { background:linear-gradient(180deg, rgba(255,90,0,.1) 0%, rgba(255,90,0,0) 100%), var(--panel); }
        .side-cta .btn { width:100%; margin-top:14px; background:#0b0b0b; border-color:#0b0b0b; color:#fff; }
        .side-row { display:flex; justify-content:space-between; padding:11px 0; border-bottom:1px solid var(--line); }
        .side-row:last-child { border-bottom:0; }
        .side-row span { color:var(--muted); font-size:.86rem; }
        .side-row b { font:900 1rem 'Barlow Condensed'; text-transform:uppercase; }
        .safety { background:rgba(250,204,21,.08); border-color:rgba(250,204,21,.22); color:#fde68a; }
        @media (max-width:1050px) {
          .hero,.layout { grid-template-columns:1fr; }
          .side-stack { position:static; }
          .quick-card { min-height:auto; }
          .controls-top { grid-template-columns:1fr; }
        }
        @media (max-width:720px) {
          .wrap { padding:16px 12px 64px; }
          .topbar { align-items:flex-start; }
          .top-title { font-size:2rem; }
          .hero-main { padding:22px; }
          .hero-stats { grid-template-columns:1fr; }
          .chat-card { grid-template-columns:58px 1fr; }
          .chat-action { grid-column:1 / -1; border-left:0; border-top:1px solid var(--line); padding:10px; }
          .section-title { display:block; }
          .count-pill { display:inline-block; margin-top:10px; }
          .blocked-card { display:block; }
          .blocked-card .unblock-btn { margin-top:12px; width:100%; }
          .chat-name { font-size:1.35rem; }
          .blocked-toggle { display:none; }
        }
      `}</style>

      <header className="topbar">
        <div>
          <div className="top-kicker">Intercambios</div>
          <div className="top-title">Chats</div>
        </div>
        <button className="btn orange" onClick={() => navigate('/matches')}>Buscar matches</button>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="hero-main">
            <div>
              <div className="kicker">// conversaciones activas</div>
              <h1 className="hero-title">Coordina tus <span>cruces</span> y completa mas rapido.</h1>
              <p className="hero-sub">Aca tenes tus conversaciones abiertas, usuarios con intercambio activo y un punto de entrada claro para cerrar figuritas pendientes.</p>
            </div>
            <div className="hero-stats">
              <div className="hero-stat orange"><b>{chats.length}</b><span>Chats activos</span></div>
              <div className="hero-stat green"><b>{showBlocked ? blockedUsers.length : chats.length}</b><span>{showBlocked ? 'Bloqueados' : 'Conversaciones'}</span></div>
              <div className="hero-stat blue"><b>{showBlocked ? 0 : chats.filter(chat => chat.last_message_preview).length}</b><span>{showBlocked ? 'Vista bloqueada' : 'Con actividad'}</span></div>
            </div>
          </div>

          <aside className="quick-card">
            <div>
              <div className="kicker">Siguiente accion</div>
              <h2>{showBlocked ? 'Revisa a quien desbloquear' : 'Responde los mejores cruces'}</h2>
              <p>{showBlocked ? 'Mantene controlados los usuarios bloqueados y libera solo los contactos que quieras recuperar.' : 'Prioriza los chats con mas movimiento para cerrar intercambios antes.'}</p>
            </div>
            <button className="btn orange" onClick={() => navigate(showBlocked ? '/matches' : '/matches')}>{showBlocked ? 'Ver matches' : 'Ver mejores matches'}</button>
          </aside>
        </section>

        <section className="controls">
          <div className="controls-top">
            {!showBlocked && (
              <div className="search-box">
                <label>Buscar chat</label>
                <input type="text" placeholder="Buscar usuario, zona o figurita..." />
              </div>
            )}
            <div className="blocked-toggle">
              <button className="btn" onClick={() => setShowBlocked(!showBlocked)}>
                {showBlocked ? 'Volver a chats' : 'Usuarios bloqueados'}
              </button>
            </div>
          </div>
          {!showBlocked && (
            <div className="tabs">
              <button className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>Todos</button>
              <button className={`tab ${activeTab === 'fuertes' ? 'active' : ''}`} onClick={() => setActiveTab('fuertes')}>Fuertes</button>
              <button className={`tab ${activeTab === 'cerca' ? 'active' : ''}`} onClick={() => setActiveTab('cerca')}>Cerca</button>
              <button className={`tab ${activeTab === 'sin responder' ? 'active' : ''}`} onClick={() => setActiveTab('sin responder')}>Sin responder</button>
            </div>
          )}
        </section>

        <section className="layout">
          <div>
            <div className="section-title">
              <div>
                <div className="section-kicker">{showBlocked ? 'Moderacion' : 'Inbox'}</div>
                <h2>{showBlocked ? 'Usuarios bloqueados' : 'Conversaciones activas'}</h2>
                <p>{showBlocked ? 'Revisa bloqueos aplicados desde tus interacciones y desbloquea si queres reabrir el contacto.' : 'Entra al chat, confirma figuritas y coordina el punto de encuentro.'}</p>
              </div>
              <span className="count-pill">{showBlocked ? `${blockedUsers.length} bloqueados` : `${chats.length} activos`}</span>
            </div>

            <div className="main-stack">
              {showBlocked ? (
                loadingBlocked ? (
                  <div className="empty">
                    <div className="empty-icon">Cargando</div>
                    <h3>Revisando bloqueos</h3>
                    <p>Estamos cargando la lista de usuarios bloqueados.</p>
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">🛡</div>
                    <h3>Sin bloqueados</h3>
                    <p>No tenes usuarios bloqueados en este momento.</p>
                  </div>
                ) : (
                  blockedUsers.map(block => (
                    <div key={block.id} className="blocked-card">
                      <div className="blocked-user">
                        <div className="avatar">
                          {block.profile?.avatar_url ? (
                            <img src={block.profile.avatar_url} alt="" />
                          ) : (
                            (block.profile?.name || '?')[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <b>{block.profile?.name || 'Usuario'}</b>
                          <span>Bloqueado desde tus conversaciones</span>
                        </div>
                      </div>
                      <button className="unblock-btn" onClick={() => handleUnblock(block.id)}>Desbloquear</button>
                    </div>
                  ))
                )
              ) : filteredChats.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">💬</div>
                  <h3>Sin conversaciones</h3>
                  <p>No hay chats en esta sección.</p>
                  <button className="btn orange" onClick={() => navigate('/matches')}>Ver intercambios</button>
                </div>
              ) : (
                filteredChats.map((chat, index) => {
                  const other = getOtherUser(chat)
                  const isHot = activeTab === 'fuertes' || (activeTab === 'todos' && index < 2)
                  return (
                    <button
                      key={chat.id}
                      className={`chat-card ${isHot ? 'hot' : ''}`}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                    >
                      <div className="chat-avatar-wrap">
                        <div className="avatar">
                          {other?.avatar_url ? (
                            <img src={other.avatar_url} alt="" />
                          ) : (
                            (other?.name || '?')[0].toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="chat-body">
                        <div className="chat-top">
                          <div>
                            <h3 className="chat-name">{other?.name || 'Usuario'}</h3>
                            <div className="chat-meta">{other?.city || other?.department || 'Sin ubicacion'} · {chat.album?.name || 'Intercambio activo'}</div>
                          </div>
                          <span className="chat-time">{formatTime(chat.last_message_at || chat.created_at)}</span>
                        </div>
                        <p className="last-msg">{chat.last_message_preview || 'Toca para ver la conversacion'}</p>
                        <div className="chat-tags">
                          {isHot && <span className="tag orange">Intercambio fuerte</span>}
                          <span className="tag green">Ir al chat</span>
                          <span className="tag blue">{chat.last_message_preview ? 'Activo' : 'Nuevo'}</span>
                        </div>
                      </div>
                      <div className="chat-action">
                        <div className="open-btn">Abrir chat</div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <aside className="side-stack">
            <section className="side-card side-cta">
              <div className="side-label">Enfoque</div>
              <h3>{showBlocked ? 'Mantene control del historial' : 'Cerra un cruce hoy'}</h3>
              <p>{showBlocked ? 'Los bloqueos tambien forman parte de una experiencia segura y ordenada dentro de la app.' : 'Tenes conversaciones abiertas esperando respuesta. Prioriza las mas activas primero.'}</p>
              <button className="btn" onClick={() => navigate('/matches')}>{showBlocked ? 'Volver a matches' : 'Ver fuertes'}</button>
            </section>

            <section className="side-card">
              <div className="side-label">Resumen</div>
              <h3>Lectura rapida</h3>
              <div className="side-row"><span>Chats activos</span><b>{chats.length}</b></div>
              <div className="side-row"><span>Bloqueados</span><b>{blockedUsers.length}</b></div>
              <div className="side-row"><span>Con preview</span><b>{chats.filter(chat => chat.last_message_preview).length}</b></div>
            </section>

            <section className="side-card safety">
              <div className="side-label">Seguridad</div>
              <h3>Antes de coordinar</h3>
              <p>Coordina siempre en lugares publicos y evita compartir datos sensibles por fuera de la app.</p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
