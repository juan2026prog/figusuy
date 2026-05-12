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
import GamificationIcon from '../components/gamification/icons/GamificationIcon'

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
              <div className="level-icon">
                {level.iconKey ? <GamificationIcon icon={level.iconKey} size="lg" /> : level.icon}
              </div>
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
                        
                        const isHistoric = def.rarity === 'histórico';

                        return (
                          <span key={b.key} className={`badge ${colorClass} ${isHistoric ? 'badge-historic' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {def.iconKey ? <GamificationIcon icon={def.iconKey} size="sm" /> : def.icon} {def.name}
                            {isHistoric && <small style={{ marginLeft: '4px', fontSize: '0.6rem', opacity: 0.8 }}>HISTÓRICO</small>}
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
                              <article key={key} className={`ach-card ${stateClass} cat-${cat.key}`}>
                                <div className="ach-top">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="ach-icon" style={{ display: 'inline-flex' }}>
                                      {def.iconKey ? <GamificationIcon icon={def.iconKey} size="sm" /> : def.icon}
                                    </span>
                                    {def.rarity && <span className="ach-rarity">{def.rarity}</span>}
                                  </div>
                                  <span className={`ach-state ${stateClass}`}>{stateLabel}</span>
                                </div>
                                <div className="ach-name">{def.name}</div>
                                <p className="ach-desc">{def.description}</p>
                                <div className="ach-bar">
                                  <div style={{ width: `${pct}%`, background: cat.color }}></div>
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
                          <div className="reward-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {typeDef.iconKey ? <GamificationIcon icon={typeDef.iconKey} size="md" /> : typeDef.icon || '🎁'}
                          </div>
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
                        <div className="reward-icon" style={{ opacity: 0.5, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {def.iconKey ? <GamificationIcon icon={def.iconKey} size="md" /> : def.icon}
                        </div>
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
