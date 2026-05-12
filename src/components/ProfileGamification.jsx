import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGamificationStore } from '../stores/gamificationStore'
import { useAuthStore } from '../stores/authStore'
import { LEVELS, LEVEL_ORDER, BADGES, ACHIEVEMENTS, getLevelProgress, getNextLevelMessage } from '../lib/gamification'
import ReputationStars from './ReputationStars'
import { getStarLevel } from '../lib/reputation'
import GamificationIcon from './gamification/icons/GamificationIcon'

/**
 * ProfileGamification — Redesigned for Premium Card Gaming aesthetic.
 * Manteniendo lógica, props y hooks originales.
 */
export default function ProfileGamification() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { progress, achievements, badges, rewards, reputation, loading, initialize } = useGamificationStore()

  useEffect(() => {
    if (profile?.id) initialize(profile.id)
  }, [profile?.id])

  if (loading && !progress) return (
    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '2rem' }}>sync</span>
    </div>
  )

  const currentLevelKey = progress?.level || 'explorador'
  const level = LEVELS[currentLevelKey] || LEVELS.explorador
  const nextLevelKey = level.next
  const nextLevel = nextLevelKey ? LEVELS[nextLevelKey] : null
  const { percent } = getLevelProgress(currentLevelKey, progress || {}, profile || {})
  const nextMsg = getNextLevelMessage(currentLevelKey, progress || {}, profile || {})

  const completedAchievementsCount = (achievements || []).filter(a => a.completed).length
  const completedExchanges = progress?.completed_exchanges || profile?.completed_exchanges || 0
  const streakDays = progress?.streak_days || 0
  const starRating = reputation?.star_rating || 1

  return (
    <div className="fy-gamification-root">
      <style>{`
        .fy-gamification-root {
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
        }

        .fy-level-card {
          display: flex;
          gap: 22px;
          align-items: center;
          padding: 24px;
          border-radius: 18px;
          border: 1px solid rgba(255, 106, 0, 0.25);
          background: linear-gradient(135deg, #1a0d04, #0a0a0a);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          margin-bottom: 24px;
        }

        .fy-level-card::after {
          content: "";
          position: absolute;
          top: -50%;
          right: -20%;
          width: 150px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 106, 0, 0.15) 0%, transparent 70%);
          transform: rotate(45deg);
          pointer-events: none;
        }

        .fy-level-icon {
          width: 110px;
          height: 110px;
          min-width: 110px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: #000;
          border: 2px solid #ff6a00;
          box-shadow: 0 0 25px rgba(255, 106, 0, 0.4);
          position: relative;
          z-index: 1;
        }

        .fy-level-info {
          flex: 1;
          z-index: 1;
        }

        .fy-level-kicker {
          color: #ff6a00;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.1em;
          margin: 0 0 4px;
        }

        .fy-level-name {
          font-size: 36px;
          font-weight: 1000;
          font-style: italic;
          text-transform: uppercase;
          margin: 0;
          line-height: 1;
          background: linear-gradient(to bottom, #fff, #ccc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .fy-level-desc {
          color: #bbb;
          font-size: 15px;
          margin: 8px 0 12px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .fy-xp-row {
          display: flex;
          justify-content: space-between;
          margin: 20px 0 8px;
          font-size: 18px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .fy-xp-val {
          color: #ff6a00;
        }

        .fy-bar {
          height: 10px;
          background: #1a1a1a;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .fy-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff5a00, #ffb000);
          border-radius: 999px;
          box-shadow: 0 0 15px rgba(255, 106, 0, 0.5);
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .fy-next-level {
          margin-top: 24px;
          padding: 18px;
          border-radius: 14px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          background: rgba(139, 92, 246, 0.05);
          position: relative;
        }

        .fy-next-level-strong {
          display: block;
          font-size: 22px;
          text-transform: uppercase;
          font-style: italic;
          font-weight: 900;
          color: #a78bfa;
        }

        .fy-progress-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .fy-progress-box {
          padding: 16px 8px;
          text-align: center;
          border-radius: 14px;
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s;
        }

        .fy-progress-box:hover {
          border-color: rgba(255, 106, 0, 0.4);
          transform: translateY(-2px);
        }

        .fy-progress-box b {
          display: block;
          font-size: 28px;
          color: #fff;
          line-height: 1.1;
        }

        .fy-progress-box span {
          color: #888;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        @media (max-width: 600px) {
          .fy-level-card {
            flex-direction: column;
            text-align: center;
            padding: 24px 16px;
          }
          .fy-progress-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .fy-level-icon {
            width: 100px;
            height: 100px;
            min-width: 100px;
          }
        }
      `}</style>

      <div className="fy-level-card">
        <div className="fy-level-icon">
          <GamificationIcon icon={level.iconKey} size="lg" />
        </div>
        <div className="fy-level-info">
          <p className="fy-level-kicker">Nivel actual</p>
          <h3 className="fy-level-name">{level.name}</h3>
          <p className="fy-level-desc">{level.description}</p>
          <div className="fy-stars">
            <ReputationStars stars={starRating} size="sm" />
          </div>
        </div>
      </div>

      <div className="fy-xp-row">
        <span>Progreso</span>
        <span className="fy-xp-val">{percent}%</span>
      </div>
      <div className="fy-bar">
        <div className="fy-bar-fill" style={{ width: `${percent}%` }}></div>
      </div>

      {nextLevel && (
        <div className="fy-next-level">
          <small style={{ color: '#aaa', textTransform: 'uppercase', fontWeight: 900, fontSize: '10px', letterSpacing: '0.1em' }}>Próximo nivel</small>
          <strong className="fy-next-level-strong">{nextLevel.name}</strong>
          <p style={{ color: '#bbb', margin: '4px 0 0', fontSize: '14px', fontFamily: 'system-ui' }}>{nextMsg}</p>
        </div>
      )}

      <div className="fy-progress-grid">
        <div className="fy-progress-box">
          <b>{streakDays}</b>
          <span>Racha</span>
        </div>
        <div className="fy-progress-box">
          <b>{completedExchanges}</b>
          <span>Canjes</span>
        </div>
        <div className="fy-progress-box">
          <b>{completedAchievementsCount}</b>
          <span>Hitos</span>
        </div>
        <div className="fy-progress-box">
          <b>{starRating.toFixed(1)}</b>
          <span>Reputación</span>
        </div>
      </div>
    </div>
  )
}
