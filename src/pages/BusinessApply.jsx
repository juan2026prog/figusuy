import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/Toast';

export default function BusinessApply() {
  const navigate = useNavigate();
  const profile = useAuthStore(state => state.profile);
  const toast = useToast();

  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    city: '',
    department: '',
    phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_name || !formData.address) {
      toast.error('Nombre y dirección son obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('location_requests').insert({
        user_id: profile.id,
        ...formData
      });
      
      if (error) throw error;
      
      // Update profile locally & remotely
      await supabase.from('profiles').update({ business_status: 'pending' }).eq('id', profile.id);
      useAuthStore.setState({ profile: { ...profile, business_status: 'pending' } });
      
      toast.success('Solicitud enviada correctamente');
      navigate('/business/pending');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', backgroundColor: '#020617', color: 'white' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #1e293b' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '4rem', height: '4rem', backgroundColor: '#ea580c', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>🏪</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Registrá tu Local</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Únete a FigusUY Negocios y aparecé en el mapa de puntos de intercambio.</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Nombre del Local *</label>
            <input 
              required
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: '#020617', border: '1px solid #1e293b', color: 'white', outline: 'none' }}
              value={formData.business_name}
              onChange={e => setFormData({...formData, business_name: e.target.value})}
              placeholder="Ej: Kiosco El Sol"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Dirección *</label>
            <input 
              required
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: '#020617', border: '1px solid #1e293b', color: 'white', outline: 'none' }}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Ej: Av. 18 de Julio 1234"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Ciudad</label>
              <input 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: '#020617', border: '1px solid #1e293b', color: 'white', outline: 'none' }}
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                placeholder="Montevideo"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Departamento</label>
              <input 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: '#020617', border: '1px solid #1e293b', color: 'white', outline: 'none' }}
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                placeholder="Montevideo"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Teléfono de contacto</label>
            <input 
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: '#020617', border: '1px solid #1e293b', color: 'white', outline: 'none' }}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="091 234 567"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Comentarios extra (opcional)</label>
            <textarea 
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: '#020617', border: '1px solid #1e293b', color: 'white', outline: 'none', resize: 'vertical', minHeight: '80px' }}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Algún detalle adicional..."
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '0.875rem', backgroundColor: '#ea580c', color: 'white', fontWeight: 900, borderRadius: '1rem', border: 'none', cursor: 'pointer', marginTop: '1rem' }}
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            style={{ width: '100%', padding: '0.875rem', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: 700, borderRadius: '1rem', border: 'none', cursor: 'pointer' }}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}
