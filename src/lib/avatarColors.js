/**
 * Generate a deterministic gradient color pair from a string (username, userId, etc.)
 * Returns a CSS linear-gradient string.
 */
const GRADIENTS = [
  ['#ea580c', '#f97316'], // Brand Orange
  ['#dc2626', '#ef4444'], // Red → Rose
  ['#f59e0b', '#fbbf24'], // Amber → Gold
  ['#10b981', '#14b8a6'], // Emerald → Teal
  ['#d97706', '#ea580c'], // Amber Dark → Orange
  ['#ec4899', '#f43f5e'], // Pink → Rose
  ['#0d9488', '#059669'], // Teal → Green
  ['#c2410c', '#dc2626'], // Burnt Orange → Red
  ['#16a34a', '#10b981'], // Green → Emerald
  ['#b45309', '#d97706'], // Brown → Amber
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getAvatarGradient(identifier) {
  const idx = hashString(identifier) % GRADIENTS.length
  const [from, to] = GRADIENTS[idx]
  return `linear-gradient(135deg, ${from}, ${to})`
}

export function getAvatarColor(identifier) {
  const idx = hashString(identifier) % GRADIENTS.length
  return GRADIENTS[idx][0]
}
