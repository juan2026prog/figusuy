import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }
const input = { width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc' }

export default function AdminSettings() {
  const { settings, fetchSettings, updateSetting, users, fetchUsers, logAction } = useAdminStore()
  const { profile } = useAuthStore()
  const [editKey, setEditKey] = useState(null)
  const [editVal, setEditVal] = useState('')

  // Checklist images toggle
  const [checklistImages, setChecklistImages] = useState(true)

  // Manual plan change
  const [planSearch, setPlanSearch] = useState('')
  const [planTarget, setPlanTarget] = useState(null) // { type: 'user'|'business', id, name }
  const [planValue, setPlanValue] = useState('gratis')
  const [planSaving, setPlanSaving] = useState(false)
  const [planMsg, setPlanMsg] = useState('')

  // Premium free trial
  const [freeMode, setFreeMode] = useState('disabled') // 'disabled' | 'days' | 'everyone'
  const [freeDays, setFreeDays] = useState(7)
  const [freeSaving, setFreeSaving] = useState(false)

  // Location search for business plan
  const [locations, setLocations] = useState([])
  const [locSearch, setLocSearch] = useState('')

  useEffect(() => {
    fetchSettings()
    fetchUsers()
    loadLocationsList()
    loadSpecialSettings()
  }, [])

  const loadLocationsList = async () => {
    const { data } = await supabase.from('locations').select('id, name, owner_id').order('name')
    setLocations(data || [])
  }

  const loadSpecialSettings = async () => {
    const { data } = await supabase.from('app_settings').select('key, value').in('key', ['checklist_images_enabled', 'premium_free_mode', 'premium_free_days'])
    ;(data || []).forEach(s => {
      if (s.key === 'checklist_images_enabled') setChecklistImages(s.value === true || s.value === 'true')
      if (s.key === 'premium_free_mode') setFreeMode(s.value || 'disabled')
      if (s.key === 'premium_free_days') setFreeDays(Number(s.value) || 7)
    })
  }

  // ======== CHECKLIST IMAGES ========
  const toggleChecklistImages = async () => {
    const newVal = !checklistImages
    setChecklistImages(newVal)
    await supabase.from('app_settings').upsert({ key: 'checklist_images_enabled', value: JSON.stringify(newVal), category: 'general', updated_by: profile?.id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    logAction(profile?.id, 'TOGGLE_CHECKLIST_IMAGES', 'setting', 'checklist_images_enabled', { enabled: newVal })
  }

  // ======== MANUAL PLAN CHANGE ========
  const matchedUsers = users.filter(u =>
    planSearch.length > 1 && (u.name?.toLowerCase().includes(planSearch.toLowerCase()) || u.email?.toLowerCase().includes(planSearch.toLowerCase()))
  ).slice(0, 8)

  const matchedLocations = locations.filter(l =>
    locSearch.length > 1 && l.name?.toLowerCase().includes(locSearch.toLowerCase())
  ).slice(0, 8)

  const handlePlanChange = async () => {
    if (!planTarget) return
    setPlanSaving(true)
    setPlanMsg('')

    try {
      if (planTarget.type === 'user') {
        // Update plan_name on profiles or subscription
        await supabase.from('profiles').update({
          plan_name: planValue,
          is_premium: planValue !== 'gratis'
        }).eq('id', planTarget.id)

        logAction(profile?.id, 'MANUAL_PLAN_CHANGE', 'user', planTarget.id, { plan: planValue, target_name: planTarget.name })
      } else {
        // Update location's plan
        await supabase.from('locations').update({
          plan: planValue
        }).eq('id', planTarget.id)

        logAction(profile?.id, 'MANUAL_PLAN_CHANGE', 'location', planTarget.id, { plan: planValue, target_name: planTarget.name })
      }

      setPlanMsg(`✅ Plan de "${planTarget.name}" cambiado a ${planValue}`)
      setPlanTarget(null)
      setPlanSearch('')
      setLocSearch('')
    } catch (e) {
      setPlanMsg(`❌ Error: ${e.message}`)
    } finally {
      setPlanSaving(false)
    }
  }

  // ======== PREMIUM FREE MODE ========
  const saveFreeMode = async () => {
    setFreeSaving(true)
    await supabase.from('app_settings').upsert([
      { key: 'premium_free_mode', value: JSON.stringify(freeMode), category: 'monetization', updated_by: profile?.id, updated_at: new Date().toISOString() },
      { key: 'premium_free_days', value: JSON.stringify(freeDays), category: 'monetization', updated_by: profile?.id, updated_at: new Date().toISOString() },
    ], { onConflict: 'key' })
    logAction(profile?.id, 'UPDATE_FREE_MODE', 'setting', 'premium_free_mode', { mode: freeMode, days: freeDays })
    setFreeSaving(false)
  }

  // ======== GENERIC SETTINGS ========
  const grouped = settings.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  const categoryLabels = { general: '⚙️ General', algorithm: '🧠 Algoritmo', limits: '🔒 Límites', safety: '🛡️ Seguridad', social: '🌐 Social', monetization: '💰 Monetización' }

  const handleSave = async (key) => {
    let val = editVal
    try { val = JSON.parse(editVal) } catch {}
    await updateSetting(key, val, profile?.id)
    setEditKey(null)
  }

  const userPlans = ['gratis', 'plus', 'pro']
  const businessPlans = ['gratis', 'turbo', 'dominio']

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>settings</span>
          Configuración General
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Controles de plataforma, planes, modos premium y más.
        </p>
      </div>

      {/* ========== 1. CHECKLIST IMAGES ========== */}
      <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>image</span>
              Checklist con Imágenes
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {checklistImages
                ? 'Los usuarios ven imágenes en sus checklists de figuritas.'
                : 'Las imágenes están deshabilitadas — se muestran solo números/nombres.'}
            </p>
          </div>
          <button
            onClick={toggleChecklistImages}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: checklistImages ? '#10b981' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>
              {checklistImages ? 'toggle_on' : 'toggle_off'}
            </span>
            {checklistImages ? 'ACTIVO' : 'DESACTIVADO'}
          </button>
        </div>
      </div>

      {/* ========== 2. MANUAL PLAN CHANGE ========== */}
      <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '4px solid #ea580c' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>swap_horiz</span>
          Cambiar Plan Manualmente
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* User Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>👤 Buscar Usuario</label>
            <input type="text" placeholder="Nombre o email..." value={planSearch}
              onChange={e => { setPlanSearch(e.target.value); setPlanTarget(null); setPlanMsg('') }}
              style={input} />
            {planSearch.length > 1 && matchedUsers.length > 0 && !planTarget && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', maxHeight: '10rem', overflowY: 'auto', marginTop: '0.25rem', background: 'white' }}>
                {matchedUsers.map(u => (
                  <div key={u.id} onClick={() => { setPlanTarget({ type: 'user', id: u.id, name: u.name || u.email }); setPlanSearch(u.name + ' — ' + u.email); setPlanValue(u.plan_name || 'gratis') }}
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{u.name} — <span style={{ color: '#94a3b8' }}>{u.email}</span></span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '0.125rem 0.375rem', borderRadius: '0.375rem' }}>{u.plan_name || 'gratis'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>🏪 Buscar Tienda/Local</label>
            <input type="text" placeholder="Nombre del local..." value={locSearch}
              onChange={e => { setLocSearch(e.target.value); setPlanTarget(null); setPlanMsg('') }}
              style={input} />
            {locSearch.length > 1 && matchedLocations.length > 0 && !planTarget && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', maxHeight: '10rem', overflowY: 'auto', marginTop: '0.25rem', background: 'white' }}>
                {matchedLocations.map(l => (
                  <div key={l.id} onClick={() => { setLocSearch(l.name); setPlanTarget({ type: 'business', id: l.id, name: l.name }); setPlanValue(l.plan || 'gratis') }}
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9' }}>
                    {l.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {planTarget && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>{planTarget.type === 'user' ? '👤 Usuario:' : '🏪 Local:'}</span>{' '}
              <strong style={{ color: '#0f172a' }}>{planTarget.name}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {(planTarget.type === 'user' ? userPlans : businessPlans).map(p => (
                <button key={p} onClick={() => setPlanValue(p)} style={{
                  flex: 1, padding: '0.625rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer',
                  textTransform: 'capitalize',
                  border: planValue === p ? '2px solid #ea580c' : '1px solid #e2e8f0',
                  background: planValue === p ? '#fff7ed' : 'white',
                  color: planValue === p ? '#ea580c' : '#64748b'
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handlePlanChange} disabled={planSaving} style={{
                background: '#ea580c', color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', opacity: planSaving ? 0.5 : 1
              }}>{planSaving ? '⏳ Cambiando...' : '💾 Confirmar Cambio'}</button>
              <button onClick={() => { setPlanTarget(null); setPlanSearch(''); setLocSearch('') }} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {planMsg && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: planMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{planMsg}</p>
        )}
      </div>

      {/* ========== 3. PREMIUM FREE MODE ========== */}
      <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#10b981' }}>redeem</span>
          Modo Premium Gratuito
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
          Habilita las funciones premium para todos los usuarios de forma gratuita — útil para lanzamientos, betas o promociones.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { key: 'disabled', label: 'Desactivado', icon: 'lock', desc: 'Los planes premium funcionan con cobro normal' },
            { key: 'days', label: 'Por Días', icon: 'timer', desc: 'Premium gratis por un tiempo determinado' },
            { key: 'everyone', label: 'Para Todos', icon: 'lock_open', desc: 'Todo es gratis, sin límite de tiempo' },
          ].map(m => (
            <button key={m.key} onClick={() => setFreeMode(m.key)} style={{
              flex: 1, padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'center',
              border: freeMode === m.key ? '2px solid #10b981' : '1px solid #e2e8f0',
              background: freeMode === m.key ? '#ecfdf5' : 'white',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: freeMode === m.key ? '#10b981' : '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>{m.icon}</span>
              <p style={{ fontWeight: 800, fontSize: '0.875rem', color: freeMode === m.key ? '#0f172a' : '#64748b' }}>{m.label}</p>
              <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {freeMode === 'days' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Cantidad de Días</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="number" min="1" max="365" value={freeDays} onChange={e => setFreeDays(Number(e.target.value))}
                style={{ ...input, width: '6rem' }} />
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>días desde el registro del usuario</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={saveFreeMode} disabled={freeSaving} style={{
            background: '#10b981', color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', opacity: freeSaving ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{freeSaving ? 'sync' : 'save'}</span>
            {freeSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          {freeMode === 'everyone' && (
            <span style={{ fontSize: '0.8125rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>warning</span>
              Todo el contenido premium será accesible gratuitamente
            </span>
          )}
        </div>
      </div>

      {/* ========== 4. GENERIC SETTINGS (existing) ========== */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>tune</span>
        Parámetros del Sistema
      </h2>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ ...card, marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.875rem' }}>{categoryLabels[cat] || cat}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{s.key.replace(/_/g, ' ')}</p>
                  {s.updated_at && <p style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Actualizado: {new Date(s.updated_at).toLocaleString()}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editKey === s.key ? (
                    <>
                      <input style={{ ...input, width: '12rem' }} value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave(s.key)} />
                      <button onClick={() => handleSave(s.key)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✓</button>
                      <button onClick={() => setEditKey(null)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#f1f5f9', color: '#64748b', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <code style={{ fontSize: '0.8125rem', background: '#f8fafc', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 700 }}>
                        {JSON.stringify(s.value).replace(/"/g, '')}
                      </code>
                      <button onClick={() => { setEditKey(s.key); setEditVal(typeof s.value === 'string' ? s.value : JSON.stringify(s.value)) }} style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: '#fff7ed', color: '#ea580c', border: 'none', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}>✏️</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
