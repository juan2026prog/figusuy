import React, { useState } from 'react'
import { useGrowthStore } from '../stores/growthStore'
import { useAuthStore } from '../stores/authStore'
import { SHARE_TYPES } from '../lib/growthEngine'

export default function ShareModal() {
  const { profile } = useAuthStore()
  const { shareModal, closeShareModal, executeShare } = useGrowthStore()
  const { open, type, data } = shareModal
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  if (!open) return null

  const shareDef = SHARE_TYPES[type] || {}
  const allTypes = Object.values(SHARE_TYPES)

  const handleShare = async (shareType) => {
    if (!profile?.id) return
    setSharing(true)
    const ok = await executeShare(profile.id, shareType, data)
    setSharing(false)
    if (ok) {
      setCopied(true)
      setTimeout(() => { setCopied(false); closeShareModal() }, 1500)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/?ref=${profile?.id}&type=${type}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="sm-overlay" onClick={closeShareModal}>
      <style>{`
        .sm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:95;display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Barlow',sans-serif;animation:sm-fadein .2s}
        @keyframes sm-fadein{from{opacity:0}to{opacity:1}}
        .sm-modal{background:#121212;border:1px solid rgba(255,255,255,.1);width:min(480px,100%);max-height:85vh;overflow-y:auto;animation:sm-slideup .3s cubic-bezier(.4,0,.2,1)}
        @keyframes sm-slideup{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        .sm-header{padding:24px 24px 18px;border-bottom:1px solid rgba(255,255,255,.06);background:linear-gradient(135deg,rgba(255,90,0,.1),transparent 50%);position:relative;overflow:hidden}
        .sm-header::before{content:'COMPARTIR';position:absolute;right:14px;top:-8px;font:italic 900 4.5rem 'Barlow Condensed';color:rgba(255,255,255,.03);pointer-events:none;line-height:1}
        .sm-kicker{font:900 .72rem 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;color:#ff5a00}
        .sm-header h2{font:italic 900 2.2rem 'Barlow Condensed';text-transform:uppercase;color:#f5f5f5;line-height:.88;margin:6px 0 0}
        .sm-header p{color:rgba(245,245,245,.5);font-size:.88rem;margin:8px 0 0;line-height:1.4}
        .sm-close{position:absolute;top:16px;right:16px;width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.5);cursor:pointer}
        .sm-close:hover{border-color:#ff5a00;color:#ff5a00}
        .sm-body{padding:20px 24px}
        .sm-types{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px}
        .sm-type{display:flex;align-items:center;gap:10px;padding:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);cursor:pointer;transition:all .15s}
        .sm-type:hover{border-color:rgba(255,90,0,.3);background:rgba(255,90,0,.04)}
        .sm-type.active{border-color:#ff5a00;background:rgba(255,90,0,.08)}
        .sm-type-icon{width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);flex-shrink:0}
        .sm-type-icon .material-symbols-outlined{font-size:1.2rem}
        .sm-type-label{font:900 .78rem 'Barlow Condensed';text-transform:uppercase;color:#f5f5f5;letter-spacing:.04em}
        .sm-divider{height:1px;background:rgba(255,255,255,.06);margin:16px 0}
        .sm-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .sm-btn{padding:14px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#f5f5f5;font:900 .84rem 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s}
        .sm-btn:hover{border-color:#ff5a00;color:#ff5a00}
        .sm-btn.primary{background:#ff5a00;border-color:#ff5a00;color:#fff}
        .sm-btn.primary:hover{background:#cc4800;border-color:#cc4800}
        .sm-btn:disabled{opacity:.5;cursor:not-allowed}
        .sm-success{padding:30px;text-align:center}
        .sm-success-icon{font-size:3rem;display:block;margin-bottom:10px}
        .sm-success h3{font:italic 900 1.8rem 'Barlow Condensed';text-transform:uppercase;color:#22c55e;margin:0 0 6px}
        .sm-success p{color:rgba(245,245,245,.5);font-size:.86rem}
        @media(max-width:520px){.sm-types{grid-template-columns:1fr}.sm-actions{grid-template-columns:1fr}}
      `}</style>

      <div className="sm-modal" onClick={e => e.stopPropagation()}>
        {copied ? (
          <div className="sm-success">
            <span className="sm-success-icon">✅</span>
            <h3>¡Compartido!</h3>
            <p>Tu contenido fue compartido. +XP de comunidad.</p>
          </div>
        ) : (
          <>
            <div className="sm-header">
              <div className="sm-kicker">// compartir valor</div>
              <h2>Compartí con contexto</h2>
              <p>No compartís un link. Compartís tu colección, tu progreso, tu resultado.</p>
              <button className="sm-close" onClick={closeShareModal}>✕</button>
            </div>

            <div className="sm-body">
              <div className="sm-types">
                {allTypes.map(st => (
                  <div
                    key={st.key}
                    className={`sm-type ${type === st.key ? 'active' : ''}`}
                    onClick={() => useGrowthStore.setState({ shareModal: { open: true, type: st.key, data } })}
                  >
                    <div className="sm-type-icon" style={{borderColor: `${st.color}33`}}>
                      <span className="material-symbols-outlined" style={{color: st.color}}>{st.icon}</span>
                    </div>
                    <span className="sm-type-label">{st.label}</span>
                  </div>
                ))}
              </div>

              <div className="sm-divider" />

              <div className="sm-actions">
                <button className="sm-btn" onClick={handleCopyLink} disabled={sharing}>
                  <span className="material-symbols-outlined" style={{fontSize:'1.1rem'}}>content_copy</span>
                  Copiar link
                </button>
                <button className="sm-btn primary" onClick={() => handleShare(type)} disabled={sharing}>
                  <span className="material-symbols-outlined" style={{fontSize:'1.1rem'}}>share</span>
                  {sharing ? 'Enviando...' : 'Compartir'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
