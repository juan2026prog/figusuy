import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function BusinessPending() {
  const navigate = useNavigate();
  const profile = useAuthStore(state => state.profile);

  return (
    <div className="pending-panini-wrapper">
      <style>{`
        .pending-panini-wrapper {
          --bg:#0b0b0b; --panel:#121212; --panel2:#181818; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
          --text:#f5f5f5; --muted:rgba(245,245,245,.58); --muted2:rgba(245,245,245,.36); --orange:#ff5a00; --orange2:#cc4800;
          min-height:100vh; color:var(--text); font-family:'Barlow',sans-serif;
          background:radial-gradient(circle at top right, rgba(255,90,0,.14), transparent 28%), linear-gradient(180deg, #0b0b0b 0%, #090909 100%);
          display: flex; align-items: center; justify-content: center; padding: 22px;
        }
        .pending-card {
          width: 100%; max-width: 480px; background: var(--panel); border: 1px solid var(--line);
          padding: 40px 32px; text-align: center; position: relative; overflow: hidden;
        }
        .pending-card:before { content:''; position:absolute; inset:auto 0 0 0; height:4px; background:linear-gradient(90deg, var(--orange) 0%, rgba(255,90,0,0) 72%); }
        .pending-icon {
          width: 80px; height: 80px; border: 1px solid rgba(255,90,0,.35); background: rgba(255,90,0,.08);
          color: var(--orange); border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; font-size: 2.5rem;
        }
        .kicker { font: 900 .72rem 'Barlow Condensed'; letter-spacing: .16em; text-transform: uppercase; color: var(--orange); margin-bottom: 8px; }
        .pending-title { font: italic 900 2.45rem 'Barlow Condensed'; text-transform: uppercase; line-height: .9; margin: 0 0 16px 0; }
        .pending-desc { color: var(--muted); font-size: 1rem; line-height: 1.6; margin-bottom: 32px; }
        .btn {
          border: 1px solid var(--line2); background: transparent; color: #fff; padding: 1rem 1.15rem; 
          font: 900 .95rem 'Barlow Condensed'; letter-spacing: .08em; text-transform: uppercase; 
          cursor: pointer; display: inline-flex; align-items: center; justify-content: center; 
          gap: 8px; transition: .2s ease; width: 100%;
        }
        .btn.orange { background: var(--orange); border-color: var(--orange); color: #fff; }
        .btn.orange:hover { background: var(--orange2); border-color: var(--orange2); }
      `}</style>
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
