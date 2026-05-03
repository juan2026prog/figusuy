import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGrowthStore } from '../stores/growthStore'
import { NOTIFICATION_TRIGGERS, NOTIFICATION_PRIORITIES } from '../lib/growthEngine'

export default function SmartNotifications() {
  const navigate = useNavigate()
  const {
    notifications, notificationCenter,
    toggleNotificationCenter, markNotificationRead,
    markAllRead, trackNotificationAction
  } = useGrowthStore()
  const { open, unread } = notificationCenter

  const handleAction = async (notif) => {
    await markNotificationRead(notif.id)
    await trackNotificationAction(notif.id, 'clicked')
    if (notif.route) navigate(notif.route)
    toggleNotificationCenter()
  }

  const handleMarkAll = async () => {
    const userId = notifications[0]?.user_id
    if (userId) await markAllRead(userId)
  }

  const grouped = notifications.reduce((acc, n) => {
    const today = new Date().toDateString()
    const nDate = new Date(n.created_at).toDateString()
    const key = nDate === today ? 'Hoy' : nDate === new Date(Date.now() - 86400000).toDateString() ? 'Ayer' : 'Anteriores'
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  return (
    <>
      {/* Bell trigger */}
      <div className="sn-trigger-wrapper">
        <button className="sn-bell" onClick={toggleNotificationCenter} aria-label="Notificaciones">
          <span className="material-symbols-outlined">notifications</span>
          {unread > 0 && <span className="sn-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </div>

      {/* Panel */}
      {open && <div className="sn-backdrop" onClick={toggleNotificationCenter} />}
      <div className={`sn-panel ${open ? 'open' : ''}`}>
        <style>{`
          .sn-trigger-wrapper { position: fixed; bottom: 80px; right: 20px; z-index: 85; }
          .sn-bell{position:relative;display:inline-grid;place-items:center;width:46px;height:46px;border:1px solid rgba(255,255,255,.12);background:var(--color-surface, #121212);color:#fff;cursor:pointer;transition:border-color .2s;border-radius:23px;box-shadow:0 4px 12px rgba(0,0,0,.3)}
          .sn-bell:hover{border-color:var(--admin-orange,#ff5a00);background:#1a1a1a}
          .sn-bell .material-symbols-outlined{font-size:1.4rem}
          .sn-badge{position:absolute;top:0px;right:-2px;min-width:18px;height:18px;padding:0 5px;background:#ef4444;color:#fff;font:900 .62rem 'Barlow Condensed';display:grid;place-items:center;border-radius:9px;line-height:1;box-shadow:0 0 0 2px #0b0b0b}
          .sn-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:90}
          .sn-panel{position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);background:#0b0b0b;border-left:1px solid rgba(255,255,255,.08);z-index:91;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;font-family:'Barlow',sans-serif}
          .sn-panel.open{transform:translateX(0)}
          .sn-header{padding:20px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center}
          .sn-header h2{font:italic 900 2rem 'Barlow Condensed';text-transform:uppercase;color:#f5f5f5;line-height:.9;margin:0}
          .sn-header-actions{display:flex;gap:8px;align-items:center}
          .sn-btn-sm{border:1px solid rgba(255,255,255,.14);background:transparent;color:rgba(245,245,245,.54);padding:6px 10px;font:900 .7rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
          .sn-btn-sm:hover{border-color:#ff5a00;color:#ff5a00}
          .sn-scroll{flex:1;overflow-y:auto;padding:12px 0}
          .sn-group-label{padding:6px 20px;font:900 .68rem 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;color:rgba(245,245,245,.34)}
          .sn-item{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .15s}
          .sn-item:hover{background:rgba(255,255,255,.03)}
          .sn-item.unread{background:rgba(255,90,0,.04);border-left:3px solid #ff5a00}
          .sn-icon-box{width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}
          .sn-icon-box .material-symbols-outlined{font-size:1.3rem;color:#ff5a00}
          .sn-content h4{font:900 .88rem 'Barlow Condensed';color:#f5f5f5;text-transform:uppercase;margin:0 0 3px;line-height:1}
          .sn-content p{font-size:.82rem;color:rgba(245,245,245,.54);margin:0;line-height:1.4}
          .sn-time{font:900 .62rem 'Barlow Condensed';color:rgba(245,245,245,.28);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
          .sn-priority{display:inline-block;width:8px;height:8px;border-radius:4px;margin-right:6px}
          .sn-empty{padding:60px 20px;text-align:center}
          .sn-empty-icon{font-size:3rem;display:block;margin-bottom:12px;opacity:.3}
          .sn-empty h3{font:italic 900 1.6rem 'Barlow Condensed';text-transform:uppercase;color:#f5f5f5;margin:0 0 6px}
          .sn-empty p{color:rgba(245,245,245,.4);font-size:.88rem}
        `}</style>

        <div className="sn-header">
          <div>
            <div style={{font:"900 .72rem 'Barlow Condensed'",letterSpacing:'.16em',textTransform:'uppercase',color:'#ff5a00'}}>// oportunidades</div>
            <h2>Notificaciones</h2>
          </div>
          <div className="sn-header-actions">
            {unread > 0 && <button className="sn-btn-sm" onClick={handleMarkAll}>Marcar todo</button>}
            <button className="sn-btn-sm" onClick={toggleNotificationCenter}>✕</button>
          </div>
        </div>

        <div className="sn-scroll">
          {notifications.length === 0 ? (
            <div className="sn-empty">
              <span className="sn-empty-icon">🔔</span>
              <h3>Sin novedades</h3>
              <p>Cuando haya una oportunidad real, te avisamos acá.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="sn-group-label">{group}</div>
                {items.map(n => {
                  const trigger = NOTIFICATION_TRIGGERS[n.trigger_key] || {}
                  const prio = NOTIFICATION_PRIORITIES[n.priority || trigger.priority] || {}
                  const isUnread = !n.read_at
                  const ago = getTimeAgo(n.created_at)
                  return (
                    <div key={n.id} className={`sn-item ${isUnread ? 'unread' : ''}`} onClick={() => handleAction(n)}>
                      <div className="sn-icon-box">
                        <span className="material-symbols-outlined">{trigger.icon || 'notifications'}</span>
                      </div>
                      <div className="sn-content">
                        <h4>
                          <span className="sn-priority" style={{background: prio.color || '#64748b'}} />
                          {n.title || trigger.title}
                        </h4>
                        <p>{n.body || trigger.template}</p>
                      </div>
                      <span className="sn-time">{ago}</span>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}
