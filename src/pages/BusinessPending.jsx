import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function BusinessPending() {
  const navigate = useNavigate();
  const profile = useAuthStore(state => state.profile);

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', backgroundColor: 'var(--color-bg)', color: 'white' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'var(--color-surface)', padding: '3rem 2rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <div style={{ width: '5rem', height: '5rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem' }}>⏳</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Solicitud en Revisión</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.5 }}>
          Hemos recibido tu solicitud para registrar tu local. Nuestro equipo la revisará pronto. 
          Te notificaremos una vez que sea aprobada para que puedas acceder a tu panel de negocios.
        </p>
        <button 
          onClick={() => navigate('/profile')}
          style={{ width: '100%', padding: '0.875rem', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 900, borderRadius: '1rem', border: 'none', cursor: 'pointer' }}
        >
          Volver al Perfil
        </button>
      </div>
    </div>
  );
}
