import React from 'react'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}) {
  if (!isOpen) return null

  return (
    <div className="cd-overlay" onClick={onCancel}>
      <style>{`
        .cd-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(11,11,11,0.85); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .cd-card {
          background: #181818; border: 1px solid rgba(255,255,255,0.08);
          width: 100%; max-width: 420px; padding: 24px; text-align: center;
          position: relative; overflow: hidden;
          animation: cd-scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cd-card:before {
          content:''; position:absolute; inset:auto 0 0 0; height:3px;
          background: ${variant === 'danger' ? '#ef4444' : variant === 'info' ? '#3b82f6' : '#ff5a00'};
        }
        @keyframes cd-scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .cd-icon {
          width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 24px;
          font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-style: italic;
          background: ${variant === 'danger' ? 'rgba(239,68,68,0.1)' : variant === 'info' ? 'rgba(59,130,246,0.1)' : 'rgba(255,90,0,0.1)'};
          color: ${variant === 'danger' ? '#ef4444' : variant === 'info' ? '#3b82f6' : '#ff5a00'};
          border: 1px solid ${variant === 'danger' ? 'rgba(239,68,68,0.3)' : variant === 'info' ? 'rgba(59,130,246,0.3)' : 'rgba(255,90,0,0.3)'};
        }
        .cd-title {
          font: italic 900 1.8rem 'Barlow Condensed'; text-transform: uppercase; line-height: 1;
          margin: 0 0 12px 0; color: #fff;
        }
        .cd-message { color: rgba(245,245,245,0.6); font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px; }
        .cd-actions { display: flex; gap: 12px; }
        .cd-btn {
          flex: 1; padding: 12px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #fff;
          font: 900 0.9rem 'Barlow Condensed'; letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: 0.2s ease;
        }
        .cd-btn:hover { background: rgba(255,255,255,0.05); }
        .cd-btn.primary {
          background: ${variant === 'danger' ? '#ef4444' : variant === 'info' ? '#3b82f6' : '#ff5a00'};
          border-color: ${variant === 'danger' ? '#ef4444' : variant === 'info' ? '#3b82f6' : '#ff5a00'};
        }
        .cd-btn.primary:hover { filter: brightness(1.1); }

        @media (max-width: 480px) {
          .cd-actions { flex-direction: column-reverse; gap: 8px; }
          .cd-btn { width: 100%; padding: 16px; }
        }
      `}</style>
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>
        <div className="cd-icon">
          {variant === 'danger' ? '!' : variant === 'info' ? 'i' : '?'}
        </div>
        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>
        <div className="cd-actions">
          <button className="cd-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="cd-btn primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
