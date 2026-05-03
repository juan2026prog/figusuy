import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGamificationStore } from '../stores/gamificationStore'
import { useAuthStore } from '../stores/authStore'
import { LEVELS, LEVEL_ORDER, BADGES, ACHIEVEMENTS, getLevelProgress, getNextLevelMessage } from '../lib/gamification'
import ReputationStars from './ReputationStars'
import { getStarLevel } from '../lib/reputation'

/**
 * ProfileGamification — Premium, clean gamification section for the Profile page.
 * Shows: Level, progress bar, next objective, badges, recent achievements, rewards.
 */
export default function ProfileGamification() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { progress, achievements, badges, rewards, reputation, loading, initialize } = useGamificationStore()

  useEffect(() => {
    if (profile?.id) initialize(profile.id)
  }, [profile?.id])

  if (loading && !progress) return null

  const level = LEVELS[progress?.level] || LEVELS.explorador
  const nextLevel = level.next ? LEVELS[level.next] : null
  const levelIdx = LEVEL_ORDER.indexOf(progress?.level || 'explorador')
  const { percent, requirements } = getLevelProgress(progress?.level || 'explorador', progress || {}, profile || {})
  const nextMsg = getNextLevelMessage(progress?.level || 'explorador', progress || {}, profile || {})

  const completedAchievements = (achievements || []).filter(a => a.completed)
  const inProgressAchievements = (achievements || []).filter(a => !a.completed && a.progress > 0).slice(0, 3)
  const activeRewards = (rewards || []).filter(r => !r.consumed_at && (!r.expires_at || new Date(r.expires_at) > new Date())).slice(0, 3)

  return (
    <>
      <style>{`
        .gamification-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Level Card */
        .level-card {
          position: relative;
          overflow: hidden;
          border-radius: 1.75rem;
          padding: 1.75rem;
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .level-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .level-card-glow {
          position: absolute;
          right: -3rem;
          top: -3rem;
          width: 10rem;
          height: 10rem;
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
          opacity: 0.3;
        }
        .level-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }
        .level-identity {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        .level-icon-circle {
          width: 3rem;
          height: 3rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: var(--color-border-light);
          backdrop-filter: blur(8px);
        }
        .level-name {
          font-size: 1.375rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--color-text); margin: 0;
        }
        .level-desc {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.65);
          margin: 0;
        }
        .level-steps {
          display: flex;
          gap: 0.375rem;
          position: relative;
          z-index: 1;
        }
        .level-step {
          flex: 1;
          height: 0.25rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.15);
          transition: background 0.3s;
        }
        .level-step-filled {
          background: rgba(255,255,255,0.85);
        }
        .level-step-current {
          background: rgba(255,255,255,0.45);
        }

        /* Level Progress Section */
        .level-progress-area {
          position: relative;
          z-index: 1;
          margin-top: 1rem;
        }
        .level-progress-bar-bg {
          height: 0.5rem;
          background: rgba(255,255,255,0.12);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.625rem;
        }
        .level-progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          background: rgba(255,255,255,0.8);
          transition: width 0.5s ease;
        }
        .level-next-msg {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.7);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        /* Badges Row */
        .badges-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .badge-chip {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 0.75rem;
          font-weight: 700;
          color: #e2e8f0;
          transition: all 0.2s;
        }
        .badge-chip:hover {
          background: var(--color-border-light);
          transform: scale(1.02);
        }
        .badge-chip-icon {
          font-size: 0.875rem;
        }

        /* Achievement Mini Cards */
        .achievements-mini-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .achievements-mini-grid { grid-template-columns: 1fr 1fr 1fr; }
        }
        .achievement-mini {
          padding: 1rem;
          border-radius: 1.25rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          transition: all 0.2s;
          cursor: pointer;
        }
        .achievement-mini:hover {
          border-color: #334155;
          transform: translateY(-1px);
        }
        .achievement-mini-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          display: block;
        }
        .achievement-mini-name {
          font-size: 0.8125rem;
          font-weight: 800;
          margin: 0 0 0.25rem;
          color: var(--color-text); }
        .achievement-mini-bar {
          height: 0.25rem;
          background: var(--color-border);
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 0.5rem;
        }
        .achievement-mini-fill {
          height: 100%;
          border-radius: 9999px;
          background: var(--color-primary);
          transition: width 0.4s ease;
        }
        .achievement-mini-progress-text {
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--color-text-muted);
          margin: 0.25rem 0 0;
        }
        .achievement-completed .achievement-mini-fill {
          background: #22c55e;
        }

        /* Reward Mini Cards */
        .reward-mini {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          border-radius: 1.25rem;
          background: linear-gradient(135deg, rgba(234,88,12,0.08) 0%, rgba(234,88,12,0.02) 100%);
          border: 1px solid rgba(234,88,12,0.15);
          transition: all 0.2s;
        }
        .reward-mini:hover {
          border-color: rgba(234,88,12,0.3);
          transform: translateY(-1px);
        }
        .reward-mini-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.875rem;
          background: rgba(234,88,12,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .reward-mini-info {
          flex: 1;
          min-width: 0;
        }
        .reward-mini-name {
          font-size: 0.8125rem;
          font-weight: 800;
          color: var(--color-text); margin: 0;
        }
        .reward-mini-meta {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          margin: 0.125rem 0 0;
        }
        .reward-mini-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          font-size: 0.625rem;
          font-weight: 900;
          color: #4ade80;
          white-space: nowrap;
        }

        .gamification-see-all {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-primary);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
        }
        .gamification-see-all:hover { opacity: 0.8; }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0;
        }
      `}</style>

      <div className="gamification-section">

        {/* Level Card */}
        <div
          className="level-card"
          style={{ background: level.gradient }}
          onClick={() => navigate('/achievements')}
        >
          <div className="level-card-glow" style={{ background: level.color }} />
          <div className="level-header">
            <div className="level-identity">
              <div className="level-icon-circle">{level.icon}</div>
              <div>
                <h3 className="level-name">{level.name}</h3>
                <p className="level-desc">{level.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ReputationStars stars={reputation?.star_rating || 1} size="sm" />
            </div>
          </div>

          {/* Level step indicators */}
          <div className="level-steps">
            {LEVEL_ORDER.map((lKey, i) => (
              <div
                key={lKey}
                className={`level-step ${i < levelIdx ? 'level-step-filled' : ''} ${i === levelIdx ? 'level-step-current' : ''}`}
              />
            ))}
          </div>

          {/* Progress to next level */}
          {nextLevel && (
            <div className="level-progress-area">
              <div className="level-progress-bar-bg">
                <div className="level-progress-bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <p className="level-next-msg">
                → {nextMsg}
              </p>
            </div>
          )}
          {!nextLevel && (
            <div className="level-progress-area">
              <p className="level-next-msg">🏆 Circuito Referente desbloqueado — Completá hitos y ganá rewards</p>
            </div>
          )}
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">Insignias</h3>
            </div>
            <div className="badges-row">
              {badges.map(b => {
                const def = BADGES[b.key] || { name: b.key, icon: '🏅', color: 'var(--color-text-muted)' }
                return (
                  <div key={b.key} className="badge-chip" style={{ borderColor: `${def.color}30` }} title={def.description}>
                    <span className="badge-chip-icon">{def.icon}</span>
                    {def.name}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* In-Progress Achievements */}
        {inProgressAchievements.length > 0 && (
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">Hitos activos</h3>
              <button className="gamification-see-all" onClick={() => navigate('/achievements')}>
                Ver todos <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
              </button>
            </div>
            <div className="achievements-mini-grid">
              {inProgressAchievements.map(a => {
                const def = ACHIEVEMENTS[a.key] || { name: a.key, icon: '🎯' }
                const pct = Math.round((a.progress / a.target) * 100)
                return (
                  <div key={a.key} className="achievement-mini" onClick={() => navigate('/achievements')}>
                    <span className="achievement-mini-icon">{def.icon}</span>
                    <p className="achievement-mini-name">{def.name}</p>
                    <div className="achievement-mini-bar">
                      <div className="achievement-mini-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="achievement-mini-progress-text">{a.progress}/{a.target}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Rewards */}
        {activeRewards.length > 0 && (
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">Rewards activos</h3>
              <button className="gamification-see-all" onClick={() => navigate('/achievements')}>
                Ver todos <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeRewards.map(r => {
                const timeLeft = r.expires_at ? getTimeLeft(r.expires_at) : null
                return (
                  <div key={r.id} className="reward-mini">
                    <div className="reward-mini-icon">🎁</div>
                    <div className="reward-mini-info">
                      <p className="reward-mini-name">{r.resolved_as || r.type}</p>
                      <p className="reward-mini-meta">{r.value}{timeLeft ? ` · ${timeLeft}` : ''}</p>
                    </div>
                    <span className="reward-mini-badge">ACTIVO</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Mi progreso</h3>
            <button className="gamification-see-all" onClick={() => navigate('/achievements')}>
              Mis logros <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={miniStatStyle}>
              <p style={miniStatVal}>{progress?.streak_days || 0}</p>
              <p style={miniStatLabel}>racha</p>
            </div>
            <div style={miniStatStyle}>
              <p style={miniStatVal}>{completedAchievements.length}</p>
              <p style={miniStatLabel}>hitos</p>
            </div>
            <div style={miniStatStyle}>
              <p style={miniStatVal}>{progress?.total_trades || 0}</p>
              <p style={miniStatLabel}>cruces</p>
            </div>
            <div style={miniStatStyle}>
              <p style={{ ...miniStatVal, color: getStarLevel(reputation?.star_rating || 1).color }}>
                {'★'.repeat(reputation?.star_rating || 1)}
              </p>
              <p style={miniStatLabel}>reputación</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const miniStatStyle = {
  padding: '0.875rem',
  borderRadius: '1.25rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  textAlign: 'center',
}
const miniStatVal = { fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'white' }
const miniStatLabel = { fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', margin: '0.125rem 0 0', textTransform: 'uppercase' }

function getTimeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return 'Expirado'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m`
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
