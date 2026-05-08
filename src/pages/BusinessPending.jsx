import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function BusinessPending() {
  const navigate = useNavigate();
  const profile = useAuthStore(state => state.profile);

  return (
    <div className="pending-panini-wrapper">
      
      <div className="pending-card">
        <div className="pending-icon">
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>hourglass_empty</span>
        </div>
        <div className="kicker">// estado de cuenta</div>
        <h1 className="pending-title">Solicitud en Revisión</h1>
        <p className="pending-desc">
          ¡Ya casi estás adentro! Estamos verificando los datos de tu local. 
          Apenas validemos la información, habilitaremos tu panel FigusUY Negocios para que empieces a destacar en la plataforma.
        </p>
        <button className="btn orange" onClick={() => navigate('/profile')}>
          Volver al Perfil
        </button>
      </div>
    </div>
  );
}
