import { getBlockDefinition } from './landingBuilder'

const EXPLICIT_RULES = {
  'navbar.logoUrl': { kind: 'image', recommendedSize: '240x80 px', aspectRatio: '3:1' },
  'hero.title': { kind: 'title', minLength: 10, recommendedMax: 28, hardMax: 52, fit: 'hero' },
  'hero.subtitle': { kind: 'body', minLength: 40, recommendedMax: 110, hardMax: 180, fit: 'hero-copy' },
  'hero.primaryCta.label': { kind: 'button', recommendedMax: 18, hardMax: 26 },
  'hero.secondaryCta.label': { kind: 'button', recommendedMax: 18, hardMax: 26 },
  'influencers.image': { kind: 'image', recommendedSize: '1200x1400 px', aspectRatio: '6:7' },
  'exchange_points.image': { kind: 'image', recommendedSize: '1600x900 px', aspectRatio: '16:9' },
  'final_cta.image': { kind: 'image', recommendedSize: '1200x900 px', aspectRatio: '4:3' },
  'albums.items.image': { kind: 'image', recommendedSize: '1200x1200 px', aspectRatio: '1:1' },
  'how_it_works.steps.image': { kind: 'image', recommendedSize: '1200x900 px', aspectRatio: '4:3' },
  'gamification.cards.image': { kind: 'image', recommendedSize: '1200x900 px', aspectRatio: '4:3' },
  'influencer_program_hero.titleLineOne': { kind: 'title', minLength: 10, recommendedMax: 20, hardMax: 28, fit: 'program-hero-line' },
  'influencer_program_hero.titleLineTwo': { kind: 'title', minLength: 10, recommendedMax: 18, hardMax: 24, fit: 'program-hero-line' },
  'influencer_program_hero.subtitle': { kind: 'body', minLength: 50, recommendedMax: 120, hardMax: 170, fit: 'program-hero-copy' },
  'influencer_program_hero.primaryCta.label': { kind: 'button', recommendedMax: 20, hardMax: 28 },
  'influencer_program_hero.secondaryCta.label': { kind: 'button', recommendedMax: 16, hardMax: 22 },
  'influencer_program_pillars.subtitle': { kind: 'body', minLength: 40, recommendedMax: 120, hardMax: 170 },
  'influencer_program_tiers.subtitle': { kind: 'body', minLength: 30, recommendedMax: 100, hardMax: 150 },
  'influencer_program_cta.title': { kind: 'title', minLength: 8, recommendedMax: 18, hardMax: 28, fit: 'program-cta-title' },
  'influencer_program_cta.subtitle': { kind: 'body', minLength: 25, recommendedMax: 90, hardMax: 140 },
  'faq.items.question': { kind: 'title', minLength: 8, recommendedMax: 52, hardMax: 90 },
  'faq.items.answer': { kind: 'body', minLength: 30, recommendedMax: 180, hardMax: 320 },
}

const SEMANTIC_DEFAULTS = {
  title: { kind: 'title', minLength: 8, recommendedMax: 40, hardMax: 70 },
  subtitle: { kind: 'body', minLength: 25, recommendedMax: 120, hardMax: 180 },
  description: { kind: 'body', minLength: 20, recommendedMax: 140, hardMax: 220 },
  label: { kind: 'button', minLength: 2, recommendedMax: 20, hardMax: 28 },
  badge: { kind: 'short', minLength: 2, recommendedMax: 18, hardMax: 28 },
  kicker: { kind: 'short', minLength: 4, recommendedMax: 26, hardMax: 40 },
  question: { kind: 'title', minLength: 8, recommendedMax: 52, hardMax: 90 },
  answer: { kind: 'body', minLength: 20, recommendedMax: 180, hardMax: 320 },
}

function getPathKey(path = []) {
  return path.join('.')
}

export function getFieldEditorMeta(blockType, path, field) {
  const pathKey = getPathKey(path)
  const explicit = EXPLICIT_RULES[`${blockType}.${pathKey}`] || EXPLICIT_RULES[pathKey]
  if (explicit) return { ...explicit }

  if (field.type === 'url' && /image|logoUrl/i.test(field.key)) {
    return { kind: 'image', recommendedSize: '1200x900 px', aspectRatio: '4:3' }
  }

  return SEMANTIC_DEFAULTS[field.key] ? { ...SEMANTIC_DEFAULTS[field.key] } : null
}

export function getTextHealth(meta, value) {
  const text = String(value || '').trim()
  const length = text.length
  if (!meta || typeof meta.recommendedMax !== 'number') {
    return { state: text ? 'ok' : 'empty', length }
  }
  if (!text) return { state: 'empty', length }
  if (typeof meta.hardMax === 'number' && length > meta.hardMax) {
    return { state: 'error', length }
  }
  if (length > meta.recommendedMax) {
    return { state: 'warning', length }
  }
  return { state: 'ok', length }
}

export function getFieldGuidance(blockType, path, field, value) {
  const meta = getFieldEditorMeta(blockType, path, field)
  if (!meta) return null

  if (meta.kind === 'image') {
    return {
      meta,
      state: value ? 'ok' : 'warning',
      lines: [
        `Tamano recomendado: ${meta.recommendedSize}`,
        meta.aspectRatio ? `Proporcion esperada: ${meta.aspectRatio}` : null,
      ].filter(Boolean),
    }
  }

  const health = getTextHealth(meta, value)
  const range = typeof meta.minLength === 'number'
    ? `${meta.minLength}-${meta.recommendedMax} caracteres`
    : `Hasta ${meta.recommendedMax} caracteres`

  return {
    meta,
    state: health.state,
    lines: [
      `Largo ideal: ${range}`,
      typeof meta.hardMax === 'number' ? `Maximo sugerido: ${meta.hardMax}` : null,
      value ? `Actual: ${health.length}` : 'Sin contenido',
    ].filter(Boolean),
  }
}

export function collectBlockDiagnostics(block) {
  const definition = getBlockDefinition(block?.block_type)
  if (!definition) {
    return { warnings: 0, errors: 0, emptyRequired: 0, total: 0 }
  }

  const summary = { warnings: 0, errors: 0, emptyRequired: 0, total: 0 }
  walkFields(definition.fields, block?.draft_content || {}, [], block?.block_type, summary)
  return summary
}

function walkFields(fields, value, path, blockType, summary) {
  for (const field of fields) {
    const nextPath = [...path, field.key]
    const current = value?.[field.key]

    if (field.type === 'group') {
      walkFields(field.fields || [], current || {}, nextPath, blockType, summary)
      continue
    }

    if (field.type === 'list') {
      const list = Array.isArray(current) ? current : []
      if (list.length === 0) {
        summary.emptyRequired += 1
      }
      list.forEach((item) => walkFields(field.fields || [], item || {}, nextPath, blockType, summary))
      continue
    }

    if (field.type === 'simple-list') {
      const list = Array.isArray(current) ? current : []
      if (list.length === 0) {
        summary.emptyRequired += 1
      }
      list.forEach((item) => {
        const meta = getFieldEditorMeta(blockType, nextPath, field)
        const state = getTextHealth(meta, item).state
        summary.total += 1
        if (state === 'warning') summary.warnings += 1
        if (state === 'error') summary.errors += 1
      })
      continue
    }

    const guidance = getFieldGuidance(blockType, nextPath, field, current)
    if (!guidance) continue
    summary.total += 1
    if (guidance.state === 'warning') summary.warnings += 1
    if (guidance.state === 'error') summary.errors += 1
    if (guidance.state === 'empty') summary.emptyRequired += 1
  }
}
