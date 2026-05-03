import React, { useEffect, useState } from 'react'
import { useAffiliateStore } from '../stores/affiliateStore'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.15s' })
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)", fontSize: '0.875rem', fontWeight: 500, outline: 'none', background: "var(--admin-panel2)" }
const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const statusColors = {
  activo: { bg: '#dcfce7', color: '#16a34a', icon: 'play_circle' },
  pausado: { bg: '#fef3c7', color: '#d97706', icon: 'pause_circle' },
  cerrada: { bg: '#fee2e2', color: '#dc2626', icon: 'cancel' },
}

export default function AdminAffiliateCampaigns() {
  const { campaigns, affiliates, fetchCampaigns, fetchAffiliates, createCampaign, updateCampaign, duplicateCampaign, loading } = useAffiliateStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    affiliate_id: '', code: '', slug: '', status: 'activo',
    starts_at: '', ends_at: '', max_uses: '', max_uses_per_user: '1',
    valid_plans: '', min_purchase_amount: '0'
  })

  useEffect(() => { fetchCampaigns(); fetchAffiliates() }, [])

  const resetForm = () => {
    setForm({ affiliate_id: '', code: '', slug: '', status: 'activo', starts_at: '', ends_at: '', max_uses: '', max_uses_per_user: '1', valid_plans: '', min_purchase_amount: '0' })
    setEditing(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (c) => {
    setForm({
      affiliate_id: c.affiliate_id, code: c.code, slug: c.slug, status: c.status,
      starts_at: c.starts_at ? c.starts_at.split('T')[0] : '',
      ends_at: c.ends_at ? c.ends_at.split('T')[0] : '',
      max_uses: c.max_uses || '', max_uses_per_user: c.max_uses_per_user || '1',
      valid_plans: (c.valid_plans || []).join(', '),
      min_purchase_amount: c.min_purchase_amount || '0'
    })
    setEditing(c.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.affiliate_id || !form.code || !form.slug) return
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      slug: form.slug.toLowerCase(),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      max_uses_per_user: parseInt(form.max_uses_per_user) || 1,
      valid_plans: form.valid_plans ? form.valid_plans.split(',').map(s => s.trim()).filter(Boolean) : [],
      min_purchase_amount: parseFloat(form.min_purchase_amount) || 0,
      starts_at: form.starts_at || new Date().toISOString(),
      ends_at: form.ends_at || null,
    }
    if (editing) {
      await updateCampaign(editing, payload)
    } else {
      await createCampaign(payload)
    }
    setShowModal(false)
    resetForm()
  }

  const handleCodeChange = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9_]/g, '')
    setForm({ ...form, code: clean, slug: clean.toLowerCase() })
  }

  const handleDuplicate = async (id) => {
    await duplicateCampaign(id)
    fetchCampaigns()
  }

  const filtered = campaigns.filter(c => filter === 'all' || c.status === filter)

  const activeAffiliates = affiliates.filter(a => a.status === 'activo')

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
            <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ modulo operativo</div>
            <h1 className="ag-title">Campañas de Afiliados</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>Cada influencer tiene su propia campaña con código, link, reglas y tracking.</p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">campaign</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><button onClick={openCreate} style={btn('var(--color-primary)', 'white')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add_circle</span>
          Nueva Campaña
        </button></div>
      </section>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Campañas', value: campaigns.length, icon: 'campaign', color: '#6366f1' },
          { label: 'Activas', value: campaigns.filter(c => c.status === 'activo').length, icon: 'play_circle', color: '#16a34a' },
          { label: 'Clicks Totales', value: campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0), icon: 'ads_click', color: '#0ea5e9' },
          { label: 'Conversiones', value: campaigns.reduce((s, c) => s + (c.total_conversions || 0), 0), icon: 'shopping_cart', color: '#ea580c' },
          { label: 'Revenue Total', value: '$' + campaigns.reduce((s, c) => s + Number(c.total_revenue || 0), 0).toFixed(0), icon: 'attach_money', color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>{s.value}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[{ key: 'all', label: 'Todas' }, { key: 'activo', label: 'Activas' }, { key: 'pausado', label: 'Pausadas' }, { key: 'cerrada', label: 'Cerradas' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.4rem 0.875rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            background: filter === f.key ? 'var(--color-primary)' : '#fff',
            color: filter === f.key ? 'white' : "var(--admin-muted)",
            border: filter === f.key ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
            transition: 'all 0.2s'
          }}>{f.label}</button>
        ))}
      </div>

      {/* Campaign Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))', gap: '1rem' }}>
        {filtered.map(c => {
          const aff = c.affiliates || {}
          const st = statusColors[c.status] || statusColors.cerrada
          return (
            <div key={c.id} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
              {/* Campaign Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: '0.875rem', flexShrink: 0
                  }}>
                    {aff.avatar_url ? <img src={aff.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '0.5rem', objectFit: 'cover' }} /> : (aff.name || 'A')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: "#f5f5f5", margin: 0, fontSize: '0.9375rem', lineHeight: 1.2 }}>{aff.name || 'Afiliado'}</p>
                    <p style={{ fontSize: '0.75rem', color: "var(--admin-muted)", margin: 0 }}>@{aff.handle || '...'}</p>
                  </div>
                </div>
                <span style={{
                  padding: '0.2rem 0.625rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: 700,
                  background: st.bg, color: st.color, display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{st.icon}</span>
                  {c.status}
                </span>
              </div>

              {/* Code + Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ background: "var(--admin-panel2)", padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase', marginBottom: '0.125rem' }}>Código</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#ea580c', fontFamily: 'monospace' }}>{c.code}</p>
                </div>
                <div style={{ background: "var(--admin-panel2)", padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: "1px solid var(--admin-line)" }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase', marginBottom: '0.125rem' }}>Link</p>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0ea5e9', wordBreak: 'break-all' }}>/r/{c.slug}</p>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f0f9ff', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#0369a1' }}>{c.total_clicks || 0}</p>
                  <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>Clicks</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: "rgba(249, 115, 22, 0.1)", borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#ea580c' }}>{c.total_conversions || 0}</p>
                  <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>Conv.</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#16a34a' }}>${Number(c.total_revenue || 0).toFixed(0)}</p>
                  <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: "var(--admin-muted)", textTransform: 'uppercase' }}>Revenue</p>
                </div>
              </div>

              {/* Vigencia */}
              <div style={{ fontSize: '0.75rem', color: "var(--admin-muted)", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>calendar_today</span>
                {c.starts_at ? new Date(c.starts_at).toLocaleDateString('es-UY') : 'Sin inicio'}
                {' → '}
                {c.ends_at ? new Date(c.ends_at).toLocaleDateString('es-UY') : 'Sin fin'}
                {c.max_uses && <span style={{ marginLeft: 'auto', fontWeight: 700 }}>Máx: {c.max_uses} usos</span>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <button onClick={() => openEdit(c)} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), flex: 1, justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span> Editar
                </button>
                <button onClick={() => handleDuplicate(c.id)} style={{ ...btn('#f0f9ff', '#0369a1'), padding: '0.375rem 0.5rem' }} title="Duplicar">
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>content_copy</span>
                </button>
                {c.status === 'activo' && (
                  <button onClick={() => updateCampaign(c.id, { status: 'pausado' })} style={{ ...btn('#fef3c7', '#d97706'), padding: '0.375rem 0.5rem' }} title="Pausar">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pause</span>
                  </button>
                )}
                {c.status === 'pausado' && (
                  <button onClick={() => updateCampaign(c.id, { status: 'activo' })} style={{ ...btn('#dcfce7', '#16a34a'), padding: '0.375rem 0.5rem' }} title="Activar">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>play_arrow</span>
                  </button>
                )}
                {c.status !== 'cerrada' && (
                  <button onClick={() => updateCampaign(c.id, { status: 'cerrada' })} style={{ ...btn('#fee2e2', '#dc2626'), padding: '0.375rem 0.5rem' }} title="Cerrar">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cancel</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', ...card, textAlign: 'center', padding: '3rem', color: "var(--admin-muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.3, display: 'block', marginBottom: '0.5rem' }}>campaign</span>
            No hay campañas {filter !== 'all' ? `con estado "${filter}"` : ''}.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '36rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: "#f5f5f5" }}>
                {editing ? 'Editar Campaña' : 'Nueva Campaña'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: "var(--admin-muted)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Afiliado *</label>
                <select style={inputStyle} value={form.affiliate_id} onChange={e => setForm({ ...form, affiliate_id: e.target.value })}>
                  <option value="">Seleccionar afiliado...</option>
                  {activeAffiliates.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (@{a.handle})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Código * (auto: mayúsculas)</label>
                <input style={inputStyle} value={form.code} onChange={e => handleCodeChange(e.target.value)} placeholder="FIGUZZ" />
              </div>
              <div>
                <label style={labelStyle}>Slug (link) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.75rem', color: "var(--admin-muted)", fontWeight: 600, whiteSpace: 'nowrap' }}>/r/</span>
                  <input style={inputStyle} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })} placeholder="figuzz" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Fecha inicio</label>
                <input type="date" style={inputStyle} value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Fecha fin</label>
                <input type="date" style={inputStyle} value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Máximo usos</label>
                <input type="number" style={inputStyle} value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Sin límite" />
              </div>
              <div>
                <label style={labelStyle}>Usos por usuario</label>
                <input type="number" style={inputStyle} value={form.max_uses_per_user} onChange={e => setForm({ ...form, max_uses_per_user: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Planes válidos (separar con coma)</label>
                <input style={inputStyle} value={form.valid_plans} onChange={e => setForm({ ...form, valid_plans: e.target.value })} placeholder="plus, pro, turbo (vacío = todos)" />
              </div>
              <div>
                <label style={labelStyle}>Compra mínima ($)</label>
                <input type="number" style={inputStyle} value={form.min_purchase_amount} onChange={e => setForm({ ...form, min_purchase_amount: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={btn("var(--admin-panel2)", "var(--admin-muted)")}>Cancelar</button>
              <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{editing ? 'save' : 'add_circle'}</span>
                {editing ? 'Guardar' : 'Crear Campaña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
