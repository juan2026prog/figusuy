export const ALBUM_PROGRESS_STATES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PARTNER_VERIFIED: 'partner_verified'
}

const ALBUM_STATE_KEY = 'figusuy.partnerStore.albumStates.v1'
const VALIDATIONS_KEY = 'figusuy.partnerStore.validations.v1'

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('figusuy:partnerStore-storage-updated'))
}

function albumKey(userId, albumId) {
  return `${userId}:${albumId}`
}

export function getPartnerStoreAlbumState(userId, albumId) {
  if (!userId || !albumId) {
    return { status: ALBUM_PROGRESS_STATES.IN_PROGRESS }
  }
  const states = readStorage(ALBUM_STATE_KEY, {})
  return states[albumKey(userId, albumId)] || { status: ALBUM_PROGRESS_STATES.IN_PROGRESS }
}

export function markAlbumCompleted(payload) {
  const {
    userId,
    userName,
    albumId,
    albumName,
    albumCover,
    albumYear
  } = payload
  const key = albumKey(userId, albumId)
  const states = readStorage(ALBUM_STATE_KEY, {})
  const validations = readStorage(VALIDATIONS_KEY, [])
  const completedAt = new Date().toISOString()

  states[key] = {
    status: ALBUM_PROGRESS_STATES.COMPLETED,
    completedAt
  }

  const existingIndex = validations.findIndex(item => item.userAlbumKey === key)
  const nextRecord = {
    userAlbumKey: key,
    userId,
    userName,
    albumId,
    albumName,
    albumCover: albumCover || null,
    albumYear: albumYear || null,
    status: 'pending',
    completedAt,
    locationId: null,
    locationName: null,
    verifiedAt: null,
    validatedByUserId: null,
    validatedByName: null,
    notes: ''
  }

  if (existingIndex >= 0) {
    validations[existingIndex] = {
      ...validations[existingIndex],
      ...nextRecord
    }
  } else {
    validations.unshift(nextRecord)
  }

  writeStorage(ALBUM_STATE_KEY, states)
  writeStorage(VALIDATIONS_KEY, validations)
}

export function verifyAlbumAsPartnerStore({
  userId,
  albumId,
  locationId,
  locationName,
  validatedByUserId,
  validatedByName,
  notes
}) {
  const key = albumKey(userId, albumId)
  const states = readStorage(ALBUM_STATE_KEY, {})
  const validations = readStorage(VALIDATIONS_KEY, [])
  const verifiedAt = new Date().toISOString()

  states[key] = {
    status: ALBUM_PROGRESS_STATES.PARTNER_VERIFIED,
    completedAt: states[key]?.completedAt || verifiedAt,
    partnerVerifiedAt: verifiedAt,
    partnerVerifiedByLocationId: locationId,
    partnerVerifiedByLocationName: locationName,
    partnerValidatedByName: validatedByName || null
  }

  const index = validations.findIndex(item => item.userAlbumKey === key)
  if (index >= 0) {
    validations[index] = {
      ...validations[index],
      status: 'verified',
      locationId,
      locationName,
      verifiedAt,
      validatedByUserId,
      validatedByName,
      notes: notes || ''
    }
  }

  writeStorage(ALBUM_STATE_KEY, states)
  writeStorage(VALIDATIONS_KEY, validations)
}

export function getPartnerStoreValidations() {
  return readStorage(VALIDATIONS_KEY, [])
}

export function subscribePartnerStoreStorage(callback) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener('figusuy:partnerStore-storage-updated', handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener('figusuy:partnerStore-storage-updated', handler)
  }
}
