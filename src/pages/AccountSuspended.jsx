import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export default function AccountSuspended() {
  const { profile, cancelDeletion, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleRecover = async () => {
    setLoading(true);
    try {
      await cancelDeletion();
      toast.success("¡Bienvenido de vuelta! Tu cuenta ha sido reactivada.");
      navigate('/profile');
    } catch (err) {
      toast.error("Error al reactivar la cuenta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = profile?.recoverable_until 
    ? Math.max(0, Math.ceil((new Date(profile.recoverable_until) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="suspended-root">
      <div className="suspended-card card animate-in">
        <div className="icon">🛡️</div>
        <h1>Cuenta Desactivada</h1>
        <p>Has solicitado la eliminación de tu cuenta de FigusUY.</p>
        
        <div className="info-box">
          <p>Tu cuenta y datos se borrarán permanentemente en:</p>
          <div className="countdown">
            <span className="number">{daysLeft}</span>
            <span className="text">días</span>
          </div>
        </div>

        <div className="actions">
          <button className="btn orange" onClick={handleRecover} disabled={loading}>
            {loading ? 'Reactivando...' : 'REACTIVAR MI CUENTA'}
          </button>
          <button className="btn ghost" onClick={() => signOut()}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <style>{`
        .suspended-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080808;
          padding: 20px;
        }
        .suspended-card {
          width: 100%;
          max-width: 450px;
          padding: 50px 40px;
          text-align: center;
          background: #121212;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .icon { font-size: 4rem; margin-bottom: 24px; }
        h1 { 
          font-family: 'Barlow Condensed', sans-serif; 
          font-weight: 900; 
          font-size: 2.2rem; 
          text-transform: uppercase;
          margin-bottom: 12px;
          color: white;
        }
        p { color: #888; line-height: 1.6; margin-bottom: 30px; }
        .info-box {
          background: rgba(255,90,0,0.05);
          border: 1px solid rgba(255,90,0,0.1);
          padding: 24px;
          border-radius: 20px;
          margin-bottom: 40px;
        }
        .info-box p { margin-bottom: 12px; font-size: 0.9rem; color: #aaa; }
        .countdown {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
        }
        .countdown .number {
          font-size: 3.5rem;
          font-weight: 900;
          color: #ff5a00;
          font-family: 'Barlow Condensed', sans-serif;
        }
        .countdown .text {
          font-size: 1.2rem;
          font-weight: bold;
          color: #ff5a00;
          text-transform: uppercase;
        }
        .actions { display: flex; flex-direction: column; gap: 12px; }
        .btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.2s;
          border: none;
        }
        .btn.orange { background: #ff5a00; color: white; }
        .btn.ghost { background: transparent; color: #666; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
