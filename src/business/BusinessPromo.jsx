import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BusinessPromo() {
  const { location } = useOutletContext()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [planRules, setPlanRules] = useState(null)

  useEffect(() => {
    if (location) {
      fetchPlanRules()
      fetchPromos()
    }
  }, [location])

  const fetchPlanRules = async () => {
    const { data } = await supabase
      .from('business_plan_rules')
      .select('*')
      .eq('plan_name', location.business_plan || 'gratis')
      .single()
    if (data) setPlanRules(data)
  }

  const fetchPromos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sponsored_placements')
      .select('*')
      .eq('location_id', location.id)
    if (!error) setPromos(data || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!planRules || planRules.max_active_promos === 0) {
      alert('Tu plan Gratis no permite promos activas. ¡Mejorá a Turbo!')
      return
    }
    
    const activeCount = promos.filter(p => p.is_active).length
    if (planRules.max_active_promos !== null && activeCount >= planRules.max_active_promos) {
      alert(`Tu plan permite ${planRules.max_active_promos} promo activa. Pausá la actual para crear otra.`)
      return
    }

    const { data, error } = await supabase.from('sponsored_placements').insert({
      location_id: location.id,
      title: 'Nueva Promo',
      description: 'Descripción de la promo',
      placement_type: 'context_banner',
      sponsor_type: 'local',
      is_active: false,
      cta_label: 'Ver Promo',
      whatsapp: location.whatsapp
    }).select()

    if (!error) {
      fetchPromos()
    }
  }

  const toggleStatus = async (promo) => {
    const newStatus = !promo.is_active
    
    // Check limits if activating
    if (newStatus && planRules && planRules.max_active_promos !== null) {
      const activeCount = promos.filter(p => p.id !== promo.id && p.is_active).length
      if (activeCount >= planRules.max_active_promos) {
        alert(`Límite alcanzado. Pausa otra promo primero.`)
        return
      }
    }

    await supabase.from('sponsored_placements').update({ is_active: newStatus }).eq('id', promo.id)
    fetchPromos()
  }

  if (!location) return null

  return (
    <div className="biz-promo">
      <style>{`
        .promo-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .promo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .promo-status {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .status-active { background: rgba(16,185,129,0.15); color: #10b981; }
        .status-paused { background: rgba(148,163,184,0.15); color: #94a3b8; }
        
        .promo-title { font-size: 1.125rem; font-weight: 800; color: white; margin-bottom: 0.25rem; }
        .promo-desc { font-size: 0.875rem; color: #cbd5e1; margin-bottom: 1.5rem; }
        
        .promo-actions {
          display: flex;
          gap: 0.75rem;
          border-top: 1px solid #334155;
          padding-top: 1rem;
        }
        
        .btn-new-promo {
          background: #f97316;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-new-promo:hover { background: #ea580c; }
        .btn-new-promo:disabled { background: #475569; cursor: not-allowed; }

        .btn-outline {
          background: transparent;
          border: 1px solid #475569;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.8125rem;
        }
        .btn-outline:hover { background: #334155; }
        
        .upsell-banner {
          background: linear-gradient(135deg, rgba(249,115,22,0.1), rgba(217,70,239,0.1));
          border: 1px solid rgba(249,115,22,0.2);
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          margin-bottom: 2rem;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Promociones Activas</h2>
        <button className="btn-new-promo" onClick={handleCreate}>
          <span className="material-symbols-outlined">add</span>
          Crear Promo
        </button>
      </div>

      {planRules && planRules.max_active_promos === 0 && (
        <div className="upsell-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#f97316', marginBottom: '1rem' }}>rocket_launch</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>Llegá a más coleccionistas</h3>
          <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Las promos te permiten aparecer destacado en la pantalla principal y en los álbumes. Exclusivo para planes Turbo y Dominio.
          </p>
          <button className="btn-new-promo">Ver Planes</button>
        </div>
      )}

      {loading ? <p>Cargando promos...</p> : promos.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No tienes promociones creadas.</p>
      ) : (
        <div>
          {promos.map(promo => (
            <div key={promo.id} className="promo-card">
              <div className="promo-header">
                <div>
                  <h3 className="promo-title">{promo.title}</h3>
                  <p className="promo-desc">{promo.description}</p>
                </div>
                <div className={`promo-status ${promo.is_active ? 'status-active' : 'status-paused'}`}>
                  {promo.is_active ? 'Activa' : 'Pausada'}
                </div>
              </div>
              <div className="promo-actions">
                <button className="btn-outline">Editar</button>
                <button className="btn-outline" onClick={() => toggleStatus(promo)}>
                  {promo.is_active ? 'Pausar' : 'Activar'}
                </button>
                <button className="btn-outline" style={{ borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
