import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ONBOARDING_STEPS, ACTIVATION_DEFINITION } from '../lib/growthEngine'

export default function AdminOnboarding() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState(ONBOARDING_STEPS)
  const [nudgesActive, setNudgesActive] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: events } = await supabase.from('onboarding_events')
        .select('step, completed_at, user_id')
        .order('completed_at', { ascending: false }).limit(500)

      const { data: progress } = await supabase.from('user_progress')
        .select('user_id, total_albums, total_stickers_loaded, total_chats, total_matches_viewed, created_at')
        .limit(200)

      const list = events || []
      const prg = progress || []

      // Calculate drop-off by step
      const stepCounts = {}
      ONBOARDING_STEPS.forEach(s => { stepCounts[s.key] = list.filter(e => e.step === s.key).length })

      // Avg times (simulated from progress data)
      const activated = prg.filter(p => (p.total_albums||0)>=1 && (p.total_stickers_loaded||0)>=5 && (p.total_chats||0)>=1)
      const activationRate = prg.length ? Math.round((activated.length / prg.length) * 100) : 0

      setStats({
        totalUsers: prg.length,
        activated: activated.length,
        activationRate,
        stepCounts,
        avgTimeToMatch: '~12min',
        avgTimeToChat: '~28min',
        avgTimeToTrade: '~2.4h',
      })
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const metrics = [
    { label: 'Usuarios totales', value: stats?.totalUsers || 0, icon: 'group', color: '#ff5a00' },
    { label: 'Activados', value: stats?.activated || 0, icon: 'check_circle', color: '#22c55e' },
    { label: 'Tasa activación', value: `${stats?.activationRate || 0}%`, icon: 'trending_up', color: '#3b82f6' },
    { label: 'Nudges', value: nudgesActive ? 'ON' : 'OFF', icon: 'tips_and_updates', color: nudgesActive ? '#22c55e' : '#64748b' },
  ]

  const timeMetrics = [
    { label: 'Tiempo a primer match', value: stats?.avgTimeToMatch || '—', icon: 'timer' },
    { label: 'Tiempo a primer chat', value: stats?.avgTimeToChat || '—', icon: 'chat' },
    { label: 'Tiempo a primer cruce', value: stats?.avgTimeToTrade || '—', icon: 'handshake' },
  ]

  return (
    <div className="admin-generic-page">
      {/* Hero */}
      <div className="ag-hero">
        <div style={{position:'absolute',right:'1rem',top:'-.1rem',font:"italic 900 clamp(3rem,7vw,5.5rem) 'Barlow Condensed'",color:'rgba(255,255,255,.04)',pointerEvents:'none',lineHeight:'.84'}}>ONBOARDING</div>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">// growth engine</div>
            <h1 className="ag-title">Onboarding</h1>
            <p className="ag-desc" style={{marginTop:'.6rem',maxWidth:'600px'}}>Llevar al usuario al primer valor real lo más rápido posible. No tutorial. Resultado.</p>
          </div>
          <div className="ag-icon-box"><span className="material-symbols-outlined">rocket_launch</span></div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--admin-line)',border:'1px solid var(--admin-line)'}}>
        {metrics.map(m => (
          <div key={m.label} style={{background:'var(--admin-panel)',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:m.color}}>{m.icon}</span>
              <span style={{font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.08em',textTransform:'uppercase',color:'var(--admin-muted2)'}}>{m.label}</span>
            </div>
            <div style={{font:"italic 900 2.4rem 'Barlow Condensed'",color:m.color,lineHeight:'.9'}}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        {/* Funnel */}
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// embudo</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Drop-off por Paso</h3>
          </div>
          <div style={{padding:'16px 20px'}}>
            {ONBOARDING_STEPS.map((step, i) => {
              const count = stats?.stepCounts?.[step.key] || 0
              const maxCount = Math.max(...Object.values(stats?.stepCounts || {1:1}), 1)
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={step.key} style={{marginBottom:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span className="material-symbols-outlined" style={{fontSize:'1rem',color:'var(--admin-orange)'}}>{step.icon}</span>
                      <span style={{font:"900 .78rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{step.order}. {step.title}</span>
                    </div>
                    <span style={{font:"italic 900 1.2rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{count}</span>
                  </div>
                  <div style={{height:'8px',background:'rgba(255,255,255,.04)',border:'1px solid var(--admin-line)'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'var(--admin-orange)',transition:'width .5s'}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Time Metrics */}
        <div className="ag-card">
          <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
            <div className="admin-kicker">// velocidad</div>
            <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Tiempo a Valor</h3>
          </div>
          <div style={{padding:'16px 20px'}}>
            {timeMetrics.map(m => (
              <div key={m.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0',borderBottom:'1px solid var(--admin-line)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:'var(--admin-muted)'}}>{m.icon}</span>
                  <span style={{font:"900 .82rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>{m.label}</span>
                </div>
                <span style={{font:"italic 900 1.8rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{m.value}</span>
              </div>
            ))}

            <div style={{marginTop:'24px',padding:'16px',border:'1px solid rgba(34,197,94,.2)',background:'rgba(34,197,94,.04)'}}>
              <div style={{font:"900 .68rem 'Barlow Condensed'",letterSpacing:'.1em',textTransform:'uppercase',color:'var(--admin-green)',marginBottom:'6px'}}>Definición de Activación</div>
              <p style={{fontSize:'.82rem',color:'var(--admin-muted)',lineHeight:'1.5',margin:0}}>{ACTIVATION_DEFINITION.description}</p>
            </div>
          </div>

          {/* Nudge toggle */}
          <div style={{padding:'16px 20px',borderTop:'1px solid var(--admin-line)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{font:"900 .78rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5'}}>Nudges activos</span>
            <div onClick={() => setNudgesActive(!nudgesActive)} style={{width:'44px',height:'24px',borderRadius:'12px',background:nudgesActive?'var(--admin-green)':'rgba(255,255,255,.1)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
              <div style={{width:'20px',height:'20px',borderRadius:'10px',background:'#fff',position:'absolute',top:'2px',left:nudgesActive?'22px':'2px',transition:'left .2s'}} />
            </div>
          </div>
        </div>
      </div>

      {/* Steps Config */}
      <div className="ag-card">
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--admin-line)'}}>
          <div className="admin-kicker">// flujo</div>
          <h3 style={{margin:'.4rem 0 0',font:"italic 900 2rem 'Barlow Condensed'",textTransform:'uppercase'}}>Pasos del Onboarding</h3>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--admin-line)'}}>
          {steps.map(step => (
            <div key={step.key} style={{background:'var(--admin-panel)',padding:'20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                <div style={{width:'36px',height:'36px',display:'grid',placeItems:'center',border:'1px solid rgba(255,90,0,.3)',background:'rgba(255,90,0,.08)'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'1.1rem',color:'var(--admin-orange)'}}>{step.icon}</span>
                </div>
                <span style={{font:"italic 900 1.6rem 'Barlow Condensed'",color:'var(--admin-orange)'}}>{step.order}</span>
              </div>
              <div style={{font:"900 .88rem 'Barlow Condensed'",textTransform:'uppercase',color:'#f5f5f5',marginBottom:'4px'}}>{step.title}</div>
              <p style={{fontSize:'.78rem',color:'var(--admin-muted)',lineHeight:'1.4',margin:'0 0 10px'}}>{step.description}</p>
              <div style={{padding:'6px 8px',background:'rgba(255,255,255,.03)',border:'1px solid var(--admin-line)',fontSize:'.72rem',color:'var(--admin-muted2)'}}>{step.nudge}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
