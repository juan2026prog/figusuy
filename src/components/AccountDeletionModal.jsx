import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToast } from './Toast';

const STEPS = {
  WARNING: 1,
  STATS: 2,
  REASON: 3,
  CONFIRM: 4
};

const REASONS = [
  "Ya completé mi álbum",
  "No encontré suficientes intercambios",
  "La app es difícil de usar",
  "Prefiero no decirlo",
  "Otro motivo"
];

export default function AccountDeletionModal({ isOpen, onClose }) {
  const [step, setStep] = useState(STEPS.WARNING);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { signOut } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && step === STEPS.WARNING) {
      fetchStats();
    }
  }, [isOpen, step]);

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc('get_user_deletion_stats');
    if (!error) setStats(data);
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleRequestDeletion = async () => {
    if (confirmText !== "ELIMINAR") {
      toast.error("Por favor escribe ELIMINAR para confirmar.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('request_account_deletion', { reason });
      if (error) throw error;
      
      toast.success("Tu cuenta ha sido desactivada. Tienes 30 días para recuperarla.");
      onClose();
      // Sign out after a short delay
      setTimeout(() => signOut(), 2000);
    } catch (err) {
      toast.error("Error al procesar la solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="deletion-overlay">
      <div className="deletion-modal card animate-in">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="deletion-content">
          {step === STEPS.WARNING && (
            <div className="step-content">
              <div className="danger-icon">⚠️</div>
              <h2>¿Estás seguro que quieres irte?</h2>
              <p>Tu cuenta será desactivada inmediatamente y dejarás de ser visible en la plataforma.</p>
              <div className="warning-box">
                <p><b>Período de gracia:</b> Tendrás 30 días para volver a entrar y cancelar la eliminación si cambias de opinión.</p>
              </div>
              <div className="actions">
                <button className="btn" onClick={onClose}>Mantenerme en FigusUY</button>
                <button className="btn red-ghost" onClick={handleNext}>Entiendo, continuar</button>
              </div>
            </div>
          )}

          {step === STEPS.STATS && (
            <div className="step-content">
              <h2>Todo lo que has logrado</h2>
              <p>Si eliminas tu cuenta, perderás acceso a:</p>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="val">{stats?.albums || 0}</span>
                  <span className="lbl">Álbumes</span>
                </div>
                <div className="stat-item">
                  <span className="val">{stats?.trades || 0}</span>
                  <span className="lbl">Canjes</span>
                </div>
                <div className="stat-item">
                  <span className="val">{stats?.xp || 0}</span>
                  <span className="lbl">XP</span>
                </div>
                <div className="stat-item">
                  <span className="val">{stats?.badges || 0}</span>
                  <span className="lbl">Insignias</span>
                </div>
              </div>
              {stats?.account_type === 'influencer' && (
                <div className="special-notice">
                  <p>🌟 <b>Aviso para Influencers:</b> Perderás tu enlace de referido y tus comisiones pendientes si no las retiras antes.</p>
                </div>
              )}
              {stats?.business_promos > 0 && (
                <div className="special-notice">
                  <p>🏪 <b>Aviso para Negocios:</b> Tus {stats.business_promos} promociones activas dejarán de mostrarse.</p>
                </div>
              )}
              <div className="actions">
                <button className="btn ghost" onClick={handleBack}>Atrás</button>
                <button className="btn red-ghost" onClick={handleNext}>Continuar</button>
              </div>
            </div>
          )}

          {step === STEPS.REASON && (
            <div className="step-content">
              <h2>Ayúdanos a mejorar</h2>
              <p>¿Por qué quieres eliminar tu cuenta?</p>
              <div className="reasons-list">
                {REASONS.map(r => (
                  <label key={r} className={`reason-item ${reason === r ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="reason" 
                      value={r} 
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    {r}
                  </label>
                ))}
              </div>
              <div className="actions">
                <button className="btn ghost" onClick={handleBack}>Atrás</button>
                <button className="btn red-ghost" disabled={!reason} onClick={handleNext}>Siguiente</button>
              </div>
            </div>
          )}

          {step === STEPS.CONFIRM && (
            <div className="step-content">
              <h2>Confirmación Final</h2>
              <p>Escribe <b>ELIMINAR</b> a continuación para confirmar la desactivación de tu cuenta.</p>
              
              <input 
                className="input critical-input" 
                placeholder="Escribe ELIMINAR aquí"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              />

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>Entiendo que mis datos serán borrados permanentemente tras 30 días.</span>
              </label>

              <div className="actions">
                <button className="btn ghost" onClick={handleBack}>Atrás</button>
                <button 
                  className="btn red" 
                  disabled={confirmText !== "ELIMINAR" || !acceptedTerms || loading}
                  onClick={handleRequestDeletion}
                >
                  {loading ? 'Procesando...' : 'ELIMINAR CUENTA'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="step-indicator">
          {Object.values(STEPS).map(s => (
            <div key={s} className={`dot ${step === s ? 'active' : ''} ${step > s ? 'done' : ''}`} />
          ))}
        </div>
      </div>

      <style>{`
        .deletion-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .deletion-modal {
          width: 100%;
          max-width: 500px;
          background: #121212;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 40px;
          position: relative;
          color: white;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255,0,0,0.05);
        }
        .close-btn {
          position: absolute;
          top: 20px; right: 20px;
          background: none; border: none;
          color: #666; font-size: 24px;
          cursor: pointer;
        }
        .step-content {
          text-align: center;
        }
        .danger-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 1.8rem;
          margin-bottom: 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        p {
          color: #aaa;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .warning-box {
          background: rgba(255,100,0,0.1);
          border: 1px solid rgba(255,100,0,0.2);
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: left;
        }
        .warning-box p { margin: 0; color: #ff9d66; font-size: 0.9rem; }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 30px;
        }
        .stat-item {
          background: rgba(255,255,255,0.05);
          padding: 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
        }
        .stat-item .val { font-size: 1.5rem; font-weight: bold; color: #fff; }
        .stat-item .lbl { font-size: 0.8rem; color: #666; text-transform: uppercase; }
        
        .reasons-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 30px;
          text-align: left;
        }
        .reason-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 14px 20px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }
        .reason-item:hover { background: rgba(255,255,255,0.06); }
        .reason-item.selected { 
          background: rgba(255,90,0,0.1); 
          border-color: rgba(255,90,0,0.3);
          color: #ff5a00;
        }
        .reason-item input { display: none; }

        .critical-input {
          text-align: center;
          font-size: 1.2rem;
          letter-spacing: 0.2em;
          font-weight: bold;
          margin-bottom: 20px;
          background: rgba(255,0,0,0.05);
          border-color: rgba(255,0,0,0.2);
        }
        .checkbox-label {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          text-align: left;
          font-size: 0.85rem;
          color: #888;
          cursor: pointer;
          margin-bottom: 30px;
        }
        .checkbox-label input { margin-top: 3px; }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.2s;
          border: none;
        }
        .btn.red { background: #ff4444; color: white; }
        .btn.red:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn.red-ghost { 
          background: rgba(255,68,68,0.1); 
          color: #ff4444;
          border: 1px solid rgba(255,68,68,0.2);
        }
        .btn.ghost { background: transparent; color: #888; }
        
        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 30px;
        }
        .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #333;
          transition: 0.3s;
        }
        .dot.active { background: #ff5a00; width: 20px; border-radius: 10px; }
        .dot.done { background: #666; }

        .special-notice {
          background: rgba(0,200,255,0.05);
          border: 1px solid rgba(0,200,255,0.1);
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: left;
          font-size: 0.85rem;
        }
        .special-notice p { margin: 0; color: #66d9ff; }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
