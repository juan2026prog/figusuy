import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useGamificationStore } from '../stores/gamificationStore'
import {
  LEVELS, LEVEL_ORDER, LEVEL_REQUIREMENTS, ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES,
  BADGES, REWARD_TYPES, ACHIEVEMENT_REWARDS, getLevelProgress, getNextLevelMessage
} from '../lib/gamification'
import ReputationStars from '../components/ReputationStars'
import {
  MILESTONE_MIN_REP, REWARD_MIN_REP, renderStars, getStarLevel,
  canUnlockMilestone, canClaimReward, getReputationBlockMessage, getRequiredRepLabel
} from '../lib/reputation'

export default function AchievementsPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { progress, achievements, badges, rewards, reputation, loading, initialize } = useGamificationStore()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (profile?.id) initialize(profile.id)
  }, [profile?.id])

  const level = LEVELS[progress?.level] || LEVELS.explorador
  const levelIdx = LEVEL_ORDER.indexOf(progress?.level || 'explorador')
  const nextLevel = level.next ? LEVELS[level.next] : null
  const { percent, requirements } = getLevelProgress(progress?.level || 'explorador', progress || {}, profile || {})
  const nextMsg = getNextLevelMessage(progress?.level || 'explorador', progress || {}, profile || {})
  const completedCount = (achievements || []).filter(a => a.completed).length
  const totalCount = (achievements || []).length || 20

  const tabs = [
    { key: 'overview', label: 'Resumen', icon: 'dashboard' },
    { key: 'achievements', label: 'Hitos', icon: 'emoji_events' },
    { key: 'rewards', label: 'Rewards', icon: 'card_giftcard' },
  ]

  const activeRewardsCount = rewards?.filter(r => !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > new Date())).length || 0

  return (
    <div className="panini-page">
      <style>{`
        :root{
          --bg:#0b0b0b;
          --panel:#121212;
          --panel2:#181818;
          --panel3:#202020;
          --line:rgba(255,255,255,.08);
          --line2:rgba(255,255,255,.14);
          --text:#f5f5f5;
          --muted:rgba(245,245,245,.54);
          --muted2:rgba(245,245,245,.34);
          --orange:#ff5a00;
          --orange2:#cc4800;
          --green:#22c55e;
          --blue:#3b82f6;
          --purple:#8b5cf6;
          --yellow:#facc15;
          --red:#ef4444;
        }

        .panini-page { font-family: 'Barlow', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; width: 100%; }
        .panini-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .panini-page button { font-family: inherit; }

        .topbar{
          min-height:82px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          padding:14px 22px;
          border-bottom:1px solid var(--line);
          background:#0b0b0b;
          position:sticky;
          top:0;
          z-index:20;
        }
        .top-kicker{font:900 .72rem 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;color:var(--orange)}
        .top-title{font:italic 900 2.45rem 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin-top:3px}
        .btn{border:1px solid var(--line2);background:transparent;color:#fff;padding:.85rem 1.15rem;font:900 .88rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
        .btn:hover{border-color:var(--orange);color:var(--orange)}
        .btn.orange{background:var(--orange);border-color:var(--orange);color:#fff}
        .btn.orange:hover{background:var(--orange2);border-color:var(--orange2)}

        .wrap{max-width:1320px;margin:0 auto;padding:28px 22px 76px}

        .hero{
          display:grid;
          grid-template-columns:1fr 360px;
          gap:22px;
          margin-bottom:22px;
        }
        .hero-main{
          position:relative;
          overflow:hidden;
          background:linear-gradient(135deg,#181818 0%,#101010 55%,rgba(255,90,0,.18) 100%);
          border:1px solid var(--line);
          padding:30px;
          min-height:290px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
        }
        .hero-main:before{
          content:'LOGROS';
          position:absolute;
          right:24px;
          top:-18px;
          font:italic 900 8.5rem 'Barlow Condensed';
          color:rgba(255,255,255,.035);
          line-height:1;
          pointer-events:none;
        }
        .kicker{font:900 .72rem 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;color:var(--orange)}
        .hero-title{font:italic 900 clamp(3rem,6vw,5.6rem) 'Barlow Condensed';line-height:.86;text-transform:uppercase;margin-top:8px;position:relative;z-index:1}
        .hero-title span{color:var(--orange)}
        .hero-sub{color:var(--muted);font-size:1rem;line-height:1.6;max-width:640px;margin-top:14px;position:relative;z-index:1}

        .hero-bottom{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);margin-top:30px;position:relative;z-index:1}
        .hero-stat{background:rgba(18,18,18,.92);padding:18px}
        .hero-stat b{display:block;font:italic 900 2.5rem 'Barlow Condensed';line-height:.9}
        .hero-stat span{font:900 .72rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted2)}
        .hero-stat.orange b{color:var(--orange)}.hero-stat.green b{color:var(--green)}.hero-stat.blue b{color:var(--blue)}

        .level-card{
          background:var(--panel);
          border:1px solid var(--line);
          padding:22px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          min-height:290px;
        }
        .level-icon{width:72px;height:72px;background:var(--orange);display:grid;place-items:center;font-size:2.2rem;margin-bottom:16px}
        .level-card h2{font:italic 900 2.55rem 'Barlow Condensed';line-height:.88;text-transform:uppercase}
        .level-card p{color:var(--muted);font-size:.92rem;line-height:1.5;margin-top:8px}
        .level-percent{font:italic 900 3.5rem 'Barlow Condensed';color:var(--orange);line-height:.9;margin-top:22px}
        .level-label{font:900 .72rem 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;color:var(--muted2)}

        .tabs{display:flex;gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:22px;overflow:auto}
        .tab{border:0;background:var(--panel);color:var(--muted);padding:14px 22px;font:900 .86rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:8px}
        .tab.active{background:var(--orange);color:#fff}
        .tab:hover{color:#fff}

        .layout{display:grid;grid-template-columns:1fr 330px;gap:22px;align-items:start}
        .main-stack{display:grid;gap:22px}
        .side-stack{display:grid;gap:22px;position:sticky;top:104px}

        .card{background:var(--panel);border:1px solid var(--line)}
        .card-head{padding:20px 22px;border-bottom:1px solid var(--line);background:var(--panel2);display:flex;justify-content:space-between;gap:16px;align-items:flex-end}
        .card-head h2{font:italic 900 2.2rem 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin-top:5px}
        .card-head p{color:var(--muted);font-size:.9rem;margin-top:5px}

        .roadmap{padding:22px}
        .roadmap-line{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}
        .road-step{position:relative;background:#0d0d0d;border:1px solid var(--line);padding:14px;min-height:94px}
        .road-step.done{border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.06)}
        .road-step.current{border-color:var(--orange);background:rgba(255,90,0,.09)}
        .road-step b{display:block;font:italic 900 1.25rem 'Barlow Condensed';text-transform:uppercase;line-height:.9}
        .road-step span{display:block;color:var(--muted2);font-size:.76rem;margin-top:8px}
        .road-mark{position:absolute;right:10px;top:10px;color:var(--orange);font-weight:900}

        .bar{height:20px;background:#090909;border:1px solid var(--line2);position:relative;overflow:hidden}
        .bar div{height:100%;background:var(--orange);width:64%;transition:width 0.3s;}
        .bar:before,.bar:after{content:'';position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.42)}
        .bar:before{left:33.33%}.bar:after{left:66.66%}

        .missions{display:grid;gap:8px;margin-top:18px}
        .mission{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 14px;background:#0d0d0d;border:1px solid var(--line)}
        .mission-check{width:28px;height:28px;display:grid;place-items:center;background:rgba(255,255,255,.06);color:var(--muted2);font-weight:900}
        .mission.done .mission-check{background:rgba(34,197,94,.14);color:var(--green)}
        .mission b{font-size:.9rem}.mission span{font-size:.8rem;color:var(--muted)}
        .mission small{font:900 .72rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--orange)}

        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line)}
        .stat{background:var(--panel);padding:20px;text-align:left}
        .stat b{display:block;font:italic 900 2.65rem 'Barlow Condensed';line-height:.9}
        .stat span{display:block;margin-top:6px;font:900 .72rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted2)}
        .stat.orange b{color:var(--orange)}.stat.green b{color:var(--green)}.stat.purple b{color:var(--purple)}.stat.blue b{color:var(--blue)}

        .badges-wrap{display:flex;gap:8px;flex-wrap:wrap;padding:20px 22px}
        .badge{border:1px solid var(--line2);background:#0d0d0d;padding:8px 11px;font:900 .8rem 'Barlow Condensed';letter-spacing:.07em;text-transform:uppercase;color:#fff;display:flex;gap:7px;align-items:center}
        .badge.green{border-color:rgba(34,197,94,.35);color:var(--green);background:rgba(34,197,94,.07)}
        .badge.orange{border-color:rgba(255,90,0,.35);color:var(--orange);background:rgba(255,90,0,.08)}
        .badge.blue{border-color:rgba(59,130,246,.35);color:#60a5fa;background:rgba(59,130,246,.08)}

        .achievement-section{display:grid;gap:14px}
        .category-title{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:var(--panel2);border:1px solid var(--line)}
        .category-title h3{font:italic 900 2rem 'Barlow Condensed';text-transform:uppercase;line-height:.9}
        .category-title span{font:900 .72rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted2)}
        .ach-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .ach-card{background:var(--panel);border:1px solid var(--line);padding:18px;position:relative;overflow:hidden}
        .ach-card.done{border-color:rgba(34,197,94,.3);background:linear-gradient(135deg,rgba(34,197,94,.08),var(--panel) 55%)}
        .ach-card.progress{border-color:rgba(255,90,0,.3);background:linear-gradient(135deg,rgba(255,90,0,.08),var(--panel) 55%)}
        .ach-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
        .ach-icon{font-size:2rem}.ach-state{border:1px solid var(--line2);padding:4px 7px;font:900 .62rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
        .ach-state.done{color:var(--green);border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.08)}
        .ach-state.progress{color:var(--orange);border-color:rgba(255,90,0,.35);background:rgba(255,90,0,.08)}
        .ach-name{font:italic 900 1.55rem 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin-bottom:7px}
        .ach-desc{color:var(--muted);font-size:.84rem;line-height:1.45;margin-bottom:14px}
        .ach-bar{height:8px;background:#090909;border:1px solid var(--line);overflow:hidden}.ach-bar div{height:100%;background:var(--orange);width:60%;transition:width 0.3s;}.ach-card.done .ach-bar div{background:var(--green);width:100%}
        .ach-meta{display:flex;justify-content:space-between;margin-top:7px;color:var(--muted2);font-size:.75rem;font-weight:800}
        .reward-chip{margin-top:12px;border:1px solid rgba(255,90,0,.25);background:rgba(255,90,0,.07);color:var(--orange);padding:8px 10px;font-size:.76rem;font-weight:800}

        .reward-list{display:grid;gap:10px}
        .reward-card{display:grid;grid-template-columns:58px 1fr auto;gap:14px;align-items:center;background:var(--panel);border:1px solid var(--line);padding:14px}
        .reward-icon{width:58px;height:58px;background:rgba(255,90,0,.1);border:1px solid rgba(255,90,0,.25);display:grid;place-items:center;font-size:1.6rem}
        .reward-card h3{font:italic 900 1.45rem 'Barlow Condensed';text-transform:uppercase;line-height:.9}.reward-card p{color:var(--muted);font-size:.82rem;margin-top:5px}
        .reward-status{border:1px solid var(--line2);padding:6px 9px;font:900 .7rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.reward-status.active{color:var(--green);border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.08)}.reward-status.used{color:var(--blue);border-color:rgba(59,130,246,.35);background:rgba(59,130,246,.08)}

        .side-card{background:var(--panel);border:1px solid var(--line);padding:20px}
        .side-card h3{font:italic 900 1.85rem 'Barlow Condensed';line-height:.9;text-transform:uppercase;margin-bottom:10px}.side-card p{color:var(--muted);font-size:.9rem;line-height:1.5}
        .next-reward{background:var(--orange);border-color:var(--orange2);color:#fff}.next-reward p{color:rgba(255,255,255,.82)}.next-reward .btn{background:#0b0b0b;border-color:#0b0b0b;margin-top:16px;width:100%}
        .side-row{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:11px 0}.side-row:last-child{border-bottom:0}.side-row span{color:var(--muted);font-size:.86rem}.side-row b{font:900 1rem 'Barlow Condensed'}

        .empty{background:var(--panel);border:1px solid var(--line);padding:44px;text-align:center}.empty-icon{font-size:3rem;display:block;margin-bottom:12px}.empty h3{font:italic 900 2rem 'Barlow Condensed';text-transform:uppercase}.empty p{color:var(--muted);margin-top:7px}

        .tab-content{display:none}.tab-content.active{display:block}

        @media(max-width:1050px){.hero,.layout{grid-template-columns:1fr}.side-stack{position:static}.stats-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:720px){.wrap{padding:16px 12px 64px}.topbar{align-items:flex-start}.top-title{font-size:2rem}.hero-main{padding:22px}.hero-bottom{grid-template-columns:1fr}.ach-grid{grid-template-columns:1fr}.roadmap-line{grid-template-columns:1fr 1fr}.reward-card{grid-template-columns:48px 1fr}.reward-status{grid-column:1/-1;text-align:center}.tabs{width:100%}.tab{flex:1;justify-content:center;padding:12px 10px}.card-head{display:block}}
      `}</style>
      <header className="topbar">
        <div>
          <div className="top-kicker">Progreso / Logros</div>
          <div className="top-title">Mis Logros</div>
        </div>
        <button className="btn" onClick={() => navigate('/profile')}>← Perfil</button>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="hero-main">
            <div>
              <div className="kicker">// circuito de coleccionista</div>
              <h1 className="hero-title">Subí de nivel, ganá <span>rewards</span> y completá más.</h1>
              <p className="hero-sub">Tus intercambios, actividad y progreso desbloquean niveles, insignias y premios útiles dentro de FigusUY.</p>
            </div>
            <div className="hero-bottom">
              <div className="hero-stat orange"><b>{completedCount}</b><span>Hitos completos</span></div>
              <div className="hero-stat green"><b>{progress?.total_trades || 0}</b><span>Cruces logrados</span></div>
              <div className="hero-stat blue"><b>{progress?.days_active || 0}</b><span>Días activos</span></div>
            </div>
          </div>

          <aside className="level-card">
            <div>
              <div className="level-icon">{level.icon}</div>
              <div className="kicker">Nivel actual</div>
              <h2>{level.name}</h2>
              <p>{nextMsg}</p>
              <div style={{ marginTop: '14px' }}>
                <ReputationStars stars={reputation?.star_rating || 1} size="lg" showLabel />
              </div>
            </div>
            {nextLevel && (
              <div>
                <div className="level-percent">{percent}%</div>
                <div className="level-label">hacia {nextLevel.name}</div>
              </div>
            )}
          </aside>
        </section>

        <nav className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>▦ Resumen</button>
          <button className={`tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>🏅 Hitos</button>
          <button className={`tab ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>🎁 Rewards</button>
        </nav>

        <section className="layout">
          <div className="main-stack">
            {activeTab === 'overview' && (
              <div id="overview" className="tab-content active">
                <section className="card">
                  <div className="card-head">
                    <div>
                      <div className="kicker">Roadmap</div>
                      <h2>Camino de nivel</h2>
                      <p>Tu recorrido dentro de FigusUY.</p>
                    </div>
                  </div>
                  <div className="roadmap">
                    <div className="roadmap-line">
                      {LEVEL_ORDER.map((lk, i) => {
                        const isDone = i < levelIdx;
                        const isCurrent = i === levelIdx;
                        const lvlName = LEVELS[lk].name;
                        const label = isCurrent ? 'Nivel actual' : isDone ? 'Superado' : (i === levelIdx + 1 ? 'Próximo nivel' : 'Bloqueado');
                        return (
                          <div key={lk} className={`road-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                            {isDone && <div className="road-mark">✓</div>}
                            {isCurrent && <div className="road-mark">●</div>}
                            <b>{lvlName}</b>
                            <span>{label}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="bar">
                      <div style={{ width: `${nextLevel ? (levelIdx * 33.33 + percent * 0.3333) : 100}%` }}></div>
                    </div>
                    <div className="missions">
                      {nextLevel && requirements.length > 0 ? (
                        requirements.map(r => (
                          <div key={r.key} className={`mission ${r.met ? 'done' : ''}`}>
                            <div className="mission-check">{r.met ? '✓' : '○'}</div>
                            <div>
                              <b>{r.label}</b>
                              <span>{r.met ? 'Ya superaste este objetivo.' : 'Sigue trabajando en este objetivo.'}</span>
                            </div>
                            <small>{r.met ? 'Listo' : 'En progreso'}</small>
                          </div>
                        ))
                      ) : (
                        <div className="mission done">
                          <div className="mission-check">✓</div>
                          <div>
                            <b>Circuito Referente activo</b>
                            <span>Completá hitos y ganá rewards</span>
                          </div>
                          <small>Listo</small>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="card">
                  <div className="stats-grid">
                    <div className="stat orange"><b>{progress?.streak_days || 0}</b><span>Racha actual</span></div>
                    <div className="stat green"><b>{completedCount}</b><span>Hitos</span></div>
                    <div className="stat purple"><b>{progress?.total_trades || 0}</b><span>Cruces</span></div>
                    <div className="stat blue"><b>{progress?.days_active || 0}</b><span>Días activos</span></div>
                  </div>
                </section>

                <section className="card">
                  <div className="card-head">
                    <div>
                      <div className="kicker">Insignias</div>
                      <h2>Tu colección</h2>
                      <p>Badges desbloqueados por actividad y confianza.</p>
                    </div>
                  </div>
                  {badges && badges.length > 0 ? (
                    <div className="badges-wrap">
                      {badges.map(b => {
                        const def = BADGES[b.key] || { name: b.key, icon: '🏅', color: 'orange' };
                        let colorClass = 'orange';
                        if (def.color?.includes('green') || def.color === '#22c55e') colorClass = 'green';
                        else if (def.color?.includes('blue') || def.color === '#3b82f6') colorClass = 'blue';
                        return (
                          <span key={b.key} className={`badge ${colorClass}`}>
                            {def.icon} {def.name}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="badges-wrap">
                      <span className="badge">Todavía no tenés insignias</span>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div id="achievements" className="tab-content active">
                <section className="achievement-section">
                  {ACHIEVEMENT_CATEGORIES.map(cat => {
                    const categoryKeys = Object.keys(ACHIEVEMENTS).filter(k => ACHIEVEMENTS[k].category === cat.key);
                    if (categoryKeys.length === 0) return null;
                    
                    const catCompleted = categoryKeys.filter(k => {
                      const a = (achievements || []).find(ach => ach.achievement_key === k || ach.key === k);
                      return a && a.completed;
                    }).length;

                    return (
                      <div key={cat.key} style={{ display: 'grid', gap: '14px', marginBottom: '22px' }}>
                        <div className="category-title">
                          <div>
                            <h3>{cat.label}</h3>
                            <span>{categoryKeys.length} hitos disponibles</span>
                          </div>
                          <div style={{ fontSize: '2rem' }}>{cat.icon}</div>
                        </div>
                        <div className="ach-grid">
                          {categoryKeys.map(key => {
                            const def = ACHIEVEMENTS[key];
                            const userAch = (achievements || []).find(a => a.achievement_key === key || a.key === key);
                            const progressVal = userAch ? userAch.progress : 0;
                            const target = def.target;
                            const pct = Math.min(100, Math.round((progressVal / target) * 100));
                            const reward = ACHIEVEMENT_REWARDS[key];
                            
                            const isDone = userAch ? userAch.completed : false;
                            const isProgress = !isDone && progressVal > 0;
                            const stateClass = isDone ? 'done' : isProgress ? 'progress' : '';
                            const stateLabel = isDone ? 'Completado' : isProgress ? 'En progreso' : 'Bloqueado';

                            return (
                              <article key={key} className={`ach-card ${stateClass}`}>
                                <div className="ach-top">
                                  <span className="ach-icon">{def.icon}</span>
                                  <span className={`ach-state ${stateClass}`}>{stateLabel}</span>
                                </div>
                                <div className="ach-name">{def.name}</div>
                                <p className="ach-desc">{def.description}</p>
                                <div className="ach-bar">
                                  <div style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="ach-meta">
                                  <span>{progressVal}/{target}</span>
                                  <span>{pct}%</span>
                                </div>
                                {reward && (
                                  <div className="reward-chip">
                                    🎁 Reward: {REWARD_TYPES[reward.type]?.name || reward.type} ({reward.value})
                                    {REWARD_MIN_REP[reward.type] && (
                                      <span style={{ marginLeft: '8px', opacity: 0.75 }}>
                                        · {getRequiredRepLabel(REWARD_MIN_REP[reward.type])}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* Reputation gate indicator for milestones */}
                                {MILESTONE_MIN_REP[key] && (
                                  <div style={{
                                    marginTop: '8px',
                                    padding: '6px 10px',
                                    border: `1px solid ${canUnlockMilestone(key, reputation?.star_rating || 1).canUnlock ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'}`,
                                    background: canUnlockMilestone(key, reputation?.star_rating || 1).canUnlock ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: canUnlockMilestone(key, reputation?.star_rating || 1).canUnlock ? 'var(--green)' : 'var(--muted)',
                                  }}>
                                    {canUnlockMilestone(key, reputation?.star_rating || 1).canUnlock
                                      ? `✓ Reputación suficiente (${renderStars(MILESTONE_MIN_REP[key])})`
                                      : `Requiere ${renderStars(MILESTONE_MIN_REP[key])} — ${getStarLevel(MILESTONE_MIN_REP[key]).label}`
                                    }
                                  </div>
                                )}
                              </article>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </section>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div id="rewards" className="tab-content active">
                {rewards && rewards.length > 0 && (
                  <section className="reward-list" style={{ marginBottom: '32px' }}>
                    <div className="category-title" style={{ marginBottom: '14px' }}>
                      <div>
                        <h3>Tus Rewards</h3>
                        <span>Premios que has ganado</span>
                      </div>
                    </div>
                    {rewards.map(r => {
                      const isExpired = r.expires_at && new Date(r.expires_at) < new Date()
                      const isConsumed = !!r.consumed_at
                      const isActive = !isExpired && !isConsumed
                      const typeDef = REWARD_TYPES[r.type] || REWARD_TYPES[r.resolved_as] || { name: r.type, icon: '🎁' }
                      
                      const statusClass = isActive ? 'active' : isConsumed ? 'used' : '';
                      const statusLabel = isActive ? 'Activo' : isConsumed ? 'Usado' : 'Expirado';
                      
                      // Check reputation gate for this reward
                      const repCheck = canClaimReward(r.type || r.resolved_as, reputation?.star_rating || 1);

                      return (
                        <article key={r.id} className="reward-card" style={{ marginBottom: '10px' }}>
                          <div className="reward-icon">{typeDef.icon || '🎁'}</div>
                          <div>
                            <h3>{typeDef.name}</h3>
                            <p>
                              {r.value}
                              {r.resolved_as && ` · Mejorado a ${REWARD_TYPES[r.resolved_as]?.name || r.resolved_as}`}
                              {r.source && ` · ${r.source.replace('achievement:', 'Hito: ')}`}
                            </p>
                            {!repCheck.canClaim && !isConsumed && (
                              <p style={{
                                marginTop: '6px',
                                color: 'var(--muted)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                              }}>
                                Te falta reputación para este reward — necesitás {renderStars(repCheck.required)}
                              </p>
                            )}
                          </div>
                          <span className={`reward-status ${statusClass}`}>{statusLabel}</span>
                        </article>
                      )
                    })}
                  </section>
                )}

                <section className="reward-list">
                  <div className="category-title" style={{ marginBottom: '14px' }}>
                    <div>
                      <h3>Catálogo de Rewards</h3>
                      <span>Beneficios que puedes desbloquear completando hitos</span>
                    </div>
                    <div style={{ fontSize: '2rem' }}>🎁</div>
                  </div>
                  {Object.keys(REWARD_TYPES).map(key => {
                    const def = REWARD_TYPES[key];
                    const repReq = REWARD_MIN_REP[key];
                    const repOk = repReq ? (reputation?.star_rating || 1) >= repReq : true;
                    return (
                      <article key={key} className="reward-card" style={{ marginBottom: '10px' }}>
                        <div className="reward-icon" style={{ opacity: 0.5, background: 'transparent' }}>{def.icon}</div>
                        <div>
                          <h3 style={{ opacity: 0.8 }}>{def.name}</h3>
                          <p>{def.description}</p>
                          {repReq && (
                            <p style={{
                              marginTop: '5px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              fontFamily: "'Barlow Condensed', sans-serif",
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: repOk ? 'var(--green)' : 'var(--muted)',
                            }}>
                              {repOk 
                                ? `✓ Reputación suficiente`
                                : `Mín. ${renderStars(repReq)} — ${getStarLevel(repReq).label}`
                              }
                            </p>
                          )}
                        </div>
                        <span className="reward-status" style={{ opacity: 0.4 }}>Bloqueado</span>
                      </article>
                    )
                  })}
                </section>
              </div>
            )}
          </div>

          <aside className="side-stack">
            {nextLevel && requirements.length > 0 && (
              <section className="side-card next-reward">
                <h3>Próximo reward</h3>
                <p>{nextMsg}</p>
                <button className="btn" onClick={() => navigate('/stores')}>Ver intercambios</button>
              </section>
            )}
            <section className="side-card">
              <h3>Resumen</h3>
              <div className="side-row"><span>Hitos</span><b>{completedCount}/{totalCount}</b></div>
              <div className="side-row"><span>Rewards activos</span><b>{activeRewardsCount}</b></div>
              <div className="side-row"><span>Insignias</span><b>{badges?.length || 0}</b></div>
              <div className="side-row">
                <span>Reputación</span>
                <b><ReputationStars stars={reputation?.star_rating || 1} size="sm" inline /></b>
              </div>
            </section>
            <section className="side-card">
              <h3>Consejo</h3>
              <p>Marcá bien tus repetidas y faltantes. Eso mejora tus cruces y te ayuda a avanzar más rápido.</p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
