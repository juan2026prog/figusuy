import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function BusinessSuspended() {
  const navigate = useNavigate()

  return (
    <div className="status-page">
      <div className="status-card status-card--danger">
        <span className="material-symbols-outlined status-icon">block</span>
        <h1 className="status-title">Cuenta Suspendida</h1>
        <p className="status-copy">
          Tu cuenta de negocio ha sido suspendida temporalmente.
          Si crees que esto es un error o necesitas más información, contacta a nuestro equipo de soporte.
        </p>
        <div className="status-actions">
          <a href="mailto:soporte@figusuy.com" className="status-btn status-btn--primary">
            Contactar Soporte
          </a>
          <button className="status-btn status-btn--ghost" onClick={() => navigate('/profile')}>
            Volver a mi perfil
          </button>
        </div>
      </div>
    </div>
  )
}
