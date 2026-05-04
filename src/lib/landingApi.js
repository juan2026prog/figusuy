import { supabase } from './supabase'
import {
  LANDING_DEFAULT_BLOCKS,
  LANDING_PAGE_KEY,
  cloneBlockContent,
  createEmptyBlock,
} from './landingBuilder'

let missingPublicLandingRpc = false
let missingLandingEventsTable = false
let missingLandingBlocksTable = false

export async function ensureLandingSeeded() {
  if (missingLandingBlocksTable) return

  const { data, error } = await supabase
    .from('landing_blocks')
    .select('id')
    .eq('page_key', LANDING_PAGE_KEY)
    .limit(1)

  if (isMissingRelationError(error, 'landing_blocks')) {
    missingLandingBlocksTable = true
    return
  }
  if (error) throw error
  if (data?.length) return

  const payload = LANDING_DEFAULT_BLOCKS.map((block) => ({
    ...block,
    draft_content: cloneBlockContent(block.draft_content),
    published_content: cloneBlockContent(block.published_content),
  }))

  const { error: insertError } = await supabase.from('landing_blocks').insert(payload)
  if (isMissingRelationError(insertError, 'landing_blocks')) {
    missingLandingBlocksTable = true
    return
  }
  if (insertError) throw insertError
}

export async function fetchLandingBlocks({ mode = 'published' } = {}) {
  if (mode === 'draft') {
    await ensureLandingSeeded()
    if (missingLandingBlocksTable) return []

    const { data, error } = await supabase
      .from('landing_blocks')
      .select('*')
      .eq('page_key', LANDING_PAGE_KEY)
      .order('draft_order', { ascending: true })

    if (isMissingRelationError(error, 'landing_blocks')) {
      missingLandingBlocksTable = true
      return []
    }
    if (error) throw error
    return data || []
  }

  if (missingPublicLandingRpc) return []

  const { data, error } = await supabase.rpc('get_public_landing_blocks', {
    target_page_key: LANDING_PAGE_KEY,
  })

  if (isMissingRpcError(error, 'get_public_landing_blocks')) {
    missingPublicLandingRpc = true
    return []
  }
  if (error) throw error
  return data || []
}

export async function fetchLandingEvents() {
  if (missingLandingEventsTable) return []

  const { data, error } = await supabase
    .from('landing_block_events')
    .select('*')
    .eq('page_key', LANDING_PAGE_KEY)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (isMissingRelationError(error, 'landing_block_events')) {
    missingLandingEventsTable = true
    return []
  }
  if (error) throw error
  return data || []
}

export async function saveDraftBlock(block) {
  const payload = {
    internal_title: block.internal_title,
    slug: block.slug,
    preview_image_url: block.preview_image_url || '',
    draft_content: cloneBlockContent(block.draft_content || {}),
    draft_visible: block.draft_visible !== false,
    draft_order: Number(block.draft_order || 0),
    is_enabled: block.is_enabled !== false,
    starts_at: block.starts_at || null,
    ends_at: block.ends_at || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('landing_blocks')
    .update(payload)
    .eq('id', block.id)

  if (error) throw error
}

export async function createLandingBlock(type, order) {
  const block = createEmptyBlock(type)
  const payload = {
    ...block,
    draft_order: order,
    published_order: order,
  }

  const { data, error } = await supabase
    .from('landing_blocks')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function duplicateLandingBlock(block, order) {
  const payload = {
    page_key: LANDING_PAGE_KEY,
    block_type: block.block_type,
    internal_title: `${block.internal_title} copia`,
    slug: `${block.slug}-${Math.random().toString(36).slice(2, 6)}`,
    preview_image_url: block.preview_image_url || '',
    draft_content: cloneBlockContent(block.draft_content || {}),
    published_content: cloneBlockContent(block.published_content || block.draft_content || {}),
    draft_visible: block.draft_visible !== false,
    published_visible: false,
    draft_order: order,
    published_order: order,
    is_enabled: true,
    starts_at: block.starts_at || null,
    ends_at: block.ends_at || null,
  }

  const { data, error } = await supabase
    .from('landing_blocks')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteLandingBlock(id) {
  const { error } = await supabase.from('landing_blocks').delete().eq('id', id)
  if (error) throw error
}

export async function reorderDraftBlocks(blocks) {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const { error } = await supabase
      .from('landing_blocks')
      .update({ draft_order: index, updated_at: new Date().toISOString() })
      .eq('id', block.id)
    if (error) throw error
  }
}

export async function publishLandingDraft(blocks) {
  const now = new Date().toISOString()
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const { error } = await supabase
      .from('landing_blocks')
      .update({
        published_content: cloneBlockContent(block.draft_content || {}),
        published_visible: block.draft_visible !== false,
        published_order: index,
        published_at: now,
        updated_at: now,
      })
      .eq('id', block.id)

    if (error) throw error
  }
}

export async function trackLandingEvent({ blockSlug, blockType, eventType, ctaId = null, metadata = {} }) {
  if (missingLandingEventsTable) return

  const sessionKey = getLandingSessionKey()
  const { error } = await supabase.from('landing_block_events').insert({
    page_key: LANDING_PAGE_KEY,
    block_slug: blockSlug,
    block_type: blockType,
    event_type: eventType,
    cta_id: ctaId,
    metadata,
    session_key: sessionKey,
  })

  if (isMissingRelationError(error, 'landing_block_events')) {
    missingLandingEventsTable = true
    return
  }
  if (error) {
    console.error('landing event error', error)
  }
}

function getLandingSessionKey() {
  const key = 'figusuy-landing-session'
  const current = window.localStorage.getItem(key)
  if (current) return current
  const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(key, created)
  return created
}

function isMissingRelationError(error, relation) {
  if (!error) return false
  return (
    error.code === 'PGRST205' &&
    typeof error.message === 'string' &&
    error.message.includes(`'public.${relation}'`)
  )
}

function isMissingRpcError(error, rpcName) {
  if (!error) return false
  return (
    error.code === 'PGRST202' ||
    (typeof error.message === 'string' && error.message.includes(rpcName))
  )
}
