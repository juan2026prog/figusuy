import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useBusinessPlanStore } from '../stores/businessPlanStore';
import { useToast } from '../components/Toast';
import { getBusinessPlanLabel } from '../lib/businessPlans';
import UniversalAddressAutocomplete from './UniversalAddressAutocomplete';
import {
  getCitiesByDepartment,
  getDepartments,
  getNeighborhoodsByDepartmentAndCity,
  loadUruguayLocationTree,
  URUGUAY_LOCATION_TREE_FALLBACK,
} from '../lib/uruguayLocations';
export default function BusinessApplyModal({ isOpen, onClose, initialType = 'store' }) {
  const profile = useAuthStore(state => state.profile);
  const toast = useToast();
  const isSuggestedRequest = initialType === 'suggested';

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    neighborhood: '',
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
  const [locationTree, setLocationTree] = useState(URUGUAY_LOCATION_TREE_FALLBACK);
  const [landingPlans, setLandingPlans] = useState([]);

  const { plans: dbPlans, fetchPlans } = useBusinessPlanStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    let active = true;
    loadUruguayLocationTree()
      .then((tree) => {
        if (!active) return;
        setLocationTree(tree);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      applicant_email: profile?.email || current.applicant_email || '',
      applicant_name: profile?.name || current.applicant_name || '',
      business_plan: isSuggestedRequest ? 'gratis' : current.business_plan || 'gratis'
    }));
  }, [profile?.email, profile?.name, isSuggestedRequest]);

  const departmentOptions = useMemo(
    () => getDepartments(locationTree),
    [locationTree]
  );

  const cityOptions = useMemo(
    () => getCitiesByDepartment(locationTree, formData.department),
    [locationTree, formData.department]
  );

  const neighborhoodOptions = useMemo(
    () => getNeighborhoodsByDepartmentAndCity(locationTree, formData.department, formData.city),
    [locationTree, formData.department, formData.city]
  );

  const visibleCityOptions = useMemo(() => {
    if (formData.city && !cityOptions.includes(formData.city)) {
      return [formData.city, ...cityOptions];
    }
    return cityOptions;
  }, [cityOptions, formData.city]);

  const visibleNeighborhoodOptions = useMemo(() => {
    if (formData.neighborhood && !neighborhoodOptions.includes(formData.neighborhood)) {
      return [formData.neighborhood, ...neighborhoodOptions];
    }
    return neighborhoodOptions;
  }, [neighborhoodOptions, formData.neighborhood]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast.error('Nombre y dirección son obligatorios');
      return;
    }
    
    if (isSuggestedRequest && !profile?.id) {
      toast.error('Tenes que iniciar sesion para sugerir un punto');
      return;
    }
    if (isSuggestedRequest && !formData.notes.trim()) {
      toast.error('Contanos por que este punto vale la pena');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('location_requests').insert({
        user_id: profile?.id || null,
        name: formData.name,
        address: formData.address,
        city: formData.city || 'Montevideo',
        neighborhood: formData.neighborhood,
        department: formData.department || 'Montevideo',
        whatsapp: formData.whatsapp,
        business_plan: formData.business_plan,
        applicant_email: formData.applicant_email,
        applicant_name: formData.applicant_name,
        position: isSuggestedRequest ? 'community_suggestion' : formData.position,
        metadata: {
          notes: formData.notes,
          request_type: initialType,
          suggested_by_plan: profile?.plan_name || 'gratis',
          suggested_by_paid: isSuggestedRequest
        }
      });

      if (error) throw error;

      // Send Confirmation Email
      if (!isSuggestedRequest) try {
        await supabase.functions.invoke('send-email', {
          body: { 
            to: formData.applicant_email,
            subject: 'Recibimos tu solicitud de FigusUY Negocios ðŸ“©',
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
      if (!isSuggestedRequest && profile?.id) {
        await supabase.from('profiles').update({
          business_status: 'pending'
        }).eq('id', profile.id);
      }

      setSuccess(true);
      toast.success(isSuggestedRequest ? 'Sugerencia enviada con exito!' : 'Solicitud enviada con exito!');
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
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
        }
        .modal-content {
          background: var(--color-bg);
          width: 100%;
          max-width: 520px;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          position: relative;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .modal-header {
          padding: 1.5rem 2rem;
          background: #000;
          border-bottom: 1px solid var(--color-border);
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
        .close-btn:hover { background: rgba(255,255,255,0.15); border-color: var(--color-primary); }
        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          background: var(--color-bg);
          color: var(--color-text);
        }
        .form-group { margin-bottom: 1.5rem; }
        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 900;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.6rem;
        }
        .form-input {
          width: 100%;
          padding: 1rem 1.15rem;
          min-height: 3.25rem;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 6px;
          color: #111827;
          font-weight: 600;
          font-size: 0.95rem;
          outline: none;
          transition: 0.2s;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
        }
        .form-input:focus {
          border-color: var(--color-primary);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(255, 90, 0, 0.14);
        }
        .form-input::placeholder { color: #9ca3af; opacity: 1; }
        .form-input:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
        select.form-input {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 3rem;
          background-image:
            linear-gradient(45deg, transparent 50%, #111827 50%),
            linear-gradient(135deg, #111827 50%, transparent 50%);
          background-position:
            calc(100% - 1.1rem) calc(50% - 2px),
            calc(100% - 0.8rem) calc(50% - 2px);
          background-size: 8px 8px, 8px 8px;
          background-repeat: no-repeat;
          color-scheme: light;
        }
        select.form-input option {
          background: #ffffff;
          color: #111827;
        }
        
        .form-section-title {
          font: 900 0.75rem 'Barlow Condensed';
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 0.5rem;
          margin-bottom: 1.5rem;
          margin-top: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 641px) {
          .form-row-2col {
            grid-template-columns: 1fr 1fr;
          }
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
          letter-spacing: 0.08em;
          cursor: pointer;
          margin-top: 1rem;
          transition: 0.2s;
          box-shadow: 0 4px 15px rgba(255, 90, 0, 0.25);
        }
        .submit-btn:hover { background: var(--color-brand-600); transform: translateY(-2px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .success-view {
          text-align: center;
          padding: 1rem 0;
        }
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          display: block;
        }
        @media (max-width: 640px) {
          .modal-header { padding: 1rem 1.5rem; }
          .modal-body { padding: 1.5rem; }
        }
      `}</style>
      
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isSuggestedRequest ? 'Sugerir Punto' : 'Registrar Local'}</h2>
          <button className="close-btn" onClick={onClose}>Ã—</button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="success-view">
              <span className="success-icon">ðŸŽ‰</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                {isSuggestedRequest ? 'Sugerencia enviada!' : 'Solicitud enviada!'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                {isSuggestedRequest
                  ? 'Recibimos el punto sugerido. El equipo lo va a revisar y, si aplica, lo publicaremos dentro del mapa.'
                  : 'Hemos recibido tus datos correctamente. Nuestro equipo revisará la información y te notificará por mail una vez aprobada.'}
              </p>
              <button className="submit-btn" onClick={onClose}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                {isSuggestedRequest
                  ? 'Sugeri un kiosco, plaza, cafe o punto de encuentro que sirva para intercambiar con seguridad. Esta funcion esta habilitada para planes pagos.'
                  : 'Completa los datos del local para aparecer en FigusUY, captar puntos sugeridos y elegir tu nivel comercial.'}
              </p>

              <div className="form-group">
                <label className="form-label">{isSuggestedRequest ? 'Nombre del Punto' : 'Nombre del Local'}</label>
                <input 
                  className="form-input"
                  placeholder={isSuggestedRequest ? 'Ej: Plaza Varela o Cafe Central' : 'Ej: Kiosco El Pibe'}
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
                    const dept = data.department || data.state || formData.department;
                    const city = data.city || data.town || data.locality || '';
                    const neighborhood = data.neighborhood || '';
                    
                    setFormData({
                      ...formData,
                      address: data.fullAddress,
                      city: city,
                      neighborhood: neighborhood,
                      department: dept,
                    });
                  }}
                  required
                />
              </div>

              <div className="form-section-title">Ubicación Detallada</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <select 
                    name="department"
                    className="form-input"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value, city: '', neighborhood: ''})}
                    required
                  >
                    {departmentOptions.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <select
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value, neighborhood: ''})}
                    disabled={!formData.department}
                    required
                  >
                    <option value="">Seleccioná una ciudad</option>
                    {visibleCityOptions.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Barrio / Localidad</label>
                  <select
                    name="neighborhood"
                    className="form-input"
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    disabled={!formData.city}
                    required
                  >
                    <option value="">
                      {formData.city ? 'Seleccioná un barrio o localidad' : 'Primero elegí una ciudad'}
                    </option>
                    {visibleNeighborhoodOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!isSuggestedRequest && (
                <>
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
                      {dbPlans.length > 0 ? (
                        dbPlans.map((plan, i) => {
                          const uiName = plan.plan_name === 'turbo' ? 'Radar' : 
                                        plan.plan_name === 'dominio' ? 'Conversion' : 
                                        plan.plan_name === 'gratis' ? 'Boost' : 'Collector Hub'
                          return (
                            <option key={i} value={plan.plan_name}>
                              Plan {uiName} (UYU {plan.monthly_price.toLocaleString()}/mes)
                            </option>
                          )
                        })
                      ) : (
                        <>
                          <option value="gratis">Plan Boost (UYU 590/mes)</option>
                          <option value="turbo">Plan Radar (UYU 990/mes)</option>
                          <option value="dominio">Plan Conversion (UYU 1.490/mes)</option>
                          <option value="partner_store">Plan Collector Hub (UYU 1.490/mes)</option>
                        </>
                      )}
                    </select>

                    {(() => {
                    if (dbPlans.length === 0) return null;
                    const selectedPlan = dbPlans.find(p => p.plan_name === formData.business_plan);
                    if (!selectedPlan) return null;
                    
                    const benefits = [];
                    if (selectedPlan.max_photos > 1) benefits.push(`${selectedPlan.max_photos} fotos en el local`);
                    if (selectedPlan.max_active_promos > 1) benefits.push(`${selectedPlan.max_active_promos} promos activas`);
                    if (selectedPlan.can_have_featured_badge) benefits.push('Badge destacado');
                    if (selectedPlan.can_have_featured_cta) benefits.push('Botón de acción (CTA)');
                    if (selectedPlan.can_have_advanced_metrics) benefits.push('Métricas avanzadas');
                    if (selectedPlan.plan_name === 'partner_store') benefits.push('Validación de álbumes');

                    if (benefits.length === 0) return null;
                    return (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--panel-bg, #1a1a1a)', borderRadius: '0.5rem', border: '1px solid var(--border-color, #333)' }}>
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary, #a0a0a0)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Características incluidas:</h4>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-primary, #f5f5f5)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {benefits.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">{isSuggestedRequest ? 'Por que sirve este punto' : 'Notas adicionales'}</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '7rem', resize: 'vertical' }}
                  placeholder={isSuggestedRequest ? 'Contanos si es un punto seguro, concurrido o util para intercambiar.' : 'Horario, referencias o cualquier dato comercial extra.'}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  required={isSuggestedRequest}
                />
              </div>

              <div className="form-section-title">Datos del Solicitante</div>
              
              <div className="form-group">
                <label className="form-label">Tu Nombre</label>
                <input 
                  className="form-input"
                  value={formData.applicant_name}
                  onChange={e => setFormData({...formData, applicant_name: e.target.value})}
                  required
                />
              </div>

              <div className="form-row form-row-2col">
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
                {!isSuggestedRequest && (
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
                )}
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : isSuggestedRequest ? 'Enviar sugerencia' : 'Enviar Solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
