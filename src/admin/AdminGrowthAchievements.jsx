import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROWTH_ACHIEVEMENTS, GROWTH_ACHIEVEMENT_CATEGORY } from '../lib/growthEngine'

export default function AdminGrowthAchievements() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('user_achievements')
        .select('achievement_key, completed, progress, target, user_id')
        .in('achievement_key', Object.keys(GROWTH_ACHIEVEMENTS))
      const list = data || []
      const aggr = {}
      Object.keys(GROWTH_ACHIEVEMENTS).forEach(key => {
        const items = list.filter(a => a.achievement_key === key)
        aggr[key] = {
          total: items.length,
          completed: items.filter(a => a.completed).length,
          inProgress: items.filter(a => !a.completed && a.progress > 0).length,
        }
      })
      setStats(aggr)
      setAchievements(list)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const totalUnlocked = Object.values(stats).reduce((s, a) => s + a.completed, 0)
  const totalUsers = new Set(achievements.map(a => a.user_id)).size

  const metrics = [
    { label: 'Logros desbloqueados', value: totalUnlocked, icon: 'lock_open', color: '#22c55e' },
    { label: 'Usuarios con logros', value: totalUsers, icon: 'group', color: '#3b82f6' },
    { label: 'Logros disponibles', value: Object.keys(GROWTH_ACHIEVEMENTS).length, icon: 'emoji_events', color: '#ff5a00' },
    { label: 'Categoría', value: GROWTH_ACHIEVEMENT_CATEGORY.label, icon: 'category', color: '#8b5cf6' },
  ]

  return (
    <div className="admin-generic-page">
      {/* Hero */}
      <div className="ag-hero">
        <div style={{position:'absolute',right:'1rem',top:'-.1rem',font:"italic 900 clamp(3rem,7vw,5.5rem) 'Barlow Condensed'",color:'rgba(255,255,255,.04)',pointerEvents:'none',lineHeight:'.84'}}>LOGROS</div>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">// growth engine</div>
            <h1 className="ag-title">Growth Achievements</h1>
            <p className="ag-desc" style={{marginTop:'.6rem',maxWidth:'600px'}}>Logros que recompensan crecimiento de red. No uso. Adquisición, viralidad, liquidez.</p>
          </div>
          <div className="ag-icon-box"><span className="material-symbols-outlined">military_tech</span></div>
        </div>
      </div>

      {/* Metrics */}
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

      {/* Achievements Grid */}
      <div className="ag-card">
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div className="admin-kicker">// {GROWTH_ACHIEVEMENT_CATEGORY.icon} {GROWTH_ACHIEVEMENT_CATEGORY.label}</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Logros de Growth</h3>
          </div>
          <div className="ag-status">
            <span className="material-symbols-outlined" style={{fontSize:'.9rem'}}>check_circle</span>
            {totalUnlocked} desbloqueados
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1px',background:'var(--admin-line)'}}>
          {Object.entries(GROWTH_ACHIEVEMENTS).map(([key, def]) => {
            const s = stats[key] || { total: 0, completed: 0, inProgress: 0 }
            return (
              <div key={key} style={{background:'var(--admin-panel)',padding:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'1.8rem'}}>{def.icon}</span>
                    <div>
                      <div style={{font:"italic 900 1.3rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5',lineHeight:'.9'}}>{def.name}</div>
                      <div style={{fontSize:'.76rem',color:'var(--admin-muted)',marginTop:'3px'}}>{def.description}</div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                  <div style={{padding:'8px',background:'rgba(255,255,255,.02)',border:'1px solid var(--admin-line)',textAlign:'center'}}>
                    <div style={{font:"italic 900 1.4rem 'Barlow Condensed'",color:'var(--admin-green)'}}>{s.completed}</div>
                    <div style={{font:"900 .58rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>Completados</div>
                  </div>
                  <div style={{padding:'8px',background:'rgba(255,255,255,.02)',border:'1px solid var(--admin-line)',textAlign:'center'}}>
                    <div style={{font:"italic 900 1.4rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{s.inProgress}</div>
                    <div style={{font:"900 .58rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>En progreso</div>
                  </div>
                  <div style={{padding:'8px',background:'rgba(255,255,255,.02)',border:'1px solid var(--admin-line)',textAlign:'center'}}>
                    <div style={{font:"italic 900 1.4rem 'Barlow Condensed'",color:'var(--admin-muted)'}}>{s.total}</div>
                    <div style={{font:"900 .58rem 'Barlow Condensed'",letterSpacing:'.06em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>Total</div>
                  </div>
                </div>

                {/* Reward */}
                {def.reward ? (
                  <div style={{padding:'8px 10px',border:'1px solid rgba(255,90,0,.2)',background:'rgba(255,90,0,.05)',fontSize:'.72rem',fontWeight:800,color:'var(--admin-orange)'}}>
                    🎁 Reward: {def.reward.type} ({def.reward.value})
                  </div>
                ) : (
                  <div style={{padding:'8px 10px',border:'1px solid var(--admin-line)',fontSize:'.72rem',color:'var(--admin-muted2)'}}>Sin reward asociado</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
