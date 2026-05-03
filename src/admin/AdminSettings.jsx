import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

const card = { background: "var(--admin-panel)", borderRadius: "0.5rem", padding: "1.25rem", border: "1px solid var(--admin-line)" }
const input = { width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--admin-line)", fontSize: "0.875rem", outline: "none", background: "#0d0d0d", color: "#fff" }

const fallbackDescriptions = {
  // Algorithm
  match_weight_active: 'Peso que se le da a la actividad reciente del usuario en el cálculo de matches. Un valor más alto prioriza usuarios activos.',
  match_weight_compatibility: 'Peso de la compatibilidad de figuritas (faltantes vs repetidas) en el score de matching. Es el factor principal del algoritmo.',
  match_weight_mutual: 'Peso del beneficio mutuo — cuántas figuritas pueden intercambiarse en ambas direcciones. El más importante del algoritmo.',
  match_weight_rating: 'Peso de la reputación/valoración del usuario. Usuarios bien calificados aparecen más arriba en los resultados.',
  match_weight_premium_boost: 'Multiplicador adicional para usuarios premium en el ranking de resultados. Solo actúa como desempate, no altera la relevancia base.',
  match_max_free: 'Cantidad máxima de matches (cruces) visibles por día para usuarios del plan gratuito. Los premium no tienen límite.',
  // General
  app_name: 'Nombre de la aplicación mostrado en toda la interfaz, notificaciones, emails y SEO.',
  primary_country: 'País principal de operación. Afecta la geolocalización por defecto y las opciones de departamento/barrio.',
  currency: 'Moneda predeterminada para precios, planes premium y pagos dentro de la plataforma.',
  maintenance_mode: 'Si está en true, la app muestra un cartel de mantenimiento y bloquea el acceso a usuarios no-admin.',
  support_email: 'Email de soporte que se muestra a los usuarios para reportar problemas o hacer consultas.',
  // Limits
  free_max_contacts: 'Cantidad máxima de contactos/chats que un usuario gratuito puede iniciar por mes.',
  free_max_albums: 'Cantidad máxima de álbumes que un usuario gratuito puede tener activos simultáneamente.',
  // Safety
  safety_message: 'Mensaje de seguridad que se muestra a los usuarios antes de coordinar un intercambio presencial.',
  // Monetization
  checklist_images_enabled: 'Muestra imágenes de figuritas en el checklist del álbum. Si se desactiva, se muestran solo números/nombres.',
  premium_free_mode: 'Modo de acceso gratuito a funciones premium. disabled = cobro normal, days = trial, everyone = gratis total.',
  premium_free_days: 'Cantidad de días de prueba gratuita de funciones premium para nuevos usuarios.',
}

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

  const [matchedUsers, setMatchedUsers] = useState([])
  const [matchedLocations, setMatchedLocations] = useState([])

  useEffect(() => {
    fetchSettings()
    loadSpecialSettings()
  }, [])

  useEffect(() => {
    if (planSearch.length > 1 && !planTarget) {
      const timer = setTimeout(async () => {
        const { data, error } = await supabase.rpc('admin_search_users', { search_term: planSearch })
        if (!error && data) setMatchedUsers(data)
        else {
          // Fallback just in case RPC fails (legacy)
          const { data: qData } = await supabase.from('profiles')
            .select('id, name, email, plan_name, is_premium')
            .or(`name.ilike.%${planSearch}%,email.ilike.%${planSearch}%`)
            .limit(8)
          if (qData) setMatchedUsers(qData)
        }
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setMatchedUsers([])
    }
  }, [planSearch, planTarget])

  useEffect(() => {
    if (locSearch.length > 1 && !planTarget) {
      const timer = setTimeout(async () => {
        const { data, error } = await supabase.rpc('admin_search_locations', { search_term: locSearch })
        if (!error && data) setMatchedLocations(data)
        else {
          // Fallback
          const { data: qData } = await supabase.from('locations')
            .select('id, name, business_plan')
            .ilike('name', `%${locSearch}%`)
            .limit(8)
          if (qData) setMatchedLocations(qData)
        }
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setMatchedLocations([])
    }
  }, [locSearch, planTarget])

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

  const handlePlanChange = async () => {
    if (!planTarget) return
    setPlanSaving(true)
    setPlanMsg('')

    try {
      if (planTarget.type === 'user') {
        const isPrem = planValue !== 'gratis'
        const { error } = await supabase.from('profiles').update({
          plan_name: planValue,
          is_premium: isPrem
        }).eq('id', planTarget.id)
        
        if (error) throw error

        logAction(profile?.id, 'MANUAL_PLAN_CHANGE', 'user', planTarget.id, { plan: planValue, target_name: planTarget.name })
      } else {
        const { error } = await supabase.from('locations').update({
          business_plan: planValue
        }).eq('id', planTarget.id)

        if (error) throw error

        logAction(profile?.id, 'MANUAL_PLAN_CHANGE', 'location', planTarget.id, { plan: planValue, target_name: planTarget.name })
      }

      setPlanMsg(`✅ Plan de "${planTarget.name}" cambiado a ${planValue}`)
      setTimeout(() => setPlanMsg(''), 4000)
      setPlanTarget(null)
      setPlanSearch('')
      setLocSearch('')
    } catch (e) {
      console.error('Plan change error:', e)
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

  const userPlans = ['gratis', 'premium plus', 'premium pro']
  const businessPlans = ['gratis', 'turbo', 'dominio']

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>settings</span>
          Configuración General
        </h1>
        <p style={{ fontSize: '0.9375rem', color: "var(--admin-muted2)", marginTop: '0.25rem' }}>
          Controles de plataforma, planes, modos premium y más.
        </p>
      </div>

      {/* ========== 1. CHECKLIST IMAGES ========== */}
      <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: "#f5f5f5", display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>image</span>
              Checklist con Imágenes
            </h3>
            <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)" }}>
              {checklistImages
                ? 'Los usuarios ven imágenes en sus checklists de figuritas.'
                : 'Las imágenes están deshabilitadas — se muestran solo números/nombres.'}
            </p>
          </div>
          <button
            onClick={toggleChecklistImages}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: checklistImages ? '#10b981' : "var(--admin-muted)",
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
      <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: "#f5f5f5", display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>swap_horiz</span>
          Cambiar Plan Manualmente
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* User Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase', marginBottom: '0.375rem' }}>👤 Buscar Usuario</label>
            <input type="text" placeholder="Nombre o email..." value={planSearch}
              onChange={e => { setPlanSearch(e.target.value); setPlanTarget(null); setPlanMsg('') }}
              style={input} />
            {planSearch.length > 1 && matchedUsers.length > 0 && !planTarget && (
              <div style={{ border: "1px solid var(--admin-line)", borderRadius: '0.5rem', maxHeight: '10rem', overflowY: 'auto', marginTop: '0.25rem', background: "var(--admin-panel2)" }}>
                {matchedUsers.map(u => (
                  <div key={u.id} onClick={() => { setPlanTarget({ type: 'user', id: u.id, name: u.name || u.email }); setPlanSearch(u.name + ' — ' + u.email); setPlanValue(u.plan_name || 'gratis') }}
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{u.name} — <span style={{ color: "var(--admin-muted)" }}>{u.email}</span></span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', background: "rgba(249, 115, 22, 0.1)", padding: '0.125rem 0.375rem', borderRadius: '0.375rem' }}>{u.plan_name || 'gratis'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: "var(--admin-muted2)", textTransform: 'uppercase', marginBottom: '0.375rem' }}>🏪 Buscar Tienda/Local</label>
            <input type="text" placeholder="Nombre del local..." value={locSearch}
              onChange={e => { setLocSearch(e.target.value); setPlanTarget(null); setPlanMsg('') }}
              style={input} />
            {locSearch.length > 1 && matchedLocations.length > 0 && !planTarget && (
              <div style={{ border: "1px solid var(--admin-line)", borderRadius: '0.5rem', maxHeight: '10rem', overflowY: 'auto', marginTop: '0.25rem', background: "var(--admin-panel2)" }}>
                {matchedLocations.map(l => (
                  <div key={l.id} onClick={() => { setLocSearch(l.name); setPlanTarget({ type: 'business', id: l.id, name: l.name }); setPlanValue(l.plan || 'gratis') }}
                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{l.name}</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#3b82f6', background: "rgba(59, 130, 246, 0.1)", padding: '0.125rem 0.375rem', borderRadius: '0.375rem' }}>{l.plan || 'gratis'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {planTarget && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: "var(--admin-panel2)", borderRadius: '0.75rem', border: "1px solid var(--admin-line)" }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span style={{ color: "var(--admin-muted2)" }}>{planTarget.type === 'user' ? '👤 Usuario:' : '🏪 Local:'}</span>{' '}
              <strong style={{ color: "#f5f5f5" }}>{planTarget.name}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {(planTarget.type === 'user' ? userPlans : businessPlans).map(p => (
                <button key={p} onClick={() => setPlanValue(p)} style={{
                  flex: 1, padding: '0.625rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer',
                  textTransform: 'capitalize',
                  border: planValue === p ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                  background: planValue === p ? '#fff7ed' : 'white',
                  color: planValue === p ? 'var(--color-primary)' : "var(--admin-muted2)"
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handlePlanChange} disabled={planSaving} style={{
                background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', opacity: planSaving ? 0.5 : 1
              }}>{planSaving ? '⏳ Cambiando...' : '💾 Confirmar Cambio'}</button>
              <button onClick={() => { setPlanTarget(null); setPlanSearch(''); setLocSearch('') }} style={{ background: "var(--admin-panel2)", color: "var(--admin-muted2)", border: 'none', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {planMsg && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: planMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{planMsg}</p>
        )}
      </div>

      {/* ========== 3. PREMIUM FREE MODE ========== */}
      <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: "#f5f5f5", display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#10b981' }}>redeem</span>
          Modo Premium Gratuito
        </h3>
        <p style={{ fontSize: '0.8125rem', color: "var(--admin-muted2)", marginBottom: '1rem' }}>
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
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: freeMode === m.key ? '#10b981' : "var(--admin-muted)", display: 'block', marginBottom: '0.5rem' }}>{m.icon}</span>
              <p style={{ fontWeight: 800, fontSize: '0.875rem', color: freeMode === m.key ? "#f5f5f5" : "var(--admin-muted2)" }}>{m.label}</p>
              <p style={{ fontSize: '0.6875rem', color: "var(--admin-muted)", marginTop: '0.25rem' }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {freeMode === 'days' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: "var(--admin-muted2)", textTransform: 'uppercase', marginBottom: '0.375rem' }}>Cantidad de Días</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="number" min="1" max="365" value={freeDays} onChange={e => setFreeDays(Number(e.target.value))}
                style={{ ...input, width: '6rem' }} />
              <span style={{ fontSize: '0.875rem', color: "var(--admin-muted2)" }}>días desde el registro del usuario</span>
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
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: "#f5f5f5", marginBottom: '1rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>tune</span>
        Parámetros del Sistema
      </h2>

      {Object.entries(grouped).map(([cat, items]) => {
        const catMeta = {
          algorithm: { icon: '🧠', color: '#8b5cf6', borderColor: '#c4b5fd' },
          general: { icon: '⚙️', color: '#3b82f6', borderColor: '#93c5fd' },
          limits: { icon: '🔒', color: '#f59e0b', borderColor: '#fcd34d' },
          safety: { icon: '🛡️', color: '#10b981', borderColor: '#6ee7b7' },
          social: { icon: '🌐', color: '#06b6d4', borderColor: '#67e8f9' },
          monetization: { icon: '💰', color: 'var(--color-primary)', borderColor: '#fdba74' },
        }[cat] || { icon: '📋', color: "var(--admin-muted2)", borderColor: "var(--admin-muted)" }

        return (
          <div key={cat} style={{ ...card, marginBottom: '1rem', borderLeft: `4px solid ${catMeta.borderColor}` }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: "#f5f5f5" }}>
              <span>{catMeta.icon}</span> {categoryLabels[cat] || cat}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {items.map(s => {
                const desc = s.description || fallbackDescriptions[s.key] || null

                return (
                  <div key={s.key} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '0.875rem 1rem', borderRadius: '0.625rem',
                    background: editKey === s.key ? '#fffbeb' : "var(--admin-panel2)",
                    border: editKey === s.key ? '1px solid #fcd34d' : '1px solid transparent',
                    transition: 'all 0.15s', gap: '1rem',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: "#f5f5f5", margin: 0, marginBottom: '0.25rem' }}>
                        {s.key.replace(/_/g, ' ')}
                      </p>
                      {desc && (
                        <p style={{ fontSize: '0.75rem', color: "var(--admin-muted2)", margin: 0, marginBottom: '0.375rem', lineHeight: 1.5 }}>
                          {desc}
                        </p>
                      )}
                      {s.updated_at && (
                        <p style={{ fontSize: '0.625rem', color: "var(--admin-muted)", margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>schedule</span>
                          {new Date(s.updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {editKey === s.key ? (
                        <>
                          <input style={{ ...input, width: '12rem' }} value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave(s.key)} autoFocus />
                          <button onClick={() => handleSave(s.key)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditKey(null)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem', background: "var(--admin-panel2)", color: "var(--admin-muted2)", border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✕</button>
                        </>
                      ) : (
                        <>
                          <code style={{ fontSize: '0.8125rem', background: "var(--admin-panel2)", padding: '0.3rem 0.75rem', borderRadius: '0.5rem', color: catMeta.color, border: "1px solid var(--admin-line)", fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {JSON.stringify(s.value).replace(/"/g, '')}
                          </code>
                          <button onClick={() => { setEditKey(s.key); setEditVal(typeof s.value === 'string' ? s.value : JSON.stringify(s.value)) }} style={{ padding: '0.3rem 0.5rem', borderRadius: '0.375rem', background: "rgba(249, 115, 22, 0.1)", color: 'var(--color-primary)', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>✏️</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
