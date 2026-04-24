import { haversineDistance } from './haversine'

/**
 * Core matching engine for FigusUy
 * 
 * Calculates compatibility scores between users based on:
 * - Sticker overlap (what they have that you need and vice versa)
 * - Mutual exchange potential  
 * - Geographic proximity
 * - User activity and reputation
 */

/**
 * Calculate match score between the current user and a potential match
 * 
 * @param {Object} currentUser - Current user's profile and stickers
 * @param {Object} otherUser - Other user's profile and stickers
 * @returns {Object} Match result with score and details
 */
export function calculateMatch(currentUser, otherUser) {
  const myMissing = new Set(currentUser.missing.map(s => s.sticker_number))
  const myDuplicates = new Set(currentUser.duplicates.map(s => s.sticker_number))
  const theirMissing = new Set(otherUser.missing.map(s => s.sticker_number))
  const theirDuplicates = new Set(otherUser.duplicates.map(s => s.sticker_number))

  // What they have that I need
  const theyCanGiveMe = [...theirDuplicates].filter(n => myMissing.has(n))
  // What I have that they need
  const iCanGiveThem = [...myDuplicates].filter(n => theirMissing.has(n))

  const totalCoincidences = theyCanGiveMe.length + iCanGiveThem.length
  const isMutual = theyCanGiveMe.length > 0 && iCanGiveThem.length > 0

  // Distance calculation
  const distance = haversineDistance(
    currentUser.lat, currentUser.lng,
    otherUser.lat, otherUser.lng
  )

  // Activity check (active in last 7 days)
  const lastActive = new Date(otherUser.last_active)
  const isActive = (Date.now() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000

  // Rating factor (0-5 scale)
  const rating = otherUser.rating || 5

  // Score calculation:
  //   coincidences * 10
  // + mutual bonus (20 if mutual, 5 if one-way)
  // + active bonus (5 if active)
  // + rating * 2
  // - distance penalty (capped)
  const distancePenalty = distance === Infinity ? 50 : Math.min(distance * 0.5, 50)

  const score =
    (totalCoincidences * 10) +
    (isMutual ? 20 : (totalCoincidences > 0 ? 5 : 0)) +
    (isActive ? 5 : 0) +
    (rating * 2) -
    distancePenalty

  return {
    userId: otherUser.id,
    profile: otherUser,
    theyCanGiveMe,
    iCanGiveThem,
    totalCoincidences,
    isMutual,
    distance,
    isActive,
    rating,
    score: Math.max(0, Math.round(score * 100) / 100),
    isPremium: otherUser.is_premium,
  }
}

/**
 * Find and rank all matches for a user in a specific album
 * 
 * @param {Object} currentUser - Current user profile + stickers
 * @param {Array} otherUsers - Array of other user profiles + stickers
 * @returns {Array} Sorted matches by score (DESC)
 */
export function findMatches(currentUser, otherUsers) {
  const minStickers = currentUser.min_match_stickers || 1
  const isPremium = currentUser.is_premium
  const planName = currentUser.premium_plan?.name || 'Gratis'

  let matches = otherUsers
    .map(other => calculateMatch(currentUser, other))
    .filter(match => match.totalCoincidences > 0)
    .filter(match => match.theyCanGiveMe.length >= minStickers)
    .filter(match => {
      if (match.distance === Infinity) return true
      
      // Determine distance constraints based on plan
      let minDistance = 0.5 // Default: Gratis (500m)
      
      if (isPremium) {
        if (planName.toLowerCase().includes('pro')) {
          minDistance = 0 // Premium Pro: Sin límite
        } else if (planName.toLowerCase().includes('plus')) {
          minDistance = 0.25 // Premium Plus: 250m
        }
      }
      
      return match.distance >= minDistance
    })
    .sort((a, b) => b.score - a.score)
    
  // Apply max matches limit based on plan
  let maxMatches = 3 // Default: Gratis
  if (isPremium) {
    if (planName.toLowerCase().includes('pro')) {
      maxMatches = Infinity // Premium Pro: Ilimitado
    } else if (planName.toLowerCase().includes('plus')) {
      maxMatches = 10 // Premium Plus: 10 matches
    }
  }
  
  if (maxMatches !== Infinity) {
    matches = matches.slice(0, maxMatches)
  }

  return matches
}

/**
 * Get compatibility level label and star count
 */
export function getCompatibilityLevel(score) {
  if (score >= 80) return { label: 'Perfecto', stars: 5, color: '#10b981' }
  if (score >= 60) return { label: 'Excelente', stars: 4, color: '#3b82f6' }
  if (score >= 40) return { label: 'Bueno', stars: 3, color: '#8b5cf6' }
  if (score >= 20) return { label: 'Regular', stars: 2, color: '#f59e0b' }
  return { label: 'Bajo', stars: 1, color: '#94a3b8' }
}
