import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SHARE_TYPES, REFERRAL_REWARDS } from '../lib/growthEngine'

export default function AdminReferrals() {
  const [stats, setStats] = useState(null)
  const [shares, setShares] = useState([])
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('shares')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [shareRes, refRes] = await Promise.all([
        supabase.from('share_events').select('id, user_id, share_type, created_at, metadata').order('created_at', { ascending: false }).limit(200),
        supabase.from('referral_events').select('id, referrer_id, referred_id, event, created_at').order('created_at', { ascending: false }).limit(200),
      ])
      const sh = shareRes.data || []
      const rf = refRes.data || []
      const byType = {}
      Object.keys(SHARE_TYPES).forEach(k => { byType[k] = sh.filter(s => s.share_type === k).length })
      setStats({
        totalShares: sh.length,
        totalInvites: rf.filter(r => r.event === 'invite_sent').length,
        referredSignups: rf.filter(r => r.event === 'friend_signed_up').length,
        referredActivated: rf.filter(r => r.event === 'friend_activated').length,
        referredConversions: rf.filter(r => r.event === 'friend_first_trade').length,
        byType,
      })
      setShares(sh.slice(0, 50))
      setReferrals(rf.slice(0, 50))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const metrics = [
    { label: 'Shares', value: stats?.totalShares || 0, icon: 'share', color: '#ff5a00' },
    { label: 'Invitaciones', value: stats?.totalInvites || 0, icon: 'mail', color: '#3b82f6' },
    { label: 'Registros referidos', value: stats?.referredSignups || 0, icon: 'person_add', color: '#22c55e' },
    { label: 'Activados', value: stats?.referredActivated || 0, icon: 'check_circle', color: '#8b5cf6' },
    { label: 'Conversiones', value: stats?.referredConversions || 0, icon: 'paid', color: '#f59e0b' },
  ]

  const tabs = [
    { key: 'shares', label: 'Shares', icon: 'share' },
    { key: 'referrals', label: 'Referidos', icon: 'group_add' },
    { key: 'rewards', label: 'Rewards', icon: 'redeem' },
  ]

  return (
    <div className="admin-generic-page">
      {/* Hero */}
      <div className="ag-hero">
        <div style={{position:'absolute',right:'1rem',top:'-.1rem',font:"italic 900 clamp(3rem,7vw,5.5rem) 'Barlow Condensed'",color:'rgba(255,255,255,.04)',pointerEvents:'none',lineHeight:'.84'}}>REFERRALS</div>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">// growth engine</div>
            <h1 className="ag-title">Referrals / Shares</h1>
            <p className="ag-desc" style={{marginTop:'.6rem',maxWidth:'600px'}}>Usuarios que traen usuarios. Sharing contextual con valor real, no links vacíos.</p>
          </div>
          <div className="ag-icon-box"><span className="material-symbols-outlined">share</span></div>
        </div>
      </div>

      {/* Metrics */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'1px',background:'var(--admin-line)',border:'1px solid var(--admin-line)'}}>
          {metrics.map(m => (
            <div key={m.label} style={{background:'var(--admin-panel)',padding:'18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                <span className="material-symbols-outlined" style={{fontSize:'1rem',color:m.color}}>{m.icon}</span>
                <span style={{font:"900 .64rem 'Barlow Condensed'",letterSpacing:'.08em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>{m.label}</span>
              </div>
              <div style={{font:"italic 900 2.2rem 'Barlow Condensed'",color:m.color,lineHeight:'.9'}}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Share Types Breakdown */}
      {stats?.byType && (
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// distribución</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Shares por Tipo</h3>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'var(--admin-line)'}}>
            {Object.entries(SHARE_TYPES).map(([key, def]) => {
              const count = stats.byType[key] || 0
              return (
                <div key={key} style={{background:'var(--admin-panel)',padding:'18px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                    <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:def.color}}>{def.icon}</span>
                    <span style={{font:"900 .74rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{def.label}</span>
                  </div>
                  <div style={{font:"italic 900 2rem 'Barlow Condensed'",color:def.color}}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:'1px',background:'var(--admin-line)',border:'1px solid var(--admin-line)'}}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{flex:1,padding:'14px',border:0,background:tab===t.key?'var(--admin-orange)':'var(--admin-panel)',color:tab===t.key?'#fff':'var(--admin-muted)',font:"900 .82rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            <span className="material-symbols-outlined" style={{fontSize:'1rem'}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'shares' && (
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// historial</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Shares Recientes</h3>
          </div>
          <div style={{maxHeight:'400px',overflowY:'auto'}}>
            {shares.length === 0 ? (
              <div style={{padding:'40px',textAlign:'center',color:'var(--admin-muted)'}}>Sin shares todavía</div>
            ) : shares.map(s => {
              const def = SHARE_TYPES[s.share_type] || { icon: 'share', label: s.share_type, color: '#ff5a00' }
              return (
                <div key={s.id} style={{display:'grid',gridTemplateColumns:'36px 1fr auto',gap:'12px',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid var(--admin-line)'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:def.color}}>{def.icon}</span>
                  <div>
                    <span style={{font:"900 .78rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{def.label}</span>
                    <div style={{fontSize:'.68rem',color:'var(--admin-muted2)'}}>user: {s.user_id?.slice(0,8)}...</div>
                  </div>
                  <span style={{font:"900 .62rem 'Barlow Condensed'",color:'var(--admin-muted2)'}}>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'referrals' && (
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// referidos</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Eventos de Referidos</h3>
          </div>
          <div style={{maxHeight:'400px',overflowY:'auto'}}>
            {referrals.length === 0 ? (
              <div style={{padding:'40px',textAlign:'center',color:'var(--admin-muted)'}}>Sin referidos todavía</div>
            ) : referrals.map(r => {
              const reward = REFERRAL_REWARDS[r.event] || {}
              const colors = { invite_sent: '#3b82f6', friend_signed_up: '#22c55e', friend_activated: '#8b5cf6', friend_first_trade: '#f59e0b' }
              return (
                <div key={r.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'12px',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid var(--admin-line)'}}>
                  <div>
                    <span style={{font:"900 .78rem 'Barlow Condensed'",textTransform:'uppercase',color:colors[r.event]||'#fff'}}>{reward.label || r.event}</span>
                    <div style={{fontSize:'.68rem',color:'var(--admin-muted2)'}}>referrer: {r.referrer_id?.slice(0,8)}... → {r.referred_id?.slice(0,8)}...</div>
                  </div>
                  <span style={{font:"900 .62rem 'Barlow Condensed'",color:'var(--admin-muted2)'}}>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'rewards' && (
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// incentivos</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Rewards por Referido</h3>
          </div>
          <div style={{padding:'16px 20px'}}>
            {Object.entries(REFERRAL_REWARDS).map(([key, def]) => (
              <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--admin-line)'}}>
                <div>
                  <div style={{font:"900 .82rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{def.label}</div>
                  <div style={{fontSize:'.72rem',color:'var(--admin-muted2)',marginTop:'2px'}}>+{def.xp} XP{def.reward_type ? ` · ${def.reward_type} (${def.reward_hours}h)` : ''}</div>
                </div>
                <span style={{font:"italic 900 1.2rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
