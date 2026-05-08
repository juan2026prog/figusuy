import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToast } from './Toast';

export default function InfluencerApplyModal({ isOpen, onClose }) {
  const profile = useAuthStore(state => state.profile);
  const toast = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    country: 'Uruguay',
    city: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    twitch_url: '',
    facebook_url: '',
    x_url: '',
    main_social: '',
    other_social_url: '',
    content_type: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null);

  useEffect(() => {
    if (!profile?.id || !isOpen) return;

    const checkExisting = async () => {
      const { data, error } = await supabase
        .from('influencer_applications')
        .select('status')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setExistingStatus(data.status);
    };

    checkExisting();
  }, [profile?.id, isOpen]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.name || '',
        email: profile.email || '',
        city: profile.city || '',
      }));
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('influencer_applications').insert([
        {
          full_name: formData.full_name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          country: formData.country,
          city: formData.city,
          instagram_url: formData.instagram_url,
          tiktok_url: formData.tiktok_url,
          youtube_url: formData.youtube_url,
          twitch_url: formData.twitch_url,
          facebook_url: formData.facebook_url,
          x_url: formData.x_url,
          main_social: formData.main_social,
          other_social_url: formData.other_social_url,
          content_type: formData.content_type,
          message: formData.message,
          status: 'pending',
          user_id: profile?.id || null
        }
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya tenés una solicitud pendiente con estos datos.');
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast.success('¡Solicitud enviada con éxito!');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Hubo un error al enviar tu solicitud. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2100;
          padding: 1rem;
        }
        .modal-content {
          background: #0a0a0a;
          width: 100%;
          max-width: 600px;
          border-radius: 8px;
          border: 1px solid #222;
          overflow: hidden;
          position: relative;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }
        .modal-header {
          padding: 1.5rem 2rem;
          background: #000;
          border-bottom: 1px solid #222;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 900;
          margin: 0;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          font-style: italic;
          letter-spacing: 0.05em;
        }
        .close-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          cursor: pointer;
          transition: 0.2s;
        }
        .close-btn:hover { 
          background: var(--color-primary); 
          border-color: var(--color-primary);
          transform: rotate(90deg);
        }
        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          color: #eee;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
        .social-row-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          grid-column: 1 / -1;
          margin-bottom: 0.5rem;
        }
        .social-row-grid .form-group { margin-bottom: 0; }
        @media (max-width: 768px) {
          .social-row-grid { grid-template-columns: 1fr; gap: 0.75rem; }
        }
        .form-group { margin-bottom: 1.5rem; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 900;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.6rem;
          opacity: 0.9;
        }
        .form-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: #0f0f0f;
          border: 1px solid #222;
          border-radius: 4px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .form-input:focus {
          border-color: var(--color-primary);
          background: #151515;
          box-shadow: 0 0 0 4px rgba(255, 90, 0, 0.05);
        }
        .social-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .social-input-wrapper .material-symbols-outlined {
          position: absolute;
          left: 0.85rem;
          font-size: 1.1rem;
          color: #555;
          pointer-events: none;
          transition: 0.2s;
        }
        .form-input:focus ~ .material-symbols-outlined, .social-input-wrapper:hover .material-symbols-outlined {
          color: var(--color-primary);
        }
        .social-input-wrapper .form-input {
          padding-left: 2.6rem;
        }
        
        .submit-btn {
          width: 100%;
          padding: 1.15rem;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: 4px;
          font: 900 1.1rem 'Barlow Condensed';
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-style: italic;
          cursor: pointer;
          margin-top: 1rem;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px rgba(255, 90, 0, 0.15);
        }
        .submit-btn:hover:not(:disabled) {
          background: #ff7520;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(255, 90, 0, 0.3);
        }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }

        .form-section-header {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 0.5rem 0 1rem;
        }
        .form-section-header span {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, #333, transparent);
        }
        .form-section-header label {
          font-size: 0.65rem;
          font-weight: 900;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          white-space: nowrap;
        }

        .success-view {
          text-align: center;
          padding: 2rem 1rem;
        }
        .success-icon {
          font-size: 5rem;
          margin-bottom: 1.5rem;
          display: inline-block;
          animation: bounce 1s infinite alternate;
        }
        @keyframes bounce {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
        .pending-view, .success-view { text-align: center; padding: 3rem 1rem; }
        .pending-view .material-symbols-outlined, .success-view .material-symbols-outlined { font-size: 4rem; color: #ff5a00; margin-bottom: 1.5rem; opacity: .7; }
        .pending-view h2, .success-view h2 { font: italic 900 2.5rem 'Barlow Condensed'; text-transform: uppercase; margin-bottom: 1rem; color: #fff; line-height: 1; }
        .pending-view p, .success-view p { color: #aaa; line-height: 1.6; margin-bottom: 1.5rem; }
      `}</style>

      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sumate como Influencer</h2>
          <button className="close-btn" onClick={onClose}>âœ•</button>
        </div>

        <div className="modal-body">
          {existingStatus === 'pending' ? (
            <div className="pending-view">
              <span className="material-symbols-outlined">hourglass_top</span>
              <h2>Postulación en Revisión</h2>
              <p>Ya recibimos tus datos. Nuestro equipo de Growth está evaluando tu perfil para habilitar tu código.</p>
              <p>Te notificaremos por aquí y vía email apenas tengamos novedades.</p>
              <button className="btn btn-secondary w-full" onClick={onClose} style={{ marginTop: '1rem' }}>CERRAR</button>
            </div>
          ) : success ? (
            <div className="success-view">
              <span className="material-symbols-outlined">check_circle</span>
              <h2>¡Solicitud Enviada!</h2>
              <p>Gracias por querer sumarte a FigusUY. Vamos a revisar tu perfil y te contactaremos pronto.</p>
              <button className="btn btn-secondary w-full" onClick={onClose} style={{ marginTop: '1rem' }}>ENTENDIDO</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '2rem', borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
                Buscamos creadores comprometidos con la comunidad. No importa cuántos seguidores tengas, 
                sino cuánto valor podés aportar a FigusUY.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    className="form-input"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    required
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input 
                    className="form-input"
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    required
                    placeholder="Ej: 099 123 456"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email de contacto</label>
                  <input 
                    className="form-input"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ciudad / Localidad</label>
                  <input 
                    className="form-input"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    required
                    placeholder="Ej: Montevideo"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">¿Qué tipo de contenido hacés?</label>
                  <select 
                    className="form-input"
                    value={formData.content_type}
                    onChange={e => setFormData({...formData, content_type: e.target.value})}
                    required
                  >
                    <option value="">Seleccioná una opción</option>
                    <option value="unboxing">Unboxing / Apertura de sobres</option>
                    <option value="intercambio">Eventos de intercambio</option>
                    <option value="tutoriales">Tutoriales / Tips de colección</option>
                    <option value="humor">Humor / Entretenimiento</option>
                    <option value="deportes">Periodismo Deportivo / Noticias</option>
                    <option value="lifestyle">Lifestyle / Blog</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="form-section-header">
                  <label>Redes Sociales (Al menos una)</label>
                  <span />
                </div>

                <div className="social-row-grid">
                  <div className="form-group">
                    <label className="form-label">Instagram</label>
                    <div className="social-input-wrapper">
                      <input 
                        className="form-input"
                        placeholder="@usuario"
                        value={formData.instagram_url}
                        onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                      />
                      <span className="material-symbols-outlined">photo_camera</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">TikTok</label>
                    <div className="social-input-wrapper">
                      <input 
                        className="form-input"
                        placeholder="@usuario"
                        value={formData.tiktok_url}
                        onChange={e => setFormData({...formData, tiktok_url: e.target.value})}
                      />
                      <span className="material-symbols-outlined">video_library</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">YouTube</label>
                    <div className="social-input-wrapper">
                      <input 
                        className="form-input"
                        placeholder="Canal / @usuario"
                        value={formData.youtube_url}
                        onChange={e => setFormData({...formData, youtube_url: e.target.value})}
                      />
                      <span className="material-symbols-outlined">play_circle</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Twitch</label>
                    <div className="social-input-wrapper">
                      <input 
                        className="form-input"
                        placeholder="Canal"
                        value={formData.twitch_url}
                        onChange={e => setFormData({...formData, twitch_url: e.target.value})}
                      />
                      <span className="material-symbols-outlined">live_tv</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">X (Twitter)</label>
                    <div className="social-input-wrapper">
                      <input 
                        className="form-input"
                        placeholder="@usuario"
                        value={formData.x_url}
                        onChange={e => setFormData({...formData, x_url: e.target.value})}
                      />
                      <span className="material-symbols-outlined">tag</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Facebook</label>
                    <div className="social-input-wrapper">
                      <input 
                        className="form-input"
                        placeholder="Página / Perfil"
                        value={formData.facebook_url}
                        onChange={e => setFormData({...formData, facebook_url: e.target.value})}
                      />
                      <span className="material-symbols-outlined">thumb_up</span>
                    </div>
                  </div>
                </div>

                <div className="form-group full-width" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">¿Cuál es la red que más usás para tu comunidad?</label>
                  <select 
                    className="form-input"
                    value={formData.main_social}
                    onChange={e => setFormData({...formData, main_social: e.target.value})}
                    required
                  >
                    <option value="">Seleccioná una opción</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitch">Twitch</option>
                    <option value="x">X (Twitter)</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Otra</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">¿Por qué querés ser parte de FigusUY?</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '6rem', resize: 'vertical' }}
                    placeholder="Contanos un poco sobre vos y cómo pensás promocionar la plataforma..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? 'Procesando...' : 'Enviar Solicitud de Ingreso'}
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#555', marginTop: '1.5rem' }}>
                Al enviar, aceptás que revisemos tus perfiles públicos para evaluar la solicitud.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
