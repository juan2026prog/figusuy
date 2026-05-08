import React, { useEffect, useMemo, useState } from 'react'
import { getHealthMeta, getTierMeta } from '../lib/influencerDashboard'
import { useInfluencerStore } from '../stores/influencerStore'
import { useToast } from '../components/Toast'

const card = { background: 'var(--admin-panel)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--admin-line)' }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' })
const input = { width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)', fontSize: '0.875rem', outline: 'none', background: '#0d0d0d', color: '#fff' }
const label = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const CATEGORIES = ['gaming', 'futbol', 'fútbol', 'collectibles', 'lifestyle', 'anime', 'local', 'creator']
const STATUSES = ['activo', 'pausado', 'archivado', 'bloqueado']
const TIER_OPTIONS = [
  { value: 'community', label: 'Community' },
  { value: 'growth', label: 'Growth' },
  { value: 'partner', label: 'Partner' },
]

const categoryColors = {
  gaming: { bg: '#ede9fe', color: '#7c3aed' },
  futbol: { bg: '#dcfce7', color: '#16a34a' },
  'fútbol': { bg: '#dcfce7', color: '#16a34a' },
  collectibles: { bg: '#fef3c7', color: '#d97706' },
  lifestyle: { bg: '#fce7f3', color: '#db2777' },
  anime: { bg: '#e0e7ff', color: '#4f46e5' },
  local: { bg: '#f0fdfa', color: '#0d9488' },
  creator: { bg: '#fff7ed', color: '#ea580c' },
}

const emptyTierState = {
  effective_tier: 'community',
  computed_tier: 'community',
  activation_count: 0,
  conversion_count: 0,
  quality_score: 0,
  tier_score: 0,
  performance_health: 'watch',
  manual_override_tier: null,
  lock_auto_upgrade: false,
  lock_auto_downgrade: false,
  upgrade_opportunity: 'Sin datos suficientes todavia.',
  downgrade_risk: 'Sin riesgo relevante.',
}

