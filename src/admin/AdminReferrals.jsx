import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SHARE_TYPES, REFERRAL_REWARDS } from '../lib/growthEngine'

const normalizeShareType = (platform) => {
  if (!platform) return 'album'
  const key = String(platform).toLowerCase()
  return SHARE_TYPES[key] ? key : 'album'
}

const normalizeReferralEvent = (status, rewardGranted = false) => {
  const value = String(status || '').toLowerCase()
  if (value === 'pending') return 'invite_sent'
  if (value === 'signed_up') return 'friend_signed_up'
  if (value === 'activated') return 'friend_activated'
  if (value === 'completed_trade' || value === 'first_trade') return 'friend_first_trade'
  if (rewardGranted) return 'friend_activated'
  return 'invite_sent'
}

export default function AdminReferrals() {
  const [stats, setStats] = useState(null)
  const [shares, setShares] = useState([])
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('shares')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [shareRes, refRes] = await Promise.all([
        supabase
          .from('share_events')
          .select('id, user_id, platform, link_id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('referral_events')
          .select('id, referrer_id, referred_id, status, reward_granted, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ])

      const sh = (shareRes.data || []).map((item) => ({
        ...item,
        share_type: normalizeShareType(item.platform),
      }))

      const rf = (refRes.data || []).map((item) => ({
        ...item,
        event: normalizeReferralEvent(item.status, item.reward_granted),
      }))

      const byType = {}
      Object.keys(SHARE_TYPES).forEach((key) => {
        byType[key] = sh.filter((share) => share.share_type === key).length
      })

      setStats({
        totalShares: sh.length,
        totalInvites: rf.filter((item) => item.event === 'invite_sent').length,
        referredSignups: rf.filter((item) => item.event === 'friend_signed_up').length,
        referredActivated: rf.filter((item) => item.event === 'friend_activated').length,
        referredConversions: rf.filter((item) => item.event === 'friend_first_trade').length,
        byType,
      })
      setShares(sh.slice(0, 50))
      setReferrals(rf.slice(0, 50))
    } catch (err) {
      console.error(err)
    }
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
      <div className="ag-hero">
        <div style={{ position: 'absolute', right: '1rem', top: '-.1rem', font: "italic 900 clamp(3rem,7vw,5.5rem) 'Barlow Condensed'", color: 'rgba(255,255,255,.04)', pointerEvents: 'none', lineHeight: '.84' }}>REFERRALS</div>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ growth engine</div>
            <h1 className="ag-title">Referrals / Shares</h1>
            <p className="ag-desc" style={{ marginTop: '.6rem', maxWidth: '600px' }}>Usuarios que traen usuarios. Sharing contextual con valor real, no links vacios.</p>
          </div>
          <div className="ag-icon-box"><span className="material-symbols-outlined">share</span></div>
        </div>
      </div>

      {loading && (
        <div className="ag-card" style={{ padding: '1.2rem', color: 'var(--admin-muted)' }}>
          Cargando referrals...
        </div>
      )}

      {!loading && stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1px', background: 'var(--admin-line)', border: '1px solid var(--admin-line)' }}>
            {metrics.map((metric) => (
              <div key={metric.label} style={{ background: 'var(--admin-panel)', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: metric.color }}>{metric.icon}</span>
                  <span style={{ font: "900 .64rem 'Barlow Condensed'", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--admin-muted2)' }}>{metric.label}</span>
                </div>
                <div style={{ font: "italic 900 2.2rem 'Barlow Condensed'", color: metric.color, lineHeight: '.9' }}>{metric.value}</div>
              </div>
            ))}
          </div>

          <div className="ag-card">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--admin-line)' }}>
              <div className="admin-kicker">/ distribucion</div>
              <h3 style={{ margin: '.4rem 0 0', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase' }}>Shares por tipo</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--admin-line)' }}>
              {Object.entries(SHARE_TYPES).map(([key, def]) => (
                <div key={key} style={{ background: 'var(--admin-panel)', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: def.color }}>{def.icon}</span>
                    <span style={{ font: "900 .74rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>{def.label}</span>
                  </div>
                  <div style={{ font: "italic 900 2rem 'Barlow Condensed'", color: def.color }}>{stats.byType[key] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1px', background: 'var(--admin-line)', border: '1px solid var(--admin-line)' }}>
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 0,
                  background: tab === item.key ? 'var(--admin-orange)' : 'var(--admin-panel)',
                  color: tab === item.key ? '#fff' : 'var(--admin-muted)',
                  font: "900 .82rem 'Barlow Condensed'",
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'shares' && (
            <div className="ag-card">
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--admin-line)' }}>
                <div className="admin-kicker">/ historial</div>
                <h3 style={{ margin: '.4rem 0 0', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase' }}>Shares recientes</h3>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {shares.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-muted)' }}>Sin shares todavia</div>
                ) : shares.map((share) => {
                  const def = SHARE_TYPES[share.share_type] || { icon: 'share', label: share.share_type, color: '#ff5a00' }
                  return (
                    <div key={share.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: '12px', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--admin-line)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: def.color }}>{def.icon}</span>
                      <div>
                        <span style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: def.color }}>{def.label}</span>
                        <div style={{ fontSize: '.68rem', color: 'var(--admin-muted2)' }}>
                          user: {share.user_id?.slice(0, 8)}... Â· {share.status || 'clicked'}
                        </div>
                      </div>
                      <span style={{ font: "900 .62rem 'Barlow Condensed'", color: 'var(--admin-muted2)' }}>{new Date(share.created_at).toLocaleDateString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'referrals' && (
            <div className="ag-card">
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--admin-line)' }}>
                <div className="admin-kicker">/ referidos</div>
                <h3 style={{ margin: '.4rem 0 0', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase' }}>Eventos de referidos</h3>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {referrals.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-muted)' }}>Sin referidos todavia</div>
                ) : referrals.map((referral) => {
                  const reward = REFERRAL_REWARDS[referral.event] || {}
                  const colors = {
                    invite_sent: '#3b82f6',
                    friend_signed_up: '#22c55e',
                    friend_activated: '#8b5cf6',
                    friend_first_trade: '#f59e0b',
                  }
                  return (
                    <div key={referral.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--admin-line)' }}>
                      <div>
                        <span style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: colors[referral.event] || '#fff' }}>{reward.label || referral.event}</span>
                        <div style={{ fontSize: '.68rem', color: 'var(--admin-muted2)' }}>
                          referrer: {referral.referrer_id?.slice(0, 8)}... â†’ {referral.referred_id?.slice(0, 8)}... Â· {referral.status || 'pending'}
                        </div>
                      </div>
                      <span style={{ font: "900 .62rem 'Barlow Condensed'", color: 'var(--admin-muted2)' }}>{new Date(referral.created_at).toLocaleDateString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'rewards' && (
            <div className="ag-card">
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--admin-line)' }}>
                <div className="admin-kicker">/ incentivos</div>
                <h3 style={{ margin: '.4rem 0 0', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase' }}>Rewards por referido</h3>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {Object.entries(REFERRAL_REWARDS).map(([key, def]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--admin-line)' }}>
                    <div>
                      <div style={{ font: "900 .82rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>{def.label}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--admin-muted2)', marginTop: '2px' }}>
                        +{def.xp} XP{def.reward_type ? ` Â· ${def.reward_type} (${def.reward_hours}h)` : ''}
                      </div>
                    </div>
                    <span style={{ font: "italic 900 1.2rem 'Barlow Condensed'", color: 'var(--admin-orange)' }}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
