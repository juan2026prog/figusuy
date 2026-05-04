import { supabase } from './supabase'

export const ALBUM_PROGRESS_STATES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PARTNER_VERIFIED: 'legend_verified'
}

const EMPTY_STATE = { status: ALBUM_PROGRESS_STATES.IN_PROGRESS }

export async function getPartnerStoreAlbumState(userId, albumId) {
  if (!userId || !albumId) return EMPTY_STATE

  const { data, error } = await supabase.rpc('get_my_album_progress', {
    p_album_id: albumId
  })

  if (error) {
    console.error('Error loading album progress state:', error)
    return EMPTY_STATE
  }

  return data || EMPTY_STATE
}

export async function markAlbumCompleted(payload) {
  if (!payload?.albumId) {
    throw new Error('albumId requerido')
  }

  const { data, error } = await supabase.rpc('request_legend_album_completion', {
    p_album_id: payload.albumId
  })

  if (error) throw error
  return data || EMPTY_STATE
}

export async function getPartnerStoreValidations(locationId) {
  if (!locationId) return []

  const { data, error } = await supabase.rpc('get_legend_validations_for_location', {
    p_location_id: locationId
  })

  if (error) {
    console.error('Error loading legend validations:', error)
    return []
  }

  return data || []
}

export async function verifyAlbumAsPartnerStore({
  validationId,
  locationId,
  notes
}) {
  if (!validationId || !locationId) {
    throw new Error('validationId y locationId son requeridos')
  }

  const { data, error } = await supabase.rpc('verify_legend_album', {
    p_validation_id: validationId,
    p_location_id: locationId,
    p_notes: notes || ''
  })

  if (error) throw error
  return data
}
