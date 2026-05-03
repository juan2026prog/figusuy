import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/Toast';
import { getBusinessPlanLabel } from '../lib/businessPlans';
import UniversalAddressAutocomplete from './UniversalAddressAutocomplete';
export default function BusinessApplyModal({ isOpen, onClose, initialType = 'store' }) {
  const profile = useAuthStore(state => state.profile);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    department: 'Montevideo',
    whatsapp: '',
    notes: '',
    applicant_email: profile?.email || '',
    applicant_name: profile?.name || '',
    position: '',
    business_plan: 'gratis'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast.error('Nombre y dirección son obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('location_requests').insert({
        user_id: profile?.id || null,
        name: formData.name,
        address: formData.address,
        city: formData.city || 'Montevideo',
        department: formData.department || 'Montevideo',
        whatsapp: formData.whatsapp,
        business_plan: formData.business_plan,
        applicant_email: formData.applicant_email,
        applicant_name: formData.applicant_name,
        position: formData.position,
        metadata: {
          notes: formData.notes,
          request_type: initialType
        }
      });

      if (error) throw error;

      // Send Confirmation Email
      try {
        await supabase.functions.invoke('send-email', {
          body: { 
            to: formData.applicant_email,
            subject: 'Recibimos tu solicitud de FigusUY Negocios 📩',
            template: 'business_requested',
            data: {
              name: formData.applicant_name,
              business_name: formData.name,
              address: formData.address,
              plan: getBusinessPlanLabel(formData.business_plan)
            }
          }
        });
      } catch (emailErr) {
        console.error('Error sending confirmation email:', emailErr);
      }

      // Update profile status locally only if logged in
      if (profile?.id) {
        await supabase.from('profiles').update({
          business_status: 'pending'
        }).eq('id', profile.id);
      }

      setSuccess(true);
      toast.success('¡Solicitud enviada con éxito!');
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar la solicitud');
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
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
        }
        .modal-content {
          background: var(--color-surface);
          width: 100%;
          max-width: 500px;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          position: relative;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 1.5rem 2rem;
          background: var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 900;
          margin: 0;
          color: var(--color-text); }
        .close-btn {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
        }
        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          color: var(--color-text); }
        .form-group { margin-bottom: 1.25rem; }
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--color-text-muted);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: var(--color-border);
          border: 1px solid #334155;
          border-radius: 4px;
          color: var(--color-text); font-weight: 600;
          outline: none;
        }
        .form-input:focus { border-color: var(--color-primary); }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: var(--color-primary);
          color: var(--color-text); border: none;
          border-radius: 1.25rem;
          font-weight: 900;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: 0.2s;
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .success-view {
          text-align: center;
          padding: 2rem;
        }
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          display: block;
        }
      `}</style>
      
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialType === 'suggested' ? 'Proponer Lugar' : 'Registrar Local'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="success-view">
              <span className="success-icon">🎉</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>¡Solicitud enviada!</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                Hemos recibido tus datos correctamente. Nuestro equipo revisará la información y te notificará por mail una vez aprobada.
              </p>
              <button className="submit-btn" onClick={onClose}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Completá los datos del local para aparecer en el mapa y lista de FigusUY.
              </p>

              <div className="form-group">
                <label className="form-label">Nombre del Local</label>
                <input 
                  className="form-input"
                  placeholder="Ej: Kiosco El Pibe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <UniversalAddressAutocomplete
                  countryCode="uy"
                  label="Dirección Completa"
                  value={formData.address}
                  onChange={(val) => setFormData({...formData, address: val})}
                  onAddressSelect={(data) => {
                    setFormData({
                      ...formData,
                      address: data.fullAddress,
                      city: data.city || data.neighborhood || data.locality,
                      department: data.department || formData.department,
                    });
                  }}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <select 
                    className="form-input"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    required
                  >
                    <option value="Montevideo">Montevideo</option>
                    <option value="Canelones">Canelones</option>
                    <option value="Maldonado">Maldonado</option>
                    <option value="Colonia">Colonia</option>
                    <option value="San José">San José</option>
                    <option value="Rocha">Rocha</option>
                    <option value="Maldonado">Maldonado</option>
                    <option value="Salto">Salto</option>
                    <option value="Paysandú">Paysandú</option>
                    <option value="Florida">Florida</option>
                    <option value="Lavalleja">Lavalleja</option>
                    <option value="Durazno">Durazno</option>
                    <option value="Tacuarembó">Tacuarembó</option>
                    <option value="Rivera">Rivera</option>
                    <option value="Artigas">Artigas</option>
                    <option value="Soriano">Soriano</option>
                    <option value="Río Negro">Río Negro</option>
                    <option value="Flores">Flores</option>
                    <option value="Cerro Largo">Cerro Largo</option>
                    <option value="Treinta y Tres">Treinta y Tres</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad / Barrio</label>
                  <input 
                    className="form-input"
                    placeholder="Ej: Pocitos"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp de contacto</label>
                <input 
                  className="form-input"
                  placeholder="099123456"
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan Seleccionado</label>
                <select 
                  className="form-input"
                  value={formData.business_plan}
                  onChange={e => setFormData({...formData, business_plan: e.target.value})}
                  required
                >
                  <option value="gratis">Gratis ($0)</option>
                  <option value="turbo">Turbo (UYU 690/mes)</option>
                  <option value="dominio">Dominio (UYU 1.490/mes)</option>
                  <option value="legend">PartnerStore (UYU 1.900/mes)</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Datos del Solicitante</p>
                
                <div className="form-group">
                  <label className="form-label">Tu Nombre</label>
                  <input 
                    className="form-input"
                    value={formData.applicant_name}
                    onChange={e => setFormData({...formData, applicant_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      className="form-input"
                      type="email"
                      value={formData.applicant_email}
                      onChange={e => setFormData({...formData, applicant_email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input 
                      className="form-input"
                      placeholder="Dueño / Encargado"
                      value={formData.position}
                      onChange={e => setFormData({...formData, position: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
