import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type, exiting: false }])
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    }, duration)
  }, [])

  const value = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const icons = {
  success: 'OK',
  error: 'ERR',
  warning: 'WARN',
  info: 'INFO',
}

function ToastItem({ toast }) {
  return (
    <div className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}>
      <span className={`toast-icon toast-icon-${toast.type}`}>{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
    </div>
  )
}

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (onClose) {
      const t = setTimeout(onClose, 3000)
      return () => clearTimeout(t)
    }
  }, [onClose])

  return (
    <div
      className={`toast toast-${type} toast-enter`}
      style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, cursor: 'pointer' }}
      onClick={onClose}
    >
      <span className={`toast-icon toast-icon-${type}`}>{icons[type] || icons.info}</span>
      <span className="toast-message">{message}</span>
    </div>
  )
}
