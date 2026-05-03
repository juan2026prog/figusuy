import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { NOTIFICATION_TRIGGERS, NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '../lib/growthEngine'

export default function AdminSmartNotifications() {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [triggers, setTriggers] = useState(Object.values(NOTIFICATION_TRIGGERS))
  const [loading, setLoading] = useState(true)
  const [editingTrigger, setEditingTrigger] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: notifs } = await supabase.from('smart_notifications')
        .select('id, trigger_key, title, body, priority, read_at, action_taken, created_at, user_id')
        .order('created_at', { ascending: false }).limit(200)
      const list = notifs || []
      const sent = list.length
      const opened = list.filter(n => n.read_at).length
      const acted = list.filter(n => n.action_taken).length
      const byTrigger = {}
      list.forEach(n => { byTrigger[n.trigger_key] = (byTrigger[n.trigger_key] || 0) + 1 })
      const topTriggers = Object.entries(byTrigger).sort((a, b) => b[1] - a[1]).slice(0, 5)
      setStats({ sent, opened, ctr: sent ? Math.round((acted / sent) * 100) : 0, reactivated: list.filter(n => n.action_taken === 'returned').length, topTriggers })
      setEvents(list.slice(0, 50))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const toggleTrigger = (key) => {
    setTriggers(prev => prev.map(t => t.key === key ? { ...t, active: !t.active } : t))
  }

  const updatePriority = (key, newPriority) => {
    setTriggers(prev => prev.map(t => t.key === key ? { ...t, priority: newPriority } : t))
  }

  const metrics = [
    { label: 'Enviadas', value: stats?.sent || 0, icon: 'send', color: '#ff5a00' },
    { label: 'Abiertas', value: stats?.opened || 0, icon: 'visibility', color: '#22c55e' },
    { label: 'CTR', value: `${stats?.ctr || 0}%`, icon: 'ads_click', color: '#3b82f6' },
    { label: 'Reactivados', value: stats?.reactivated || 0, icon: 'person_add', color: '#8b5cf6' },
  ]

  return (
    <div className="admin-generic-page">
      {/* Hero */}
      <div className="ag-hero" style={{'--hero-text':'NOTIFICACIONES'}}>
        <div style={{position:'absolute',right:'1rem',top:'-.1rem',font:"italic 900 clamp(3rem,7vw,5.5rem) 'Barlow Condensed'",color:'rgba(255,255,255,.04)',pointerEvents:'none',lineHeight:'.84'}}>NOTIFICACIONES</div>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">// growth engine</div>
            <h1 className="ag-title">Smart Notifications</h1>
            <p className="ag-desc" style={{marginTop:'.6rem',maxWidth:'600px'}}>Notificaciones inteligentes basadas en oportunidad real. No ruido. Solo valor.</p>
          </div>
          <div className="ag-icon-box"><span className="material-symbols-outlined">notifications_active</span></div>
        </div>
      </div>

      {/* Metrics */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--admin-line)',border:'1px solid var(--admin-line)'}}>
          {metrics.map(m => (
            <div key={m.label} style={{background:'var(--admin-panel)',padding:'20px',textAlign:'left'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:m.color}}>{m.icon}</span>
                <span style={{font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.08em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>{m.label}</span>
              </div>
              <div style={{font:"italic 900 2.4rem 'Barlow Condensed'",color:m.color,lineHeight:'.9'}}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Triggers Table */}
      <div className="ag-card">
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div className="admin-kicker">// configuración</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Triggers Activos</h3>
          </div>
          <span style={{font:"900 .72rem 'Barlow Condensed'",color:'var(--admin-muted2)',letterSpacing:'.08em',textTransform:'uppercase'}}>{triggers.filter(t=>t.active).length} / {triggers.length} activos</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Estado','Trigger','Categoría','Prioridad','Cooldown','Template','Acciones'].map(h => (
                  <th key={h} style={{padding:'12px 14px',textAlign:'left',font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.08em',textTransform:'uppercase',color:'var(--admin-muted2)',borderBottom:'1px solid var(--admin-line)',background:'var(--admin-panel2)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {triggers.map(t => {
                const prio = NOTIFICATION_PRIORITIES[t.priority] || {}
                const cat = NOTIFICATION_CATEGORIES.find(c => c.key === t.category) || {}
                return (
                  <tr key={t.key} style={{borderBottom:'1px solid var(--admin-line)'}}>
                    <td style={{padding:'12px 14px'}}>
                      <div onClick={() => toggleTrigger(t.key)} style={{width:'36px',height:'20px',borderRadius:'10px',background:t.active?'var(--admin-green)':'rgba(255,255,255,.1)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                        <div style={{width:'16px',height:'16px',borderRadius:'8px',background:'#fff',position:'absolute',top:'2px',left:t.active?'18px':'2px',transition:'left .2s'}} />
                      </div>
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:'var(--admin-orange)'}}>{t.icon}</span>
                        <div>
                          <div style={{font:"900 .84rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{t.title}</div>
                          <div style={{font:"400 .72rem 'Barlow'",color:'var(--admin-muted2)'}}>{t.key}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <span style={{padding:'4px 8px',border:`1px solid ${cat.color}33`,background:`${cat.color}11`,color:cat.color,font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase'}}>{cat.label || t.category}</span>
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <select value={t.priority} onChange={e => updatePriority(t.key, e.target.value)} style={{padding:'4px 8px',font:"900 .72rem 'Barlow Condensed'",background:'#0d0d0d',color:prio.color,border:`1px solid ${prio.color}44`,cursor:'pointer'}}>
                        {Object.entries(NOTIFICATION_PRIORITIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{padding:'12px 14px',font:"900 .82rem 'Barlow Condensed'",color:'var(--admin-muted)'}}>{t.cooldown_hours}h</td>
                    <td style={{padding:'12px 14px',fontSize:'.78rem',color:'var(--admin-muted)',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.template}</td>
                    <td style={{padding:'12px 14px'}}>
                      <button onClick={() => setEditingTrigger(editingTrigger === t.key ? null : t.key)} style={{border:'1px solid var(--admin-line2)',background:'transparent',color:'#fff',padding:'5px 10px',font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer'}}>Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events */}
      <div className="ag-card">
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
          <div className="admin-kicker">// historial</div>
          <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Eventos Recientes</h3>
        </div>
        <div style={{maxHeight:'400px',overflowY:'auto'}}>
          {events.length === 0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'var(--admin-muted)'}}>Sin eventos todavía</div>
          ) : events.map(e => {
            const trigger = NOTIFICATION_TRIGGERS[e.trigger_key] || {}
            return (
              <div key={e.id} style={{display:'grid',gridTemplateColumns:'36px 1fr auto',gap:'12px',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid var(--admin-line)'}}>
                <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:'var(--admin-orange)'}}>{trigger.icon || 'notifications'}</span>
                <div>
                  <div style={{font:"900 .78rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{e.title || trigger.title}</div>
                  <div style={{fontSize:'.72rem',color:'var(--admin-muted2)'}}>{e.body || trigger.template}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{font:"900 .62rem 'Barlow Condensed'",color:e.read_at?'var(--admin-green)':'var(--admin-muted2)',letterSpacing:'.06em',textTransform:'uppercase'}}>{e.read_at ? 'Leída' : 'No leída'}</div>
                  <div style={{fontSize:'.62rem',color:'var(--admin-muted2)'}}>{new Date(e.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Triggers */}
      {stats?.topTriggers?.length > 0 && (
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// ranking</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Top Triggers</h3>
          </div>
          <div style={{padding:'14px 20px'}}>
            {stats.topTriggers.map(([key, count], i) => {
              const tr = NOTIFICATION_TRIGGERS[key] || {}
              return (
                <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i < stats.topTriggers.length-1 ? '1px solid var(--admin-line)' : 'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{font:"italic 900 1.4rem 'Barlow Condensed'",color:'var(--admin-orange)',width:'24px'}}>{i+1}</span>
                    <span className="material-symbols-outlined" style={{fontSize:'1rem',color:'var(--admin-muted)'}}>{tr.icon || 'notifications'}</span>
                    <span style={{font:"900 .82rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{tr.title || key}</span>
                  </div>
                  <span style={{font:"italic 900 1.6rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
