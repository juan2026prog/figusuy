import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROWTH_ACHIEVEMENTS } from '../lib/growthEngine'
import { REWARD_TYPES, ACHIEVEMENT_REWARDS } from '../lib/gamification'

export default function AdminRewardsEngine() {
  const [rewards, setRewards] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('user_rewards')
        .select('id, user_id, type, value, source, consumed_at, expires_at, created_at, resolved_as')
        .order('created_at', { ascending: false }).limit(300)
      const list = data || []
      const now = new Date()
      const active = list.filter(r => !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > now))
      const consumed = list.filter(r => r.consumed_at)
      const expired = list.filter(r => !r.consumed_at && r.expires_at && new Date(r.expires_at) <= now)
      const byType = {}
      list.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1 })
      const bySource = {}
      list.forEach(r => {
        const src = r.source?.startsWith('growth:') ? 'Growth' : r.source?.startsWith('achievement:') ? 'Logro' : r.source?.startsWith('referral:') ? 'Referido' : r.source === 'admin_manual' ? 'Manual' : 'Otro'
        bySource[src] = (bySource[src] || 0) + 1
      })
      setStats({ total: list.length, active: active.length, consumed: consumed.length, expired: expired.length, byType, bySource })
      setRewards(list)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const revokeReward = async (rewardId) => {
    if (!confirm('¿Revocar este reward?')) return
    await supabase.from('user_rewards').update({ consumed_at: new Date().toISOString(), resolved_as: 'revoked' }).eq('id', rewardId)
    loadData()
  }

  const now = new Date()
  const filtered = tab === 'active'
    ? rewards.filter(r => !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > now))
    : tab === 'consumed' ? rewards.filter(r => r.consumed_at)
    : tab === 'expired' ? rewards.filter(r => !r.consumed_at && r.expires_at && new Date(r.expires_at) <= now)
    : rewards

  const metrics = [
    { label: 'Total otorgados', value: stats?.total || 0, icon: 'redeem', color: '#ff5a00' },
    { label: 'Activos', value: stats?.active || 0, icon: 'bolt', color: '#22c55e' },
    { label: 'Consumidos', value: stats?.consumed || 0, icon: 'check_circle', color: '#3b82f6' },
    { label: 'Expirados', value: stats?.expired || 0, icon: 'schedule', color: '#64748b' },
  ]

  const tabs = [
    { key: 'active', label: 'Activos', count: stats?.active },
    { key: 'consumed', label: 'Consumidos', count: stats?.consumed },
    { key: 'expired', label: 'Expirados', count: stats?.expired },
    { key: 'all', label: 'Todos', count: stats?.total },
  ]

  return (
    <div className="admin-generic-page">
      {/* Hero */}
      <div className="ag-hero">
        <div style={{position:'absolute',right:'1rem',top:'-.1rem',font:"italic 900 clamp(3rem,7vw,5.5rem) 'Barlow Condensed'",color:'rgba(255,255,255,.04)',pointerEvents:'none',lineHeight:'.84'}}>REWARDS</div>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">// growth engine</div>
            <h1 className="ag-title">Rewards Engine</h1>
            <p className="ag-desc" style={{marginTop:'.6rem',maxWidth:'600px'}}>Rewards útiles. No cosméticos vacíos. XP, boost, prioridad, días Plus/Pro.</p>
          </div>
          <div className="ag-icon-box"><span className="material-symbols-outlined">card_giftcard</span></div>
        </div>
      </div>

      {/* Metrics */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--admin-line)',border:'1px solid var(--admin-line)'}}>
          {metrics.map(m => (
            <div key={m.label} style={{background:'var(--admin-panel)',padding:'20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                <span className="material-symbols-outlined" style={{fontSize:'1rem',color:m.color}}>{m.icon}</span>
                <span style={{font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.08em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>{m.label}</span>
              </div>
              <div style={{font:"italic 900 2.4rem 'Barlow Condensed'",color:m.color,lineHeight:'.9'}}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        {/* By Type */}
        {stats?.byType && (
          <div className="ag-card">
            <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
              <div className="admin-kicker">// por tipo</div>
              <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Distribución</h3>
            </div>
            <div style={{padding:'14px 20px'}}>
              {Object.entries(stats.byType).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
                const def = REWARD_TYPES[type] || { name: type, icon: '🎁' }
                const maxVal = Math.max(...Object.values(stats.byType))
                return (
                  <div key={type} style={{marginBottom:'12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                      <span style={{font:"900 .76rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{def.icon} {def.name}</span>
                      <span style={{font:"italic 900 1.1rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{count}</span>
                    </div>
                    <div style={{height:'6px',background:'rgba(255,255,255,.04)',border:'1px solid var(--admin-line)'}}>
                      <div style={{height:'100%',width:`${(count/maxVal)*100}%`,background:'var(--admin-orange)',transition:'width .3s'}} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* By Source */}
        {stats?.bySource && (
          <div className="ag-card">
            <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
              <div className="admin-kicker">// por origen</div>
              <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Fuentes</h3>
            </div>
            <div style={{padding:'14px 20px'}}>
              {Object.entries(stats.bySource).sort((a,b) => b[1]-a[1]).map(([src, count]) => {
                const colors = { Growth: '#ff5a00', Logro: '#22c55e', Referido: '#8b5cf6', Manual: '#3b82f6', Otro: '#64748b' }
                return (
                  <div key={src} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--admin-line)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'10px',height:'10px',background:colors[src]||'#64748b'}} />
                      <span style={{font:"900 .82rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{src}</span>
                    </div>
                    <span style={{font:"italic 900 1.4rem 'Barlow Condensed'",color:colors[src]||'var(--admin-muted)'}}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reward Catalog */}
      <div className="ag-card">
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
          <div className="admin-kicker">// catálogo</div>
          <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Catálogo de Rewards</h3>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'var(--admin-line)'}}>
          {Object.entries(REWARD_TYPES).map(([key, def]) => (
            <div key={key} style={{background:'var(--admin-panel)',padding:'18px'}}>
              <div style={{fontSize:'1.8rem',marginBottom:'8px'}}>{def.icon}</div>
              <div style={{font:"900 .82rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{def.name}</div>
              <div style={{fontSize:'.74rem',color:'var(--admin-muted)',marginTop:'4px',lineHeight:'1.4'}}>{def.description}</div>
              <div style={{marginTop:'8px',font:"900 .62rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',color:'var(--admin-orange)'}}>
                {stats?.byType?.[key] || 0} otorgados
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + List */}
      <div style={{display:'flex',gap:'1px',background:'var(--admin-line)',border:'1px solid var(--admin-line)'}}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{flex:1,padding:'12px',border:0,background:tab===t.key?'var(--admin-orange)':'var(--admin-panel)',color:tab===t.key?'#fff':'var(--admin-muted)',font:"900 .78rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer'}}>
            {t.label} ({t.count || 0})
          </button>
        ))}
      </div>

      <div className="ag-card">
        <div style={{maxHeight:'400px',overflowY:'auto'}}>
          {filtered.length === 0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'var(--admin-muted)'}}>Sin rewards en esta categoría</div>
          ) : filtered.map(r => {
            const def = REWARD_TYPES[r.type] || { name: r.type, icon: '🎁' }
            const isActive = !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > now)
            return (
              <div key={r.id} style={{display:'grid',gridTemplateColumns:'48px 1fr auto',gap:'12px',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid var(--admin-line)'}}>
                <div style={{width:'48px',height:'48px',display:'grid',placeItems:'center',border:'1px solid var(--admin-line)',background:'rgba(255,255,255,.02)',fontSize:'1.4rem'}}>{def.icon}</div>
                <div>
                  <div style={{font:"900 .78rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{def.name} · {r.value}</div>
                  <div style={{fontSize:'.68rem',color:'var(--admin-muted2)',marginTop:'2px'}}>
                    {r.source?.replace('achievement:','Hito: ').replace('growth:','Growth: ').replace('referral:','Ref: ')} · user: {r.user_id?.slice(0,8)}...
                  </div>
                </div>
                <div style={{textAlign:'right',display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end'}}>
                  <span style={{padding:'3px 8px',border:`1px solid ${isActive?'rgba(34,197,94,.3)':'var(--admin-line)'}`,background:isActive?'rgba(34,197,94,.06)':'transparent',font:"900 .62rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',color:isActive?'var(--admin-green)':'var(--admin-muted2)'}}>
                    {isActive ? 'Activo' : r.consumed_at ? 'Usado' : 'Expirado'}
                  </span>
                  {isActive && (
                    <button onClick={() => revokeReward(r.id)} style={{border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.06)',color:'#ef4444',padding:'2px 8px',font:"900 .58rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer'}}>Revocar</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
