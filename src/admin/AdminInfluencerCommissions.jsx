import React, { useEffect, useMemo, useState } from 'react'
import { DEFAULT_TIER_ENGINE_SETTINGS } from '../lib/influencerTierEngine'
import { useInfluencerStore } from '../stores/influencerStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../components/Toast'

const card = { background: 'var(--admin-panel)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--admin-line)' }
const btn = (bg, color) => ({ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: bg, color, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' })
const input = { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)', fontSize: '0.875rem', fontWeight: 500, outline: 'none', background: 'var(--admin-panel2)', color: '#fff' }
const label = { fontSize: '0.75rem', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem', display: 'block' }

const ACTIVATION_RULES = [
  { key: 'onboarding_completed', label: 'Onboarding completo' },
  { key: 'album_loaded', label: 'Cargo album' },
  { key: 'stickers_marked', label: 'Marco figuritas' },
  { key: 'reached_matches', label: 'Llego a matches' },
]

const CONVERSION_RULES = [
  { key: 'paid_plus', label: 'Pago Plus' },
  { key: 'paid_pro', label: 'Pago Pro' },
  { key: 'business_activated', label: 'Activo negocio' },
  { key: 'ecosystem_purchase', label: 'Compro en el ecosistema' },
]

const QUALITY_RULES = [
  { key: 'retained_30d', label: 'Retencion real' },
  { key: 'active_7d', label: 'Actividad 7 dias' },
  { key: 'no_fraud', label: 'Sin fraude' },
  { key: 'no_refund', label: 'Sin refunds' },
  { key: 'no_fast_churn', label: 'Sin churn inmediato' },
]

const buildEditableSettings = (settings) => ({
  activation_weight: String(settings.activation_weight),
  conversion_weight: String(settings.conversion_weight),
  quality_weight: String(settings.quality_weight),
  activation_rules: settings.activation_rules,
  conversion_rules: settings.conversion_rules,
  quality_rules: settings.quality_rules,
  tier_thresholds: {
    ...settings.tier_thresholds,
  },
  quality_minimums: {
    ...settings.quality_minimums,
  },
  downgrade_rules: {
    ...settings.downgrade_rules,
  },
  upgrade_rules: {
    ...settings.upgrade_rules,
  },
  tier_commissions: {
    community: { ...settings.tier_commissions.community },
    growth: { ...settings.tier_commissions.growth },
    partner: { ...settings.tier_commissions.partner },
  },
})

export default function AdminInfluencerCommissions() {
  const {
    tierEngineSettings,
    tierSnapshots,
    fetchTierEngineSettings,
    saveTierEngineSettings,
    recalculateTierSnapshots,
  } = useInfluencerStore()
  const profile = useAuthStore(state => state.profile)
  const toast = useToast()
  const [form, setForm] = useState(buildEditableSettings(DEFAULT_TIER_ENGINE_SETTINGS))
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    const load = async () => {
      const result = await fetchTierEngineSettings()
      const settings = result.data || tierEngineSettings || DEFAULT_TIER_ENGINE_SETTINGS
      setForm(buildEditableSettings(settings))
    }
    load()
  }, [])

  const totals = useMemo(() => {
    return tierSnapshots.reduce((acc, snapshot) => {
      acc.total += 1
      acc[snapshot.effective_tier] = (acc[snapshot.effective_tier] || 0) + 1
      return acc
    }, { total: 0, community: 0, growth: 0, partner: 0 })
  }, [tierSnapshots])

  const updateNested = (section, key, value) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }))
  }

  const toggleRule = (section, key) => {
    setForm((current) => {
      const exists = current[section].includes(key)
      return {
        ...current,
        [section]: exists
          ? current[section].filter(item => item !== key)
          : [...current[section], key],
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      activation_weight: Number(form.activation_weight || 0),
      conversion_weight: Number(form.conversion_weight || 0),
      quality_weight: Number(form.quality_weight || 0),
      activation_rules: form.activation_rules,
      conversion_rules: form.conversion_rules,
      quality_rules: form.quality_rules,
      tier_thresholds: {
        tier_1_min_activations: Number(form.tier_thresholds.tier_1_min_activations || 0),
        tier_1_min_conversions: Number(form.tier_thresholds.tier_1_min_conversions || 0),
        tier_2_min_activations: Number(form.tier_thresholds.tier_2_min_activations || 0),
        tier_2_min_conversions: Number(form.tier_thresholds.tier_2_min_conversions || 0),
        tier_3_min_activations: Number(form.tier_thresholds.tier_3_min_activations || 0),
        tier_3_min_conversions: Number(form.tier_thresholds.tier_3_min_conversions || 0),
      },
      quality_minimums: {
        community: Number(form.quality_minimums.community || 0),
        growth: Number(form.quality_minimums.growth || 0),
        partner: Number(form.quality_minimums.partner || 0),
      },
      downgrade_rules: {
        inactivity_days: Number(form.downgrade_rules.inactivity_days || 0),
        conversion_drop_pct: Number(form.downgrade_rules.conversion_drop_pct || 0),
        quality_drop_pct: Number(form.downgrade_rules.quality_drop_pct || 0),
      },
      upgrade_rules: {
        sustained_improvement_days: Number(form.upgrade_rules.sustained_improvement_days || 0),
        conversion_velocity_min: Number(form.upgrade_rules.conversion_velocity_min || 0),
        retention_quality_min: Number(form.upgrade_rules.retention_quality_min || 0),
      },
      tier_commissions: {
        community: {
          user_commission: Number(form.tier_commissions.community.user_commission || 0),
          business_commission: Number(form.tier_commissions.community.business_commission || 0),
        },
        growth: {
          user_commission: Number(form.tier_commissions.growth.user_commission || 0),
          business_commission: Number(form.tier_commissions.growth.business_commission || 0),
        },
        partner: {
          user_commission: Number(form.tier_commissions.partner.user_commission || 0),
          business_commission: Number(form.tier_commissions.partner.business_commission || 0),
        },
      },
    }

    const result = await saveTierEngineSettings(payload, profile?.id)
    setSaving(false)

    if (result.error) {
      toast.error(result.error.message || 'No se pudo guardar el Tier Engine')
      return
    }

    setRecalculating(true)
    await recalculateTierSnapshots()
    setRecalculating(false)
    setForm(buildEditableSettings(result.data))
    toast.success('Tier Engine actualizado')
  }

  const runRecalculate = async () => {
    setRecalculating(true)
    await recalculateTierSnapshots()
    setRecalculating(false)
    toast.success('Tiers recalculados')
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <section className="ag-hero" style={{ marginBottom: '2rem' }}>
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ influencers</div>
            <h1 className="ag-title">Tier Engine</h1>
            <p className="ag-desc" style={{ marginTop: '.8rem', maxWidth: '48rem' }}>
              Configura el score interno de influencers solo con activacion, conversion y calidad. Nada de followers, reach o impresiones.
            </p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">tune</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleSave} style={btn('var(--color-primary)', 'white')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>save</span>
            {saving ? 'Guardando...' : 'Guardar configuracion'}
          </button>
          <button onClick={runRecalculate} style={btn('var(--admin-panel2)', '#f5f5f5')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>autorenew</span>
            {recalculating ? 'Recalculando...' : 'Recalcular tiers'}
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Influencers', value: totals.total, color: '#6366f1', icon: 'group' },
          { label: 'Community', value: totals.community, color: '#f97316', icon: 'groups' },
          { label: 'Growth', value: totals.growth, color: '#38bdf8', icon: 'trending_up' },
          { label: 'Partner', value: totals.partner, color: '#22c55e', icon: 'handshake' },
        ].map((item) => (
          <div key={item.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: item.color }}>{item.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f5f5f5' }}>{item.value}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase' }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <section style={card}>
          <div className="admin-kicker">/ pesos</div>
          <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>InfluencerTierScore</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            <div>
              <label style={label}>Activation weight</label>
              <input type="number" step="0.05" style={input} value={form.activation_weight} onChange={(event) => setForm({ ...form, activation_weight: event.target.value })} />
            </div>
            <div>
              <label style={label}>Conversion weight</label>
              <input type="number" step="0.05" style={input} value={form.conversion_weight} onChange={(event) => setForm({ ...form, conversion_weight: event.target.value })} />
            </div>
            <div>
              <label style={label}>Quality weight</label>
              <input type="number" step="0.05" style={input} value={form.quality_weight} onChange={(event) => setForm({ ...form, quality_weight: event.target.value })} />
            </div>
          </div>
        </section>

        <section style={card}>
          <div className="admin-kicker">/ reglas</div>
          <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>Que cuenta de verdad</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            {[
              { title: 'Activacion valida', section: 'activation_rules', rules: ACTIVATION_RULES },
              { title: 'Conversion valida', section: 'conversion_rules', rules: CONVERSION_RULES },
              { title: 'Calidad valida', section: 'quality_rules', rules: QUALITY_RULES },
            ].map((group) => (
              <div key={group.title} style={{ border: '1px solid var(--admin-line)', padding: '1rem', background: 'var(--admin-panel2)' }}>
                <div style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5', marginBottom: '0.75rem' }}>{group.title}</div>
                <div style={{ display: 'grid', gap: '0.55rem' }}>
                  {group.rules.map((rule) => (
                    <label key={rule.key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#f5f5f5', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={form[group.section].includes(rule.key)}
                        onChange={() => toggleRule(group.section, rule.key)}
                      />
                      {rule.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <div className="admin-kicker">/ thresholds</div>
          <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>Tiers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            {[
              { key: 'community', title: 'Community', a: 'tier_1_min_activations', c: 'tier_1_min_conversions' },
              { key: 'growth', title: 'Growth', a: 'tier_2_min_activations', c: 'tier_2_min_conversions' },
              { key: 'partner', title: 'Partner', a: 'tier_3_min_activations', c: 'tier_3_min_conversions' },
            ].map((tier) => (
              <div key={tier.key} style={{ border: '1px solid var(--admin-line)', padding: '1rem', background: 'var(--admin-panel2)' }}>
                <div style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5', marginBottom: '0.75rem' }}>{tier.title}</div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={label}>Min activaciones</label>
                    <input type="number" style={input} value={form.tier_thresholds[tier.a]} onChange={(event) => updateNested('tier_thresholds', tier.a, event.target.value)} />
                  </div>
                  <div>
                    <label style={label}>Min conversiones</label>
                    <input type="number" style={input} value={form.tier_thresholds[tier.c]} onChange={(event) => updateNested('tier_thresholds', tier.c, event.target.value)} />
                  </div>
                  <div>
                    <label style={label}>Min calidad</label>
                    <input type="number" style={input} value={form.quality_minimums[tier.key]} onChange={(event) => updateNested('quality_minimums', tier.key, event.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <div className="admin-kicker">/ dinamica</div>
          <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>Upgrade / Downgrade</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
            <div style={{ border: '1px solid var(--admin-line)', padding: '1rem', background: 'var(--admin-panel2)' }}>
              <div style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5', marginBottom: '0.75rem' }}>Downgrade rules</div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label style={label}>Dias sin actividad</label>
                  <input type="number" style={input} value={form.downgrade_rules.inactivity_days} onChange={(event) => updateNested('downgrade_rules', 'inactivity_days', event.target.value)} />
                </div>
                <div>
                  <label style={label}>Caida conversion %</label>
                  <input type="number" style={input} value={form.downgrade_rules.conversion_drop_pct} onChange={(event) => updateNested('downgrade_rules', 'conversion_drop_pct', event.target.value)} />
                </div>
                <div>
                  <label style={label}>Caida calidad %</label>
                  <input type="number" style={input} value={form.downgrade_rules.quality_drop_pct} onChange={(event) => updateNested('downgrade_rules', 'quality_drop_pct', event.target.value)} />
                </div>
              </div>
            </div>
            <div style={{ border: '1px solid var(--admin-line)', padding: '1rem', background: 'var(--admin-panel2)' }}>
              <div style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5', marginBottom: '0.75rem' }}>Upgrade rules</div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label style={label}>Mejora sostenida dias</label>
                  <input type="number" style={input} value={form.upgrade_rules.sustained_improvement_days} onChange={(event) => updateNested('upgrade_rules', 'sustained_improvement_days', event.target.value)} />
                </div>
                <div>
                  <label style={label}>Conversion velocity min</label>
                  <input type="number" style={input} value={form.upgrade_rules.conversion_velocity_min} onChange={(event) => updateNested('upgrade_rules', 'conversion_velocity_min', event.target.value)} />
                </div>
                <div>
                  <label style={label}>Retention quality min</label>
                  <input type="number" style={input} value={form.upgrade_rules.retention_quality_min} onChange={(event) => updateNested('upgrade_rules', 'retention_quality_min', event.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={card}>
          <div className="admin-kicker">/ comisiones</div>
          <h2 style={{ margin: '.45rem 0 1rem', font: "italic 900 2rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5' }}>Por tier</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            {['community', 'growth', 'partner'].map((tier) => (
              <div key={tier} style={{ border: '1px solid var(--admin-line)', padding: '1rem', background: 'var(--admin-panel2)' }}>
                <div style={{ font: "900 .78rem 'Barlow Condensed'", textTransform: 'uppercase', color: '#f5f5f5', marginBottom: '0.75rem' }}>{tier}</div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={label}>User commission</label>
                    <input type="number" step="0.1" style={input} value={form.tier_commissions[tier].user_commission} onChange={(event) => setForm((current) => ({
                      ...current,
                      tier_commissions: {
                        ...current.tier_commissions,
                        [tier]: {
                          ...current.tier_commissions[tier],
                          user_commission: event.target.value,
                        },
                      },
                    }))} />
                  </div>
                  <div>
                    <label style={label}>Business commission</label>
                    <input type="number" step="0.1" style={input} value={form.tier_commissions[tier].business_commission} onChange={(event) => setForm((current) => ({
                      ...current,
                      tier_commissions: {
                        ...current.tier_commissions,
                        [tier]: {
                          ...current.tier_commissions[tier],
                          business_commission: event.target.value,
                        },
                      },
                    }))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
