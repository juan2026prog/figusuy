export const EXCHANGE_STATUS_META = {
  pending: { label: 'Pendiente', tone: '#94a3b8' },
  pending_confirmation: { label: 'Esperando confirmacion', tone: '#f59e0b' },
  completed: { label: 'Intercambio confirmado', tone: '#22c55e' },
  not_completed: { label: 'No se concreto', tone: '#ef4444' },
  disputed: { label: 'En disputa', tone: '#fb7185' },
  expired: { label: 'Expirado', tone: '#64748b' },
}

export const EXCHANGE_RESPONSE_LABELS = {
  yes: 'Si, se hizo',
  not_yet: 'Todavia no',
  no: 'No se concreto',
}

export function getExchangeStatusMeta(status) {
  return EXCHANGE_STATUS_META[status] || EXCHANGE_STATUS_META.pending
}

export function getExchangePromptVisibility(completion, trigger, currentUserId) {
  if (completion?.status === 'completed') return { visible: true, reason: 'completed' }
  if (completion?.status === 'disputed') return { visible: true, reason: 'disputed' }
  if (completion?.status === 'not_completed') return { visible: true, reason: 'not_completed' }
  if (completion?.status === 'expired') return { visible: true, reason: 'expired' }

  const myResponse = getMyExchangeResponse(completion, currentUserId)
  if (completion?.status === 'pending_confirmation') return { visible: true, reason: myResponse ? 'awaiting_other' : 'needs_response' }
  if (completion?.status === 'pending' && myResponse) return { visible: true, reason: 'already_answered' }
  if (trigger?.should_prompt) return { visible: true, reason: 'triggered' }

  return { visible: false, reason: 'hidden' }
}

export function getMyExchangeResponse(completion, currentUserId) {
  if (!completion || !currentUserId) return null
  if (completion.user_1_id === currentUserId) return completion.user_1_response || null
  if (completion.user_2_id === currentUserId) return completion.user_2_response || null
  return null
}

export function formatPercent(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num)) return '0%'
  return `${Math.round(num)}%`
}
