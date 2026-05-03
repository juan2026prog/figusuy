import React, { useEffect } from 'react'
import AuthPanel from './AuthPanel'

export default function AuthModal({ isOpen, onClose, initialType = null }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <style>{`
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(0,0,0,.82);
          backdrop-filter: blur(8px);
        }

        .auth-modal-card {
          width: min(100%, 1080px);
          max-height: calc(100vh - 2rem);
          overflow: auto;
        }
      `}</style>

      <div className="auth-modal-card" onClick={(event) => event.stopPropagation()}>
        <AuthPanel mode="modal" onClose={onClose} initialType={initialType} />
      </div>
    </div>
  )
}
