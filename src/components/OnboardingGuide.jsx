import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGrowthStore } from '../stores/growthStore'

export default function OnboardingGuide() {
  const navigate = useNavigate()
  const { onboardingProgress, onboardingVisible, dismissOnboarding, trackOnboardingStep } = useGrowthStore()

  if (!onboardingVisible || !onboardingProgress || onboardingProgress.isActivated) return null

  const { steps, percent, currentStep, completed, total } = onboardingProgress

  const handleStepAction = (step) => {
    trackOnboardingStep(null, step.key) // userId injected at App level
    navigate(step.route)
  }

  return (
    <div className="ob-guide">
      <style>{`
        .ob-guide{position:fixed;bottom:80px;right:16px;width:min(380px,calc(100vw - 32px));z-index:80;font-family:'Barlow',sans-serif}
        .ob-card{background:#121212;border:1px solid rgba(255,255,255,.1);overflow:hidden;animation:ob-slide .4s cubic-bezier(.4,0,.2,1)}
        @keyframes ob-slide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .ob-head{padding:18px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.06);background:linear-gradient(135deg,rgba(255,90,0,.12),transparent 60%)}
        .ob-head-left h3{font:italic 900 1.55rem 'Barlow Condensed';text-transform:uppercase;color:#f5f5f5;line-height:.9;margin:0}
        .ob-kicker{font:900 .68rem 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;color:#ff5a00;margin-bottom:4px}
        .ob-close{width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.5);cursor:pointer;font-size:.9rem}
        .ob-close:hover{border-color:#ff5a00;color:#ff5a00}
        .ob-progress{height:4px;background:rgba(255,255,255,.06)}
        .ob-progress div{height:100%;background:#ff5a00;transition:width .5s}
        .ob-steps{padding:8px 0}
        .ob-step{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
        .ob-step:last-child{border-bottom:0}
        .ob-step:hover{background:rgba(255,255,255,.02)}
        .ob-step-icon{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}
        .ob-step-icon .material-symbols-outlined{font-size:1.2rem;color:rgba(245,245,245,.5)}
        .ob-step.done .ob-step-icon{border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.08)}
        .ob-step.done .ob-step-icon .material-symbols-outlined{color:#22c55e}
        .ob-step.current .ob-step-icon{border-color:rgba(255,90,0,.4);background:rgba(255,90,0,.1)}
        .ob-step.current .ob-step-icon .material-symbols-outlined{color:#ff5a00}
        .ob-step-text h4{font:900 .84rem 'Barlow Condensed';text-transform:uppercase;color:#f5f5f5;margin:0 0 2px;line-height:1.1}
        .ob-step-text p{font-size:.76rem;color:rgba(245,245,245,.4);margin:0;line-height:1.3}
        .ob-step.done .ob-step-text h4{color:rgba(245,245,245,.4)}
        .ob-step-action{border:1px solid rgba(255,90,0,.3);background:rgba(255,90,0,.08);color:#ff5a00;padding:6px 12px;font:900 .68rem 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;cursor:pointer;white-space:nowrap}
        .ob-step-action:hover{background:#ff5a00;color:#fff}
        .ob-step-check{font:900 .8rem 'Barlow Condensed';color:#22c55e;letter-spacing:.06em}
        .ob-nudge{padding:12px 20px;background:rgba(255,90,0,.06);border-top:1px solid rgba(255,90,0,.12);font-size:.78rem;color:rgba(245,245,245,.6);display:flex;gap:8px;align-items:center}
        .ob-nudge span{color:#ff5a00;font-size:1rem}
        @media(max-width:768px){.ob-guide{bottom:70px;right:8px;left:8px;width:auto}}
      `}</style>

      <div className="ob-card">
        <div className="ob-head">
          <div className="ob-head-left">
            <div className="ob-kicker">// primeros pasos</div>
            <h3>Tu primer valor</h3>
          </div>
          <button className="ob-close" onClick={dismissOnboarding}>✕</button>
        </div>

        <div className="ob-progress">
          <div style={{width: `${percent}%`}} />
        </div>

        <div className="ob-steps">
          {steps.map((step, i) => {
            const isCurrent = currentStep?.key === step.key
            const cls = step.done ? 'done' : isCurrent ? 'current' : ''
            return (
              <div key={step.key} className={`ob-step ${cls}`}>
                <div className="ob-step-icon">
                  <span className="material-symbols-outlined">
                    {step.done ? 'check_circle' : step.icon}
                  </span>
                </div>
                <div className="ob-step-text">
                  <h4>{step.order}. {step.title}</h4>
                  <p>{step.description}</p>
                </div>
                {step.done ? (
                  <span className="ob-step-check">✓ Listo</span>
                ) : isCurrent ? (
                  <button className="ob-step-action" onClick={() => handleStepAction(step)}>
                    {step.action}
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>

        {currentStep && (
          <div className="ob-nudge">
            <span className="material-symbols-outlined">tips_and_updates</span>
            {currentStep.nudge}
          </div>
        )}
      </div>
    </div>
  )
}