export default function AdminInfluencers() {
  const {
    affiliates,
    tierSnapshots,
    fetchInfluencers,
    createInfluencer,
    updateInfluencer,
    recalculateTierSnapshots,
    updateTierSnapshotControls,
    restoreAutoTier,
  } = useInfluencerStore()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const [refreshingTiers, setRefreshingTiers] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', handle: '', category: 'creator', status: 'activo',
    avatar_url: '', notes: '', contact_email: '', contact_phone: '',
  })
  const [tierForm, setTierForm] = useState({
    manual_override_tier: '',
    lock_auto_upgrade: false,
    lock_auto_downgrade: false,
  })

  useEffect(() => {
    const load = async () => {
      await fetchInfluencers()
      setRefreshingTiers(true)
      await recalculateTierSnapshots()
      setRefreshingTiers(false)
    }
    load()
  }, [])

  const snapshotMap = useMemo(
    () => Object.fromEntries(tierSnapshots.map(item => [item.affiliate_id, item])),
    [tierSnapshots]
  )

  const resetForm = () => {
    setForm({
      name: '', handle: '', category: 'creator', status: 'activo',
      avatar_url: '', notes: '', contact_email: '', contact_phone: '',
    })
    setTierForm({
      manual_override_tier: '',
      lock_auto_upgrade: false,
      lock_auto_downgrade: false,
    })
    setEditing(null)
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (affiliate) => {
    const snapshot = snapshotMap[affiliate.id] || emptyTierState
    setForm({
      name: affiliate.name,
      handle: affiliate.handle,
      category: affiliate.category || 'creator',
      status: affiliate.status || 'activo',
      avatar_url: affiliate.avatar_url || '',
      notes: affiliate.notes || '',
      contact_email: affiliate.contact_email || '',
      contact_phone: affiliate.contact_phone || '',
    })
    setTierForm({
      manual_override_tier: snapshot.manual_override_tier || '',
      lock_auto_upgrade: Boolean(snapshot.lock_auto_upgrade),
      lock_auto_downgrade: Boolean(snapshot.lock_auto_downgrade),
    })
    setEditing(affiliate.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.handle) return
    if (editing) {
      await updateInfluencer(editing, form)
      await updateTierSnapshotControls(editing, {
        manual_override_tier: tierForm.manual_override_tier || null,
        lock_auto_upgrade: tierForm.lock_auto_upgrade,
        lock_auto_downgrade: tierForm.lock_auto_downgrade,
      })
      toast.success('Influencer actualizado')
    } else {
      const result = await createInfluencer(form)
      if (!result.error && result.data) {
        await recalculateTierSnapshots([result.data.id])
        toast.success('Influencer creado')
      }
    }
    setShowModal(false)
    resetForm()
  }

  const handleRecalculate = async (affiliateId = null) => {
    setRefreshingTiers(true)
    await recalculateTierSnapshots(affiliateId ? [affiliateId] : null)
    setRefreshingTiers(false)
    toast.success(affiliateId ? 'Tier recalculado' : 'Tier engine actualizado')
  }

  const handleDelete = (affiliate) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Influencer',
      message: `¿Estás seguro de eliminar a ${affiliate.name}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        const { error } = await useInfluencerStore.getState().deleteInfluencer(affiliate.id)
        if (!error) {
          toast.success('Influencer eliminado')
        } else {
          toast.error('Error al eliminar influencer')
        }
      }
    })
  }

  const filtered = affiliates
    .filter(item => filter === 'all' || item.status === filter)
    .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.handle.toLowerCase().includes(search.toLowerCase()))

  const rankedRows = filtered.map((affiliate) => ({
    affiliate,
    snapshot: snapshotMap[affiliate.id] || emptyTierState,
  }))

  const tierTotals = tierSnapshots.reduce((acc, snapshot) => {
    acc[snapshot.effective_tier] = (acc[snapshot.effective_tier] || 0) + 1
    return acc
  }, { community: 0, growth: 0, partner: 0 })

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ influencer tier engine</div>
            <h1 className="ag-title">Influencers</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>
              Ranking operativo basado solo en activacion, conversion y calidad. Sin followers, sin alcance, sin vanity metrics.
            </p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={openCreate} style={btn('var(--color-primary)', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>person_add</span>
            Nuevo Influencer
          </button>
          <button onClick={() => handleRecalculate()} style={btn('var(--admin-panel2)', '#f5f5f5')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>autorenew</span>
            {refreshingTiers ? 'Recalculando...' : 'Recalcular tiers'}
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: affiliates.length, color: '#6366f1', icon: 'group' },
          { label: 'Community', value: tierTotals.community, color: '#f97316', icon: 'groups' },
          { label: 'Growth', value: tierTotals.growth, color: '#38bdf8', icon: 'trending_up' },
          { label: 'Partner', value: tierTotals.partner, color: '#22c55e', icon: 'handshake' },
        ].map((item) => (
          <div key={item.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: item.color }}>{item.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f5f5f5' }}>{item.value}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase' }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ key: 'all', label: 'Todos' }, ...STATUSES.map(item => ({ key: item, label: item.charAt(0).toUpperCase() + item.slice(1) }))].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '2rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === item.key ? 'var(--color-primary)' : '#fff',
              color: filter === item.key ? 'white' : 'var(--admin-muted)',
              border: filter === item.key ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
            }}
          >
            {item.label}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <input
            placeholder="Buscar por nombre o @handle..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ ...input, maxWidth: '20rem' }}
          />
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: 'var(--admin-panel2)', borderBottom: '1px solid #e2e8f0' }}>
                {['Influencer', 'Tier actual', 'Performance real', 'Override', 'Contacto', 'Acciones'].map((header) => (
                  <th key={header} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--admin-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedRows.map(({ affiliate, snapshot }) => {
                const tierMeta = getTierMeta(snapshot.effective_tier)
                const healthMeta = getHealthMeta(snapshot.performance_health)

                return (
                  <tr
                    key={affiliate.id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--admin-panel2)' }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '0.5rem',
                          background: categoryColors[affiliate.category]?.bg || 'var(--admin-panel2)',
                          color: categoryColors[affiliate.category]?.color || 'var(--admin-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          overflow: 'hidden',
                        }}>
                          {affiliate.avatar_url
                            ? <img src={affiliate.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : affiliate.name?.[0]?.toUpperCase()
                          }
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#f5f5f5', margin: 0 }}>{affiliate.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', margin: 0 }}>@{affiliate.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'grid', gap: '0.4rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', width: 'fit-content', padding: '0.28rem 0.6rem', borderRadius: '999px', background: tierMeta.bg, color: tierMeta.color, fontWeight: 800 }}>
                          <span>{tierMeta.tier}</span>
                          <span>{tierMeta.label}</span>
                        </div>
                        <div style={{ color: '#f5f5f5', fontWeight: 800 }}>Score {Number(snapshot.tier_score || 0).toFixed(1)}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content', padding: '0.2rem 0.55rem', borderRadius: '999px', background: healthMeta.bg, color: healthMeta.color, fontWeight: 700 }}>
                          {healthMeta.label}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'grid', gap: '0.3rem' }}>
                        <div style={{ color: '#f5f5f5', fontWeight: 700 }}>Activaciones {snapshot.activation_count || 0}</div>
                        <div style={{ color: '#f5f5f5', fontWeight: 700 }}>Conversiones {snapshot.conversion_count || 0}</div>
                        <div style={{ color: '#f5f5f5', fontWeight: 700 }}>Calidad {Number(snapshot.quality_score || 0).toFixed(1)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                          Comision {Number(snapshot.current_user_commission || 0).toFixed(1)}% usuarios Â· {Number(snapshot.current_business_commission || 0).toFixed(1)}% negocios
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        <div style={{ fontWeight: 700, color: snapshot.manual_override_tier ? '#22c55e' : 'var(--admin-muted)' }}>
                          {snapshot.manual_override_tier ? `Manual: ${getTierMeta(snapshot.manual_override_tier).label}` : 'Auto-tier activo'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                          {snapshot.lock_auto_upgrade ? 'Upgrade bloqueado' : 'Upgrade automatico'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                          {snapshot.lock_auto_downgrade ? 'Downgrade bloqueado' : 'Downgrade automatico'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                      {affiliate.contact_email || affiliate.contact_phone || 'â€”'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <button onClick={() => openEdit(affiliate)} style={{ ...btn('var(--admin-panel2)', 'var(--admin-muted)'), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                        </button>
                        <button onClick={() => handleRecalculate(affiliate.id)} style={{ ...btn('#eff6ff', '#0369a1'), padding: '0.25rem 0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>autorenew</span>
                        </button>
                        {affiliate.status === 'activo' && (
                          <button onClick={() => updateInfluencer(affiliate.id, { status: 'pausado' })} style={{ ...btn('#fef3c7', '#d97706'), padding: '0.25rem 0.5rem' }} title="Pausar">
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pause</span>
                          </button>
                        )}
                        {(affiliate.status === 'pausado' || affiliate.status === 'bloqueado') && (
                          <button onClick={() => updateInfluencer(affiliate.id, { status: 'activo' })} style={{ ...btn('#dcfce7', '#16a34a'), padding: '0.25rem 0.5rem' }} title="Activar">
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>play_arrow</span>
                          </button>
                        )}
                        {affiliate.status !== 'bloqueado' && (
                          <button onClick={() => updateInfluencer(affiliate.id, { status: 'bloqueado' })} style={{ ...btn('#fef2f2', '#ef4444'), padding: '0.25rem 0.5rem' }} title="Bloquear">
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>block</span>
                          </button>
                        )}
                        <button onClick={() => handleDelete(affiliate)} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), padding: '0.25rem 0.5rem' }} title="Eliminar">
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rankedRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-muted)' }}>
                    No hay influencers cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ ...card, width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f5f5f5' }}>
                {editing ? 'Editar influencer' : 'Nuevo influencer'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={label}>Nombre *</label>
                <input style={input} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div>
                <label style={label}>@Handle *</label>
                <input style={input} value={form.handle} onChange={(event) => setForm({ ...form, handle: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
              </div>
              <div>
                <label style={label}>Categoria</label>
                <select style={input} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Estado</label>
                <select style={input} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Email</label>
                <input style={input} value={form.contact_email} onChange={(event) => setForm({ ...form, contact_email: event.target.value })} />
              </div>
              <div>
                <label style={label}>Telefono</label>
                <input style={input} value={form.contact_phone} onChange={(event) => setForm({ ...form, contact_phone: event.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Avatar URL</label>
                <input style={input} value={form.avatar_url} onChange={(event) => setForm({ ...form, avatar_url: event.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Notas internas</label>
                <textarea style={{ ...input, minHeight: '4rem', resize: 'vertical' }} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
            </div>

            {editing && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--admin-line)' }}>
                <div className="admin-kicker">/ override manual</div>
                <h3 style={{ margin: '.45rem 0 1rem', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>Tier Control</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={label}>Tier manual</label>
                    <select style={input} value={tierForm.manual_override_tier} onChange={(event) => setTierForm({ ...tierForm, manual_override_tier: event.target.value })}>
                      <option value="">Sin override</option>
                      {TIER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', alignContent: 'start', gap: '0.65rem', paddingTop: '1.45rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#f5f5f5', fontWeight: 600 }}>
                      <input type="checkbox" checked={tierForm.lock_auto_upgrade} onChange={(event) => setTierForm({ ...tierForm, lock_auto_upgrade: event.target.checked })} />
                      Bloquear auto-upgrade
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#f5f5f5', fontWeight: 600 }}>
                      <input type="checkbox" checked={tierForm.lock_auto_downgrade} onChange={(event) => setTierForm({ ...tierForm, lock_auto_downgrade: event.target.checked })} />
                      Bloquear auto-downgrade
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.35rem', color: 'var(--admin-muted)', fontSize: '0.8125rem' }}>
                  <div>{snapshotMap[editing]?.upgrade_opportunity || emptyTierState.upgrade_opportunity}</div>
                  <div>{snapshotMap[editing]?.downgrade_risk || emptyTierState.downgrade_risk}</div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={async () => {
                      await restoreAutoTier(editing)
                      setTierForm({
                        manual_override_tier: '',
                        lock_auto_upgrade: false,
                        lock_auto_downgrade: false,
                      })
                      toast.success('Auto-tier restaurado')
                    }}
                    style={btn('var(--admin-panel2)', 'var(--admin-muted)')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>restart_alt</span>
                    Restaurar auto-tier
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={btn('var(--admin-panel2)', 'var(--admin-muted)')}>Cancelar</button>
              <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{editing ? 'save' : 'person_add'}</span>
                {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div style={{ background: "var(--admin-panel)", borderRadius: '1rem', width: '100%', maxWidth: '24rem', padding: '1.5rem', border: "1px solid var(--admin-line)" }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: "#f5f5f5", marginBottom: '0.5rem' }}>{confirmConfig.title}</h2>
            <p style={{ fontSize: '0.875rem', color: "var(--admin-muted)", marginBottom: '1.5rem', lineHeight: 1.5 }}>{confirmConfig.message}</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { confirmConfig.onConfirm(); setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null }) }} style={{ ...btn('#ef4444', 'white'), flex: 1, justifyContent: 'center' }}>Confirmar</button>
              <button onClick={() => setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null })} style={{ ...btn("var(--admin-panel2)", "var(--admin-muted)"), flex: 1, justifyContent: 'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
