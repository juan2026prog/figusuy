import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import { LiveBadge, LiveFeed } from '../components/LiveMomentum'
import { useLiveMomentum } from '../hooks/useLiveMomentum'

export default function ChatsListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { chats, fetchChats } = useAppStore()
  const [showBlocked, setShowBlocked] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  const [activeTab, setActiveTab] = useState('todos')
  const { summary, feed } = useLiveMomentum({ chats })

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
      

      <header className="topbar">
        <div>
          <div className="top-kicker">Intercambios</div>
          <div className="top-title">Chats</div>
          <div className="top-live">
            <LiveBadge tone="orange" pulse>{summary.activeNow} activos ahora</LiveBadge>
            <LiveBadge tone="green">{chats.length} conversaciones en marcha</LiveBadge>
          </div>
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
                            <img src={block.profile.avatar_url} alt="" loading="lazy" />
                          ) : (
                            <img 
                              src={block.profile?.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'} 
                              alt="" 
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
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
                            <img src={other.avatar_url} alt="" loading="lazy" />
                          ) : (
                            <img 
                              src={other?.account_type === 'business' ? '/assets/avatar-tienda.webp' : '/assets/avatar-generico.webp'} 
                              alt="" 
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
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

            {!showBlocked && <LiveFeed title="Ahora en FigusUY" items={feed} refreshedAt={summary.refreshedAt} />}

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
