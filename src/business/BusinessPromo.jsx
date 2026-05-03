import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLocalBusinessPlanRules } from '../lib/businessPlans'
import PromoDetailModal, { getPromoStatus, PROMO_STATUS_CONFIG } from '../components/PromoDetailModal'

export default function BusinessPromo() {
  const { location } = useOutletContext()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [planRules, setPlanRules] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [previewPromo, setPreviewPromo] = useState(null)

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
    setPlanRules(data || getLocalBusinessPlanRules(location.business_plan || 'gratis'))
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
      alert('Tu plan Gratis no permite promos activas. Mejora a Turbo.')
      return
    }

    const activeCount = promos.filter(p => p.is_active).length
    if (planRules.max_active_promos !== null && activeCount >= planRules.max_active_promos) {
      alert(`Tu plan permite ${planRules.max_active_promos} promo activa. Pausa la actual para crear otra.`)
      return
    }

    const { error } = await supabase.from('sponsored_placements').insert({
      location_id: location.id,
      title: 'Nueva Promo',
      description: '',
      condition_text: '',
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

    if (newStatus && planRules && planRules.max_active_promos !== null) {
      const activeCount = promos.filter(p => p.id !== promo.id && p.is_active).length
      if (activeCount >= planRules.max_active_promos) {
        alert('Limite alcanzado. Pausa otra promo primero.')
        return
      }
    }

    await supabase.from('sponsored_placements').update({ is_active: newStatus }).eq('id', promo.id)
    fetchPromos()
  }

  const startEdit = (promo) => {
    setEditingId(promo.id)
    setEditForm({
      title: promo.title || '',
      condition_text: promo.condition_text || '',
      description: promo.description || '',
      image_url: promo.image_url || '',
      starts_at: promo.starts_at ? promo.starts_at.slice(0, 10) : '',
      ends_at: promo.ends_at ? promo.ends_at.slice(0, 10) : ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editForm.title.trim()) {
      alert('El título es obligatorio.')
      return
    }
    setSaving(true)
    const payload = {
      title: editForm.title.trim(),
      condition_text: editForm.condition_text.trim() || null,
      description: editForm.description.trim() || null,
      image_url: editForm.image_url.trim() || null,
      starts_at: editForm.starts_at ? new Date(editForm.starts_at).toISOString() : null,
      ends_at: editForm.ends_at ? new Date(editForm.ends_at).toISOString() : null
    }
    const { error } = await supabase
      .from('sponsored_placements')
      .update(payload)
      .eq('id', editingId)
    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      setEditingId(null)
      setEditForm({})
      fetchPromos()
    }
    setSaving(false)
  }

  const handleDelete = async (promo) => {
    if (!confirm('¿Seguro que querés eliminar esta promo?')) return
    await supabase.from('sponsored_placements').delete().eq('id', promo.id)
    fetchPromos()
  }

  const getDateStatus = (promo) => {
    const status = getPromoStatus(promo)
    return PROMO_STATUS_CONFIG[status]
  }

  if (!location) return null

  return (
    <div className="biz-page">
      <style>{`
        .bp-top {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr);
          gap: 1.25rem;
        }

        .bp-lead {
          padding: 1.35rem;
          border: 1px solid var(--line);
          background:
            linear-gradient(135deg, rgba(255, 90, 0, .14) 0%, rgba(255, 90, 0, .04) 26%, transparent 48%),
            var(--panel);
        }

        .bp-side {
          padding: 1.35rem;
          border: 1px solid var(--line);
          background: var(--panel2);
        }

        .bp-lead h2,
        .bp-side h3 {
          margin-top: .55rem;
          font: italic 900 2.2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .bp-lead p,
        .bp-side p {
          margin-top: .75rem;
          color: var(--muted);
          line-height: 1.58;
        }

        .bp-card {
          padding: 1.35rem;
          border: 1px solid var(--line);
          background: var(--panel);
          transition: border-color .15s;
        }

        .bp-card:hover {
          border-color: rgba(255,255,255,.18);
        }

        .bp-card + .bp-card {
          margin-top: 1rem;
        }

        .bp-card-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: start;
          margin-bottom: .65rem;
        }

        .bp-promo-title {
          font: italic 900 1.8rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .bp-promo-condition {
          display: flex;
          align-items: center;
          gap: .4rem;
          margin-top: .45rem;
          font-size: .88rem;
          color: var(--orange);
          font-weight: 700;
        }

        .bp-promo-condition .material-symbols-outlined {
          font-size: .95rem;
        }

        .bp-promo-desc {
          margin-top: .4rem;
          color: var(--muted);
          font-size: .88rem;
          line-height: 1.55;
        }

        .bp-status-badge {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .42rem .62rem;
          font: 900 .72rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .bp-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .bp-date-row {
          display: flex;
          gap: .7rem;
          flex-wrap: wrap;
          margin-top: .55rem;
        }

        .bp-date-pill {
          display: flex;
          align-items: center;
          gap: .3rem;
          padding: .32rem .55rem;
          background: #0d0d0d;
          border: 1px solid var(--line);
          font: 700 .74rem 'Barlow', sans-serif;
          color: var(--muted);
        }

        .bp-date-pill .material-symbols-outlined {
          font-size: .85rem;
          color: var(--muted2);
        }

        .bp-actions {
          display: flex;
          flex-wrap: wrap;
          gap: .7rem;
          padding-top: 1rem;
          border-top: 1px solid var(--line);
          margin-top: .85rem;
        }

        /* Edit form */
        .bp-edit-form {
          margin-top: 1rem;
          padding: 1.25rem;
          background: #0d0d0d;
          border: 1px solid rgba(255,90,0,.2);
        }

        .bp-field {
          margin-bottom: 1rem;
        }

        .bp-field label {
          display: block;
          font: 900 .68rem 'Barlow Condensed';
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--muted2);
          margin-bottom: .4rem;
        }

        .bp-field input,
        .bp-field textarea {
          width: 100%;
          padding: .72rem .85rem;
          background: #121212;
          border: 1px solid var(--line2);
          color: #fff;
          font: 700 .9rem 'Barlow', sans-serif;
          outline: none;
          transition: border-color .15s;
        }

        .bp-field input:focus,
        .bp-field textarea:focus {
          border-color: var(--orange);
        }

        .bp-field textarea {
          min-height: 64px;
          resize: vertical;
        }

        .bp-field .bp-hint {
          font-size: .72rem;
          color: var(--muted2);
          margin-top: .3rem;
        }

        .bp-edit-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .bp-edit-actions {
          display: flex;
          gap: .7rem;
          padding-top: .85rem;
        }

        .upsell-banner {
          padding: 1.6rem;
          border: 1px solid rgba(255, 90, 0, .22);
          background:
            linear-gradient(135deg, rgba(255, 90, 0, .12), rgba(56, 189, 248, .08)),
            var(--panel);
          text-align: center;
        }

        .upsell-banner h3 {
          margin-top: .8rem;
          font: italic 900 2rem 'Barlow Condensed';
          text-transform: uppercase;
          line-height: .9;
        }

        .upsell-banner p {
          max-width: 28rem;
          margin: .7rem auto 1.2rem;
          color: var(--muted);
          line-height: 1.55;
        }

        @media (max-width: 980px) {
          .bp-top {
            grid-template-columns: 1fr;
          }
          .bp-edit-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="bp-top">
        <div className="bp-lead">
          <div className="biz-page-kicker">/ promo activa</div>
          <h2>Empuja mensajes comerciales cuando mas importa.</h2>
          <p>Las promos sirven para destacar un anuncio puntual dentro del ecosistema. No son solo decoracion: tienen que mover una accion concreta.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.55rem', marginTop: '1rem' }}>
            <span className="biz-chip orange">Creadas: {promos.length}</span>
            {planRules && <span className="biz-chip">{planRules.max_active_promos === null ? 'Sin tope' : `${planRules.max_active_promos} activas`}</span>}
          </div>
        </div>

        <aside className="bp-side">
          <div className="biz-page-kicker">/ accion</div>
          <h3>Crea una promo nueva</h3>
          <p>Usa este espacio para comunicar llegada de albumes, sobres, descuentos o disponibilidad especial.</p>
          <button className="biz-btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleCreate}>Crear promo</button>
        </aside>
      </section>

      {planRules && planRules.max_active_promos === 0 && (
        <div className="upsell-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--orange)' }}>rocket_launch</span>
          <h3>Llega a mas coleccionistas</h3>
          <p>Las promos te permiten aparecer destacado en puntos de alto trafico. Esta capa comercial se desbloquea con Turbo o Dominio.</p>
          <button className="biz-btn-primary">Ver planes</button>
        </div>
      )}

      {loading ? (
        <div className="biz-card"><p className="biz-text-muted">Cargando promos...</p></div>
      ) : promos.length === 0 ? (
        <div className="biz-card">
          <div className="biz-page-kicker">/ estado</div>
          <h2 className="biz-card-title">Todavia no hay promos creadas</h2>
          <p className="biz-card-copy">Cuando actives una promocion va a aparecer aqui con su estado y controles de gestion.</p>
        </div>
      ) : (
        <div>
          {promos.map(promo => {
            const dateStatus = getDateStatus(promo)
            const isEditing = editingId === promo.id
            const formatShortDate = (d) => {
              if (!d) return '—'
              return new Date(d).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })
            }

            return (
              <div key={promo.id} className="bp-card">
                <div className="bp-card-header">
                  <div style={{ minWidth: 0 }}>
                    <div className="bp-promo-title">{promo.title}</div>
                    {promo.condition_text && (
                      <div className="bp-promo-condition">
                        <span className="material-symbols-outlined">check_circle</span>
                        {promo.condition_text}
                      </div>
                    )}
                    {promo.description && <p className="bp-promo-desc">{promo.description}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', alignItems: 'flex-end' }}>
                    <div
                      className="bp-status-badge"
                      style={{
                        color: dateStatus.color,
                        background: dateStatus.bg,
                        border: `1px solid ${dateStatus.border}`
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '.78rem' }}>{dateStatus.icon}</span>
                      {dateStatus.label}
                    </div>
                  </div>
                </div>

                {/* Date pills */}
                <div className="bp-date-row">
                  <span className="bp-date-pill">
                    <span className="material-symbols-outlined">event</span>
                    Desde: {formatShortDate(promo.starts_at)}
                  </span>
                  <span className="bp-date-pill">
                    <span className="material-symbols-outlined">event</span>
                    Hasta: {promo.ends_at ? formatShortDate(promo.ends_at) : 'Sin límite'}
                  </span>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="bp-edit-form">
                    <div className="bp-field">
                      <label>Título *</label>
                      <input
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Ej: 15% OFF en sobres"
                        maxLength={80}
                      />
                      <div className="bp-hint">Corto, claro, comercial. Max 80 caracteres.</div>
                    </div>
                    <div className="bp-field">
                      <label>Condición</label>
                      <input
                        value={editForm.condition_text}
                        onChange={e => setEditForm({ ...editForm, condition_text: e.target.value })}
                        placeholder="Ej: Comprando 10 sobres o más"
                        maxLength={120}
                      />
                      <div className="bp-hint">¿Qué tengo que hacer para usar esta promo?</div>
                    </div>
                    <div className="bp-field">
                      <label>Descripción (opcional)</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Ej: Válido hasta agotar stock"
                        maxLength={300}
                      />
                    </div>
                    <div className="bp-field">
                      <label>Imagen URL (opcional)</label>
                      <input
                        value={editForm.image_url}
                        onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                      <div className="bp-hint">URL de imagen promocional. Si no hay, se usa un fallback visual.</div>
                    </div>
                    <div className="bp-edit-row">
                      <div className="bp-field">
                        <label>Fecha inicio</label>
                        <input
                          type="date"
                          value={editForm.starts_at}
                          onChange={e => setEditForm({ ...editForm, starts_at: e.target.value })}
                        />
                      </div>
                      <div className="bp-field">
                        <label>Fecha fin</label>
                        <input
                          type="date"
                          value={editForm.ends_at}
                          onChange={e => setEditForm({ ...editForm, ends_at: e.target.value })}
                        />
                        <div className="bp-hint">Dejar vacío = Sin fecha límite</div>
                      </div>
                    </div>

                    {/* Preview thumbnail if image_url */}
                    {editForm.image_url && (
                      <div style={{ marginBottom: '1rem' }}>
                        <img
                          src={editForm.image_url}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', border: '1px solid var(--line)' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}

                    <div className="bp-edit-actions">
                      <button className="biz-btn-primary" onClick={saveEdit} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button className="biz-btn-secondary" onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Action bar */}
                <div className="bp-actions">
                  {!isEditing && (
                    <button className="biz-btn-secondary" onClick={() => startEdit(promo)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                      Editar
                    </button>
                  )}
                  <button className="biz-btn-secondary" onClick={() => toggleStatus(promo)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                      {promo.is_active ? 'pause_circle' : 'play_circle'}
                    </span>
                    {promo.is_active ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    className="biz-btn-secondary"
                    style={{ borderColor: 'rgba(255,90,0,.35)', color: 'var(--orange)' }}
                    onClick={() => setPreviewPromo(promo)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                    Ver promo
                  </button>
                  <button className="biz-btn-danger" onClick={() => handleDelete(promo)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewPromo && (
        <PromoDetailModal
          promo={previewPromo}
          location={location}
          onClose={() => setPreviewPromo(null)}
          onViewLocal={() => setPreviewPromo(null)}
        />
      )}
    </div>
  )
}
