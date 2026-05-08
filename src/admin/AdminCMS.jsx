import React, { useEffect, useMemo, useState } from 'react'
import LandingRenderer from '../components/landing/LandingRenderer'
import {
  LANDING_PAGE_KEY,
  LANDING_PAGE_OPTIONS,
  computeBlockMetrics,
  getBlockDefinition,
  getLandingPageBlockLibrary,
  getLandingPageDefinition,
  normalizeLandingBlocks,
} from '../lib/landingBuilder'
import {
  createLandingBlock,
  deleteLandingBlock,
  duplicateLandingBlock,
  fetchLandingBlocks,
  fetchLandingEvents,
  publishLandingDraft,
  reorderDraftBlocks,
  saveDraftBlock,
} from '../lib/landingApi'
import { collectBlockDiagnostics, getFieldGuidance } from '../lib/landingEditor'

const cardStyle = {
  background: 'var(--admin-panel)',
  border: '1px solid var(--admin-line)',
}

export default function AdminCMS() {
  const [pageKey, setPageKey] = useState(LANDING_PAGE_KEY)
  const [blocks, setBlocks] = useState([])
  const [sharedBlocks, setSharedBlocks] = useState([])
  const [events, setEvents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [draggedId, setDraggedId] = useState(null)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [saving, setSaving] = useState(false)
  const pageLibrary = useMemo(() => getLandingPageBlockLibrary(pageKey), [pageKey])
  const pageDefinition = useMemo(() => getLandingPageDefinition(pageKey), [pageKey])
  const [addingType, setAddingType] = useState('')

  useEffect(() => {
    setAddingType(pageLibrary[0]?.type || '')
  }, [pageLibrary])

  useEffect(() => {
    load(pageKey)
  }, [pageKey])

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedId) || blocks[0] || null,
    [blocks, selectedId]
  )

  const previewBlocks = useMemo(() => {
    const current = normalizeLandingBlocks(blocks, 'draft')
    if (pageKey === LANDING_PAGE_KEY) return current

    const shared = normalizeLandingBlocks(sharedBlocks, 'draft')
    const nav = shared.filter((block) => block.block_type === 'navbar')
    const footer = shared.filter((block) => block.block_type === 'footer')
    return [...nav, ...current, ...footer]
  }, [blocks, pageKey, sharedBlocks])

  async function load(targetPageKey = pageKey) {
    try {
      const [draftRows, landingEvents, sharedRows] = await Promise.all([
        fetchLandingBlocks({ mode: 'draft', pageKey: targetPageKey }),
        fetchLandingEvents({ pageKey: targetPageKey }),
        targetPageKey === LANDING_PAGE_KEY
          ? Promise.resolve([])
          : fetchLandingBlocks({ mode: 'draft', pageKey: LANDING_PAGE_KEY }),
      ])
      setBlocks(draftRows)
      setEvents(landingEvents)
      setSharedBlocks(sharedRows)
      setSelectedId((current) => draftRows.find((block) => block.id === current)?.id || draftRows[0]?.id || null)
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'No se pudo cargar el editor de landings.' })
    }
  }

  const updateSelectedBlock = (updater) => {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== selectedBlock?.id) return block
        return typeof updater === 'function' ? updater(block) : updater
      })
    )
  }

  const saveDrafts = async () => {
    if (!blocks.length) return
    setSaving(true)
    setStatus({ type: 'idle', message: '' })
    try {
      const reordered = blocks.map((block, index) => ({ ...block, draft_order: index }))
      setBlocks(reordered)
      await reorderDraftBlocks(reordered)
      for (const block of reordered) {
        await saveDraftBlock(block)
      }
      setStatus({ type: 'success', message: 'Draft guardado.' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'Error guardando el draft.' })
    } finally {
      setSaving(false)
    }
  }

  const publishDraft = async () => {
    setSaving(true)
    setStatus({ type: 'idle', message: '' })
    try {
      const reordered = blocks.map((block, index) => ({ ...block, draft_order: index }))
      setBlocks(reordered)
      await reorderDraftBlocks(reordered)
      for (const block of reordered) {
        await saveDraftBlock(block)
      }
      await publishLandingDraft(reordered)
      await load(pageKey)
      setStatus({ type: 'success', message: 'Landing publicada.' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'No se pudo publicar la landing.' })
    } finally {
      setSaving(false)
    }
  }

  const addBlock = async () => {
    if (!addingType) return
    try {
      const created = await createLandingBlock(addingType, blocks.length, pageKey)
      setBlocks((current) => [...current, created])
      setSelectedId(created.id)
      setStatus({ type: 'success', message: 'Bloque agregado.' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'No se pudo agregar el bloque.' })
    }
  }

  const duplicateBlock = async (block) => {
    try {
      const created = await duplicateLandingBlock(block, blocks.length)
      setBlocks((current) => [...current, created])
      setSelectedId(created.id)
      setStatus({ type: 'success', message: 'Bloque duplicado.' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'No se pudo duplicar el bloque.' })
    }
  }

  const removeBlock = async (block) => {
    const shouldDelete = window.confirm(`Eliminar "${block.internal_title}"?`)
    if (!shouldDelete) return
    try {
      await deleteLandingBlock(block.id)
      const next = blocks.filter((item) => item.id !== block.id)
      setBlocks(next)
      setSelectedId(next[0]?.id || null)
      setStatus({ type: 'success', message: 'Bloque eliminado.' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'No se pudo eliminar.' })
    }
  }

  const handleDrop = (targetId) => {
    if (!draggedId || draggedId === targetId) return
    const sourceIndex = blocks.findIndex((block) => block.id === draggedId)
    const targetIndex = blocks.findIndex((block) => block.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const next = [...blocks]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    setBlocks(next.map((block, index) => ({ ...block, draft_order: index })))
    setDraggedId(null)
  }

  const selectedDiagnostics = selectedBlock ? collectBlockDiagnostics(selectedBlock) : null

  return (
    <div className="admin-generic-page">
      <section className="ag-hero">
        <div className="ag-hero-row">
          <div>
            <div className="admin-kicker">/ admin &gt; landings</div>
            <h1 className="ag-title">Landing Editor</h1>
            <p style={{ marginTop: '.8rem', maxWidth: '62rem', color: 'var(--admin-muted)' }}>
              Editor visual para `/`, `/puntos` e `/influencers`. Textos con guardrails editoriales, imagenes con tamano recomendado y preview real con autoajuste.
            </p>
          </div>
          <div className="ag-icon-box">
            <span className="material-symbols-outlined">web_stories</span>
          </div>
        </div>
      </section>

      <section style={{ ...cardStyle, padding: '1rem', display: 'grid', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {LANDING_PAGE_OPTIONS.map((page) => (
            <button
              key={page.key}
              type="button"
              className="admin-action-btn"
              onClick={() => setPageKey(page.key)}
              style={{
                background: pageKey === page.key ? 'rgba(255,90,0,.12)' : 'transparent',
                borderColor: pageKey === page.key ? 'rgba(255,90,0,.35)' : 'var(--admin-line)',
                color: pageKey === page.key ? '#fff' : 'var(--admin-muted2)',
              }}
            >
              {page.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '240px' }}>
            <div className="admin-kicker">{pageDefinition.route}</div>
            <strong style={{ color: '#fff' }}>{pageDefinition.label}</strong>
            <div style={{ color: 'var(--admin-muted)', marginTop: '.2rem' }}>{pageDefinition.description}</div>
          </div>
          <select value={addingType} onChange={(event) => setAddingType(event.target.value)}>
            {pageLibrary.map((item) => (
              <option key={item.type} value={item.type}>{item.label}</option>
            ))}
          </select>
          <button className="admin-action-btn" onClick={addBlock}>Agregar bloque</button>
          <button className="admin-action-btn" onClick={saveDrafts} disabled={saving}>Guardar draft</button>
          <button className="admin-action-btn admin-action-primary" onClick={publishDraft} disabled={saving}>Publicar landing</button>
          <div style={{ marginLeft: 'auto', color: status.type === 'error' ? 'var(--admin-red)' : status.type === 'success' ? 'var(--admin-green)' : 'var(--admin-muted)' }}>
            {status.message || 'Preview del draft actual'}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr) minmax(380px, 620px)', gap: '1rem', alignItems: 'start' }}>
        <div style={{ ...cardStyle, padding: '1rem', position: 'sticky', top: '88px' }}>
          <h3 style={panelTitle}>Bloques</h3>
          <p style={panelCopy}>Reordena, edita y controla la salud editorial de cada bloque.</p>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            {blocks.map((block, index) => {
              const metrics = computeBlockMetrics(events, block.slug)
              const diagnostics = collectBlockDiagnostics(block)
              const definition = getBlockDefinition(block.block_type)
              const isSelected = selectedBlock?.id === block.id
              return (
                <button
                  key={block.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedId(block.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(block.id)}
                  onClick={() => setSelectedId(block.id)}
                  style={{
                    ...cardStyle,
                    background: isSelected ? 'rgba(255,90,0,.08)' : 'var(--admin-panel2)',
                    borderColor: isSelected ? 'rgba(255,90,0,.35)' : 'var(--admin-line)',
                    padding: '0.9rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'start' }}>
                    <div>
                      <div className="admin-kicker">#{String(index + 1).padStart(2, '0')} / {definition?.label || block.block_type}</div>
                      <strong style={{ display: 'block', marginTop: '.35rem', color: '#fff' }}>{block.internal_title}</strong>
                      <div style={{ marginTop: '.25rem', fontSize: '.76rem', color: 'var(--admin-muted2)' }}>{block.slug}</div>
                    </div>
                    <Badge state={block.draft_visible !== false ? 'success' : 'warning'}>
                      {block.draft_visible !== false ? 'Visible' : 'Oculto'}
                    </Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginTop: '.9rem' }}>
                    <MetricMini label="Warn" value={diagnostics.warnings} />
                    <MetricMini label="Err" value={diagnostics.errors} />
                    <MetricMini label="Clicks" value={metrics.clicks} />
                    <MetricMini label="CTR" value={`${metrics.ctr}%`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {selectedBlock ? (
            <>
              <div style={{ ...cardStyle, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div className="admin-kicker">/ bloque seleccionado</div>
                    <h3 style={panelTitle}>{selectedBlock.internal_title}</h3>
                    <p style={panelCopy}>El editor marca longitud ideal, riesgo de overflow y recomendaciones visuales por campo.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    <button className="admin-action-btn" onClick={() => duplicateBlock(selectedBlock)}>Duplicar</button>
                    <button className="admin-action-btn" style={{ borderColor: 'rgba(239,68,68,.3)', color: 'var(--admin-red)' }} onClick={() => removeBlock(selectedBlock)}>Eliminar</button>
                  </div>
                </div>
                {selectedDiagnostics ? (
                  <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <Badge state={selectedDiagnostics.errors ? 'error' : 'success'}>{selectedDiagnostics.errors} errores</Badge>
                    <Badge state={selectedDiagnostics.warnings ? 'warning' : 'success'}>{selectedDiagnostics.warnings} alertas</Badge>
                    <Badge state={selectedDiagnostics.emptyRequired ? 'warning' : 'success'}>{selectedDiagnostics.emptyRequired} campos vacios</Badge>
                  </div>
                ) : null}
              </div>

              <div style={{ ...cardStyle, padding: '1rem' }}>
                <h4 style={fieldsetTitle}>Meta del bloque</h4>
                <div style={twoCol}>
                  <Field label="Titulo interno">
                    <input value={selectedBlock.internal_title || ''} onChange={(event) => updateSelectedBlock((block) => ({ ...block, internal_title: event.target.value }))} />
                  </Field>
                  <Field label="Slug">
                    <input value={selectedBlock.slug || ''} onChange={(event) => updateSelectedBlock((block) => ({ ...block, slug: event.target.value }))} />
                  </Field>
                  <Field label="Preview image URL">
                    <input value={selectedBlock.preview_image_url || ''} onChange={(event) => updateSelectedBlock((block) => ({ ...block, preview_image_url: event.target.value }))} />
                  </Field>
                  <Field label="Visible">
                    <label style={toggleLabel}>
                      <input type="checkbox" checked={selectedBlock.draft_visible !== false} onChange={(event) => updateSelectedBlock((block) => ({ ...block, draft_visible: event.target.checked }))} />
                      Mostrar en landing
                    </label>
                  </Field>
                  <Field label="Programar desde">
                    <input type="datetime-local" value={toLocalDateTime(selectedBlock.starts_at)} onChange={(event) => updateSelectedBlock((block) => ({ ...block, starts_at: fromLocalDateTime(event.target.value) }))} />
                  </Field>
                  <Field label="Programar hasta">
                    <input type="datetime-local" value={toLocalDateTime(selectedBlock.ends_at)} onChange={(event) => updateSelectedBlock((block) => ({ ...block, ends_at: fromLocalDateTime(event.target.value) }))} />
                  </Field>
                </div>
              </div>

              <div style={{ ...cardStyle, padding: '1rem' }}>
                <h4 style={fieldsetTitle}>Contenido</h4>
                <FieldRenderer
                  blockType={selectedBlock.block_type}
                  definition={getBlockDefinition(selectedBlock.block_type)}
                  value={selectedBlock.draft_content || {}}
                  onChange={(nextContent) => updateSelectedBlock((block) => ({ ...block, draft_content: nextContent }))}
                />
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, padding: '2rem', color: 'var(--admin-muted)' }}>No hay bloques para editar.</div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: '1rem', position: 'sticky', top: '88px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={panelTitle}>Preview</h3>
              <p style={panelCopy}>Usa el mismo renderer de las landings publicas.</p>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="admin-action-btn" style={{ background: device === 'desktop' ? 'rgba(255,90,0,.08)' : 'transparent' }} onClick={() => setDevice('desktop')}>Desktop</button>
              <button className="admin-action-btn" style={{ background: device === 'mobile' ? 'rgba(255,90,0,.08)' : 'transparent' }} onClick={() => setDevice('mobile')}>Mobile</button>
            </div>
          </div>
          <div style={{ marginTop: '1rem', padding: '.85rem', border: '1px solid var(--admin-line)', background: '#060606', overflow: 'auto' }}>
            <div style={{ width: device === 'mobile' ? '390px' : '100%', maxWidth: '100%', margin: '0 auto', border: '1px solid rgba(255,255,255,.08)' }}>
              <LandingRenderer blocks={previewBlocks} device={device} preview />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FieldRenderer({ blockType, definition, value, onChange }) {
  if (!definition) return null

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {definition.fields.map((field) => (
        <FieldNode
          key={field.key}
          blockType={blockType}
          field={field}
          path={[field.key]}
          value={value[field.key]}
          onChange={(nextValue) => onChange({ ...value, [field.key]: nextValue })}
        />
      ))}
    </div>
  )
}

function FieldNode({ blockType, field, path, value, onChange }) {
  if (field.type === 'group') {
    return (
      <div style={subCard}>
        <h5 style={fieldsetTitle}>{field.label}</h5>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {field.fields.map((child) => (
            <FieldNode
              key={child.key}
              blockType={blockType}
              field={child}
              path={[...path, child.key]}
              value={value?.[child.key]}
              onChange={(nextValue) => onChange({ ...(value || {}), [child.key]: nextValue })}
            />
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'list') {
    const list = Array.isArray(value) ? value : []
    return (
      <div style={subCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '.75rem' }}>
          <h5 style={fieldsetTitle}>{field.label}</h5>
          <button className="admin-action-btn" type="button" onClick={() => onChange([...list, buildEmptyItem(field.fields)])}>Agregar</button>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {list.map((item, index) => (
            <div key={`${field.key}-${index}`} style={{ ...cardStyle, padding: '0.75rem', background: 'var(--admin-panel2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '.75rem' }}>
                <strong style={{ color: '#fff' }}>{field.itemLabel} {index + 1}</strong>
                <button className="admin-action-btn" type="button" onClick={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>Eliminar</button>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {field.fields.map((child) => (
                  <FieldNode
                    key={`${field.key}-${index}-${child.key}`}
                    blockType={blockType}
                    field={child}
                    path={[...path, child.key]}
                    value={item?.[child.key]}
                    onChange={(nextValue) =>
                      onChange(
                        list.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, [child.key]: nextValue } : entry
                        )
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'simple-list') {
    const list = Array.isArray(value) ? value : []
    const guidance = getFieldGuidance(blockType, path, field, list[0] || '')
    return (
      <div style={subCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '.75rem' }}>
          <div>
            <h5 style={fieldsetTitle}>{field.label}</h5>
            {guidance ? <Guidance guidance={guidance} /> : null}
          </div>
          <button className="admin-action-btn" type="button" onClick={() => onChange([...list, ''])}>Agregar</button>
        </div>
        <div style={{ display: 'grid', gap: '.5rem' }}>
          {list.map((item, index) => (
            <div key={`${field.key}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.5rem' }}>
              <input value={item} onChange={(event) => onChange(list.map((entry, entryIndex) => entryIndex === index ? event.target.value : entry))} />
              <button className="admin-action-btn" type="button" onClick={() => onChange(list.filter((_, entryIndex) => entryIndex !== index))}>Quitar</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'toggle') {
    return (
      <Field label={field.label}>
        <label style={toggleLabel}>
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
          Activado
        </label>
      </Field>
    )
  }

  if (field.type === 'select') {
    return (
      <Field label={field.label}>
        <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </Field>
    )
  }

  const guidance = getFieldGuidance(blockType, path, field, value)
  const isImage = guidance?.meta?.kind === 'image'

  if (field.type === 'textarea') {
    return (
      <Field label={field.label} guidance={guidance}>
        <textarea value={value || ''} onChange={(event) => onChange(event.target.value)} rows={4} />
      </Field>
    )
  }

  if (isImage) {
    return (
      <Field label={field.label} guidance={guidance}>
        <div style={{ display: 'grid', gap: '.75rem' }}>
          <input type="url" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
          <div style={{ ...cardStyle, padding: '.6rem', background: 'var(--admin-panel2)' }}>
            <div style={{ aspectRatio: '16 / 9', width: '100%', background: '#0b0b0b', border: '1px solid rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {value ? <img src={value} alt={field.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--admin-muted2)' }}>Preview</span>}
            </div>
          </div>
        </div>
      </Field>
    )
  }

  return (
    <Field label={field.label} guidance={guidance}>
      <input
        type={field.type === 'number' ? 'number' : field.type === 'color' ? 'color' : field.type === 'url' ? 'url' : 'text'}
        value={value ?? (field.type === 'color' ? '#ffffff' : '')}
        onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value || 0) : event.target.value)}
      />
    </Field>
  )
}

function Field({ label, guidance, children }) {
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      {children}
      {guidance ? <Guidance guidance={guidance} /> : null}
    </div>
  )
}

function Guidance({ guidance }) {
  return (
    <div style={{ marginTop: '.45rem', display: 'grid', gap: '.25rem' }}>
      <Badge state={guidance.state}>{guidance.state === 'error' ? 'Muy largo' : guidance.state === 'warning' ? 'Revisar' : guidance.state === 'empty' ? 'Vacio' : 'OK'}</Badge>
      {guidance.lines.map((line) => (
        <div key={line} style={{ color: 'var(--admin-muted2)', fontSize: '.76rem' }}>{line}</div>
      ))}
    </div>
  )
}

function Badge({ state = 'success', children }) {
  const palette = state === 'error'
    ? ['rgba(239,68,68,.12)', 'rgba(239,68,68,.35)', 'var(--admin-red)']
    : state === 'warning' || state === 'empty'
      ? ['rgba(250,204,21,.12)', 'rgba(250,204,21,.35)', 'var(--admin-yellow)']
      : ['rgba(34,197,94,.12)', 'rgba(34,197,94,.35)', 'var(--admin-green)']

  return (
    <span
      className="ag-status"
      style={{ background: palette[0], borderColor: palette[1], color: palette[2] }}
    >
      {children}
    </span>
  )
}

function MetricMini({ label, value }) {
  return (
    <div style={{ ...cardStyle, padding: '.5rem', background: '#0d0d0d' }}>
      <div style={{ color: 'var(--admin-muted2)', fontSize: '.7rem', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <strong style={{ display: 'block', marginTop: '.25rem', color: '#fff' }}>{value}</strong>
    </div>
  )
}

function buildEmptyItem(fields = []) {
  return fields.reduce((accumulator, field) => {
    if (field.type === 'group') {
      accumulator[field.key] = buildEmptyItem(field.fields)
    } else if (field.type === 'list' || field.type === 'simple-list') {
      accumulator[field.key] = []
    } else if (field.type === 'toggle') {
      accumulator[field.key] = false
    } else {
      accumulator[field.key] = ''
    }
    return accumulator
  }, {})
}

function toLocalDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function fromLocalDateTime(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

const panelTitle = { margin: 0, color: '#fff', font: "italic 900 1.8rem 'Barlow Condensed'" }
const panelCopy = { marginTop: '.35rem', color: 'var(--admin-muted)' }
const fieldLabel = { display: 'block', marginBottom: '.35rem', color: 'var(--admin-muted2)', fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase' }
const fieldsetTitle = { margin: 0, color: '#fff', font: "italic 900 1.05rem 'Barlow Condensed'" }
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.85rem' }
const subCard = { ...cardStyle, padding: '0.9rem', background: 'var(--admin-panel2)' }
const toggleLabel = { display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: '#fff', fontWeight: 600 }
