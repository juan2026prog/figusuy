import React from 'react'

export default function ConfirmDialog({ isOpen, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel, variant = 'danger' }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-body text-center">
          <span className="modal-icon">
            {variant === 'danger' ? '⚠️' : 'ℹ️'}
          </span>
          <h3 className="text-lg font-bold mb-xs">{title}</h3>
          <p className="text-sm text-secondary mb-lg">{message}</p>
          <div className="flex-center gap-sm">
            <button className="btn btn-secondary flex-1" onClick={onCancel}>
              {cancelText}
            </button>
            <button
              className={`btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
